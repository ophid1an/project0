const gameConf = require('./game-conf');
const grid = require('./game-grid');
const selection = require('./game-selection');

const input = (function () {
    var userInput = gameConf.htmlElements.userInput,
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
                isCertain: letter !== ' ' ? cursor.isCertain : true // case when letter is ' '
            };
        },
        add = letter => {
            var letterWithDate = Object.assign(letter, {
                date: Date.now()
            });

            lettersToSend[cursor.ind] = letterWithDate;
            return this;
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
            placeLetter(letter) {
                var transformedLetter = transformLetter(letter);

                add(transformedLetter);
                grid.drawLetter(transformedLetter);
                lettersHash[cursor.pos] = letter;
            },
            check(key, squares) {
                var inputValue = userInput.value,
                    utilKeys = gameConf.utilKeys,
                    ind = -1;

                selectionSquares = squares;
                cursor = selection.getCursor();
                cursor.pos = selectionSquares[cursor.ind];
                userInput.value = '';

                // Check for util keys
                ind = utilKeys.indexOf(key);
                if (ind !== -1) {
                    switch (key) {
                        case 'Enter':
                            userInput.blur();
                            break;
                        case 'Delete':
                            stub.placeLetter(' ');
                            selection.moveCursor(); // Redraw at current position
                            break;
                        case 'Backspace':
                            selection.moveCursor('backwards');
                            break;
                        case 'ArrowLeft':
                            selection.moveCursor('left');
                            break;
                        case 'ArrowRight':
                            selection.moveCursor('right');
                            break;
                        case 'ArrowUp':
                            selection.moveCursor('up');
                            break;
                        case 'ArrowDown':
                            selection.moveCursor('down');
                            break;
                    }
                    return;
                }

                // Else check for letter

                if (!inputValue) {
                    return;
                }

                ind = lettersSupported.indexOf(inputValue.toUpperCase());

                if (ind !== -1) {
                    var letter = lettersSupported[ind];

                    if (letter === '.') {
                        return selection.toggleCursor();
                    }
                    if (letter !== ' ' && letter !== lettersHash[cursor.pos]) { // Place letter if not space and not different than previous one
                        stub.placeLetter(letter);
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
