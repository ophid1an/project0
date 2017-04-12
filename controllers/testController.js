const User = require('../models/user');
const limits = require('../config').limits;
// const async = require('async');
const jwt = require('jsonwebtoken');
const jwtOptions = require('../config').jwtOptions;
const cookiesOptions = require('../config').cookiesOptions;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const util = require('util');
const mongoose = require('mongoose');

function userAddFriendGet(req, res, next) {

  User.findOne({
        'username': 'nick'
    })
    .exec((err, user) => {

      if (err) {
        return next(err);
      }

      User.update({
        _id: req.user._id
      }, {
        $push: {
          friends: {
            friend: user
          }
        }
      }, err => {
        if (err) {
          return next(err);
        }
        res.redirect('/main/friends');
      });


    });
}

module.exports = {
    userAddFriendGet: userAddFriendGet
};
