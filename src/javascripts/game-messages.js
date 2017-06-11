const gameConf = require('./game-conf');
const dateformat = require('dateformat');

const messages = (function () {
    var socket = {},
        isPlayer1 = false,
        otherUsername = '',
        messagesList = gameConf.htmlElements.messagesList,
        messagesBtn = gameConf.htmlElements.messagesBtn,
        messagesBtnName = messagesBtn.innerHTML,
        canReceiveNewMessages = false,
        mostRecentOtherMessageDate = new Date(0),
        setMostRecentOtherMessageDate = msg => {
            if (otherUsername) {
                var msgDate = new Date(msg.date); // msg.date is a STRING !!!
                if (msgDate > mostRecentOtherMessageDate) {
                    mostRecentOtherMessageDate = msgDate;
                }
            }
        },
        setMessageCount = len => {
            var strArr = messagesBtn.innerHTML.split(' '),
                oldCount = 0;
            if (strArr.length === 1) {
                messagesBtn.innerHTML = `${messagesBtnName} (${len})`;
            } else {
                oldCount = +(strArr[1].toString().slice(1, strArr[1].length - 1));
                messagesBtn.innerHTML = `${messagesBtnName} (${len+oldCount})`;
            }
        },
        stub = {
            init(msgs, s, isP1, otherName) {
                socket = s;
                isPlayer1 = isP1;
                otherUsername = otherName;
                stub.update(msgs);
                canReceiveNewMessages = true; // don't count new messages until after first connection
                return this;
            },
            resize() {
                var body = document.getElementsByTagName('body')[0],
                    bodyComputedStyle = window.getComputedStyle(body),
                    bodyTotalHeight = window.parseFloat(bodyComputedStyle.height, 10) +
                    window.parseFloat(bodyComputedStyle.marginTop, 10) +
                    window.parseFloat(bodyComputedStyle.marginBottom, 10) +
                    window.parseFloat(bodyComputedStyle.paddingTop, 10) +
                    window.parseFloat(bodyComputedStyle.paddingBottom, 10),
                    messagesListHeight = window.parseFloat(window.getComputedStyle(messagesList).height, 10),
                    randomOffset = 20,
                    messagesListNewHeight = (Math.abs(window.innerHeight - (bodyTotalHeight - messagesListHeight + randomOffset))) + 'px';

                messagesList.style.height = messagesListNewHeight;
                messagesList.scrollTop = messagesList.scrollHeight;

                return this;
            },
            update(msgs) {
                var frag = document.createDocumentFragment(),
                    otherMsgsCount = 0,
                    liDate, liText;

                msgs.forEach(msg => {
                    if (msg.isPlayer1 !== isPlayer1) {
                        setMostRecentOtherMessageDate(msg);
                        otherMsgsCount += 1;
                    }

                    liDate = document.createElement('li');
                    liDate.textContent = dateformat(msg.date, 'mmm d, HH:MM:ss');
                    liText = document.createElement('li');
                    liText.textContent = msg.text;

                    if (isPlayer1 === msg.isPlayer1) {
                        liDate.classList.add('this-player');
                        liText.classList.add('this-player');
                    }

                    frag.appendChild(liDate);
                    frag.appendChild(liText);
                });

                messagesList.appendChild(frag);
                messagesList.scrollTop = messagesList.scrollHeight;

                if (canReceiveNewMessages && otherMsgsCount) {
                    setMessageCount(otherMsgsCount);
                }

                return this;
            },
            send(text) {
                var trimmedText = text.trim();

                if (!trimmedText.length) {
                    return false;
                }

                var msg = {
                    text,
                    date: Date.now(),
                    isPlayer1: isPlayer1
                };

                stub.update([msg]);

                socket.emit('message to other', text);
                return this;
            },
            receive() {
                if (otherUsername) {
                    socket.emit('messages to me', mostRecentOtherMessageDate);
                }
                return this;
            },
        };

    return stub;
})();

module.exports = messages;
