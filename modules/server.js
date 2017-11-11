var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var models = require('./models');


var app = express();
var PORT = 3000;

var exphbs = require("express-handlebars");

app.engine("handlebars", 
    exphbs({ 
        defaultLayout: "main",
        partialsDir:[__dirname+"/views/partials"]
     }));//make the main.handlebars be the layout template
app.set("view engine","handlebars");//set the express view engine as handlebars

//parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

models.sequelize.sync().then(function(){
    console.log("success");
}).catch(function(err){
    console.log(err,"failure");
});

//listener
app.listen(PORT, function () {
  console.log('App listening on PORT: ' + PORT);
});

require("./routes/sentenceRoutes.js")(app, models.sentenceQuestions)