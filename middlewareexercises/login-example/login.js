
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'hnigcphuatheoauhoc',
  cookie: {
    maxAge: 60000
  }
}));

  app.get('/login', function(request, response) {
    response.render('login.hbs');
  });

  app.post('/submit_login', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username === 'Aaron' && password === 'opensesame') {
      // successful login
      request.session.loggedInUser = username;
      response.redirect('/');
    } else {
      response.redirect('/login');
    }
  });

app.use(function authentication(request, response, next) {
  if (request.session.loggedInUser) {
    next(); // you shall pass
  } else {
    response.send('Stop you must! <a href="/login">Login</a>');
  }
});

    app.get('/logout', function(request, response) {
      request.session.loggedInUser = null;
      response.redirect('/');
    });

    app.get('/', function(request, response) {
      response.render('home.hbs', {
        name: request.session.loggedInUser
      });
    });

app.listen(3000, function() {
  console.log('Listening on port 3000.');
});
