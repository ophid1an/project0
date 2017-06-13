const express = require('express');
const router = express.Router();

const title = require('../config').title;
const author = require('../config').author;
const userController = require('../controllers/userController');
const crosswordController = require('../controllers/crosswordController');
const gameController = require('../controllers/gameController');

const testController = require('../controllers/testController');


/* GET main page. */
router.get('/', function (req, res) {
    var iReqs = req.user.incFriendReq,
        incRequests = (iReqs && iReqs.length) ? iReqs.length : 0;

    res.render('main', {
        title,
        author,
        username: req.user.username,
        isAdmin: req.user.isAdmin,
        incRequests
    });
});

router.get('/new-game', gameController.gameNewGet);

router.post('/new-game', gameController.gameNewPost);

router.get('/resume-game', gameController.gameResumeGet);

router.get('/game-session/:gameId', gameController.gameSessionGet);

router.get('/game-statistics/:gameId', gameController.gameStatisticsGet);

router.get('/friends', userController.userFriendsGet);

router.post('/friends/out-request', userController.userOutRequestPost);

router.post('/friends/inc-request', userController.userIncRequestPost);

router.get('/history', userController.userHistoryGet);

router.get('/settings', userController.userSettingsGet);

router.get('/upload-crossword', crosswordController.crosswordUploadGet);

router.post('/upload-crossword', crosswordController.crosswordUploadPost);



if (process.env.NODE_ENV !== 'production') {
    router.get('/add-friend/:user', testController.userAddFriendGet);
    router.get('/crosswords', testController.crosswordsGet);
    router.get('/games', testController.gamesGet);
    router.get('/random-crossword/:diff', testController.randomCrosswordGet);
}



module.exports = router;
