const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CrosswordSchema = Schema({
  language: {
    type: String
  },
  difficulty: {
    type: Number,
    required: true
  },
  totalLetters: {
    type: Number,
    required: true
  },
  dimensions: {
    type: [Number],
    required: true
  },
  blackPositions: {
    type: [Schema.Types.Mixed],
    required: true
  },
  cluesAcross: {
    type: [Schema.Types.Mixed],
    required: true
  },
  cluesDown: {
    type: [Schema.Types.Mixed],
    required: true
  }
});

module.exports = mongoose.model('Crossword', CrosswordSchema);
