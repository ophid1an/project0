/* globals io */ ;
(function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}(start));



function start() {

    function indexOfArray(val, array) {
        var hash = {};

        for (var i = 0; i < array.length; i++) {
            hash[array[i]] = i;
        }
        return (hash.hasOwnProperty(val)) ? hash[val] : -1;
    }




    function getGameId() {
        var strToSearch = '/game-session/',
            ind = window.location.href.match(strToSearch).index + strToSearch.length;
        return window.location.href.slice(ind, ind + 24);
    }




    function getMousePosition(canvas, event) {
        var rect = canvas.getBoundingClientRect(),
            x = event.clientX - rect.left,
            y = event.clientY - rect.top;
        return [x, y];
    }




    function modifyCanvas() {
        var canvas = gameConf.canvas,
            rows = gameConf.crossword.dim[0],
            cols = gameConf.crossword.dim[1],
            pad = gameConf.grid.pad,
            numberPadX = gameConf.grid.numberPadX,
            numberPadY = gameConf.grid.numberPadY,
            sqLen = gameConf.grid.sqLen;

        canvas.setAttribute('width', 2 * pad + numberPadX + sqLen * cols);
        canvas.setAttribute('height', 2 * pad + numberPadY + sqLen * rows);
    }




    function modifyDefsDiv() {
        var defsDiv = gameConf.htmlElements.defsDiv,
            body = document.getElementsByTagName('body')[0],
            bodyComputedStyle = window.getComputedStyle(body),
            bodyTotalHeight = window.parseFloat(bodyComputedStyle.height, 10) +
            window.parseFloat(bodyComputedStyle.marginTop, 10) +
            window.parseFloat(bodyComputedStyle.marginBottom, 10) +
            window.parseFloat(bodyComputedStyle.paddingTop, 10) +
            window.parseFloat(bodyComputedStyle.paddingBottom, 10),
            defsDivHeight = window.parseFloat(window.getComputedStyle(defsDiv).height, 10),
            randomOffset = 20,
            defsDivNewHeight = (Math.abs(window.innerHeight - (bodyTotalHeight - defsDivHeight + randomOffset))) + 'px';

        defsDiv.style.height = defsDivNewHeight;
    }



    function addSocketListeners() {
        var infoP1Span = gameConf.htmlElements.infoP1Span;
        var infoP2Span = gameConf.htmlElements.infoP2Span;
        var locale = gameConf.locale;
        socket.on('connect', function () {
            infoP1Span.classList.replace('text-danger', 'text-success');
            infoP1Span.innerHTML = locale.online;
        });

        socket.on('disconnect', function () {
            infoP1Span.classList.replace('text-success', 'text-danger');
            infoP1Span.innerHTML = locale.offline;
        });

        infoP2Span.innerHTML = 'LALA LALA LALA LALA LALA LALA';

    }



    function addEventListeners() {
        var canvas = gameConf.canvas,
            userInput = gameConf.htmlElements.userInput,
            defsDiv = gameConf.htmlElements.defsDiv;

        userInput.addEventListener('keyup', function (e) {
            var key = checkKey(e.key, userInput.value);
            if (key) {
                startWritting(key);
            }
        });

        userInput.addEventListener('blur', function () {
            sendLetters(lettersToSend);
            userInput.value = '';
            cursor.isCertain = true;
            drawCursor(gameConf.colors.background); // clear cursor
            clearSelection();
        });

        defsDiv.addEventListener('click', function (e) {
            var target = e.target;
            if (target.tagName === 'SPAN') {
                select({
                    spanId: target.id
                });

                // Clear and set lettersToSend
                lettersToSend.letters = [];
                lettersToSend.startInd = cursorPosToClueIndex();

                userInput.focus();
            }
        });

        canvas.addEventListener('click', function (e) {
            var mousePos = getMousePosition(canvas, e),
                sqPos = getSquarePosition(mousePos);

            if (sqPos) {
                select({
                    sqPos: sqPos
                });

                // Clear and set lettersToSend
                lettersToSend.letters = [];
                lettersToSend.startInd = cursorPosToClueIndex();

                userInput.focus();
            }
        });

        window.onresize = function () {
            modifyDefsDiv();
        };
    }




    function checkKey(key, inputValue) {
        var utilKeys = gameConf.utilKeys,
            lettersSupported = gameConf.lettersSupported,
            ind;

        ind = utilKeys.indexOf(key);
        if (ind !== -1) {
            return utilKeys[ind];
        }
        if (!inputValue) {
            return false;
        }

        ind = lettersSupported.indexOf(inputValue[inputValue.length - 1].toUpperCase());
        if (ind === -1) {
            return false;
        }
        return lettersSupported[ind];
    }



    function cursorPosToClueIndex() {
        var cluePos = gameConf.crossword.clues[cursor.clueInd].pos,
            isAcross = gameConf.crossword.clues[cursor.clueInd].isAcross;

        return isAcross ? cursor.pos[1] - cluePos[1] : cursor.pos[0] - cluePos[0];
    }



    function startWritting(key) {
        var userInput = gameConf.htmlElements.userInput;

        if (key === 'Enter') {
            userInput.blur();
        } else if (key === '.') {
            cursor.isCertain = !cursor.isCertain;
            drawCursor();
        } else if (key === 'Backspace') {

            //Clear lettersToSend letter
            lettersToSend.letters[cursorPosToClueIndex()] = ' ';

            // Clear square
            manipulateSquare({
                name: 'clear',
                pos: cursor.pos,
            });

            // Move cursor back
            moveCursor('backwards');
            drawCursor();

            lettersToSend.startInd = cursorPosToClueIndex();
        } else {
            writeLetter(key);
        }
    }




    function writeLetter(letter) {
        var pos = cursor.pos,
            isCertain = cursor.isCertain;

        letter = isCertain ? letter : letter + gameConf.uncertaintyChar;

        // Clear square
        manipulateSquare({
            name: 'clear',
            pos: pos,
        });

        // Put in lettersToSend
        lettersToSend.letters[cursorPosToClueIndex()] = letter;

        // Draw letter
        if (letter[0] !== ' ') {
            manipulateSquare({
                name: 'write',
                pos: pos,
                color: gameConf.colors.thisPlayer,
                letter: letter
            });
        }

        // Advance cursor
        moveCursor('forward');
        drawCursor();
    }




    function sendLetters(lettersToSend) {
        var transformedLetters = [],
            clue = gameConf.crossword.clues[cursor.clueInd];

        if (!lettersToSend.letters.length) {
            return false;
        }

        lettersToSend.letters.forEach(function (letter, i) {
            transformedLetters.push({
                l: letter[0],
                p: clue.isAcross ? [clue.pos[0], clue.pos[1] + i] : [clue.pos[0] + i, clue.pos[1]],
                c: letter.length === 1
            });
        });

        socket.emit('letters msg', {
            gid: gameConf.gameId,
            letters: transformedLetters,
            p1: gameConf.isPlayer1
        });
    }




    function sendLettersXHR(lettersToSend) {
        var req,
            transformedLetters = [],
            clue = gameConf.crossword.clues[cursor.clueInd];

        if (!lettersToSend.letters.length) {
            return false;
        }

        lettersToSend.letters.forEach(function (letter, i) {
            transformedLetters.push({
                letter: letter[0],
                pos: clue.isAcross ? [clue.pos[0], clue.pos[1] + i] : [clue.pos[0] + i, clue.pos[1]],
                isCertain: letter.length === 1
            });
        });

        req = new XMLHttpRequest();
        req.open('POST', '/main/game-session', true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify({
            gameId: gameConf.gameId,
            letters: transformedLetters,
            isPlayer1: gameConf.isPlayer1
        }));

        req.onreadystatechange = function alertContents() {
            if (req.readyState === XMLHttpRequest.DONE) {
                if (req.status === 200) {
                    var res = {};
                    try {
                        res = JSON.parse(req.responseText);
                    } catch (e) {
                        gameConf.htmlElements.defSingleDiv.innerHTML = '!!! ' + e + ' !!!';
                    }
                    if (res.error) {
                        gameConf.htmlElements.defSingleDiv.innerHTML = '!!! ' + res.error + ' !!!';
                    }
                } else {
                    gameConf.htmlElements.defSingleDiv.innerHTML = '!!! There was a problem with the request. !!!';
                }
            }
        };

    }




    function clearSelection() {
        if (cursor.pos.length) {
            var clues = gameConf.crossword.clues,
                colors = gameConf.colors,
                defSingleDiv = gameConf.htmlElements.defSingleDiv;

            // Reset grid squares
            manipulateSquare({
                name: 'stroke',
                pos: clues[cursor.clueInd].pos,
                isAcross: clues[cursor.clueInd].isAcross,
                numOfSquares: clues[cursor.clueInd].len,
                color: colors.default
            });
            defSingleDiv.innerHTML = '&nbsp;';
        }
    }




    function select(conf) {
        var spanId = conf.spanId,
            sqPos = conf.sqPos,
            clues = gameConf.crossword.clues,
            colors = gameConf.colors,
            spanPrefix = gameConf.htmlElements.spanPrefix,
            defSingleDiv = gameConf.htmlElements.defSingleDiv,
            prevCursor = cursor,
            spanOffset = spanPrefix.length, // spanId : 'defXX'
            newCursor = {},
            clueInd,
            possibleCluesInd = [];

        // Clear previous selection
        clearSelection();

        // Select from <span> OR grid
        if (spanId) {
            // Construct cursor
            clueInd = +spanId.slice(spanOffset);
            newCursor = {
                pos: clues[clueInd].pos,
                clueInd: clueInd,
                isCertain: true
            };
        } else {
            // Get clues that match square position
            clues.forEach(function (clue, clueInd) {
                var rowsMod = clue.isAcross ? 0 : clue.len;
                var colsMod = clue.isAcross ? clue.len : 0;
                if (sqPos[0] >= clue.pos[0] && sqPos[1] >= clue.pos[1] &&
                    sqPos[0] <= clue.pos[0] + rowsMod && sqPos[1] <= clue.pos[1] + colsMod) {
                    possibleCluesInd.push(clueInd);
                }
            });
            if (possibleCluesInd.length === 1) {
                clueInd = possibleCluesInd[0];
            } else {
                clueInd = clues[possibleCluesInd[0]].isAcross ? possibleCluesInd[0] : possibleCluesInd[1]; // select 'Across'
                if (prevCursor.pos.length) {
                    if (prevCursor.clueInd === possibleCluesInd[0] ||
                        prevCursor.clueInd === possibleCluesInd[1]) {
                        if (!clues[prevCursor.clueInd].isAcross) {
                            clueInd = clues[possibleCluesInd[0]].isAcross ? possibleCluesInd[1] : possibleCluesInd[0]; // select 'Down'
                        }
                        if (prevCursor.pos[0] === sqPos[0] && prevCursor.pos[1] === sqPos[1]) {
                            clueInd = clues[prevCursor.clueInd].isAcross ? possibleCluesInd[1] : possibleCluesInd[0];
                        }
                    }
                }
            }

            // Construct cursor
            newCursor = {
                pos: sqPos,
                isCertain: true,
                clueInd: clueInd
            };
        }

        // Highlight grid squares
        manipulateSquare({
            name: 'stroke',
            pos: clues[clueInd].pos,
            isAcross: clues[clueInd].isAcross,
            numOfSquares: clues[clueInd].len,
            color: colors.selection
        });

        // Set and draw cursor
        cursor = newCursor;
        drawCursor();
        // Modify defSingleDiv
        defSingleDiv.innerHTML = clues[clueInd].def;
    }





    function drawCursor(color) {
        var colors = gameConf.colors;

        manipulateSquare({
            name: 'cursor',
            pos: cursor.pos,
            color: color || colors.cursor
        });
    }



    function moveCursor(direction) {
        var isAcross = gameConf.crossword.clues[cursor.clueInd].isAcross,
            len = gameConf.crossword.clues[cursor.clueInd].len,
            cPosToClIndex = cursorPosToClueIndex();

        if (direction === 'backwards') {
            if (isAcross) {
                if (cPosToClIndex) {
                    cursor.pos = [cursor.pos[0], cursor.pos[1] - 1];
                }
            } else {
                if (cPosToClIndex) {
                    cursor.pos = [cursor.pos[0] - 1, cursor.pos[1]];
                }
            }
        } else {
            if (isAcross) {
                if (cPosToClIndex !== len - 1) {
                    cursor.pos = [cursor.pos[0], cursor.pos[1] + 1];
                }
            } else {
                if (cPosToClIndex !== len - 1) {
                    cursor.pos = [cursor.pos[0] + 1, cursor.pos[1]];
                }
            }
        }
    }



    function drawGrid() {
        var canvas = gameConf.canvas,
            rows = gameConf.crossword.dim[0],
            cols = gameConf.crossword.dim[1],
            bpos = gameConf.crossword.bpos,
            colors = gameConf.colors,
            pad = gameConf.grid.pad,
            numberPadX = gameConf.grid.numberPadX,
            sqLen = gameConf.grid.sqLen,
            padX = gameConf.grid.padX,
            padY = gameConf.grid.padY,
            ctx = canvas.getContext('2d'),
            offsetFromBtm = 5,
            i, x, y;


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
    }




    function drawLetters() {
        gameConf.letters.forEach(function (l) {
            if (l.letter && l.letter !== ' ') {
                manipulateSquare({
                    name: 'write',
                    letter: l.isCertain ? l.letter : l.letter + gameConf.uncertaintyChar,
                    pos: l.pos,
                    color: gameConf.isPlayer1 === l.isPlayer1 ? gameConf.colors.thisPlayer : gameConf.colors.otherPlayer
                });
            }
        });
    }





    function manipulateSquare(action) {
        var canvas = gameConf.canvas,
            padX = gameConf.grid.padX,
            padY = gameConf.grid.padY,
            sqLen = gameConf.grid.sqLen,
            colors = gameConf.colors,
            ctx = canvas.getContext('2d'),
            x = 0.5 + padX + sqLen * action.pos[1],
            y = 0.5 + padY + sqLen * action.pos[0],
            offsetFromBtm = 5;


        if (action.name === 'fill') {
            ctx.fillStyle = action.color;
            ctx.fillRect(x, y, sqLen, sqLen);
        } else if (action.name === 'stroke') {
            ctx.strokeStyle = action.color;
            if (action.isAcross) {
                ctx.strokeRect(x, y, sqLen * action.numOfSquares, sqLen);
            } else {
                ctx.strokeRect(x, y, sqLen, sqLen * action.numOfSquares);
            }
        } else if (action.name === 'write') {
            ctx.fillStyle = action.color;
            ctx.fillText(action.letter, x + (sqLen - ctx.measureText(action.letter).width) / 2, y + sqLen - offsetFromBtm);
        } else if (action.name === 'clear') {
            ctx.clearRect(x + 0.5, y + 0.5, sqLen - 1, sqLen - 1);
        } else if (action.name === 'cursor') {
            ctx.save();
            if (!cursor.isCertain) {
                ctx.strokeStyle = colors.background;
                ctx.strokeRect(x + 2, y + 2, sqLen - 4, sqLen - 4);
                ctx.setLineDash([4, 2]);
            }
            ctx.strokeStyle = action.color;
            ctx.strokeRect(x + 2, y + 2, sqLen - 4, sqLen - 4);
            ctx.restore();
        }
    }




    function getSquarePosition(mousePos) {
        var padX = gameConf.grid.padX,
            padY = gameConf.grid.padY,
            sqLen = gameConf.grid.sqLen,
            rows = gameConf.crossword.dim[0],
            cols = gameConf.crossword.dim[1],
            bpos = gameConf.crossword.bpos,
            sPos = [];

        sPos.push(Math.floor((mousePos[1] - padY) / sqLen));
        sPos.push(Math.floor((mousePos[0] - padX) / sqLen));

        if (sPos[0] >= 0 && sPos[1] >= 0 && sPos[0] < rows && sPos[1] < cols && indexOfArray(sPos, bpos) === -1) {
            return sPos;
        }

        return false;
    }




    function setDefs() {
        var clues = gameConf.crossword.clues,
            cluesAcrossInd = gameConf.crossword.cluesAcrossInd,
            cluesDownInd = gameConf.crossword.cluesDownInd,
            defsAcrossDiv = gameConf.htmlElements.defsAcrossDiv,
            defsDownDiv = gameConf.htmlElements.defsDownDiv,
            spanPrefix = gameConf.htmlElements.spanPrefix,
            str = '',
            defs = {
                across: [],
                down: []
            };



        cluesAcrossInd.forEach(function (eleOuter) {
            var str = '';
            var lenOuter = eleOuter.length;
            eleOuter.forEach(function (eleInner, indInner) {
                str += '<span id="' + spanPrefix + eleInner + '">';
                str += clues[eleInner].def;
                str += '</span>';
                str += indInner === lenOuter - 1 ? '' : ' - ';
            });
            defs.across.push(str);
        });

        cluesDownInd.forEach(function (eleOuter) {
            var str = '';
            var lenOuter = eleOuter.length;
            eleOuter.forEach(function (eleInner, indInner) {
                str += '<span id="' + spanPrefix + eleInner + '">';
                str += clues[eleInner].def;
                str += '</span>';
                str += indInner === lenOuter - 1 ? '' : ' - ';
            });
            defs.down.push(str);
        });

        str = '<ol>';
        defs.across.forEach(function (ele) {
            str += '<li>' + ele + '</li>';
        });
        str += '</ol>';
        defsAcrossDiv.innerHTML = str;


        str = '<ol>';
        defs.down.forEach(function (ele) {
            str += '<li>' + ele + '</li>';
        });
        str += '</ol>';
        defsDownDiv.innerHTML = str;
    }




    var gameConf = {
        gameId: getGameId(),
        canvas: document.getElementById('canvas'),
        grid: {
            pad: 10,
            numberPadX: 20,
            numberPadY: 20,
            sqLen: 30,
            padX: 0,
            padY: 0
        },
        crossword: {},
        letters: [],
        colors: {
            default: 'black',
            selection: 'yellow',
            thisPlayer: 'red',
            otherPlayer: 'blue',
            cursor: 'green',
            background: window.getComputedStyle(document.getElementsByTagName('body')[0]).backgroundColor
        },
        htmlElements: {
            defsDiv: document.getElementById('defs'),
            userInput: document.getElementById('input'),
            defSingleDiv: document.getElementById('def-single'),
            infoP1Span: document.getElementById('info-p1'),
            infoP2Span: document.getElementById('info-p2'),
            defsAcrossDiv: document.getElementById('defs-across'),
            defsDownDiv: document.getElementById('defs-down'),
            spanPrefix: 'def'
        },
        langsSupported: {
            el: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
            en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        },
        locale: {
            online: 'Online',
            offline: 'Offline'
        },
        utilKeys: ['Enter', 'Backspace'],
        lettersSupported: '',
        extraChars: ' .',
        uncertaintyChar: '*',
        isPlayer1: true
    };

    gameConf.grid.padX = gameConf.grid.pad + gameConf.grid.numberPadX;
    gameConf.grid.padY = gameConf.grid.pad + gameConf.grid.numberPadY;

    var data = {},
        cursor = {
            pos: [],
            clueInd: 0,
            isCertain: true
        },
        lettersToSend = {
            letters: [],
            startInd: 0
        };

    if (gameConf.canvas.getContext) {

        try {
            data = JSON.parse(document.getElementById('data').innerHTML);
        } catch (e) {
            window.alert('PROBLEM WHILE PARSING CROSSWORD!');
            window.location.href = "/main";
            return false;
        }

        gameConf.crossword = data.crossword;
        gameConf.letters = data.letters;
        gameConf.isPlayer1 = data.isPlayer1;
        gameConf.lettersSupported = (gameConf.langsSupported[gameConf.crossword.lang] || '') + gameConf.extraChars;

        var socket = io(undefined, {
            query: 'gid=' + gameConf.gameId
        });

        addSocketListeners();

        modifyCanvas();

        modifyDefsDiv();

        drawGrid();

        drawLetters();

        setDefs();

        addEventListeners();

    }
}
