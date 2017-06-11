const gameConf = require('./game-conf');
const defs = require('./game-defs');
const messages = require('./game-messages');

const buttons = (function () {
    var isPlayer1 = false,
        otherUsername = '',
        messagesBtn = gameConf.htmlElements.messagesBtn,
        messagesBtnName = messagesBtn.innerHTML,
        crosswordBtn = gameConf.htmlElements.crosswordBtn,
        optionsBtn = gameConf.htmlElements.optionsBtn,
        homeBtn = gameConf.htmlElements.homeBtn,
        helpBtn = gameConf.htmlElements.helpBtn,
        completeBtn = gameConf.htmlElements.completeBtn,
        dropdownList = gameConf.htmlElements.dropdownList,
        helpDiv = gameConf.htmlElements.helpDiv,
        completeDiv = gameConf.htmlElements.completeDiv,
        messagesDiv = gameConf.htmlElements.messagesDiv,
        canvasDiv = gameConf.htmlElements.canvasDiv,
        defsDiv = gameConf.htmlElements.defsDiv,
        stub = {
            init(isP1, otherName) {
                isPlayer1 = isP1;
                otherUsername = otherName;
                if (otherUsername) {
                    messagesBtn.classList.remove('hidden');
                    dropdownList.insertBefore(homeBtn, helpBtn);
                    homeBtn.classList.remove('hidden');
                    if (isPlayer1) {
                        dropdownList.appendChild(completeBtn);
                        completeBtn.classList.remove('hidden');
                    }
                } else {
                    homeBtn.classList.add('button');
                    homeBtn.classList.remove('hidden');
                    dropdownList.appendChild(completeBtn);
                    completeBtn.classList.remove('hidden');
                }

                // Add event listeners

                optionsBtn.addEventListener('click', () => {
                    dropdownList.classList.toggle('hidden');
                });

                crosswordBtn.addEventListener('click', () => {
                    crosswordBtn.classList.add('hidden');
                    messagesBtn.innerHTML = messagesBtnName;
                    messagesBtn.classList.remove('hidden');
                    messagesDiv.classList.add('hidden');
                    canvasDiv.classList.remove('hidden');
                    defsDiv.classList.remove('hidden');
                    defs.resize();
                });

                messagesBtn.addEventListener('click', () => {
                    messagesBtn.classList.add('hidden');
                    messagesBtn.innerHTML = messagesBtnName;
                    crosswordBtn.classList.remove('hidden');
                    canvasDiv.classList.add('hidden');
                    defsDiv.classList.add('hidden');
                    messagesDiv.classList.remove('hidden');
                    messages.resize();
                });

                helpBtn.addEventListener('click', () => {
                    helpDiv.classList.remove('hidden');
                });

                completeBtn.addEventListener('click', () => {
                    completeDiv.classList.remove('hidden');
                });

                window.onclick = e => {
                    var target = e.target;

                    if (!target.matches('#options-button')) {
                        dropdownList.classList.add('hidden');
                    }

                    if (!target.matches('#help-button')) {
                        helpDiv.classList.add('hidden');
                    }

                    if (!target.matches('#complete-button')) {
                        completeDiv.classList.add('hidden');
                    }
                };
            }
        };

    return stub;
})();

module.exports = buttons;
