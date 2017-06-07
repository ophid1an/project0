const gameConf = require('./game-conf');
const grid = require('./game-grid');

const selectionFactory = (crossword, socket, other = false) => {
    // Private properties and methods for both selections
    var clues = crossword.clues,
        colors = gameConf.colors,
        colorFill = other ? colors.otherSelection : colors.thisSelection,
        colorClear = colors.default,
        clueInd = -1,

        drawSelection = c => {
            grid.drawSelection({
                pos: clues[clueInd].pos,
                isAcross: clues[clueInd].isAcross,
                numOfSquares: clues[clueInd].len,
                color: c
            });
        },

        isClear = () => clueInd === -1,

        // Public methods for both selections
        stub = {
            set(ind) {
                if (ind >= 0 && ind < clues.length) {
                    clueInd = ind;
                    drawSelection(colorFill);
                }
                return this;
            },
            clear() {
                if (!isClear()) {
                    drawSelection(colorClear);
                }
                return this;
            },

        };

    if (!other) {
        // Extra private properties and methods for this player's selection
        var cursor = {
                pos: [],
                isCertain: true
            },
            colorCursor = colors.cursor,
            colorBackground = colors.background,
            defSingleDiv = gameConf.htmlElements.defSingleDiv,


            setCursor = (pos = cursor.pos, isCertain = true, color = colorCursor) => {
                cursor = {
                    pos,
                    isCertain
                };
                grid.drawCursor({
                    pos: cursor.pos,
                    isCertain: cursor.isCertain,
                    color: color
                });
            },

            getCluesIndicesFromCursorPos = (sqPos) => {
                var cluesIndices = [];
                clues.forEach(function (clue, clueInd) {
                    var rowsMod = clue.isAcross ? 0 : clue.len;
                    var colsMod = clue.isAcross ? clue.len : 0;
                    if (sqPos[0] >= clue.pos[0] && sqPos[1] >= clue.pos[1] &&
                        sqPos[0] <= clue.pos[0] + rowsMod &&
                        sqPos[1] <= clue.pos[1] + colsMod) {
                        cluesIndices.push(clueInd);
                    }
                });
                return cluesIndices;
            },

            computeClueIndToUse = (indices, sqPos) => {
                var newInd;

                if (indices.length === 1) {
                    return indices[0];
                }

                newInd = clues[indices[0]].isAcross ? indices[0] : indices[1]; // select 'Across'
                if (cursor.pos.length) {
                    if (clueInd === indices[0] ||
                        clueInd === indices[1]) {
                        if (!clues[clueInd].isAcross) {
                            newInd = clues[indices[0]].isAcross ? indices[1] :
                                indices[0]; // select 'Down'
                        }
                        if (cursor.pos[0] === sqPos[0] &&
                            cursor.pos[1] === sqPos[1]) {
                            newInd = clues[clueInd].isAcross ? indices[1] :
                                indices[0];
                        }
                    }
                }

                return newInd;
            };

        // Extra public methods for this player's selection
        Object.assign(stub, {
            set(ind) { // Override
                if (ind >= 0 && ind < clues.length) {
                    clueInd = ind;
                    drawSelection(colorFill);
                    setCursor(clues[clueInd].pos);
                    defSingleDiv.innerHTML = clues[clueInd].def;
                }
                return this;
            },
            setBySqPos(sqPos) {
                var cluesIndices = getCluesIndicesFromCursorPos(sqPos);
                clueInd = computeClueIndToUse(cluesIndices, sqPos);
                drawSelection(colorFill);
                setCursor(sqPos);
                defSingleDiv.innerHTML = clues[clueInd].def;
                return this;
            },
            clear() { // Override
                // if (!isClear()) { // TODO REMOVE IF?
                    setCursor(undefined, undefined, colorBackground); // clear cursor
                    drawSelection(colorClear);
                    defSingleDiv.innerHTML = '&nbsp;';
                // }
                return this;
            },
            moveCursor(direction = "forward") {
                var isAcross = clues[clueInd].isAcross,
                    len = clues[clueInd].len,
                    indInWord = stub.getIndexInWord();

                if (direction === 'backwards') {
                    if (isAcross) {
                        if (indInWord) {
                            cursor.pos = [cursor.pos[0], cursor.pos[1] - 1];
                        }
                    } else {
                        if (indInWord) {
                            cursor.pos = [cursor.pos[0] - 1, cursor.pos[1]];
                        }
                    }
                } else {
                    if (isAcross) {
                        if (indInWord !== len - 1) {
                            cursor.pos = [cursor.pos[0], cursor.pos[1] + 1];
                        }
                    } else {
                        if (indInWord !== len - 1) {
                            cursor.pos = [cursor.pos[0] + 1, cursor.pos[1]];
                        }
                    }
                }
                setCursor(cursor.pos,cursor.isCertain);
                return this;
            },
            toggleCursor() {
                setCursor(undefined, !cursor.isCertain);
                return this;
            },
            getIndexInWord() {
                var cluePos = clues[clueInd].pos,
                    isAcross = clues[clueInd].isAcross;
                return isAcross ? cursor.pos[1] - cluePos[1] : cursor.pos[0] - cluePos[0];
            },
            getClueInd() {
                return clueInd;
            },
            getCursor() {
                return cursor;
            },
            emit(ind = clueInd) {
                socket.emit('selection', ind);
                return this;
            }
        });
    }

    return stub;
};

module.exports = selectionFactory;
