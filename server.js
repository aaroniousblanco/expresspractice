const express = require('express');
const session = require('express-session');
const Promise = require('bluebird');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
const dbConfig = require('./config.js');
const db = pgp(dbConfig);
const app = express();
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'hbs');

app.use(session({
  secret: 'yessiree',
  cookie: {
    maxAge: 60000000000
  }
}));

//Makes session automatically available to all hbs files (including all variables)
app.use(function(request, response, next) {
  response.locals.session = request.session;
  next();
});

app.get('/', function(req, res) {
  res.render('searchbar.hbs');
});

app.get('/search_results', function(req, res, next) {
  let input = req.query.search;
  db.any(`select * from restaurant where name || category ILIKE $1`, `%${input}%`)
    .then(function(results) {
      res.render('search_results.hbs', {
        layout: false,
        search: results
      });
    })
    .catch(function(err){
      next(err);
    });
});

app.get('/restaurant/:id', function(req, res, next) {
  var id = req.params.id;
  db.any(`select restaurant.id, restaurant.name, restaurant.address, restaurant.category, reviews.restaurant_id, reviews.review, reviews.title, reviews.stars from restaurant left outer join reviews on reviews.restaurant_id = restaurant.id where restaurant.id = $1`, id)
    .then(function(result) {
      res.render('restaurant.hbs', {
        result: result
      });
    })
    .catch(function(err){
      next(err);
    });
});

app.post('/submit_reviews/:id', function(req, res, next) {
  var title = req.body.title;
  var stars = req.body.stars;
  var review = req.body.review;
  var id = req.params.id;
  db.none(`insert into reviews (title, stars, review, restaurant_id) values ($1, $2, $3, $4)`, [title, stars, review, id])
    .then(function() {
      res.redirect(`/restaurant/${id}`);
    })
    .catch(function(err){
      console.log(err.message);
      next(err);
    });
});

// User Authentication
//
// Implement user authentication for the restaurant reviewer application. To do this:
//
// Create a password column in your reviewer table - you will store plain passwords - for now, give each existing reviewer a password.
// Create a login page (containing username and password fields) and render the form at the /login URL.
// Create a handler to handle the login submission. The handler will execute a query to fetch the reviewer that matches the submitted username and then verify the password. If the username and password both match, it will
// create a session variable to remember the fact that a user has logged in.
// redirect to the home page.
// In the top right hand corner of each page, display a greeting to the current logged in user.
// Create a custom authentication middleware to only allow logged in users to submit reviews and create restaurants in the database. Do this by:
// installing the authentication middleware before the route handler for submitting reviews.

app.get('/login', function(request, response, next) {
  response.render('login.hbs');
});

app.post('/login_submission', function(request, response, next) {
  db.one(`select * from reviewer where reviewer.name = $1`, [request.body.username])
    .then(function(reviewer){
      var loggedInUserId = reviewer.id;
      var username = request.body.username;
      var enteredPassword = request.body.password;
      return [username, loggedInUserId, bcrypt.compare(enteredPassword, reviewer.password)];
    }) //this spreads the returned values into the next function
    .spread(function(username, loggedInUserId, matched) {
      console.log('Matched?', matched);
      if (matched) {
        request.session.userName = username;
        request.session.loggedInUserId = loggedInUserId; //reviewer ID here. Insert this into the submit reviews function to tie reviewers to reviews.
      }
    })
    .then(function(){
      response.redirect('/');
    })
    .catch(function(err) {
      console.log(err.message);
      response.render('login.hbs', {
        error: 'Incorrect password'
      });
    });
});


app.get('/', function(request, response, next) {
  response.render('searchbar.hbs');
});

app.get('/signup', function(request, response, next) {
  response.render('signup.hbs');
});

app.post('/signup_submission', function(request, response, next) {
  const userName = request.body.username;
  const correctPassword = request.body.password;
  bcrypt.hash(correctPassword, 10)
    .then(function(encryptedPassword) {
      console.log(encryptedPassword);
      db.none(`insert into reviewer values (default, $1, $2);`, [userName, encryptedPassword]);
    })
    .then(function() {
      response.redirect('/login');
    })
    .catch(function(err) {
      console.log(err.message);
    });
});

app.listen(3000, function() { //this stays at the bottom of the file
  console.log('Example app listening on port 3000!');
});
