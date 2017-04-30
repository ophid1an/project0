const express = require('express');
const router = express.Router();

const vars = require('../config').vars;
const cookiesOptions = require('../config').cookiesOptions;
const userController = require('../controllers/userController');


/* GET home page. */
router.get('/', function (req, res) {
    if (req.cookies[cookiesOptions.name.jwt]) {
        res.redirect('/main');
    } else {
        res.render('index', {
            author: vars.author
        });
    }
});

router.get('/logout', function (req, res) {
    res.clearCookie(cookiesOptions.name.jwt);
    res.clearCookie(cookiesOptions.name.game);
    res.redirect('/');
});

router.get('/login', userController.userLoginGet);

router.post('/login', userController.userLoginPost);

router.get('/register', userController.userRegisterGet);

router.post('/register', userController.userRegisterPost);

module.exports = router;
