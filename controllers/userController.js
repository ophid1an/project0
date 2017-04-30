const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const limits = require('../config').limits;
const jwtOptions = require('../config').jwtOptions;
const cookiesOptions = require('../config').cookiesOptions;
const getFriends = require('../lib/util').getFriends;

// const async = require('async');
// const util = require('util');



exports.userLoginGet = function (req, res) {

    if (req.cookies[cookiesOptions.name.jwt]) {
        return res.redirect('/main');
    }

    res.render('login');
};



exports.userLoginPost = function (req, res, next) {

    if (req.cookies[cookiesOptions.name.jwt]) {
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
                    algorithm: 'HS256'
                }, (err, token) => {
                    if (err) {
                        return next(err);
                    }
                    res.cookie(cookiesOptions.name.jwt, token, {
                        expires: new Date(Date.now() + cookiesOptions.age),
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production'
                    });
                    // res.json({
                    //   errors: null,
                    //   token: token
                    // });
                    res.redirect('/main');
                });


            });
        });
};






exports.userRegisterGet = function (req, res) {

    if (req.cookies[cookiesOptions.name.jwt]) {
        return res.redirect('/main');
    }

    res.render('register');
};




exports.userRegisterPost = function (req, res, next) {

    if (req.cookies[cookiesOptions.name.jwt]) {
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

            bcrypt.hash(user.pwd, saltRounds, (err, hash) => {

                if (err) {
                    return next(err);
                }

                user.pwd = hash;

                user.save(err => {

                    if (err) {
                        return next(err);
                    }

                    res.redirect('/login');
                });
            });
        });
};





exports.userHistoryGet = function (req, res) {
    res.render('history');
};




exports.userFriendsGet = function (req, res, next) {

    getFriends(req.user._id, (err, friends) => {

        if (err) {
            return next(err);
        }

        res.render('friends', {
            friends: friends
        });
    });
};




exports.userSettingsGet = function (req, res) {
    res.render('user-settings');
};
