const User = require('../models/user');
const limits = require('../config').limits;
// const async = require('async');
const jwt = require('jsonwebtoken');
const jwtOptions = require('../config').jwtOptions;
const cookiesOptions = require('../config').cookiesOptions;
const bcrypt = require('bcrypt');
const saltRounds = 10;


function userLoginGet(req, res) {
  if (req.cookies[cookiesOptions.name]) {
    res.redirect('/main');
  } else {
    res.render('login');
  }
}

function userLoginPost(req, res, next) {

  function userLoginPostErrors() {
    res.render('login', {
      errors: [{
        msg: res.__('warnWrongUsernameOrPassword')
      }]
    });
  }

  function userLoginPostErrorsJSON() {
    res.json({
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
          res.cookie(cookiesOptions.name, token, {
            expires: new Date(Date.now() + cookiesOptions.age),
            httpOnly: true
          });
          // res.json({
          //   errors: null,
          //   token: token
          // });
          res.redirect('/main');
        });


      });
    });
}

function userRegisterGet(req, res) {
  if (req.cookies[cookiesOptions.name]) {
    res.redirect('/main');
  } else {
    res.render('register');
  }
}

function userRegisterPost(req, res, next) {

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

          res.redirect('/');
        });
      });
    });
}

module.exports = {
  userLoginGet: userLoginGet,
  userLoginPost: userLoginPost,
  userRegisterGet: userRegisterGet,
  userRegisterPost: userRegisterPost
};
