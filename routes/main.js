const express = require('express'),
    router = express.Router(),
    title = require('../config').title,
    author = require('../config').author,
    userController = require('../controllers/userController'),
    crosswordController = require('../controllers/crosswordController'),
    gameController = require('../controllers/gameController');


/* GET main page. */
router.get('/', (req, res) => {
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


module.exports = router;
