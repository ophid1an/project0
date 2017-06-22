const gameConf = require('./game-conf');

const info = (function () {
    var infoDiv = gameConf.htmlElements.infoDiv,
        locale = gameConf.localeStrings.en,
        otherUsername = '',
        infoLog = msg => { //TODO Remove
            var oldMsg = infoDiv.innerHTML;
            infoDiv.innerHTML = msg;
            setTimeout(() => {
                if (infoDiv.innerHTML === msg) {
                    infoDiv.innerHTML = oldMsg;
                }
            }, 5000);
        },

        stub = {
            init(otherName, loc) {
                if (loc) {
                    locale = gameConf.localeStrings[loc];
                }
                otherUsername = otherName;
                return this;
            },
            thisOnline(flag = true) {
                if (flag) {
                    infoDiv.classList.replace('text-danger', 'text-success');
                    infoDiv.innerHTML = `&lt;${locale.online}&gt;`;
                    if (otherUsername) {
                        stub.otherOnline(false);
                    }
                } else {
                    infoDiv.classList.replace('text-success', 'text-danger');
                    infoDiv.innerHTML = `&lt;${locale.offline}&gt;`;
                }
            },
            otherOnline(flag = true) {
                if (flag) {
                    infoDiv.classList.replace('text-danger', 'text-success');
                    infoDiv.innerHTML = `&lt;${otherUsername}&gt; ${locale.isOnline}.`;
                } else {
                    infoDiv.classList.replace('text-success', 'text-danger');
                    infoDiv.innerHTML = `&lt;${otherUsername}&gt; ${locale.isOffline}.`;
                }
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
