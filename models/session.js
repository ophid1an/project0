const mongoose = require('mongoose');
const limits = require('../config');
const Schema = mongoose.Schema;

const sessionSchema = Schema({
  username: {
    type: String,
    required: true,
    minlength: limits.USERNAME_MIN_LENGTH,
    maxlength: limits.USERNAME_MAX_LENGTH,
    unique:true
  },
  email: {
    type: String,
    required: true,
    unique:true
  },
  pwd: {
    type: String,
    required: true
  },
  isAdmin: Boolean
});

module.exports = mongoose.model('Session', sessionSchema);
