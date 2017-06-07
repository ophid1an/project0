const gameConf = require('./game-conf');
const grid = require('./game-grid');
const letters = require('./game-letters');

const input = (function () {
    var userInput = gameConf.htmlElements.userInput,
        transformLetter = (letter, selection) => {
            var cursor = selection.getCursor();
            return {
                letter,
                pos: cursor.pos,
                isCertain: cursor.isCertain
            };
        },
        stub = {
            check(spec) {
                var key = spec.key,
                    lettersSupported = spec.lettersSupported,
                    selection = spec.selection;


                var inputValue = userInput.value,
                    utilKeys = gameConf.utilKeys,
                    ind = -1,
                    transformedLetter = {};

                if (!inputValue) {
                    return false;
                }

                // Check for util keys
                ind = utilKeys.indexOf(key);
                if (ind !== -1) {
                    var utilKey = utilKeys[ind];
                    switch (utilKey) {
                        case 'Enter':
                            userInput.blur();
                            break;
                        case 'Backspace':
                            transformedLetter = (transformLetter(' ', selection));
                            letters.add(transformedLetter);
                            grid.drawLetters([transformedLetter]);
                            selection.moveCursor('backwards');
                            // //Clear lettersToSend letter
                            // lettersToSend.letters[getClueIndexFromCursorPos()] = ' ';
                            //
                            // // Clear square
                            // manipulateSquare({
                            //     name: 'clear',
                            //     pos: cursor.pos,
                            // });
                            //
                            // // Move cursor back
                            // moveCursor('backwards');
                            // drawCursor();
                            //
                            // lettersToSend.startInd = getClueIndexFromCursorPos();
                            break;
                    }
                    return;
                }

                // Else check for letter
                ind = lettersSupported.indexOf(inputValue[inputValue.length - 1].toUpperCase());
                if (ind !== -1) {
                    var letter = lettersSupported[ind];

                    if (letter === '.') {
                        return selection.toggleCursor();
                    }
                    transformedLetter = (transformLetter(letter, selection));
                    letters.add(transformedLetter, selection);
                    grid.drawLetters([transformedLetter]);
                    selection.moveCursor('forward');
                }

            },
            clear() {
                userInput.value = '';

                return this;
            }
        };

    return stub;
}());

module.exports = input;
