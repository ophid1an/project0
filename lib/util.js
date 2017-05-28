const User = require('../models/user');
const Crossword = require('../models/crossword');
const limits = require('../config').limits;

exports.indexOfArray = function (val, array) {
    var hash = {};

    var len = array.length;
    for (var i = 0; i < len; i++) {
        hash[array[i]] = i;
    }
    return (hash.hasOwnProperty(val)) ? hash[val] : -1;
};

exports.getFriends = function (userId, callback) {

    User
        .findOne({
            _id: userId
        }, {
            friends: 1
        })
        .populate('friends.friend', 'username')
        .exec((err, user) => {
            if (err) {
                return callback(err);
            }

            return callback(null, user.friends.map(e => {
                return {
                    username: e.friend.username,
                    _id: e.friend._id,
                    completedGames: e.completedGames
                };
            }));
        });

};



exports.parseCrossword = function (cw) {

    function drawMatrix(mat) {
        if (mat.length) {

            var str = '';
            const rows = mat.length;
            const cols = mat[0].length;
            const rowStr = new Array(4 * cols + 2).join('-');

            for (let i = 0; i < rows; i += 1) {
                str += `${rowStr}\n|`;
                for (let j = 0; j < cols; j += 1) {
                    str += ` ${mat[i][j]} |`;
                }
                str += `\n`;
            }
            str += `${rowStr}`;
            return str;
        }
    }

    const zeroBased = cw.zeroBased || false;
    const languagesSupported = limits.CW_LANGUAGES_SUPPORTED;

    const lang = cw.lang;
    const diff = cw.diff;
    const dim = cw.dim;
    var clues = cw.clues;
    var bpos = cw.blacksPos;

    const cluesAcrossInd = [];
    const cluesDownInd = [];
    var mat = [];



    if (languagesSupported.indexOf(lang) === -1 || !diff || !dim || !dim.length ||
        dim.length !== 2 || !clues || !clues.length || clues.length < 1) {

        return false;
    }

    const rows = dim[0];
    const cols = dim[1];

    for (let i = 0; i < rows; i += 1) {
        cluesAcrossInd.push([]);
    }

    for (let i = 0; i < cols; i += 1) {
        cluesDownInd.push([]);
    }

    const hasBlack = bpos && bpos.length;
    const whitesC = hasBlack ? rows * cols - bpos.length : rows * cols;

    if (whitesC < 1) {
        return false;
    }

    //  convert to zero-based if not zero-based already
    if (!zeroBased) {
        if (hasBlack) {
            cw.blacksPos.forEach((e, i) => bpos[i] = [e[0] - 1, e[1] - 1]);
        }
        cw.clues.forEach((e, i) => clues[i].pos = [e.pos[0] - 1, e.pos[1] - 1]);
    }

    // create an empty matrix (all '0's)

    for (let i = 0; i < rows; i += 1) {
        mat.push([]);
        for (let j = 0; j < cols; j += 1) {
            mat[i].push(0);
        }
    }

    // place black squares ('+')

    bpos.forEach(e => {
        mat[e[0]][e[1]] = '+';
    });

    // place answers

    clues.forEach((clue, clueInd) => {

        const cLen = clue.answer.length;
        const isAcross = clue.isAcross;
        var x = clue.pos[0];
        var y = clue.pos[1];

        for (let i = 0; i < cLen; i += 1) {
            mat[x][y] = clue.answer[i];
            if (isAcross) {
                y += 1;
            } else {
                x += 1;
            }
        }

        // update cluesAcrossInd or cluesDownInd

        const tempArr = isAcross ? cluesAcrossInd[x] : cluesDownInd[y];
        const coordToCheck = isAcross ? 1 : 0;
        const tempArrLen = tempArr.length;

        if (!tempArrLen) {
            tempArr.push(clueInd);
        } else {

            for (let i = 0; i < tempArrLen; i += 1) {
                if (clue.pos[coordToCheck] < clues[tempArr[i]].pos[coordToCheck]) {
                    tempArr.splice(i, 0, clueInd);
                    break;
                }

                if (i === tempArrLen - 1) {
                    tempArr.push(clueInd);
                }

            }
        }

    });


    return {
        cw: new Crossword({
            lang: lang,
            diff: diff,
            whitesC: whitesC,
            dim: dim,
            blacksPos: bpos,
            clues: clues,
            cluesAcrossInd: cluesAcrossInd,
            cluesDownInd: cluesDownInd
        }),
        matrix: drawMatrix(mat)
    };

};
