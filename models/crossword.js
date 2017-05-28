const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const limits = require('../config').limits;

const CrosswordSchema = Schema({
    lang: {
        type: String,
        enum: limits.CW_LANGUAGES_SUPPORTED,
        required: true
    },
    diff: {
        type: String,
        enum: limits.CW_DIFFICULTIES,
        required: true,
        index: true
    },
    whitesC: {
        type: Number,
        min: 1,
        required: true
    },
    dim: {
        type: [Number],
        required: true
    },
    blacksPos: [
        [Number]
    ],
    cluesAcrossInd: {
        type: [
            [Number]
        ],
        required: true
    },
    cluesDownInd: {
        type: [
            [Number]
        ],
        required: true
    },
    clues: {
        type: [{
            isAcross: {
                type: Boolean,
                required: true
            },
            pos: {
                type: [Number],
                required: true
            },
            def: {
                type: String,
                minlength: 1,
                required: true
            },
            answer: {
                type: String,
                minlength: 1,
                required: true
            }
        }],
        required: true
    }
});

module.exports = mongoose.model('Crossword', CrosswordSchema);
