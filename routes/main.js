const express = require('express');
const router = express.Router();

const vars = require('../config').vars;
const crosswordController = require('../controllers/crosswordController');


/* GET main page. */
router.get('/', function (req, res) {
  res.render('main', {
    author: vars.author,
    username: req.user.username,
    isAdmin: req.user.isAdmin
  });
});

router.get('/upload-crossword', crosswordController.crosswordUploadGet);

router.post('/upload-crossword', crosswordController.crosswordUploadPost);

router.get('/friends', function (req, res, next) {
  console.log('friends page');

  var initObj = new Init();

  initObj.friends = [{
    username: 'nick',
    name: 'Nick',
    completedGames: 2
  }, {
    username: 'steve85',
    name: 'Steve',
    completedGames: 0
  }, {
    username: 'peter',
    name: 'Peter',
    completedGames: 0
  }];

  initObj.inqFriendReqs = [{
    date: '26/03/2017',
    username: 'paul',
    text: 'Hello!'
  }, {
    date: '18/03/2017',
    username: 'matt',
    text: 'Want to play?'
  }];

  initObj.users = [{
    username: 'carl'
  }, {
    username: 'matt'
  }];

  res.render('friends', initObj);
  //console.log(initObj);
});

router.get('/history', function (req, res, next) {
  console.log('history page');

  var initObj = new Init();

  res.render('history', initObj);
  //console.log(initObj);
});



router.get('/new-game', function (req, res, next) {
  console.log('new-game page');

  var initObj = new Init();

  initObj.friends = [{
    username: 'nick'
  }, {
    username: 'steve'
  }, {
    username: 'peter'
  }];

  res.render('new-game', initObj);
  //console.log(initObj);
});

router.get('/resume-game', function (req, res, next) {
  console.log('resume-game page');

  var initObj = new Init();

  res.render('resume-game', initObj);
  //console.log(initObj);
});

router.get('/game-session', function (req, res, next) {
  console.log('game-session page');

  var initObj = new Init();

  res.render('game-session', initObj);
  //console.log(initObj);
});







router.post('/new-game', function (req, res, next) {

  var initObj = init;

  var crosswordTemplate = {
    _id: "<ObjectId>",
    difficulty: "<Number>",
    totalLetters: "<Number>",
    dimensions: ["<Number>", "<Number>"],
    blackPositions: [
      ["<Number>", "<Number>"], "..."
    ],
    clues: [{
      position: ["<Number>", "<Number>"],
      isAcross: "<Boolean>",
      text: "<String>",
      answer: "<String>"
    }, "..."]
  };


  var myCrossword1 = {
    dimensions: [6, 6],
    blackPositions: [
      [2, 4],
      [3, 2],
      [4, 5],
      [5, 3]
    ],
    clues: {
      across: [{
          position: 1,
          text: 'Δοχείο για νερό ή κρασί.',
        }, {
          position: 2,
          text: 'Η μυθική χώρα του Αιήτη — Εισάγει υποθετικές προτάσεις.'
        },
        {
          position: 3,
          text: 'Κεφάλι από ιερό λείψανο.'
        },
        {
          position: 4,
          text: 'Εκπροσωπείται κι αυτή στο προεδρείο της Γ.Σ.Ε.Ε. (αρχικά).'
        },
        {
          position: 5,
          text: 'Λατρευόταν στην αρχαία Αίγυπτο — Άδης… προγόνων μας.'
        },
        {
          position: 6,
          text: 'Μαζί, ομού.'
        }
      ],
      down: [{
          position: 1,
          text: 'Μηχανή λήψης εικόνας.',
        },
        {
          position: 2,
          text: 'Πληθυντικός άρθρου της Αρχαίας — Χρησιμοποιείται σε παρομοιώσεις.',
        },
        {
          position: 3,
          text: 'Φορητή κούνια βρέφους.',
        },
        {
          position: 4,
          text: 'Είναι τα υφάσματα από αμίαντο.',
        },
        {
          position: 5,
          text: 'Έρημος της Ινδίας — Μεσαία στον… κιμά.',
        },
        {
          position: 6,
          text: '"Βασίλισσα" αρχαίων.',
        }
      ]
    }
  };


  initObj.clues = myCrossword1.clues;
  // console.log(initObj.clues);

  res.render('game-session', initObj);
  //console.log(initObj);
});

module.exports = router;
