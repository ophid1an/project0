const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const Statistic = require('../models/statistic');
const limits = require('../config').limits;
const jwtOptions = require('../config').jwtOptions;
const cookiesOptions = require('../config').cookiesOptions;
const User = require('../models/user');



exports.userLoginGet = function (req, res) {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('login');
};



exports.userLoginPost = function (req, res, next) {

    if (req.cookies.jwt) {
        return res.redirect('/main');
    }

    function userLoginPostErrors() {
        res.render('login', {
            errors: [{
                msg: res.__('warnWrongUsernameOrPassword')

            }]
        });
    }


    req.sanitize('username').trim();

    if (!req.body.username || !req.body.pwd || req.body.username.length < limits.USERNAME_MIN_LENGTH || req.body.username.length > limits.USERNAME_MAX_LENGTH || req.body.pwd.length < limits.PWD_MIN_LENGTH) {
        return userLoginPostErrors();
    }

    req.sanitize('username').escape();
    req.sanitize('pwd').escape();

    User.findOne({
            'username': req.body.username.toLowerCase()
        })
        .exec((err, user) => {

            if (err) {
                return next(err);
            }

            if (!user) {
                return userLoginPostErrors();
            }

            bcrypt.compare(req.body.pwd, user.pwd, (err, result) => {
                if (err) {
                    return next(err);
                }

                if (!result) {
                    return userLoginPostErrors();
                }

                jwt.sign({
                    uid: user._id
                }, jwtOptions.secretOrKey, {
                    issuer: jwtOptions.issuer,
                    expiresIn: jwtOptions.expiresIn,
                    jwtid: user.jti.getTime() + '',
                    algorithm: 'HS256'
                }, (err, token) => {
                    if (err) {
                        return next(err);
                    }
                    res.cookie('jwt', token, {
                        expires: new Date(Date.now() + cookiesOptions.age),
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production'
                    });

                    res.redirect('/main');
                });


            });
        });
};




exports.userRegisterGet = function (req, res) {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('register');
};




exports.userRegisterPost = function (req, res, next) {

    if (req.cookies.jwt) {
        return res.redirect('/main');
    }

    function userRegisterPostErrors(errors) {
        res.render('register', {
            user: user,
            errors: errors
        });
    }

    const registerValidationSchema = {
        'username': {
            isAlphanumeric: {
                errorMessage: res.__('warnInvalidUsernameType')
            },
            isLength: {
                options: [{
                    min: limits.USERNAME_MIN_LENGTH,
                    max: limits.USERNAME_MAX_LENGTH
                }],
                errorMessage: res.__('warnInvalidUsernameLength')
            }
        },
        'email': {
            isEmail: true,
            errorMessage: res.__('warnInvalidEmail')
        },
        'pwd': {
            isLength: {
                options: [{
                    min: limits.PWD_MIN_LENGTH
                }],
                errorMessage: res.__('warnInvalidPwd')
            },
            equals: {
                options: req.body['pwd-confirm'],
                errorMessage: res.__('warnPasswordsDoNotMatch')
            }
        }
    };

    req.sanitize('username').trim();
    req.sanitize('email').trim();

    req.checkBody(registerValidationSchema);

    req.sanitize('username').escape();
    req.sanitize('email').escape();
    req.sanitize('email').normalizeEmail();
    req.sanitize('pwd').escape();

    const errors = req.validationErrors();

    const user = new User({
        username: req.body.username.toLowerCase(),
        email: req.body.email,
        pwd: req.body.pwd
    });

    if (errors) {

        return userRegisterPostErrors(errors);

    }

    User.find({
            '$or': [{
                'username': user.username
            }, {
                'email': user.email
            }, {
                username: 1,
                email: 1
            }]
        })
        .exec((err, users) => {

            if (err) {
                return next(err);
            }

            if (users && users.length === 2) {

                let errors = [{
                    msg: res.__('warnUsernameExists')
                }, {
                    msg: res.__('warnEmailExists')
                }];

                return userRegisterPostErrors(errors);

            }

            if (users && users.length === 1) {

                let errors = [];

                if (user.username === users[0].username) {
                    errors.push({
                        msg: res.__('warnUsernameExists')
                    });
                }

                if (user.email === users[0].email) {

                    errors.push({
                        msg: res.__('warnEmailExists')
                    });
                }

                return userRegisterPostErrors(errors);
            }

            // create jti property
            user.jti = Date.now();

            // hash password
            bcrypt.hash(user.pwd, saltRounds, (err, hash) => {

                if (err) {
                    return next(err);
                }

                user.pwd = hash;

                // save user record
                user.save(err => {

                    if (err) {
                        return next(err);
                    }

                    res.redirect('/login');
                });
            });
        });
};





exports.userHistoryGet = function (req, res, next) {
    Statistic
        .find({
            $or: [{
                player1: req.user._id
            }, {
                player2: req.user._id
            }]
        })
        .populate('player1', 'username')
        .populate('player2', 'username')
        .sort({ // Sort by date game ended descending
            _id: -1
        })
        .exec((err, statsResult) => {
            if (err) {
                return next(err);
            }


            var stats = {
                easy: {
                    whitesC: 0,
                    lettersFound: 0,
                    highestRating: 0,
                    hasPlayed: false
                },
                medium: {
                    whitesC: 0,
                    lettersFound: 0,
                    highestRating: 0,
                    hasPlayed: false
                },
                hard: {
                    whitesC: 0,
                    lettersFound: 0,
                    highestRating: 0,
                    hasPlayed: false
                }
            };

            var completedGames = [],
                mdash = '\u2014',
                calcRating = (found, total) => {
                    return found ? parseFloat(found * 100 / total).toFixed(2) : 0;
                };

            statsResult.forEach(stat => {
                var isPlayer1 = req.user._id.equals(stat.player1._id),
                    otherUsername = isPlayer1 ? (stat.player2 ? stat.player2.username : mdash) :
                    stat.player1.username,
                    date = moment(stat._id.getTimestamp())
                    .format('MMM DD YYYY, HH:mm'),
                    diff = res.__(stat.diff),
                    p2Letters = stat.p2Letters ? stat.p2Letters : 0,
                    lettersFound = stat.p1Letters + p2Letters,
                    rating = calcRating(lettersFound, stat.whitesC);

                // Calculate general statistics
                stats[stat.diff].hasPlayed = true;
                stats[stat.diff].whitesC += stat.whitesC;
                stats[stat.diff].lettersFound += lettersFound;
                if (rating > stats[stat.diff].highestRating) {
                    stats[stat.diff].highestRating = rating;
                }

                // Calculate completed games array
                completedGames.push({
                    date,
                    diff,
                    rating,
                    otherUsername
                });
            });

            res.render('history', {
                completedGames,
                stats: {
                    highestRating: [
                        stats.easy.hasPlayed ? stats.easy.highestRating : mdash,
                        stats.medium.hasPlayed ? stats.medium.highestRating : mdash,
                        stats.hard.hasPlayed ? stats.hard.highestRating : mdash,
                    ],
                    avgRating: [
                        stats.easy.hasPlayed ? calcRating(stats.easy.lettersFound, stats.easy.whitesC) :
                        mdash,
                        stats.medium.hasPlayed ? calcRating(stats.medium.lettersFound, stats.easy.whitesC) :
                        mdash,
                        stats.hard.hasPlayed ? calcRating(stats.hard.lettersFound, stats.easy.whitesC) :
                        mdash,
                    ]
                }
            });

        });
};




exports.userFriendsGet = function (req, res, next) {
    User.getFriends(req.user._id, (err, friends) => {
        if (err) {
            return next(err);
        }
        res.render('friends', {
            friends: friends
        });
    });
};




exports.userNewRequestGet = function (req, res) {
    res.render('new-request');
};



exports.userNewRequestPost = function (req, res) {
    res.json(req.user.friends);
};



exports.userSettingsGet = function (req, res) {
    res.render('settings');
};
