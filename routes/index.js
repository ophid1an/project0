const express = require('express'),
    router = express.Router(),
    title = require('../config').title,
    author = require('../config').author,
    userController = require('../controllers/userController');


/* GET home page. */
router.get('/', (req, res) => {
    if (req.cookies.jwt) {
        return res.redirect('/main');
    }
    res.render('index', {
        title: title,
        author: author
    });
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.clearCookie('locale');
    res.redirect('/');
});

router.get('/login', userController.userLoginGet);

router.post('/login', userController.userLoginPost);

router.get('/register', userController.userRegisterGet);

router.post('/register', userController.userRegisterPost);


module.exports = router;
