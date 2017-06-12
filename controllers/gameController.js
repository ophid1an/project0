const moment = require('moment');
const validator = require('express-validator').validator;
const User = require('../models/user');
const Game = require('../models/game');
const Crossword = require('../models/crossword');
const Statistic = require('../models/statistic');
const limits = require('../config').limits;
const indexOfArray = require('../lib/util').indexOfArray;


exports.gameNewGet = function (req, res, next) {
    User.getFriends(req.user._id, (err, friends) => {
        if (err) {
            return next(err);
        }
        res.render('game-settings', {
            friends: friends
        });
    });
};



exports.gameNewPost = function (req, res, next) {

    const game = new Game({
        player1: req.user._id
    });


    function renderGameSettingsWithError(error) {

        User.getFriends(req.user._id, (err, friends) => {
            if (err) {
                return next(err);
            }
            res.render('game-settings', {
                friends: friends,
                errors: [{
                    msg: error
                }]
            });
        });
    }


    function proceed() {

        Crossword
            .count({
                diff: req.body.difficulty
            }, (err, count) => {
                if (err) {
                    return next(err);
                }

                if (!count) {
                    return renderGameSettingsWithError(res.__('errorCrosswordNotFound'));
                }

                const randomCw = Math.floor(Math.random() * count);

                Crossword
                    .find({
                        diff: req.body.difficulty
                    })
                    .select('dim blacksPos')
                    .limit(-1)
                    .skip(randomCw)
                    .exec((err, cw) => {
                        if (err) {
                            return next(err);
                        }

                        if (!cw.length) {
                            return renderGameSettingsWithError(res.__('errorCrosswordNotFound'));
                        }

                        game.crossword = cw[0]._id;

                        var rows = cw[0].dim[0],
                            cols = cw[0].dim[1],
                            bpos = cw[0].blacksPos,
                            letters = [],
                            date = new Date();

                        for (let i = 0; i < rows; i += 1) {
                            for (let j = 0; j < cols; j += 1) {
                                if (indexOfArray([i, j], bpos) === -1) {
                                    letters.push({
                                        pos: [i, j],
                                        date
                                    });
                                }
                            }
                        }

                        game.letters = letters;

                        game.save((err, game) => {

                            if (err) {
                                return next(err);
                            }

                            res.redirect('/main/game-session/' + game._id.toString());

                        });
                    });
            });


    }

    const difficulties = limits.CW_DIFFICULTIES;

    req.sanitize('difficulty').trim();
    req.sanitize('partner').trim();
    req.sanitize('difficulty').escape();
    req.sanitize('partner').escape();

    if (difficulties.indexOf(req.body.difficulty) === -1) {
        return renderGameSettingsWithError(res.__('errorInvalidDifficulty'));
    }

    if (req.body.partner) {

        User.getFriends(req.user._id, (err, friends) => {

            if (err) {
                return next(err);
            }

            let pos = friends.map(e => e.username).indexOf(req.body.partner);

            if (pos === -1) {
                return renderGameSettingsWithError(res.__('errorInvalidPartner'));
            }

            game.player2 = friends[pos]._id;
            proceed();

        });

    } else {
        proceed();
    }

};




exports.gameResumeGet = function (req, res, next) {

    Game
        .find({
            $or: [{
                player1: req.user._id
            }, {
                player2: req.user._id
            }]
        })
        .populate('player1', 'username')
        .populate('player2', 'username')
        .sort({
            _id: -1
        })
        .exec((err, games) => {

            if (err) {
                return next(err);
            }


            var gamesMod = [];

            games.forEach(e => {
                var entry = {};
                entry.url = '/main/game-session/' + e._id;
                entry.dateCreated = moment(e._id.getTimestamp()).format('MMM DD YYYY, HH:mm');
                entry.isAdmin = req.user._id.equals(e.player1._id);
                entry.partner = e.player2 ? (req.user._id.equals(e.player1._id) ? e.player2.username : e.player1.username) : '';
                gamesMod.push(entry);
            });

            res.render('game-settings', {
                resume: true,
                games: gamesMod
            });

        });

};


exports.gameSessionGet = function (req, res) {
    res.render('game-session');
};


exports.gameStatisticsGet = function (req, res, next) {
    /*****
    Checks to see if game exists and caller is game's moderator
    (player1). If so it saves the game statistics and removes game.
    If not it searches statistics for the specific game and displays
    found statistic
    *****/
    var gid = req.params.gameId;

    if (!validator.isHexadecimal(gid) || gid.length !== 24) {
        return res.redirect('/main');
    }


    var renderStat = (stat, isPlayer1, otherUsername) => {
            var thisLetters = isPlayer1 ? stat.p1Letters : (stat.p2Letters || 0),
                otherLetters = isPlayer1 ? (stat.p2Letters ? stat.p2Letters : 0) :
                stat.p1Letters;

            res.render('game-statistics', {
                diff: res.__(stat.diff),
                whitesC: stat.whitesC,
                thisLetters,
                otherLetters,
                otherUsername
            });
        },

        findStatistic = () => {
            Statistic
                .findOne({
                    gameId: gid,
                    $or: [{
                        player1: req.user._id
                    }, {
                        player2: req.user._id
                    }]
                })
                .populate('player1', 'username')
                .populate('player2', 'username')
                .exec((err, stat) => {
                    if (err) {
                        return next(err);
                    }

                    if (!stat) {
                        return res.redirect('/main');
                    }
                    var isPlayer1 = req.user._id.equals(stat.player1);
                    var otherUsername = isPlayer1 ? (stat.player2 ? stat.player2.username : undefined) :
                        stat.player1.username;

                    renderStat(stat, isPlayer1, otherUsername);
                });
        },

        updateFriends = (userId, friendId, statId, cb) => {
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

    // After game moderator (player1) pressed 'Complete'
    Game
        .findOne({
            _id: gid,
            player1: req.user._id
        })
        .populate('crossword')
        .populate('player2', 'username')
        .exec((err, game) => {

            if (err) {
                return next(err);
            }

            if (!game) {
                // If game doesn't exist, try to find player's statistic
                return findStatistic();
            }

            var cw = game.crossword,
                lettersHash = {},
                p1Letters = 0,
                p2Letters = 0,
                stat = {
                    gameId: game._id,
                    diff: cw.diff,
                    whitesC: cw.whitesC,
                    player1: game.player1,
                    player2: game.player2
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
            game.letters.forEach(l => {
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
                    return next(err);
                }

                var p2Username = game.player2 ? game.player2.username : '';

                if (game.player2) { // Update user.friends stats if two players
                    var parallelTasks = 3,
                        finalCb = (err) => {
                            if (err) {
                                return next(err);
                            }
                            parallelTasks -= 1;
                            if (!parallelTasks) {
                                // Finally render statistic for moderator (player1)
                                renderStat(stat, true, p2Username);

                            }
                        };

                    // Update player1 record
                    updateFriends(game.player1, game.player2, savedStat._id, finalCb);
                    // Update player2 record
                    updateFriends(game.player2, game.player1, savedStat._id, finalCb);
                    // Remove game
                    removeGame(game._id, finalCb);
                } else {
                    // Remove game
                    removeGame(game._id, () => {
                        if (err) {
                            return next(err);
                        }
                        // Finally render statistic for moderator (player1)
                        renderStat(stat, true, p2Username);
                    });
                }
            });
        });
};
