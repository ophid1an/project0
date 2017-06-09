const gameConf = require('./game-conf');
const indexOfArray = require('../../lib/util').indexOfArray;

const grid = (function () {
    var canvas = gameConf.canvas,
        colors = gameConf.colors,
        pad = gameConf.grid.pad,
        numberPadX = gameConf.grid.numberPadX,
        numberPadY = gameConf.grid.numberPadY,
        sqLen = gameConf.grid.sqLen,
        padX = gameConf.grid.padX,
        padY = gameConf.grid.padY,
        ctx = canvas.getContext('2d'),
        offsetFromBtm = 5,
        crossword = {},
        isPlayer1 = true,
        rows = -1,
        cols = -1,
        bpos = [],
        bposHash = {},

        manipulateSquare = spec => {
            var x, y;

            if (spec.pos) {
                x = 0.5 + padX + sqLen * spec.pos[1];
                y = 0.5 + padY + sqLen * spec.pos[0];
            }

            switch (spec.name) {
                case 'fill':
                    ctx.fillStyle = spec.color;
                    ctx.fillRect(x, y, sqLen, sqLen);
                    break;

                case 'selection':
                    var squares = spec.squares;
                    ctx.strokeStyle = spec.color;

                    squares.forEach(square => {
                        x = 0.5 + padX + sqLen * square[1];
                        y = 0.5 + padY + sqLen * square[0];
                        ctx.strokeRect(x + 1, y + 1, sqLen - 2, sqLen - 2);
                    });
                    break;

                case 'write':
                    var letterFull = spec.isCertain ? spec.letter :
                        spec.letter + gameConf.uncertaintyChar;
                    ctx.fillStyle = spec.color;
                    ctx.fillText(letterFull, x + (sqLen - ctx.measureText(letterFull).width) / 2, y + sqLen - offsetFromBtm);
                    break;

                case 'clear':
                    ctx.clearRect(x + 0.5, y + 0.5, sqLen - 1, sqLen - 1);
                    break;

                case 'cursor':
                    ctx.save();
                    if (!spec.isCertain) {
                        ctx.strokeStyle = colors.background;
                        ctx.strokeRect(x + 2, y + 2, sqLen - 4, sqLen - 4);
                        ctx.setLineDash([4, 2]);
                    }
                    ctx.strokeStyle = spec.color;
                    ctx.strokeRect(x + 2, y + 2, sqLen - 4, sqLen - 4);
                    ctx.restore();
                    break;
                case 'clearCursorArea':
                    ctx.clearRect(x + 1.5, y + 1.5, sqLen - 3, sqLen - 3);
                    break;
            }

        },

        stub = {
            init(c, isP1) {
                crossword = c;
                isPlayer1 = isP1;
                rows = crossword.dim[0];
                cols = crossword.dim[1];
                bpos = crossword.bpos;
                bpos.forEach((ele, ind) => bposHash[ele] = ind);
                return this;
            },
            draw() {
                var i, x, y;

                // var scaleFactor = 1;


                // if (conf.scaleFactor) {
                //   scaleFactor = conf.scaleFactor;
                //   pad = pad / scaleFactor;
                // }


                // sqLen = Math.floor(Math.min((cw - 2 * pad - 1) / (cols ), (ch - 2 * pad - 1) / (rows )));


                ctx.strokeStyle = colors.default;
                // ctx.strokeRect(0, 0, canvas.width, canvas.height);


                // ctx.scale(scaleFactor, scaleFactor);
                // ctx.save();

                // horizontal lines
                for (i = 0; i <= rows; i += 1) {
                    x = padX + 0.5;
                    y = padY + 0.5 + sqLen * i;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cols * sqLen, y);
                    ctx.stroke();
                }

                // vertical lines
                for (i = 0; i <= cols; i += 1) {
                    x = padX + 0.5 + sqLen * i;
                    y = padY + 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + rows * sqLen);
                    ctx.stroke();
                }

                // horizontal numbers
                for (i = 0; i < cols; i += 1) {
                    x = padX + sqLen * i + (sqLen - ctx.measureText(i).width) / 2;
                    y = padY - offsetFromBtm;
                    ctx.strokeText(i + 1, x, y);
                }


                //vertical numbers
                for (i = 0; i < rows; i += 1) {
                    x = pad + (numberPadX - ctx.measureText(i).width) / 2;
                    y = padY + sqLen * (i + 1) - offsetFromBtm;
                    ctx.strokeText(i + 1, x, y);
                }

                // fill black squares
                bpos.forEach(function (pos) {
                    manipulateSquare({
                        name: 'fill',
                        pos: pos,
                        color: colors.default
                    });
                });

                // ctx.restore();
                return this;
            },
            drawLetters(letters) {
                letters.forEach(function (l) {
                    manipulateSquare({
                        name: 'clear',
                        pos: l.pos
                    });
                    manipulateSquare({
                        name: 'write',
                        letter: l.letter,
                        pos: l.pos,
                        color: l.isPlayer1 === isPlayer1 ? colors.thisPlayer : colors.otherPlayer,
                        isCertain: l.isCertain
                    });
                });
                return this;
            },
            drawLetter(letter) {
                // Clear area enveloped by cursor first
                manipulateSquare({
                    name: 'clearCursorArea',
                    pos: letter.pos
                });
                // Write letter afterwards
                manipulateSquare({
                    name: 'write',
                    letter: letter.letter,
                    pos: letter.pos,
                    color: colors.thisPlayer,
                    isCertain: letter.isCertain
                });
                return this;
            },
            drawCursor(spec) {
                manipulateSquare({
                    name: 'cursor',
                    pos: spec.pos,
                    color: spec.color,
                    isCertain: spec.isCertain
                });
            },
            drawSelection(spec) {
                manipulateSquare({
                    name: 'selection',
                    squares: spec.squares,
                    color: spec.color
                });
            },
            resize() {
                var rows = crossword.dim[0],
                    cols = crossword.dim[1],
                    w = 2 * pad + numberPadX + sqLen * cols,
                    h = 2 * pad + numberPadY + sqLen * rows;
                canvas.setAttribute('width', w);
                canvas.setAttribute('height', h);

                return this;
            },
            getSquarePosition(crossword, mousePos) {
                var sqPos = [];

                sqPos.push(Math.floor((mousePos[1] - padY) / sqLen));
                sqPos.push(Math.floor((mousePos[0] - padX) / sqLen));

                if (sqPos[0] >= 0 && sqPos[1] >= 0 && sqPos[0] < rows && sqPos[1] < cols &&
                    !bposHash.hasOwnProperty(sqPos)) {
                    return sqPos;
                }

                return false;
            }
        };

    return stub;
}());

module.exports = grid;
