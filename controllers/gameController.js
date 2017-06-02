const moment = require('moment');
const User = require('../models/user');
const Game = require('../models/game');
const Crossword = require('../models/crossword');
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

                        var rows = cw[0].dim[0];
                        var cols = cw[0].dim[1];
                        var bpos = cw[0].blacksPos;
                        var letters = [];

                        for (let i = 0; i < rows; i += 1) {
                            for (let j = 0; j < cols; j += 1) {
                                if (indexOfArray([i, j], bpos) === -1) {
                                    letters.push({
                                        pos: [i, j]
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


var gameSessionPost = function (req, res) { // TODO Delete
    var data = req.body;

    var query = {
        _id: data.gameId
    };

    if (data.isPlayer1) {
        query.player1 = req.user._id;
    } else {
        query.player2 = req.user._id;
    }

    var updateLetter = (letter, callback) => {
        query['letters.pos'] = letter.pos;

        Game
            .update(query, {
                $set: {
                    'letters.$.isCertain': letter.isCertain,
                    'letters.$.letter': letter.letter,
                    'letters.$.isPlayer1': data.isPlayer1,
                }
            })
            .exec((err) => {
                if (err) {
                    return callback(err);
                }
                callback();
            });
    };

    if (!data.letters || !data.letters.length) {
        return res.json({
            error: 'Invalid JSON file!'
        });
    }

    var len = data.letters.length;

    (function uploadLetters(ind) {
        if (ind < len) {
            updateLetter(data.letters[ind], err => {
                if (err) {
                    return res.json({
                        error: err
                    });
                } else {
                    uploadLetters(ind + 1);
                }
            });
        }

    })(0);

    return res.json({
        msg: 'OK'
    });

};
