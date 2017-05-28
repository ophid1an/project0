const express = require('express');
const router = express.Router();

const title = require('../config').title;
const author = require('../config').author;
const cookiesOptions = require('../config').cookiesOptions;
const userController = require('../controllers/userController');


/* GET home page. */
router.get('/', function (req, res) {
    if (req.cookies[cookiesOptions.name]) {
        return res.redirect('/main');
    }
    res.render('index', {
        title: title,
        author: author
    });
});

router.get('/logout', function (req, res) {
    res.clearCookie(cookiesOptions.name);
    // res.clearCookie(cookiesOptions.name.game);
    res.redirect('/');
});

router.get('/login', userController.userLoginGet);

router.post('/login', userController.userLoginPost);

router.get('/register', userController.userRegisterGet);

router.post('/register', userController.userRegisterPost);

module.exports = router;
