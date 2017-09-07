const gameConf = require('./game-conf');

const defs = (function () {
    var crossword = {},
        defsAcrossDiv = gameConf.htmlElements.defsAcrossDiv,
        defsDownDiv = gameConf.htmlElements.defsDownDiv,
        stub = {
            init(c) {
                crossword = c;
                return this;
            },
            resize() {
                var defsDiv = gameConf.htmlElements.defsDiv,
                    body = document.getElementsByTagName('body')[0],
                    bodyComputedStyle = window.getComputedStyle(body),
                    bodyTotalHeight = window.parseFloat(bodyComputedStyle.height, 10) +
                    window.parseFloat(bodyComputedStyle.marginTop, 10) +
                    window.parseFloat(bodyComputedStyle.marginBottom, 10) +
                    window.parseFloat(bodyComputedStyle.paddingTop, 10) +
                    window.parseFloat(bodyComputedStyle.paddingBottom, 10),
                    defsDivHeight = window.parseFloat(window.getComputedStyle(defsDiv).height, 10),
                    isMobile = window.innerWidth < 550, // Will break with different grid system
                    randomOffset = 20,
                    defsDivNewHeight = Math.abs(window.innerHeight - (bodyTotalHeight - defsDivHeight + randomOffset)),
                    defHeadersComputedStyle = window.getComputedStyle(defsAcrossDiv.parentElement.children[0]),
                    defsHeadersHeight = (parseFloat(defHeadersComputedStyle.height, 10) +
                        parseFloat(defHeadersComputedStyle.marginTop, 10) +
                        parseFloat(defHeadersComputedStyle.marginBottom, 10) +
                        parseFloat(defHeadersComputedStyle.paddingTop, 10) +
                        parseFloat(defHeadersComputedStyle.paddingBottom, 10) +
                        parseFloat(defHeadersComputedStyle.borderTop, 10) +
                        parseFloat(defHeadersComputedStyle.borderBottom, 10));

                if (isMobile) { // Defs may float or not because of grid
                    defsAcrossDiv.style.height = defsDownDiv.style.height =
                        ((defsDivNewHeight - defsHeadersHeight * 2) / 2) + 'px';
                } else {
                    defsAcrossDiv.style.height = defsDownDiv.style.height =
                        (defsDivNewHeight - defsHeadersHeight) + 'px';
                }

                return this;
            },
            setup() {
                var clues = crossword.clues,
                    cluesAcrossInd = crossword.cluesAcrossInd,
                    cluesDownInd = crossword.cluesDownInd,
                    defSpanPrefix = gameConf.htmlElements.defSpanPrefix,
                    str = '',
                    defs = {
                        across: [],
                        down: []
                    };

                cluesAcrossInd.forEach(function (eleOuter) {
                    var str = '';
                    var lenOuter = eleOuter.length;
                    eleOuter.forEach(function (eleInner, indInner) {
                        str += '<span id="' + defSpanPrefix + eleInner + '">';
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
                        str += '<span id="' + defSpanPrefix + eleInner + '">';
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

                return this;
            }
        };
    return stub;
}());

module.exports = defs;
