const Game = require('../models/game');
const User = require('../models/user');
const Crossword = require('../models/crossword');

function gameNewGet(req, res, next) {
  User
    .findOne({
      _id: req.user._id
    })
    .populate('friends.friend')
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      res.render('game-settings', {
        friends: user.friends
      });
    });
}

function gameNewPost(req, res, next) {
  res.send('gameNewPost');
  // res.render('new-game');

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

function gameResumeGet(req, res) {
  res.render('game-settings', {
    resume: true
  });
}

function gameResumePost(req, res) {
  res.send('gameResumePost');
}

function gameSessionGet(req, res) {
  res.render('game-session');
}

module.exports = {
  gameNewGet: gameNewGet,
  gameNewPost: gameNewPost,
  gameResumeGet: gameResumeGet,
  gameResumePost: gameResumePost,
  gameSessionGet: gameSessionGet
};
