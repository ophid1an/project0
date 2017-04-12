const Session = require('../models/session');
const User = require('../models/user');
const Crossword = require('../models/crossword');

const limits = require('../config').limits;
// const async = require('async');
const jwt = require('jsonwebtoken');
const jwtOptions = require('../config').jwtOptions;
const cookiesOptions = require('../config').cookiesOptions;
const bcrypt = require('bcrypt');
const saltRounds = 10;

function sessionNewGameGet(req, res) {
  res.render('new-game');
}

function sessionNewGamePost(req, res, next) {
  res.render('new-game');

  // router.post('/new-game', function (req, res, next) {
  //
  //
  //   var crosswordTemplate = {
  //     _id: "<ObjectId>",
  //     difficulty: "<Number>",
  //     totalLetters: "<Number>",
  //     dimensions: ["<Number>", "<Number>"],
  //     blackPositions: [
  //       ["<Number>", "<Number>"], "..."
  //     ],
  //     clues: [{
  //       position: ["<Number>", "<Number>"],
  //       isAcross: "<Boolean>",
  //       text: "<String>",
  //       answer: "<String>"
  //     }, "..."]
  //   };
  //
  //
  //   var myCrossword1 = {
  //     dimensions: [6, 6],
  //     blackPositions: [
  //       [2, 4],
  //       [3, 2],
  //       [4, 5],
  //       [5, 3]
  //     ],
  //     clues: {
  //       across: [{
  //           position: 1,
  //           text: 'Δοχείο για νερό ή κρασί.',
  //         }, {
  //           position: 2,
  //           text: 'Η μυθική χώρα του Αιήτη — Εισάγει υποθετικές προτάσεις.'
  //         },
  //         {
  //           position: 3,
  //           text: 'Κεφάλι από ιερό λείψανο.'
  //         },
  //         {
  //           position: 4,
  //           text: 'Εκπροσωπείται κι αυτή στο προεδρείο της Γ.Σ.Ε.Ε. (αρχικά).'
  //         },
  //         {
  //           position: 5,
  //           text: 'Λατρευόταν στην αρχαία Αίγυπτο — Άδης… προγόνων μας.'
  //         },
  //         {
  //           position: 6,
  //           text: 'Μαζί, ομού.'
  //         }
  //       ],
  //       down: [{
  //           position: 1,
  //           text: 'Μηχανή λήψης εικόνας.',
  //         },
  //         {
  //           position: 2,
  //           text: 'Πληθυντικός άρθρου της Αρχαίας — Χρησιμοποιείται σε παρομοιώσεις.',
  //         },
  //         {
  //           position: 3,
  //           text: 'Φορητή κούνια βρέφους.',
  //         },
  //         {
  //           position: 4,
  //           text: 'Είναι τα υφάσματα από αμίαντο.',
  //         },
  //         {
  //           position: 5,
  //           text: 'Έρημος της Ινδίας — Μεσαία στον… κιμά.',
  //         },
  //         {
  //           position: 6,
  //           text: '"Βασίλισσα" αρχαίων.',
  //         }
  //       ]
  //     }
  //   };
  //
  //
  //   initObj.clues = myCrossword1.clues;
  //   // console.log(initObj.clues);
  //
  //   res.render('game-session', initObj);
  //   //console.log(initObj);
  // });


}

function resumeGameGet(req,res) {
  res.render('resume-game');
}

function gameSessionGet(req,res) {
  res.render('game-session');
}

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
  sessionNewGameGet: sessionNewGameGet,
  sessionNewGamePost: sessionNewGamePost,
  resumeGameGet: resumeGameGet,
  gameSessionGet: gameSessionGet
};
