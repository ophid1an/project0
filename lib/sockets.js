const validator = require('express-validator').validator,
    cookieParser = require('cookie-parser'),
    socketio = require('socket.io'),
    jwt = require('jsonwebtoken'),
    i18n = require('i18n'),
    jwtOptions = require('../config').jwtOptions,
    Game = require('../models/game'),
    User = require('../models/user'),
    Statistic = require('../models/statistic');



var setup = () => {
    var parser = cookieParser.apply(null, arguments);

    return (socket, next) => {
        parser(socket.request, {}, () => {
            i18n.init(socket.request, {}, () => {
                next();
            });
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
                            },
                            isPlayer1 = game.player1.equals(uid),
                            otherUsername = isPlayer1 ?
                            (game.player2 ? game.player2.username : undefined) :
                            game.player1.username,
                            locale = req.getLocale();

                        game.crossword.clues.forEach(e => {
                            crossword.clues.push({
                                len: e.answer.length,
                                isAcross: e.isAcross,
                                def: e.def,
                                pos: e.pos
                            });
                        });

                        req.game = {
                            uid,
                            gid,
                            isPlayer1,
                            otherUsername,
                            crossword,
                            letters: game.letters || [],
                            messages: game.messages || [],
                            locale
                        };

                        next();
                    });
            });
    };
};



var connected = (socket) => {

    var game = socket.request.game;

    socket.join(game.gid, () => {
        socket.to(game.gid).emit('other online');
    });

    socket.on('disconnect', () => {
        socket.to(game.gid).emit('other offline');
    });

    socket.on('send complete', () => {

        /*****
        Checks to see if game exists and caller is game's moderator
        (player1). If so it saves the game statistics and removes game.
        *****/

        var updateFriends = (userId, friendId, statId, cb) => {
                User
                    .update({
                        _id: userId,
                        'friends.friend': friendId
                    }, {
                        $set: {
                            'friends.$.lastCompleted': statId
                        },
                        $inc: {
                            'friends.$.completedGames': 1
                        }
                    })
                    .exec((err) => {
                        if (err) {
                            return cb(err);
                        }
                        cb();
                    });
            },

            removeGame = (gid, cb) => {
                Game.remove({
                    _id: gid
                }, err => {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
            };

        if (game.isPlayer1) {
            Game
                .findOne({
                    _id: game.gid
                })
                .populate('crossword')
                .populate('player2', 'username')
                .exec((err, g) => {

                    if (err) {
                        return;
                    }

                    if (!g) {
                        return;
                    }

                    var cw = g.crossword,
                        lettersHash = {},
                        p1Letters = 0,
                        p2Letters = 0,
                        stat = {
                            gameId: g._id,
                            diff: cw.diff,
                            whitesC: cw.whitesC,
                            player1: g.player1,
                            player2: g.player2
                        };

                    // Calculate crossword letters hash
                    cw.clues.forEach(clue => {
                        var isAcross = clue.isAcross,
                            answer = clue.answer,
                            len = answer.length,
                            firstPos = clue.pos;

                        for (var i = 0; i < len; i++) {
                            var pos = [
                                firstPos[0] + (isAcross ? 0 : i),
                                firstPos[1] + (isAcross ? i : 0)
                            ];
                            lettersHash[pos] = answer[i];
                        }
                    });

                    // Compare letters between correct and submitted and
                    // update players' counts
                    g.letters.forEach(l => {
                        if (l.letter === lettersHash[l.pos]) {
                            if (l.isPlayer1) {
                                p1Letters += 1;
                            } else {
                                p2Letters += 1;
                            }
                        }
                    });

                    stat.p1Letters = p1Letters;
                    if (p2Letters) {
                        stat.p2Letters = p2Letters;
                    }

                    // Save statistic
                    new Statistic(stat).save((err, savedStat) => {
                        if (err) {
                            return;
                        }

                        if (g.player2) { // Update user.friends stats if two players
                            var parallelTasks = 3,
                                finalCb = (err) => {
                                    if (err) {
                                        return;
                                    }
                                    parallelTasks -= 1;
                                    if (!parallelTasks) {
                                        // Finally send completion message to both players
                                        socket.to(game.gid).emit('game completed');
                                        socket.emit('game completed');
                                    }
                                };

                            // Update player1.friends document
                            updateFriends(g.player1, g.player2, savedStat._id, finalCb);
                            // Update player2.friends document
                            updateFriends(g.player2, g.player1, savedStat._id, finalCb);
                            // Remove game
                            removeGame(g._id, finalCb);
                        } else {
                            // Remove game
                            removeGame(g._id, () => {
                                if (err) {
                                    return;
                                }
                                // Finally send completion message to moderator (player1)
                                socket.emit('game completed');
                            });
                        }
                    });
                });
        }



    });

    socket.on('game data to me', () => {
        socket.emit('game data', game);
    });

    socket.on('selection to other', data => {
        socket.to(game.gid).emit('selection', data);
    });

    socket.on('letters to other', data => {
        if (!data.letters || !data.letters.length) {
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
                .exec((err) => {
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
        if (typeof data !== 'string' || !data.length) {
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
