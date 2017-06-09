const gameConf = require('./game-conf');
const grid = require('./game-grid');
const selection = require('./game-selection');

const input = (function () {
    var userInput = gameConf.htmlElements.userInput,
        colorBackground = gameConf.colors.background,
        lettersSupported = [],
        socket = {},
        lettersToSend = [],
        selectionSquares = [],
        lettersHash = {},
        cursor = {},
        isPlayer1 = true,
        otherUsername = '',
        mostRecentOtherLetterDate = new Date(0),
        setMostRecentOtherLetterDate = letter => {
            if (otherUsername) {
                var lDate = new Date(letter.date); // letter.date is a STRING !!!
                if (lDate > mostRecentOtherLetterDate) {
                    mostRecentOtherLetterDate = lDate;
                }
            }
        },
        transformLetter = letter => {
            return {
                letter,
                pos: cursor.pos,
                isCertain: cursor.isCertain
            };
        },
        add = letter => {
            var letterWithDate = Object.assign(letter, {
                date: Date.now()
            });

            lettersToSend[cursor.ind] = letterWithDate;
            return this;
        },
        clearCursor = () => {
            grid.drawCursor({
                pos: cursor.pos,
                color: colorBackground,
                isCertain: true
            });
        },
        stub = {
            init(letters, lettersSupp, s, isP1, otherName) {
                letters.forEach(lt => {
                    setMostRecentOtherLetterDate(lt);
                    lettersHash[lt.pos] = lt.letter;
                });
                lettersSupported = lettersSupp;
                socket = s;
                isPlayer1 = isP1;
                otherUsername = otherName;
                return this;
            },
            check(key, squares) {
                var inputValue = userInput.value,
                    utilKeys = gameConf.utilKeys,
                    ind = -1,
                    transformedLetter = {};

                selectionSquares = squares;
                cursor = selection.getCursor();
                cursor.pos = selectionSquares[cursor.ind];

                // Check for util keys
                ind = utilKeys.indexOf(key);
                if (ind !== -1) {
                    var utilKey = utilKeys[ind];
                    switch (utilKey) {
                        case 'Enter':
                            userInput.blur();
                            break;
                        case 'Backspace':
                            // Clear cursor and move cursor one square backwards
                            clearCursor();
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
                    if (letter !== ' ' && letter !== lettersHash[cursor.pos]) { // Draw letter if not space and not different than previous one
                        lettersHash[cursor.pos] = letter;
                        transformedLetter = transformLetter(letter);
                        add(transformedLetter);
                        grid.drawLetter(transformedLetter);
                    } else {
                        clearCursor(); // Just clear cursor
                    }
                    selection.moveCursor('forward'); // Advance cursor
                }

            },
            updateLetters(letters) {
                letters.forEach(lt => {
                    setMostRecentOtherLetterDate(lt);
                    lettersHash[lt.pos] = lt.letter;
                });
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
            receive() {
                if (otherUsername) {
                    socket.emit('letters to me', mostRecentOtherLetterDate);
                }
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
