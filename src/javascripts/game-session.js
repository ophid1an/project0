;
(function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}(start));


function start() {

    require('./polyfills/classList');
    require('./polyfills/matches');

    const gameConf = require('./game-conf');

    if (gameConf.canvas.getContext) {
        const io = require('socket.io-client'),
            buttons = require('./game-buttons'),
            info = require('./game-info'),
            grid = require('./game-grid'),
            defs = require('./game-defs'),
            selection = require('./game-selection'),
            input = require('./game-input'),
            messages = require('./game-messages'),
            getMousePosition = require('../../lib/util').getMousePosition,
            socket = io(undefined, {
                query: 'gid=' + gameConf.gameId
            }),
            userInput = gameConf.htmlElements.userInput,
            defSpanOffset = gameConf.htmlElements.defSpanOffset,
            hasFocus = elem => {
                return elem === document.activeElement && (elem.type || elem.href);
            },
            canvas = gameConf.canvas,
            defsDiv = gameConf.htmlElements.defsDiv,
            messagesForm = gameConf.htmlElements.messagesForm,
            messagesInput = gameConf.htmlElements.messagesInput,
            completeConfirmBtn = gameConf.htmlElements.completeConfirmBtn;

        var firstConnection = true,
            isConnected = false;

        socket.on('game data', function (data) {
            /*****
              // data = {
              //     crossword: 'Array',
              //     letters: 'Array',
              //     messages: 'Array',
              //     isPlayer1: 'Boolean',
              //     otherUsername: 'String',
              //     locale: 'String'
              // };
              *****/

            firstConnection = false;

            var lettersSupported = ((gameConf.langsSupported[data.crossword.lang] || '') +
                gameConf.extraChars).split('');

            // Setup game objects
            buttons.init(data.isPlayer1, data.otherUsername);

            info.init(data.otherUsername, data.locale)
                .thisOnline();

            grid.init(data.crossword, data.isPlayer1)
                .resize()
                .draw()
                .drawLetters(data.letters);

            defs.init(data.crossword)
                .resize()
                .setup();

            selection.init(data.crossword, socket, data.otherUsername);

            input.init(data.letters, lettersSupported, socket,
                data.isPlayer1, data.otherUsername);

            messages.init(data.messages, socket,
                data.isPlayer1, data.otherUsername);

            /***
                  HTML event listeners
            ***/

            messagesForm.addEventListener('submit', e => {
                e.preventDefault();
                if (isConnected) {
                    messages.send(messagesInput.value);
                }
                messagesInput.value = '';
            });

            completeConfirmBtn.addEventListener('click', () => {
                window.location.href = gameConf.redirectURI;
                socket.emit('send complete');
            });

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
                selection.send();
            });

            defsDiv.addEventListener('click', e => {
                var target = e.target;
                if (target.tagName === 'SPAN') {
                    if (selection.set(+target.id.slice(defSpanOffset))) {
                        selection.send();
                        userInput.focus();
                    }
                }
            });

            canvas.addEventListener('click', e => {
                var mousePos = getMousePosition(canvas, e),
                    sqPos = grid.getSquarePosition(data.crossword, mousePos);

                if (sqPos) {
                    if (selection.setBySqPos(sqPos)) {
                        selection.send();
                        userInput.focus();
                    }
                }
            });

            window.onresize = () => {
                defs.resize();
                messages.resize();
            };

        });

        socket.on('connect', () => {
            isConnected = true;

            if (firstConnection) { // If connecting freshly
                socket.emit('game data to me');
            } else {
                info.thisOnline();
                // If reconnecting to a partnered game
                // Send own saved letters
                input.send();
                // Wait a bit to signal to receive other player's letters
                setTimeout(() => {
                    input.receive();
                }, 500);
                // Signal to receive other player's messages
                messages.receive();
            }
        });

        socket.on('disconnect', () => {
            isConnected = false;
            selection.clearOther();
            info.thisOnline(false);
        });

        socket.on('selection', data => {
            selection.clearOther() // clear previous other selection and set new one
                .setOther(data.ind, data.squares);
            info.otherOnline();
        });

        socket.on('letters', data => {
            input.updateLetters(data);
            grid.drawLetters(data);
        });

        socket.on('letters received', () => {
            if (!hasFocus(userInput)) {
                input.clearLetters();
            }
        });

        socket.on('messages', data => {
            messages.update(data);
        });

        socket.on('complete', () => {
            setTimeout(() => window.location.href = gameConf.redirectURI, 500); // Wait a bit to update database
        });

        socket.on('other online', () => {
            setTimeout(() => selection.send(), 500); // Wait a bit (solves timing issue)
            info.otherOnline();
        });

        socket.on('other offline', () => {
            selection.clearOther();
            info.otherOnline(false);
        });

        socket.on('error', err => {
            console.log('Error: ' + err);
            info.error(err);
        });

        socket.on('exception', err => {
            console.log('Exception: ' + err);
            info.error(err);
        });
    }
}
