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

                        var crossword = {};
                        crossword.lang = game.crossword.lang;
                        crossword.dim = game.crossword.dim;
                        crossword.bpos = game.crossword.blacksPos;
                        crossword.cluesDownInd = game.crossword.cluesDownInd;
                        crossword.cluesAcrossInd = game.crossword.cluesAcrossInd;
                        crossword.clues = [];
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
    socket.emit('game-data', game);

    socket.join(game.gid, () => {
        // console.log(socket.rooms); // [ <socket.id>, 'room 237' ]
        socket.to(game.gid).emit('joined');
    });

    socket.on('disconnect', () => {
        console.log(socket.rooms);
        socket.to(game.gid).emit('left');
    });

    socket.on('letters', function (data) {

        if (!data.date || !data.letters || !data.letters.length) { // TODO validate input
            return new Error('Invalid request format');
        }

        var letters = data.letters,
            len = letters.length,
            date = new Date(data.date),
            query = {
                _id: game.gid
            };

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
            }

        })(0);

        function updateLetter(letter, callback) {
            query['letters.pos'] = letter.pos;

            Game
                .update(query, {
                    $set: {
                        'letters.$.isCertain': letter.isCertain,
                        'letters.$.letter': letter.letter,
                        'letters.$.isPlayer1': game.isPlayer1,
                        'letters.$.date': date
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
