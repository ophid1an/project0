const dateformat = require('dateformat'),
    sg = require('sendgrid')(process.env.SENDGRID_API_KEY),
    email = require('../config').email,
    jwt = require('jsonwebtoken'),
    validator = require('express-validator').validator,
    url = require('url'),
    crypto = require('crypto'),
    bcrypt = require('bcrypt'),
    saltRounds = 10,
    User = require('../models/user'),
    Statistic = require('../models/statistic'),
    limits = require('../config').limits,
    jwtOptions = require('../config').jwtOptions,
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



exports.userLoginGet = (req, res) => {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('login');
};



exports.userLoginPost = (req, res, next) => {

    if (req.cookies.jwt) {
        return res.redirect('/main');
    }

    var username = req.body.username,
        pwd = req.body.pwd,
        userLoginPostError = () => {
            res.render('login', {
                error: res.__('errorWrongUsernameOrPassword')
            });
        };

    if (!areStrings([username, pwd])) {
        return userLoginPostError();
    }

    username = username.trim().toLowerCase();

    if (username.length < limits.USERNAME_MIN_LENGTH || username.length > limits.USERNAME_MAX_LENGTH ||
        pwd.length < limits.PWD_MIN_LENGTH || pwd.length > limits.PWD_MAX_LENGTH) {
        return userLoginPostError();
    }

    User.findOne({
            username
        })
        .exec((err, user) => {

            if (err) {
                return next(err);
            }

            if (!user) {
                return userLoginPostError();
            }

            bcrypt.compare(pwd, user.pwd, (err, result) => {
                if (err) {
                    return next(err);
                }

                if (!result) {
                    return userLoginPostError();
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
                        expires: new Date(Date.now() + limits.COOKIES_AGE),
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production'
                    });

                    if (user.locale) {
                        res.cookie('locale', user.locale, {
                            expires: new Date(Date.now() + limits.COOKIES_AGE),
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production'
                        });
                    }

                    res.redirect('/main');
                });


            });
        });
};




exports.userForgotPwdGet = (req, res) => {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('forgot-password');
};



exports.userForgotPwdPost = (req, res, next) => {

    if (req.cookies.jwt) {
        return res.redirect('/main');
    }

    var email = req.body.email,
        userForgotPwdError = () => {
            res.render('forgot-password', {
                error: res.__('errorUserDoesNotExist')
            });
        },
        userForgotPwdOK = () => {
            res.render('forgot-password', {
                info: res.__('checkMail')
            });
        };

    if (!areStrings([email]) || !validator.isEmail(email)) {
        return userForgotPwdError();
    }

    email = validator.normalizeEmail(email);

    User.findOne({
            email
        }, {
            _id: 1
        })
        .exec((err, user) => {

            if (err) {
                return next(err);
            }

            if (!user) {
                return userForgotPwdError();
            }

            crypto.randomBytes(limits.RANDOM_BYTES_NUM, (err, buf) => {

                if (err) {
                    return next(err);
                }

                var bytes = buf.toString('hex');

                User.update({
                        _id: user._id
                    }, {
                        $set: {
                            randomBytes: {
                                expires: new Date(Date.now() + limits.FORGOT_PWD_AGE),
                                bytes
                            }
                        }
                    })
                    .exec(err => {

                        if (err) {
                            return next(err);
                        }

                        sendMail(email,
                            res.__('newPwdCreation'),
                            url.format({
                                protocol: req.protocol,
                                host: req.get('host'),
                                port: req.app.settings.port,
                                pathname: 'new-password/' + user._id + bytes
                            }));

                        userForgotPwdOK();
                    });
            });

        });
};



exports.userNewPwdGet = (req, res) => {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('new-password', {
        string: req.params.string
    });
};



exports.userNewPwdPost = (req, res, next) => {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }

    var pwd = req.body.pwd === req.body['pwd-confirm'] ? req.body.pwd : '',
        string = req.body.string;

    if (!areStrings([string, pwd]) ||
        string.length !== (24 + limits.RANDOM_BYTES_NUM * 2) ||
        !validator.isHexadecimal(string)) {
        return res.redirect('/');
    }

    var len = pwd.length;

    if (len < limits.PWD_MIN_LENGTH || len > limits.PWD_MAX_LENGTH) {
        return res.redirect('new-password/' + string);
    }

    var uid = string.substring(0, 24),
        bytes = string.substring(24);

    User.findById(uid, {
            randomBytes: 1
        })
        .exec((err, user) => {

            if (err) {
                return next(err);
            }

            if (!user || !user.randomBytes) {
                return res.redirect('/');
            }

            var date = new Date();

            if (date > user.randomBytes.expires || bytes !== user.randomBytes.bytes) {
                // update user document
                return User.update({
                        _id: uid
                    }, {
                        $unset: {
                            randomBytes: ''
                        }
                    })
                    .exec(err => {

                        if (err) {
                            return next(err);
                        }

                        res.redirect('/');
                    });
            }

            // hash password
            bcrypt.hash(pwd, saltRounds, (err, hash) => {

                if (err) {
                    return next(err);
                }

                // update user document
                User.update({
                        _id: uid
                    }, {
                        $set: {
                            pwd: hash,
                            jti: Date.now()
                        },
                        $unset: {
                            randomBytes: ''
                        }
                    })
                    .exec(err => {

                        if (err) {
                            return next(err);
                        }

                        res.redirect('/login');
                    });
            });
        });

};



exports.userRegisterGet = (req, res) => {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('register');
};




exports.userRegisterPost = (req, res, next) => {

    if (req.cookies.jwt) {
        return res.redirect('/main');
    }

    if (!areStrings([req.body.username, req.body.email,
            req.body.pwd, req.body['pwd-confirm']
        ])) {
        return res.render('register');
    }

    var userRegisterPostErrors = errors => {
            res.render('register', {
                user,
                errors
            });
        },
        registerValidationSchema = {
            'username': {
                isAlphanumeric: {
                    errorMessage: res.__('errorInvalidUsernameType')
                },
                isLength: {
                    options: [{
                        min: limits.USERNAME_MIN_LENGTH,
                        max: limits.USERNAME_MAX_LENGTH
                    }],
                    errorMessage: res.__('errorInvalidUsernameLength')
                }
            },
            'email': {
                isEmail: true,
                errorMessage: res.__('errorInvalidEmail')
            },
            'pwd': {
                isLength: {
                    options: [{
                        min: limits.PWD_MIN_LENGTH,
                        max: limits.PWD_MAX_LENGTH
                    }],
                    errorMessage: res.__('errorInvalidPwd')
                },
                equals: {
                    options: req.body['pwd-confirm'],
                    errorMessage: res.__('errorPasswordsDoNotMatch')
                }
            }
        };

    req.sanitizeBody('username').trim();
    req.sanitizeBody('email').trim();

    req.checkBody(registerValidationSchema);
    var errors = req.validationErrors();

    if (errors) {
        return userRegisterPostErrors(errors);
    }

    req.sanitizeBody('email').normalizeEmail();

    var user = new User({
        username: req.body.username.toLowerCase(),
        email: req.body.email,
        pwd: req.body.pwd
    });

    User.find({
            $or: [{
                username: user.username
            }, {
                email: user.email
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
                    msg: res.__('errorUsernameExists')
                }, {
                    msg: res.__('errorEmailExists')
                }];

                return userRegisterPostErrors(errors);

            }

            if (users && users.length === 1) {

                let errors = [];

                if (user.username === users[0].username) {
                    errors.push({
                        msg: res.__('errorUsernameExists')
                    });
                }

                if (user.email === users[0].email) {

                    errors.push({
                        msg: res.__('errorEmailExists')
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

                // save user document
                user.save(err => {

                    if (err) {
                        return next(err);
                    }

                    res.redirect('/login');
                });
            });
        });
};





exports.userHistoryGet = (req, res, next) => {
    var locale = req.getLocale();

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
                    return found ? found * 100 / total : 0;
                },
                ratingToString = rating => {
                    return rating ? parseFloat(rating).toFixed(2) : 0;
                };

            statsResult.forEach(stat => {
                var isPlayer1 = req.user._id.equals(stat.player1._id),
                    otherUsername = isPlayer1 ? (stat.player2 ? stat.player2.username : mdash) :
                    stat.player1.username,
                    date = toDate(locale, dateformat(stat._id.getTimestamp(), 'mmm d yyyy, HH:MM')),
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
                    rating: ratingToString(rating),
                    otherUsername
                });
            });
            res.render('history', {
                completedGames,
                stats: {
                    highestRating: [
                        stats.easy.hasPlayed ? ratingToString(stats.easy.highestRating) : mdash,
                        stats.medium.hasPlayed ? ratingToString(stats.medium.highestRating) : mdash,
                        stats.hard.hasPlayed ? ratingToString(stats.hard.highestRating) : mdash,
                    ],
                    avgRating: [
                        stats.easy.hasPlayed ? ratingToString(calcRating(stats.easy.lettersFound, stats.easy.whitesC)) :
                        mdash,
                        stats.medium.hasPlayed ? ratingToString(calcRating(stats.medium.lettersFound, stats.medium.whitesC)) :
                        mdash,
                        stats.hard.hasPlayed ? ratingToString(calcRating(stats.hard.lettersFound, stats.hard.whitesC)) :
                        mdash,
                    ]
                }
            });

        });
};




exports.userFriendsGet = (req, res, next) => {
    var locale = req.getLocale();

    User.findById(req.user._id, {
            friends: 1,
            incFriendReq: 1
        })
        .populate('friends.friend', 'username')
        .populate('incFriendReq.from', 'username')
        .exec((err, user) => {
            if (err) {
                return next(err);
            }

            var friends = user.friends.map(e => {
                    var lastCompleted = e.lastCompleted ?
                        toDate(locale, dateformat(e.lastCompleted.getTimestamp(), 'mmm d yyyy, HH:MM')) :
                        '\u2014';
                    return {
                        username: e.friend.username,
                        completedGames: e.completedGames,
                        lastCompleted
                    };
                }),
                incFriendRequests = user.incFriendReq.map(e => {
                    var date = toDate(locale, dateformat(e.from._id.getTimestamp(), 'mmm d yyyy, HH:MM'));

                    return {
                        date,
                        username: e.from.username,
                        text: e.text
                    };
                });

            return res.render('friends', {
                friends,
                incFriendRequests
            });

        });
};




exports.userIncRequestPost = (req, res, next) => {
    var username = req.body.username,
        accepted = req.body.accepted;

    if (!username || typeof username !== 'string') {
        return res.end();
    }

    var updateSender = (uid, otheruid, accepted, cb) => {
            var update = {
                $pull: {
                    outFriendReq: otheruid
                }
            };

            if (accepted) {
                update.$push = {
                    friends: {
                        friend: otheruid
                    }
                };
            }

            User.update({
                    _id: uid
                }, update)
                .exec(err => {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
        },
        updateReceiver = (uid, otheruid, accepted, cb) => {
            var update = {
                $pull: {
                    incFriendReq: {
                        from: otheruid
                    }
                }
            };

            if (accepted) {
                update.$push = {
                    friends: {
                        friend: otheruid
                    }
                };
            }

            User.update({
                    _id: uid
                }, update)
                .exec(err => {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
        };


    User.findOne({
            username,
            outFriendReq: req.user._id
        })
        .exec((err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.end();
            }

            var parallelTasks = 2,
                finalCb = (err) => {
                    if (err) {
                        return next(err);
                    }
                    parallelTasks -= 1;
                    if (!parallelTasks) {
                        // Finally send ack
                        return res.json({
                            msg: 'OK'
                        });
                    }
                };

            // Update this user's incoming friend requests list and
            // other user's outgoing friend requests list
            // and if accepted add each other to friends list
            updateSender(user._id, req.user._id, accepted, finalCb);
            updateReceiver(req.user._id, user._id, accepted, finalCb);
        });
};


exports.userOutRequestPost = (req, res, next) => {

    var username = req.body.username,
        text = req.body.text,
        updateSender = (uid, otheruid, cb) => {
            User.update({
                    _id: uid
                }, {
                    $push: {
                        outFriendReq: otheruid
                    }
                })
                .exec(err => {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
        },
        updateReceiver = (uid, otheruid, text, cb) => {
            User.update({
                    _id: uid
                }, {
                    $push: {
                        incFriendReq: {
                            from: otheruid,
                            text
                        }
                    }
                })
                .exec(err => {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
        };

    if (!areStrings([username, text])) {
        return res.json({
            error: res.__('badInput')
        });
    }

    username = username.trim().toLowerCase();

    if (username.length < limits.USERNAME_MIN_LENGTH ||
        username.length > limits.USERNAME_MAX_LENGTH ||
        text.length < limits.MESSAGE_MIN_LENGTH ||
        text.length > limits.MESSAGE_MAX_LENGTH) {
        return res.json({
            error: res.__('badInput')
        });
    }

    if (username === req.user.username) {
        return res.json({
            error: res.__('errorFriendExists')
        });
    }

    User.findOne({ // Find other user and act accordingly
            username
        }, {
            friends: 1,
            outFriendReq: 1,
            incFriendReq: 1
        })
        .exec((err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.json({
                    error: res.__('errorUserDoesNotExist')
                });
            }

            if (user.friends.some(e => e.friend.equals(req.user._id))) {
                return res.json({
                    error: res.__('errorFriendExists')
                });
            }

            if (user.outFriendReq.some(e => e.equals(req.user._id)) ||
                user.incFriendReq.some(e => e.from.equals(req.user._id))) {
                return res.json({
                    error: res.__('errorRequestExists')
                });
            }

            var parallelTasks = 2,
                finalCb = (err) => {
                    if (err) {
                        return next(err);
                    }
                    parallelTasks -= 1;
                    if (!parallelTasks) {
                        // Finally send ack
                        return res.json({
                            msg: res.__('infoInvitationSent')
                        });
                    }
                };

            // Update this user's outgoing friend requests list and
            // other user's incoming friend requests list
            updateSender(req.user._id, user._id, finalCb);
            updateReceiver(user._id, req.user._id, text, finalCb);

        });

};



exports.userSettingsGet = (req, res) => {
    var userLocale = req.user.locale,
        localesArr = Object.keys(limits.LOCALES),
        locales = [];

    if (userLocale) {
        userLocale = {
            value: userLocale,
            text: req.__(userLocale)
        };

        var ind = localesArr.indexOf(userLocale.value);
        localesArr.splice(ind, 1);
    }

    localesArr.forEach(e => locales.push({
        value: e,
        text: req.__(e)
    }));

    res.render('settings', {
        userLocale,
        locales
    });
};




exports.userSettingsPost = (req, res, next) => {
    var locale = req.body.language !== req.user.locale ? req.body.language : '',
        pwd = req.body.pwd === req.body['pwd-confirm'] ? req.body.pwd : '',
        locales = Object.keys(limits.LOCALES),
        update = {
            $set: {}
        },
        updateUser = () => {
            User.update({
                    _id: req.user._id
                }, update)
                .exec(err => {

                    if (err) {
                        return next(err);
                    }

                    if (locale) {
                        res.cookie('locale', locale, {
                            expires: new Date(Date.now() + limits.COOKIES_AGE),
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production'
                        });
                    }

                    res.redirect('/login');
                });
        };

    if (!areStrings([locale, pwd])) {
        res.redirect('/main/settings');
    }

    if (locales.indexOf(locale) !== -1) {
        update.$set.locale = locale;
    }

    var len = pwd.length;

    if (len >= limits.PWD_MIN_LENGTH && len <= limits.PWD_MAX_LENGTH) {

        // update jti property
        update.$set.jti = Date.now();

        // hash password
        bcrypt.hash(pwd, saltRounds, (err, hash) => {

            if (err) {
                return next(err);
            }

            update.$set.pwd = hash;

            // update user document
            return updateUser();
        });
    } else {
        if (locale) {
            return updateUser();
        }

        res.redirect('/main/settings');
    }

};
