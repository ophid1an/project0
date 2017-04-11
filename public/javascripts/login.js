$(document).ready(function () {

  var $loginForm = $('form');
  var $errorsDiv = $('#errors');

  function ajaxFail (xhr, status, errorThrown) {
    alert("Sorry, there was a problem!");
    console.log("Error: " + errorThrown);
    console.log("Status: " + status);
    console.dir(xhr);
  }

  $loginForm.on('submit', function (e) {
    e.preventDefault();
    $errorsDiv.html('');
    var username = $('#username').val();
    var pwd = $('#pwd').val();

    $.ajax({
        url: '/login',
        data: {
          username: username,
          pwd: pwd
        },
        type: 'POST',
        dataType: 'json'
      })
      .done(function (json) {
        if (json.errors) {

          var html = '<ul>';

          for (var i = 0; i < json.errors.length; i += 1) {
            html += '<li>' + json.errors[i].msg + '</li>';
          }

          html += '</ul>';

          $errorsDiv.html(html);

        } else {

          // localStorage.setItem('token',json.token);
          window.location.replace('/main');

        }
      })
      .fail(ajaxFail);

  });

});
