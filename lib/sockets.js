const validator = require('express-validator').validator;
const cookieParser = require('cookie-parser');
const inspect = require('util').inspect;
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtOptions = require('../config').jwtOptions;

const Game = require('../models/game');

const opts = {
    showHidden: true,
    depth: null
};

function initialize(server) {
    const io = socketio(server);
    io.use(setup());
    io.use(authorize());
    io.on('connection', connected);
}

function setup() {
    var parser = cookieParser.apply(null, arguments);

    return function (socket, next) {

        parser(socket.request, null, function () {
            next();
        });
    };
}


function authorize() {
    return function (socket, next) {
        if (!socket.request) {
            return next(new Error('No request sent'));
        }

        var req = socket.request,
            query = req._query,
            cookies = req.cookies;

        if (!query || !query.gid) {
            return next(new Error('No game ID provided'));
        }

        var gid = query.gid;

        if (!validator.isHexadecimal(gid) || gid.length !== 24) {
            return next(new Error('Invalid game ID format'));
        }

        if (!cookies || !cookies.jwt) {
            return next(new Error('No token found'));
        }

        jwt.verify(cookies.jwt, jwtOptions.secretOrKey, {
                algorithms: ['HS256'],
                issuer: jwtOptions.issuer
            },
            function (err, decoded) {
                if (err) {
                    return next(new Error('Invalid token'));
                }

                var uid = decoded.uid;

                Game
                    .findOne({
                        _id: gid,
                        $or: [{
                            player1: uid
                        }, {
                            player2: uid
                        }]
                    })
                    .populate('crossword')
                    .populate('player1', 'username')
                    .populate('player2', 'username')
                    .exec((err, game) => {

                        if (err) {
                            return next(err);
                        }

                        if (!game) {
                            return next(new Error('Game not found'));
                        }

                        var crossword = {
                            lang: game.crossword.lang,
                            dim: game.crossword.dim,
                            bpos: game.crossword.blacksPos,
                            cluesDownInd: game.crossword.cluesDownInd,
                            cluesAcrossInd: game.crossword.cluesAcrossInd,
                            clues: []
                        };

                        game.crossword.clues.forEach(e => {
                            crossword.clues.push({
                                len: e.answer.length,
                                isAcross: e.isAcross,
                                def: e.def,
                                pos: e.pos
                            });
                        });

                        var isPlayer1 = game.player1.equals(uid);
                        var thisUsername = isPlayer1 ? game.player1.username : game.player2.username; // TODO May not be needed
                        var otherUsername = isPlayer1 ? (game.player2 ? game.player2.username : undefined) : game.player1.username;

                        req.game = {
                            uid: uid,
                            gid: gid,
                            isPlayer1: isPlayer1,
                            thisUsername: thisUsername,
                            otherUsername: otherUsername,
                            crossword: crossword,
                            letters: game.letters || [],
                            messages: game.messages || []
                        };

                        next();
                    });
            });
    };
}


var connected = (socket) => {

    // console.log(`Game: ${inspect(socket.request.game,opts)}`);
    var game = socket.request.game;

    socket.join(game.gid, () => {
        // console.log(socket.rooms); // [ <socket.id>, 'room 237' ]
        socket.to(game.gid).emit('joined');
    });

    socket.on('game data to me', () => {
        socket.emit('game data', game);
    });

    socket.on('disconnect', () => {
        // console.log(socket.rooms);
        socket.to(game.gid).emit('left');
    });

    socket.on('letters to me', (data) => {
        var query = {
                _id: game.gid
            },
            date;

        try {
            date = new Date(data);
        } catch (e) {
            return; // TODO Should be meaningful
        }
        if (game.isPlayer1) {
            query.player1 = game.uid;
        } else {
            query.player2 = game.uid;
        }

        Game
            .findOne({
                query
            })
            .exec((err, game) => {
                var letters = [];

                if (err) {
                    return err;
                }

                if (game) {
                    game.letters.forEach(l => {
                        if (l.isPlayer1 !== game.isPlayer1 &&
                            l.date > date) {
                            letters.push(l);
                        }
                    });
                    socket.emit('letters', letters);
                }
            });
    });

    socket.on('messages to me', (data) => {
        var query = {
                _id: game.gid
            },
            date;

        try {
            date = new Date(data);
        } catch (e) {
            return; // TODO Should be meaningful
        }

        if (game.isPlayer1) {
            query.player1 = game.uid;
        } else {
            query.player2 = game.uid;
        }

        Game
            .findOne({
                query
            })
            .exec((err, game) => {
                var messages = [];

                if (err) {
                    return err;
                }

                if (game) {
                    game.messages.forEach(m => {
                        if (m.isPlayer1 !== game.isPlayer1 &&
                            m.date > date) {
                            messages.push(m);
                        }
                    });
                    socket.emit('messages', messages);
                }
            });
    });


    socket.on('selection to other', function (data) {
        socket.to(game.gid).emit('selection', data);
    });

    socket.on('letters to other', function (data) {
        // console.log((game.isPlayer1 ? 'Player 1 ' : 'Player 2 ') + 'is sending letters')
        if (!data.letters || !data.letters.length) { // TODO validate input
            return new Error('Invalid request format');
        }

        var letters = data.letters,
            len = letters.length;

        (function uploadLetters(ind) {
            if (ind < len) {
                updateLetter(letters[ind], err => {
                    if (err) {
                        return err;
                    } else {
                        uploadLetters(ind + 1);
                    }
                });
            } else {
                // console.log('letters: ' + inspect(data, opts));
                socket.to(game.gid).emit('letters', data.letters);
                socket.emit('letters received');
            }

        })(0);

        // Update letter if it is most recent than previous one
        function updateLetter(letter, callback) {
            var query = {
                _id: game.gid,
                'letters.pos': letter.pos,
                'letters.date': {
                    $lt: letter.date
                }
            };

            Game
                .update(query, {
                    $set: {
                        'letters.$.isCertain': letter.isCertain,
                        'letters.$.letter': letter.letter,
                        'letters.$.isPlayer1': game.isPlayer1,
                        'letters.$.date': letter.date
                    }
                })
                .exec((err) => {
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
        }

    });

};

module.exports = initialize;
