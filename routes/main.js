const express = require('express');
const router = express.Router();

const title = require('../config').title;
const author = require('../config').author;
const userController = require('../controllers/userController');
const crosswordController = require('../controllers/crosswordController');
const gameController = require('../controllers/gameController');

const testController = require('../controllers/testController'); // TODO delete


/* GET main page. */
router.get('/', function (req, res) {
    res.render('main', {
        title: title,
        author: author,
        username: req.user.username,
        isAdmin: req.user.isAdmin
    });
});

router.get('/new-game', gameController.gameNewGet);

router.post('/new-game', gameController.gameNewPost);

router.get('/resume-game', gameController.gameResumeGet);

router.get('/game-session/:gameId', gameController.gameSessionGet);

router.get('/friends', userController.userFriendsGet);

router.get('/history', userController.userHistoryGet);

router.get('/user-settings', userController.userSettingsGet);

router.get('/upload-crossword', crosswordController.crosswordUploadGet);

router.post('/upload-crossword', crosswordController.crosswordUploadPost);



// if (process.env.NODE_ENV !== 'production') { // TODO delete
router.get('/add-friend/:user', testController.userAddFriendGet);
router.get('/crosswords', testController.crosswordsGet);
router.get('/games', testController.gamesGet);
router.get('/random-crossword/:diff', testController.randomCrosswordGet);
// }



module.exports = router;
