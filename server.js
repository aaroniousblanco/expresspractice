const express = require('express');
const Promise = require('bluebird');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
const dbConfig = require('./config.js');
const db = pgp(dbConfig);
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
  res.render('searchbar.hbs');
});

app.get('/search_results', function(req, res, next) {
  var input = req.query.search;
  db.any(`select * from restaurant where name || category ILIKE $1`, `%${input}%`)
    .then(function(results) {
      res.render('search_results.hbs', {
        search: results
      });
    })
    .catch(function(err){
      next(err);
    });
});

app.get('/restaurant/:id', function(req, res, next) {
  var id = req.params.id;
  db.any(`select * from restaurant, reviews where reviews.restaurant_id = restaurant.id and reviews.restaurant_id = $1`, `${id}`)
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
  db.none(`insert into reviews (title, stars, review, restaurant_id) values ('${title}', '${stars}', '${review}', '${id}')`)
    .then(function() {
      res.redirect(`/restaurant/${id}`);
    })
    .catch(function(err){
      next(err);
    });
});


app.listen(3000, function() { //this stays at the bottom of the file
  console.log('Example app listening on port 3000!');
});
