const validator = require('express-validator').validator,
    cookieParser = require('cookie-parser'),
    socketio = require('socket.io'),
    jwt = require('jsonwebtoken'),
    jwtOptions = require('../config').jwtOptions,
    Game = require('../models/game');



var setup = () => {
    var parser = cookieParser.apply(null, arguments);

    return (socket, next) => {
        parser(socket.request, null, () => {
            next();
        });
    };
};



var authorize = () => {
    return (socket, next) => {
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
                            return;
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
                        var otherUsername = isPlayer1 ? (game.player2 ? game.player2.username : undefined) : game.player1.username;

                        req.game = {
                            uid: uid,
                            gid: gid,
                            isPlayer1: isPlayer1,
                            otherUsername: otherUsername,
                            crossword: crossword,
                            letters: game.letters || [],
                            messages: game.messages || []
                        };

                        next();
                    });
            });
    };
};



var connected = (socket) => {

    // console.log(`Game: ${inspect(socket.request.game,opts)}`);
    var game = socket.request.game;

    socket.join(game.gid, () => {
        socket.to(game.gid).emit('other online');
    });

    socket.on('disconnect', () => {
        socket.to(game.gid).emit('other offline');
    });

    socket.on('send complete', () => {
        socket.to(game.gid).emit('complete');
    });

    socket.on('game data to me', () => {
        socket.emit('game data', game);
    });

    socket.on('selection to other', data => {
        socket.to(game.gid).emit('selection', data);
    });

    socket.on('letters to other', data => {
        if (!data.letters || !data.letters.length) { // TODO validate input
            return;
        }

        var letters = data.letters,
            len = letters.length,
            dateNow = Date.now();

        (function uploadLetters(ind) {
            if (ind < len) {
                var letter = letters[ind];

                if (letter.date > dateNow) { // Discard letters with date ahead of now
                    uploadLetters(ind + 1);
                } else {
                    updateLetter(letter, err => {
                        if (err) {
                            return;
                        } else {
                            uploadLetters(ind + 1);
                        }
                    });
                }
            } else {
                socket.to(game.gid).emit('letters', data.letters);
                socket.emit('letters received');
            }

        })(0);

        // Update letter if it is different and most recent than previous one
        function updateLetter(letter, callback) {
            var query = {
                _id: game.gid,
                letters: {
                    $elemMatch: {
                        pos: letter.pos,
                        letter: {
                            $ne: letter.letter
                        },
                        date: {
                            $lt: new Date(letter.date) // letter.date is in unix time (number)
                        }
                    }
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
                .exec(err => {
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
        }

    });

    socket.on('letters to me', data => {
        var letters = [],
            date;

        try {
            date = new Date(data);
        } catch (e) {
            return;
        }

        game.letters.forEach(l => {
            if (l.isPlayer1 !== game.isPlayer1 &&
                l.date > date) {
                letters.push(l);
            }
        });
        socket.emit('letters', letters);

    });

    socket.on('message to other', data => {
        if (typeof data !== 'string' || !data.length) { // TODO validate input
            return;
        }

        var msg = {
            text: data,
            date: new Date(),
            isPlayer1: game.isPlayer1
        };

        Game
            .update({
                _id: game.gid
            }, {
                $push: {
                    messages: msg
                }
            })
            .exec(err => {
                if (err) {
                    return;
                }

                // if (!affected) { // TODO Implement affected for BOTH messages and letters
                //     return socket.emit('exception', 'Message update failed');
                // }

                socket.to(game.gid).emit('messages', [msg]);
            });
    });

    socket.on('messages to me', data => {
        var messages = [],
            date;

        try {
            date = new Date(data);
        } catch (e) {
            return;
        }

        game.messages.forEach(m => {
            if (m.isPlayer1 !== game.isPlayer1 &&
                m.date > date) {
                messages.push(m);
            }
        });
        socket.emit('messages', messages);
    });

};


var initialize = server => {
    const io = socketio(server);
    io.use(setup());
    io.use(authorize());
    io.on('connection', connected);
};


module.exports = initialize;
