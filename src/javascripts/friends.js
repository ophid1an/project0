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
        friendsRequestsDiv = document.getElementById('friendsRequests'),
        info = document.getElementById('info'),
        form = document.getElementById('form'),
        toggleVisibility = (time) => {
            var proceed = () => {
                newReqBtn.classList.toggle('hidden');
                friendsRequestsDiv.classList.toggle('hidden');
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

    friendsRequestsDiv.addEventListener('click', (e) => {
        var target = e.target;
        if (target.tagName === 'BUTTON') {
            var tr = target.parentElement.parentElement,
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
                                tr.remove();
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
