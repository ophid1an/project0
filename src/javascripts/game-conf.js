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
        canvasDiv: document.getElementById('canvas-container'),
        infoDiv: document.getElementById('info'), // TODO: remove when done
        defsDiv: document.getElementById('defs'),
        userInput: document.getElementById('letters-input'),
        defSingleDiv: document.getElementById('def-single'),
        infoThisSpan: document.getElementById('info-this'),
        infoOtherSpan: document.getElementById('info-other'),
        dividerSpan: document.getElementById('divider'),
        defsAcrossDiv: document.getElementById('defs-across'),
        defsDownDiv: document.getElementById('defs-down'),
        defSpanPrefix: 'def',
        defSpanOffset: 0,
        messagesBtn: document.getElementById('messages-button'),
        crosswordBtn: document.getElementById('crossword-button'),
        optionsBtn: document.getElementById('options-button'),
        homeBtn: document.getElementById('home-button'),
        helpBtn: document.getElementById('help-button'),
        completeBtn: document.getElementById('complete-button'),
        dropdownList: document.getElementById('dropdown-list'),
        helpDiv: document.getElementById('help'),
        completeDiv: document.getElementById('complete'),
        messagesDiv: document.getElementById('messages'),
        messagesList: document.getElementById('messages-list'),
        messagesForm: document.getElementById('messages-form'),
        messagesInput: document.getElementById('messages-input'), // TODO MAY NOT BE NEEDED
        completeConfirmBtn: document.getElementById('complete-confirm-button')
    },
    langsSupported: {
        el: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
        en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    localeStrings: {
        el: {
            online: 'Με σύνδεση',
            offline: 'Χωρίς σύνδεση',
            isOnline: 'είναι συνδεδεμένος',
            isOffline: 'είναι αποσυνδεδεμένος'
        },
        en: {
            online: 'Online',
            offline: 'Offline',
            isOnline: 'is online',
            isOffline: 'is offline'
        }
    },
    utilKeys: ['Enter', 'Backspace'],
    extraChars: ' .',
    uncertaintyChar: '*',
};


gameConf.grid.padX = gameConf.grid.pad + gameConf.grid.numberPadX;
gameConf.grid.padY = gameConf.grid.pad + gameConf.grid.numberPadY;
gameConf.htmlElements.defSpanOffset = gameConf.htmlElements.defSpanPrefix.length;

module.exports = gameConf;
