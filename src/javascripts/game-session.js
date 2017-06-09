;
(function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}(start));


function start() {

    const gameConf = require('./game-conf');

    if (gameConf.canvas.getContext) {

        require('./classList-polyfill');

        const io = require('socket.io-client'),
            grid = require('./game-grid'),
            defs = require('./game-defs'),
            selection = require('./game-selection'),
            input = require('./game-input'),
            getMousePosition = require('../../lib/util').getMousePosition,
            socket = io(undefined, {
                query: 'gid=' + gameConf.gameId
            }),
            game = {
                isConnected: false,
            },
            userInput = gameConf.htmlElements.userInput,
            infoThisSpan = gameConf.htmlElements.infoThisSpan,
            infoOtherSpan = gameConf.htmlElements.infoOtherSpan,
            dividerSpan = gameConf.htmlElements.dividerSpan,
            infoDiv = gameConf.htmlElements.infoDiv, // TODO to be removed
            defSpanOffset = gameConf.htmlElements.defSpanOffset,
            locale = gameConf.localeStrings,
            infoLog = msg => { //TODO Remove
                infoDiv.innerHTML = msg
                setTimeout(() => infoDiv.innerHTML = '&nbsp;', 2000)
            },
            hasFocus = elem => {
                return elem === document.activeElement && (elem.type || elem.href);
            },
            changeOtherSpans = action => {
                if (action === 'show') {
                    infoOtherSpan.classList.remove('hidden');
                    dividerSpan.classList.remove('hidden');
                }
                if (action === 'hide') {
                    infoOtherSpan.classList.add('hidden');
                    dividerSpan.classList.add('hidden');
                }
            },
            toggleOtherSpans = () => {
                infoOtherSpan.classList.toggle('hidden');
                dividerSpan.classList.toggle('hidden');
            };

        socket.on('game data', function (data) {
            Object.assign(game, {
                crossword: data.crossword,
                letters: data.letters,
                messages: data.messages,
                isPlayer1: data.isPlayer1,
                lettersSupported: ((gameConf.langsSupported[data.crossword.lang] || '') +
                    gameConf.extraChars).split(''),
                thisUsername: data.thisUsername, // TODO May not be needed
                otherUsername: data.otherUsername,
                mostRecentLetter: (function () {
                    var date = new Date(0),
                        stub = {
                            setDate(letters) {
                                letters.forEach(letter => {
                                    // letter.date is a STRING !!!
                                    if (letter.isPlayer1 !== game.isPlayer1) {
                                        var lDate = new Date(letter.date);
                                        if (lDate > date) {
                                            date = lDate;
                                        }
                                    }

                                });
                            },
                            getDate() {
                                return date;
                            }
                        };
                    return stub;
                })(),
                mostRecentMessage: (function () {
                    var date = new Date(0),
                        stub = {
                            setDate(messages) {
                                messages.forEach(message => {
                                    // message.date is a STRING !!!
                                    if (message.isPlayer1 !== game.isPlayer1) {
                                        var mDate = new Date(message.date);
                                        if (mDate > date) {
                                            date = mDate;
                                        }
                                    }
                                });
                            },
                            getDate() {
                                return date;
                            }
                        };
                    return stub;
                })(),
            });

            if (game.otherUsername) {
                // Get most recent other player letter
                game.mostRecentLetter.setDate(game.letters);
                // Get most recent other player message
                game.mostRecentMessage.setDate(game.messages);
            }

            grid.init(game.crossword, game.isPlayer1)
                .resize()
                .draw()
                .drawLetters(game.letters);

            defs.init(game.crossword)
                .resize()
                .setup();

            selection.init(game.crossword, socket);

            input.init(game.letters, game.lettersSupported, socket);

            /***
                  HTML event listeners
            ***/

            var canvas = gameConf.canvas,
                defsDiv = gameConf.htmlElements.defsDiv;

            userInput.addEventListener('keyup', e => {
                // ignore alt, shift, ctrl, caps lock
                if ([16, 17, 18, 20].indexOf(e.which) === -1) {
                    input.check(e.key, selection.getSquares());
                }
            });

            userInput.addEventListener('blur', () => {
                input.send();
                input.clear();
                selection.clear();
                if (game.otherUsername) {
                    selection.emit();
                }
            });

            defsDiv.addEventListener('click', e => {
                var target = e.target;
                if (target.tagName === 'SPAN') {
                    if (selection.set(+target.id.slice(defSpanOffset))) {
                        if (game.otherUsername) {
                            selection.emit();
                        }
                        userInput.focus();
                    }
                }
            });

            canvas.addEventListener('click', e => {
                var mousePos = getMousePosition(canvas, e),
                    sqPos = grid.getSquarePosition(game.crossword, mousePos);

                if (sqPos) {
                    if (selection.setBySqPos(sqPos)) {
                        if (game.otherUsername) {
                            selection.emit();
                        }
                        userInput.focus();
                    }
                }
            });

            window.onresize = () => {
                defs.resize();
            };

        });

        socket.on('connect', () => {
            game.isConnected = true;

            infoThisSpan.classList.replace('text-danger', 'text-success');
            infoThisSpan.innerHTML = locale.online;

            if (!game.crossword) { // If connecting freshly
                socket.emit('game data to me');
            } else {
                if (game.otherUsername) { // If reconnecting to a partnered game
                    // Send own saved letters
                    input.send();
                    // Wait a bit to signal to receive other player's letters
                    setTimeout(() => {
                        socket.emit('letters to me', game.mostRecentLetter.getDate());
                    }, 500);
                    // Signal to receive other player's messages
                    socket.emit('messages to me', game.mostRecentMessage.getDate());
                }
            }
        });

        socket.on('disconnect', () => {
            game.isConnected = false;
            selection.clearOther();

            infoThisSpan.classList.replace('text-success', 'text-danger');
            infoThisSpan.innerHTML = locale.offline;
            changeOtherSpans('hide'); // TODO
        });

        socket.on('error', err => {
            console.log('Error: ' + err);
            infoDiv.innerHTML = 'Error: ' + err;
        });

        socket.on('selection', data => {
            // clear previous other selection and set new one
            selection.clearOther()
                .setOther(data.ind, data.squares);
        });

        socket.on('letters', data => {
            game.mostRecentLetter.setDate(data);
            input.updateLetters(data);
            grid.drawLetters(data);
        });

        socket.on('letters received', () => {
            if (!hasFocus(userInput)) {
                input.clearLetters();
            }
        });

        socket.on('messages', data => {
            game.mostRecentMessage.setDate(data);
        });

        socket.on('joined', () => {
            setTimeout(() => selection.emit(), 500); // Wait a bit (solves timing issue)

            infoOtherSpan.classList.replace('text-danger', 'text-success');
            infoOtherSpan.innerHTML = game.otherUsername + ' is online.';
            changeOtherSpans('show');
        });

        socket.on('left', () => {
            selection.clearOther();

            infoOtherSpan.classList.replace('text-success', 'text-danger');
            infoOtherSpan.innerHTML = game.otherUsername + ' is offline.';
            changeOtherSpans('show');
        });

    }
}
