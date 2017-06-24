;
(function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}(start));


function start() {

    require('./polyfills/classList');

    const axios = require('axios'),
        newReqBtn = document.getElementById('new-request-button'),
        newReqDiv = document.getElementById('new-request'),
        cancelBtn = document.getElementById('cancel-button'),
        friendRequestsDiv = document.getElementById('friend-requests'),
        friendsListDiv = document.getElementById('friends-list'),
        friendsListTable = document.getElementById('friends-list-table'),
        info = document.getElementById('info'),
        form = document.getElementById('form'),
        toggleVisibility = (time) => {
            var proceed = () => {
                newReqBtn.classList.toggle('hidden');
                if (friendsListTable.rows.length > 1) {
                    friendsListDiv.classList.toggle('hidden');
                }
                friendRequestsDiv.classList.toggle('hidden');
            };

            newReqDiv.classList.toggle('hidden');

            if (!time) {
                return proceed();
            }

            setTimeout(() => {
                info.innerHTML = '';
                return proceed();
            }, time);
        };

    if (friendsListTable.rows.length > 1) {
        friendsListDiv.classList.toggle('hidden');
    }


    // HTML event listeners
    form.addEventListener('submit', e => {
        e.preventDefault();

        var username = form.elements.namedItem('username').value,
            text = form.elements.namedItem('text').value;

        axios.post('/main/friends/out-request', {
                username,
                text
            })
            .then(function (res) {
                if (res.status && res.status === 200) {
                    if (res.data) {
                        if (res.data.error) {
                            info.classList.replace('text-success', 'text-danger');
                            info.innerHTML = res.data.error;
                        }

                        if (res.data.msg) {
                            info.classList.replace('text-danger', 'text-success');
                            info.innerHTML = res.data.msg;
                        }

                        toggleVisibility(3000);
                    }
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    friendRequestsDiv.addEventListener('click', (e) => {
        var target = e.target;
        if (target.tagName === 'BUTTON') {
            var tr = target.parentElement.parentElement,
                table = tr.parentElement.parentElement,
                username = tr.children[1].innerHTML,
                acceptBtn = tr.children[3].firstChild,
                accepted = false;

            if (target === acceptBtn) {
                accepted = true;
            }

            axios.post('/main/friends/inc-request', {
                    accepted,
                    username
                })
                .then(function (res) {
                    if (res.status && res.status === 200) {
                        if (res.data) {
                            if (res.data.error) {
                                info.classList.replace('text-success', 'text-danger');
                                info.innerHTML = res.data.error;
                            }

                            if (res.data.msg &&
                                res.data.msg === 'OK') {
                                // Remove table row and hide div if it is the
                                // last incoming friend request
                                if (table.rows.length === 2) {
                                    friendRequestsDiv.innerHTML = '';
                                } else {
                                    tr.remove();
                                }

                                // Add row to friends list table
                                if (accepted) {
                                    var row = friendsListTable.insertRow(-1),
                                        cell = row.insertCell(0),
                                        text = document.createTextNode(username);

                                    cell.appendChild(text);

                                    cell = row.insertCell(1);
                                    text = document.createTextNode('0');

                                    cell.appendChild(text);

                                    cell = row.insertCell(2);
                                    text = document.createTextNode('\u2014');

                                    cell.appendChild(text);

                                    if (friendsListTable.rows.length === 2) {
                                        friendsListDiv.classList.toggle('hidden');
                                    }
                                }
                            }
                        }
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
    });

    newReqBtn.addEventListener('click', () => {
        toggleVisibility();
    });

    cancelBtn.addEventListener('click', () => {
        toggleVisibility();
    });
}
