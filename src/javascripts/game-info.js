const gameConf = require('./game-conf');

const info = (function () {
    var infoDiv = gameConf.htmlElements.infoDiv,
        gameCompletedDiv = gameConf.htmlElements.gameCompletedDiv,
        localeStrings = gameConf.localeStrings.en,
        isPlayer1 = false,
        otherUsername = '',
        infoLog = msg => {
            var oldMsg = infoDiv.innerHTML;
            infoDiv.innerHTML = msg;
            setTimeout(() => {
                if (infoDiv.innerHTML === msg) {
                    infoDiv.innerHTML = oldMsg;
                }
            }, 5000);
        },

        stub = {
            init(isP1, otherName, locale) {
                isPlayer1 = isP1;
                otherUsername = otherName;
                if (locale) {
                    localeStrings = gameConf.localeStrings[locale];
                }
                return this;
            },
            thisOnline(flag = true) {
                if (flag) {
                    infoDiv.classList.replace('text-danger', 'text-success');
                    infoDiv.innerHTML = `&lt;${localeStrings.online}&gt;`;
                    if (otherUsername) {
                        stub.otherOnline(false);
                    }
                } else {
                    infoDiv.classList.replace('text-success', 'text-danger');
                    infoDiv.innerHTML = `&lt;${localeStrings.offline}&gt;`;
                }
            },
            otherOnline(flag = true) {
                if (flag) {
                    infoDiv.classList.replace('text-danger', 'text-success');
                    infoDiv.innerHTML = `&lt;${otherUsername}&gt; ${localeStrings.isOnline}.`;
                } else {
                    infoDiv.classList.replace('text-success', 'text-danger');
                    infoDiv.innerHTML = `&lt;${otherUsername}&gt; ${localeStrings.isOffline}.`;
                }
            },
            gameCompleted(cb) {
                if (!isPlayer1) {
                    gameCompletedDiv.classList.remove('hidden');
                    return setTimeout(() => cb(), 1000);
                }
                cb();
            },
            error(err) {
                if (err === 'Game not found' ||
                    err === 'Message update failed') {
                    window.location.href = gameConf.redirectURI;
                } else {
                    infoLog('Error: ' + err);
                }
            }
        };

    return stub;
})();

module.exports = info;
