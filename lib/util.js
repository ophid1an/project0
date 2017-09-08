const limits = require('../config').limits;

exports.toDate = (locale, engDate) => {
    if (locale !== 'en') {
        var locales = limits.LOCALES,
            engMonths = locales.en.months,
            localeMonths = locales[locale].months,
            dateArr = engDate.split(' ');

        if (locale === 'el') {
            var temp = dateArr[0];
            dateArr[0] = dateArr[1];
            dateArr[1] = localeMonths[engMonths.indexOf(temp.toUpperCase())];
        }

        return dateArr.join(' ');
    }

    return engDate;
};

exports.mod = (n, m) => {
    return ((n % m) + m) % m;
};

exports.msToHours = ms => ms / 3600000;

exports.areStrings = strings => {
    for (var i = 0, len = strings.length; i < len; i += 1) {
        if (typeof strings[i] !== 'string') {
            return false;
        }
    }
    return true;
};

exports.indexOfArray = (val, array) => {
    var hash = {},
        len = array.length;

    for (var i = 0; i < len; i++) {
        hash[array[i]] = i;
    }
    return (hash.hasOwnProperty(val)) ? hash[val] : -1;
};

exports.getMousePosition = (canvas, event) => {
    var rect = canvas.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    return [x, y];
};

exports.parseCrossword = cw => {

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

    const languagesSupported = Object.keys(limits.CW_LANGUAGES_SUPPORTED),
        difficulties = limits.CW_DIFFICULTIES,
        maxDim = limits.CW_MAX_DIMENSION,
        zeroBased = cw.zeroBased,
        lang = cw.lang,
        diff = cw.diff,
        dim = cw.dim,
        bpos = cw.blacksPos,
        clues = cw.clues,
        toZeroBased = arr => [arr[0] - 1, arr[1] - 1];

    var cluesAcrossInd = [],
        cluesDownInd = [],
        mat = [];



    if (languagesSupported.indexOf(lang) === -1 || difficulties.indexOf(diff) === -1 ||
        !Array.isArray(dim) || dim.length !== 2 || !Array.isArray(bpos) ||
        !Array.isArray(clues) || clues.length < 1) {

        return false;
    }

    const rows = dim[0],
        cols = dim[1];

    if (!Number.isInteger(rows) || !Number.isInteger(cols) ||
        rows < 1 || cols < 1 || rows > maxDim || cols > maxDim) {

        return false;
    }

    var whitesC = rows * cols - bpos.length;

    if (whitesC < 1) {
        return false;
    }

    for (let i = 0, len = bpos.length; i < len; i += 1) {
        let pos = bpos[i];

        if (!Array.isArray(pos) || pos.length !== 2 ||
            !Number.isInteger(pos[0]) || !Number.isInteger(pos[1])) {

            return {
                error: `Problem with black square at position: ${pos}`
            };
        }

        if (!zeroBased) {
            bpos[i] = toZeroBased(pos);
            pos = bpos[i];
        }

        if (pos[0] < 0 || pos[1] < 0 || pos[0] > rows - 1 || pos[1] > cols - 1) {

            return {
                error: `Problem with black square at position: ${pos}`
            };
        }

    }

    for (let i = 0, len = clues.length; i < len; i += 1) {
        let pos = clues[i].pos,
            answer = clues[i].answer,
            def = clues[i].def;

        if (!Array.isArray(pos) || pos.length !== 2 ||
            !Number.isInteger(pos[0]) || !Number.isInteger(pos[1]) ||
            typeof answer !== 'string' || typeof def !== 'string' ||
            answer.length < 1 || def.length < 1) {

            return {
                error: `Problem with clue at position: ${pos}`
            };
        }

        if (!zeroBased) {
            clues[i].pos = toZeroBased(pos);
            pos = clues[i].pos;
        }

        if (pos[0] < 0 || pos[1] < 0 || pos[0] > rows - 1 || pos[1] > cols - 1) {

            return {
                error: `Problem with clue at position: ${pos}`
            };
        }
    }

    for (let i = 0; i < rows; i += 1) {
        cluesAcrossInd.push([]);
    }

    for (let i = 0; i < cols; i += 1) {
        cluesDownInd.push([]);
    }

    // create an empty matrix (all '0's)
    for (let i = 0; i < rows; i += 1) {
        mat.push([]);
        for (let j = 0; j < cols; j += 1) {
            mat[i].push('0');
        }
    }

    // place black squares ('+')
    bpos.forEach(e => {
        mat[e[0]][e[1]] = '+';
    });

    const letters = limits.CW_LANGUAGES_SUPPORTED[lang];

    var counter = whitesC;

    // place answers
    for (let clueInd = 0, len = clues.length; clueInd < len; clueInd += 1) {
        let clue = clues[clueInd],
            cLen = clue.answer.length,
            isAcross = clue.isAcross,
            x = clue.pos[0],
            y = clue.pos[1];

        for (let i = 0; i < cLen; i += 1) {
            let letter = clue.answer[i];

            if (letters.indexOf(letter) === -1 ||
                (mat[x][y] !== '0' && mat[x][y] !== letter)) {

                return {
                    error: `Problem with clue at index: ${clueInd} letter index: ${i} letter: ${letter}`
                };
            }

            if (mat[x][y] === '0') {
                counter -= 1;
            }

            mat[x][y] = clue.answer[i];

            if (isAcross) {
                y += 1;
            } else {
                x += 1;
            }

        }

        // update cluesAcrossInd or cluesDownInd
        let tempArr = isAcross ? cluesAcrossInd[x] : cluesDownInd[y],
            coordToCheck = isAcross ? 1 : 0,
            tempArrLen = tempArr.length;

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

    }

    if (counter > 1) { // Consider still empty white squares as black squares
        for (let i = 0; i < rows; i += 1) {
            for (let j = 0; j < cols; j += 1) {
                if (mat[i][j] === '0') {
                    mat[i][j] = '+';
                    bpos.push([i, j]);
                    whitesC -= 1;
                    counter -= 1;
                }
            }
        }
    }

    if (counter === 0) {
        return {
            cw: {
                lang,
                diff,
                whitesC,
                dim,
                blacksPos: bpos,
                clues,
                cluesAcrossInd,
                cluesDownInd
            },
            matrix: drawMatrix(mat)
        };
    }

    return {
        error: 'Some white squares were not filled with letters.'
    };

};
