const gameConf = {
    gameId: function () {
        var strToSearch = '/game-session/',
            ind = window.location.href.match(strToSearch).index + strToSearch.length;
        return window.location.href.slice(ind, ind + 24);
    }(),
    canvas: document.getElementById('canvas'),
    grid: {
        pad: 10,
        numberPadX: 20,
        numberPadY: 20,
        sqLen: 30,
        padX: 0,
        padY: 0
    },
    colors: {
        default: 'black',
        thisPlayer: 'blue',
        otherPlayer: 'red',
        thisSelection: 'yellow',
        otherSelection: 'red',
        cursor: 'green',
        background: window.getComputedStyle(document.getElementsByTagName('body')[0]).backgroundColor
    },
    htmlElements: {
        infoDiv: document.getElementById('info'), // TODO: remove when done
        defsDiv: document.getElementById('defs'),
        userInput: document.getElementById('input'),
        defSingleDiv: document.getElementById('def-single'),
        infoThisSpan: document.getElementById('info-this'),
        infoOtherSpan: document.getElementById('info-other'),
        dividerSpan: document.getElementById('divider'),
        defsAcrossDiv: document.getElementById('defs-across'),
        defsDownDiv: document.getElementById('defs-down'),
        defSpanPrefix: 'def',
        defSpanOffset: 0
    },
    langsSupported: {
        el: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
        en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    localeStrings: {
        online: 'Online',
        offline: 'Offline'
    },
    utilKeys: ['Enter', 'Backspace'],
    extraChars: ' .',
    uncertaintyChar: '*',
};


gameConf.grid.padX = gameConf.grid.pad + gameConf.grid.numberPadX;
gameConf.grid.padY = gameConf.grid.pad + gameConf.grid.numberPadY;
gameConf.htmlElements.defSpanOffset = gameConf.htmlElements.defSpanPrefix.length;

module.exports = gameConf;
