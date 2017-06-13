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
        friendsDiv = document.getElementById('friends'),
        info = document.getElementById('info'),
        form = document.getElementById('form'),
        toggleVisibility = () => {
            newReqBtn.classList.toggle('hidden');
            newReqDiv.classList.toggle('hidden');
            friendsDiv.classList.toggle('hidden');
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
                    }
                }
            })
            .catch(function (err) {
                console.log(err);
            });

        toggleVisibility();
    });

    newReqBtn.addEventListener('click', () => {
        toggleVisibility();
    });

    cancelBtn.addEventListener('click', () => {
        toggleVisibility();
    });
}
