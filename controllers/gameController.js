const dateformat = require('dateformat'),
    sg = require('sendgrid')(process.env.SENDGRID_API_KEY),
    email = require('../config').email,
    validator = require('express-validator').validator,
    url = require('url'),
    User = require('../models/user'),
    Game = require('../models/game'),
    Crossword = require('../models/crossword'),
    Statistic = require('../models/statistic'),
    limits = require('../config').limits,
    indexOfArray = require('../lib/util').indexOfArray,
    toDate = require('../lib/util').toDate,
    areStrings = require('../lib/util').areStrings,
    sendMail = (to, subject, content) => {
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: {
                personalizations: [{
                    to: [{
                        email: to,
                    }, ],
                    subject,
                }, ],
                from: {
                    email,
                },
                content: [{
                    type: 'text/plain',
                    value: content,
                }, ],
            },
        });

        sg.API(request);
    };


exports.gameNewGet = (req, res, next) => {
    User.getFriends(req.user._id, (err, friends) => {
        if (err) {
            return next(err);
        }
        res.render('game-settings', {
            friends
        });
    });
};



exports.gameNewPost = (req, res, next) => {

    var diff = req.body.difficulty,
        partner = req.body.partner,
        difficulties = limits.CW_DIFFICULTIES,
        game = new Game({
            player1: req.user._id
        }),
        proceed = (friendEmail, friendLocale) => {
            Crossword
                .count({
                    diff
                }, (err, count) => {
                    if (err) {
                        return next(err);
                    }

                    if (!count) {
                        return res.redirect('/main/new-game');
                    }

                    const randomCw = Math.floor(Math.random() * count);

                    Crossword
                        .find({
                            diff
                        })
                        .select('dim blacksPos')
                        .limit(-1)
                        .skip(randomCw)
                        .exec((err, cw) => {
                            if (err) {
                                return next(err);
                            }

                            if (!cw.length) {
                                return res.redirect('/main/new-game');
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

                                if (friendEmail) {
                                    var catalog = req.getCatalog(friendLocale);
                                    sendMail(friendEmail,
                                        `${catalog.yourFriend} ${req.user.username} ${catalog.startedGame}.`,
                                        url.format({
                                            protocol: req.protocol,
                                            host: req.get('host'),
                                            port: req.app.settings.port,
                                            pathname: 'main/game-session/' + game._id
                                        }));
                                }

                                res.redirect('/main/game-session/' + game._id.toString());

                            });
                        });
                });
        };

    if (!areStrings([diff, partner]) || difficulties.indexOf(diff) === -1) {
        return res.redirect('/main/new-game');
    }

    if (partner) {
        User.getFriends(req.user._id, (err, friends) => {

            if (err) {
                return next(err);
            }

            var pos = friends.map(e => e.username).indexOf(partner);

            if (pos === -1) {
                return res.redirect('/main/new-game');
            }

            game.player2 = friends[pos]._id;
            proceed(friends[pos].email, friends[pos].locale);
        });
    } else {
        proceed();
    }

};




exports.gameResumeGet = (req, res, next) => {
    var locale = req.getLocale();

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
                entry.dateCreated = toDate(locale, dateformat(e._id.getTimestamp(), 'mmm d yyyy, HH:MM'));
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


exports.gameSessionGet = (req, res) => {
    res.render('game-session');
};


exports.gameStatisticsGet = (req, res, next) => {
    var gid = req.params.gameId;

    if (typeof gid !== 'string' || !validator.isHexadecimal(gid) || gid.length !== 24) {
        return res.redirect('/main');
    }

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

            var isPlayer1 = req.user._id.equals(stat.player1._id),

                otherUsername = isPlayer1 ? (stat.player2 ? stat.player2.username : undefined) :
                stat.player1.username,

                thisLetters = isPlayer1 ? stat.p1Letters : (stat.p2Letters || 0),

                otherLetters = isPlayer1 ? (stat.p2Letters || 0) : stat.p1Letters;

            res.render('game-statistics', {
                diff: res.__(stat.diff),
                whitesC: stat.whitesC,
                thisLetters,
                otherLetters,
                otherUsername
            });

        });
};
