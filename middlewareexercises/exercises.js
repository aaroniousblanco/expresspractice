const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs-promise');
const app = express();
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'yessiree',
  cookie: {
    maxAge: 60000
  }
}));

// Middleware practice exercises below//

// Logging middleware
// Write an express middleware that will print (console.log) out the request method and the request path of all requests in the app, and delegate to the regular route handler.

app.use(function logging(request, response, next) {
  console.log(request.method, request.path);
  next();
});


// Logging middleware 2
// Write an express middleware that will log the same information as above, but in a log file. Log the information using fs or fs-promise.

app.use(function logging2(request, response, next) {
  fs.appendFile('logging2.txt', (request.method + request.path))
    .then(function() {
      next();
    })
    .catch(function(err) {
        console.log(err.message);
    });
});


// Session
// Write an express application - start one from scratch - that uses express-session. There are two pages: /ask, and /greet. The ask page asks the user to put in a name, and the greet page displays the greeting showing their name. You'll need to:

// Create an ask page that displays a form which submits to a submit handler, say /submit_name.

// The /submit_name handler will retrieve the name and save it into the session as a session variable.

// The greet page will display a greeting to the user's name as fetched from the session.
app.get('/', function(request, response) {
  response.render('ask.hbs');
});

app.post('/submit_name', function(request, response, next) {
  var name = request.body.name;
  request.session.name = name;
  response.redirect('/greet');
});

app.get('/greet', function(request, response, next) {
  response.render('greet.hbs', {
    name: request.session.name
  });
});


app.listen(3000, function() {
  console.log("Listening on port 3000.");
});
