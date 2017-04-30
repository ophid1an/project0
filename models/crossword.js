const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CrosswordSchema = Schema({
    lang: {
        type: String,
        required: true
    },
    diff: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
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
    blacksPos: {
        type: [
            [Number]
        ]
    },
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
