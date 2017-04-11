$(document).ready(function() {
    var $pwd = $('#password');
    var $pwdConf = $('#password-confirmation');
    var $username = $('#username');
    var $email = $('#email');

    var $info = $('#info');
    var $button = $('form button');

    $button.on('click', function(e) {
        var regexp = /^\S+@\S+$/;
        if (!$username.val()) {
            $info.html('Κενό όνομα χρήστη!').show().delay(2000).fadeOut();
            e.preventDefault();
        } else if (!$email.val().match(regexp)) {
            $info.html('Λανθασμένη διεύθυνση e-mail!').show().delay(2000).fadeOut();
            e.preventDefault();
        } else if ($pwd.val().length < 8) {
            $info.html('Ο κωδικός πρέπει να αποτελείται από τουλάχιστον 8 σύμβολα!').show().delay(2000).fadeOut();
            e.preventDefault();
        } else if ($pwd.val() !== $pwdConf.val()) {
            $info.html('Οι δύο κωδικοί δεν είναι ίδιοι!').show().delay(2000).fadeOut();
            e.preventDefault();
        }

    });
});
