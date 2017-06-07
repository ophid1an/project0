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
            input = require('./game-input'),
            selection = require('./game-selection'),
            getMousePosition = require('../../lib/util').getMousePosition,
            socket = io(undefined, {
                query: 'gid=' + gameConf.gameId
            });

        var game = {
                isConnected: false,
                otherLastSeen: false,
            },


            infoThisSpan = gameConf.htmlElements.infoThisSpan,
            infoOtherSpan = gameConf.htmlElements.infoOtherSpan,
            dividerSpan = gameConf.htmlElements.dividerSpan,
            infoDiv = gameConf.htmlElements.infoDiv, // TODO to be removed
            defSpanOffset = gameConf.htmlElements.defSpanOffset,
            locale = gameConf.localeStrings,

            thisSelection = function () {},
            otherSelection = function () {},
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

        socket.on('game-data', function (data) {
            Object.assign(game, {
                crossword: data.crossword,
                letters: data.letters,
                messages: data.messages,
                isPlayer1: data.isPlayer1,
                lettersSupported: ((gameConf.langsSupported[data.crossword.lang] || '') +
                    gameConf.extraChars).split(''),
                thisUsername: data.thisUsername, // TODO May not be needed
                otherUsername: data.otherUsername
            });

            thisSelection = selection(game.crossword, socket);
            otherSelection = selection(game.crossword, undefined, true);

            grid
                .init(game.crossword)
                .resize()
                .draw()
                .drawLetters(game.letters);

            defs
                .init(game.crossword)
                .resize()
                .setup();

            /***
                  HTML event listeners
            ***/

            var canvas = gameConf.canvas,
                userInput = gameConf.htmlElements.userInput,
                defsDiv = gameConf.htmlElements.defsDiv;

            userInput.addEventListener('keyup', function (e) {
                // ignore alt, shift, ctrl, caps lock
                if ([16, 17, 18, 20].indexOf(e.which) === -1) {
                    input.check({
                        key: e.key,
                        lettersSupported: game.lettersSupported,
                        selection: thisSelection
                    });
                }
            });

            userInput.addEventListener('blur', function () {
                // sendLetters(lettersToSend); // TODO
                input.clear();
                thisSelection.clear().emit(-1);
            });

            defsDiv.addEventListener('click', function (e) {
                var target = e.target;
                if (target.tagName === 'SPAN') {
                    thisSelection
                        // .clear() // TODO REMOVE?
                        .set(+target.id.slice(defSpanOffset))
                        .emit();

                    // Clear and set lettersToSend
                    // lettersToSend.letters = []; // TODO
                    // lettersToSend.startInd = getClueIndexFromCursorPos();

                    userInput.focus();
                }
            });

            canvas.addEventListener('click', function (e) {
                var mousePos = getMousePosition(canvas, e),
                    sqPos = grid.getSquarePosition(game.crossword, mousePos);

                if (sqPos) {
                    thisSelection
                        // .clear() // TODO REMOVE?
                        .setBySqPos(sqPos)
                        .emit();

                    // Clear and set lettersToSend
                    // lettersToSend.letters = []; // TODO
                    // lettersToSend.startInd = getClueIndexFromCursorPos();
                    //
                    userInput.focus();
                }
            });

            window.onresize = function () {
                defs.resize();
            };

        });

        socket.on('connect', function () {
            game.isConnected = true;

            infoThisSpan.classList.replace('text-danger', 'text-success');
            infoThisSpan.innerHTML = locale.online;
        });

        socket.on('disconnect', function () {
            game.isConnected = false;
            otherSelection.clear();

            infoThisSpan.classList.replace('text-success', 'text-danger');
            infoThisSpan.innerHTML = locale.offline;
            changeOtherSpans('hide'); // TODO
        });

        socket.on('error', function (err) {
            console.log('Error: ' + err);
            infoDiv.innerHTML = 'Error: ' + err;
        });

        socket.on('selection', function (data) {
            // clear previous other selection and set new one
            otherSelection.clear().set(data);
        });

        socket.on('letters', function (data) {
            otherSelection.clear();
            grid.drawLetters(data);
        });

        socket.on('joined', function () {
            thisSelection.emit();

            infoOtherSpan.classList.replace('text-danger', 'text-success');
            infoOtherSpan.innerHTML = game.otherUsername + ' is online.';
            changeOtherSpans('show');
        });

        socket.on('left', function () {
            otherSelection.clear();

            infoOtherSpan.classList.replace('text-success', 'text-danger');
            infoOtherSpan.innerHTML = game.otherUsername + ' is offline.';
            changeOtherSpans('show');
        });

    }
}
