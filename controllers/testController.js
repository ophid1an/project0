const User = require('../models/user');
const Crossword = require('../models/crossword');
const Game = require('../models/game');
const util = require('util');


exports.userAddFriendGet = function (req, res, next) {

    User.findOne({
            'username': req.params.user
        })
        .exec((err, user) => {

            if (err) {
                return next(err);
            }
            if (user) {
                User.update({
                    _id: req.user._id
                }, {
                    $push: {
                        friends: {
                            friend: user
                        }
                    }
                }, err => {
                    if (err) {
                        return next(err);
                    }
                    res.redirect('/main/friends');
                });
            } else {
                res.redirect('/main/friends');
            }

        });
};

exports.crosswordsGet = function (req, res, next) {

    Crossword.find()
        .exec((err, cws) => {

            if (err) {
                return next(err);
            }

            res.send(cws);
        });
};

exports.gamesGet = function (req, res, next) {

    Game
        .find()
        .populate('player1', 'username')
        .populate('player2', 'username')
        .exec((err, games) => {

            if (err) {
                return next(err);
            }

            res.send(games);
        });
};

exports.randomCrosswordGet = function (req, res, next) {

    const diff = req.params.diff;

    Crossword
        .count({
            difficulty: diff
        }, (err, count) => {
            if (err) {
                return next(err);
            }
            const random = Math.floor(Math.random() * count);

            var str = `Count ${diff}: ${count} crosswords\n`;
            str += `Random number: ${random}\n`;

            Crossword
                .find({
                    difficulty: diff
                })
                .limit(-1)
                .skip(random)
                .exec((err, cw) => {
                    if (err) {
                        return next(err);
                    }
                    console.log(typeof cw, cw.length);
                    str += util.inspect(cw);

                    res.send(str);
                });


        });
};
