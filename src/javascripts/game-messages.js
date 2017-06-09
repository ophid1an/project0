const messages = (function () {
    var messages = [],
        socket = {},
        isPlayer1 = true,
        otherUsername = '',
        mostRecentOtherMessageDate = new Date(0),
        setMostRecentOtherMessageDate = msg => {
            if (otherUsername) {
                var msgDate = new Date(msg.date); // msg.date is a STRING !!!
                if (msgDate > mostRecentOtherMessageDate) {
                    mostRecentOtherMessageDate = msgDate;
                }
            }
        },
        stub = {
            init(msgs, s, isP1, otherName) {
                messages = msgs;
                messages.forEach(msg => {
                    setMostRecentOtherMessageDate(msg);
                });
                socket = s;
                isPlayer1 = isP1;
                otherUsername = otherName;
                return this;
            },
            update(msgs) {
                msgs.forEach(msg => setMostRecentOtherMessageDate(msg));
            },
            send(text) {
                if (!text.length) {
                    return false;
                }

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
