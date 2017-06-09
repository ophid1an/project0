const gameConf = require('./game-conf');
const grid = require('./game-grid');
const selection = require('./game-selection');

const input = (function () {
    var userInput = gameConf.htmlElements.userInput,
        lettersSupported = [],
        socket = {},
        lettersToSend = [],
        selectionSquares = [],
        transformLetter = letter => {
            var cursor = selection.getCursor();
            return {
                ind: cursor.ind,
                letter: {
                    letter,
                    pos: selectionSquares[cursor.ind],
                    isCertain: cursor.isCertain
                }
            };
        },
        add = letter => {
            var letterWithDate = Object.assign(letter.letter, {
                date: Date.now()
            });

            lettersToSend[letter.ind] = letterWithDate;
            return this;
        },
        stub = {
            init(letters, s) {
                lettersSupported = letters;
                socket = s;
                return this;
            },
            check(key, squares) {
                var inputValue = userInput.value,
                    utilKeys = gameConf.utilKeys,
                    ind = -1,
                    transformedLetter = {};

                selectionSquares = squares;

                // Check for util keys
                ind = utilKeys.indexOf(key);
                if (ind !== -1) {
                    var utilKey = utilKeys[ind];
                    switch (utilKey) {
                        case 'Enter':
                            userInput.blur();
                            break;
                        case 'Backspace':
                            transformedLetter = transformLetter(' ');
                            add(transformedLetter);
                            grid.drawLetter(transformedLetter.letter);
                            selection.moveCursor('backwards');
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
                    transformedLetter = transformLetter(letter);
                    add(transformedLetter);
                    grid.drawLetter(transformedLetter.letter);
                    selection.moveCursor('forward');
                }

            },
            clear() {
                userInput.value = '';

                return this;
            },
            send() {
                if (!lettersToSend.length) {
                    return false;
                }

                var notEmptyLetters = lettersToSend.filter(letter => letter.letter);

                socket.emit('letters to other', {
                    letters: notEmptyLetters
                });
                return this;
            },
            clearLetters() {
                lettersToSend = [];
                return this;
            }
        };

    return stub;
}());

module.exports = input;
