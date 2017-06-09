require('./classList-polyfill');
const gameConf = require('./game-conf');

const info = (function () {
    var infoThisSpan = gameConf.htmlElements.infoThisSpan,
        infoOtherSpan = gameConf.htmlElements.infoOtherSpan,
        dividerSpan = gameConf.htmlElements.dividerSpan,
        infoDiv = gameConf.htmlElements.infoDiv, // TODO REMOVE?
        locale = gameConf.localeStrings.el,
        otherUsername = '',
        infoLog = msg => { //TODO Remove
            infoDiv.innerHTML = msg;
            setTimeout(() => infoDiv.innerHTML = '&nbsp;', 5000);
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
        stub = {
            init(otherName) {
                otherUsername = otherName;
                return this;
            },
            thisOnline(flag = true) {
                if (flag) {
                    infoThisSpan.classList.replace('text-danger', 'text-success');
                    infoThisSpan.innerHTML = `&lt;${locale.online}&gt;`;
                    if (otherUsername) {
                        stub.otherOnline(false);
                        changeOtherSpans('show');
                    }
                } else {
                    infoThisSpan.classList.replace('text-success', 'text-danger');
                    infoThisSpan.innerHTML = `&lt;${locale.offline}&gt;`;
                    if (otherUsername) {
                        changeOtherSpans('hide');
                        stub.otherOnline(false);
                    }
                }
            },
            otherOnline(flag = true) {
                if (flag) {
                    infoOtherSpan.classList.replace('text-danger', 'text-success');
                    infoOtherSpan.innerHTML = `&lt;${otherUsername}&gt; ${locale.isOnline}.`;
                } else {
                    infoOtherSpan.classList.replace('text-success', 'text-danger');
                    infoOtherSpan.innerHTML = `&lt;${otherUsername}&gt; ${locale.isOffline}.`;
                }
            },
            error(err) {
                infoLog('Error: ' + err);
            }
        };

    return stub;
})();

module.exports = info;
