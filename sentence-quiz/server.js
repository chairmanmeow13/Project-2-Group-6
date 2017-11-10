var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();
var PORT = 3000;

//parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

//routes
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, "home.html"));
});

app.get('/score', function(req, res){
	res.sendFile(path.join(__dirname, "scores.js"));
});

app.get('/sentences', function(req, res){
	res.sendFile(path.join(__dirname, "matchmodule.html"));
});

require("scores.js")(app,require("scores.js"))

//listener
app.listen(PORT, function () {
  console.log('App listening on PORT: ' + PORT);
});