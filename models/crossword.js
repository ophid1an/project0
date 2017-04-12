const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CrosswordSchema = Schema({
  language: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  totalWhite: {
    type: Number,
    min: 1,
    required: true
  },
  dimensions: {
    type: [Number],
    required: true
  },
  blackPositions: {
    type: [
      [Number]
    ]
  },
  clues: {
    type: [{
      isAcross: {
        type: Boolean,
        required:true
      },
      position: {
        type: [Number],
        required: true
      },
      text: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      }
    }],
    required: true
  }
});

module.exports = mongoose.model('Crossword', CrosswordSchema);
