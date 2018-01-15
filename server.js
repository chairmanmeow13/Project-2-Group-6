var express = require("express");
var app = express();
var flash = require("connect-flash");

var passport = require("passport");

var session = require("express-session");
var bodyParser = require("body-parser");

var models = require("./models");
app.use(express.static("Public"));

var exphbs = require("express-handlebars");

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
	secret:"ourprojectisthebest",
	resave:true,
	saveUninitialized:true
}));
app.use(passport.initialize());//initialize passport
app.use(passport.session());

var port = process.env.PORT || 5000;

app.listen(port,function(err){
	if(!err){
		console.log("site is live");
	} else {console.log(err);}
})

models.sequelize.sync().then(function(){
	console.log("success");
}).catch(function(err){
	console.log(err,"failure");
})

app.engine("handlebars", 
	exphbs({ 
		defaultLayout: "main",
		partialsDir:[__dirname+"/views/partials"]
	 }));//make the main.handlebars be the layout template
app.set("view engine","handlebars");//set the express view engine as handlebars

//authentication, credentials and session instantiation
require("./config/passport/passport.js")(passport,models.user,models.student,models.admin);

//routes
require("./routes/auth.js")(app,
							passport,
							models.user,
							models.student,
							models.admin);
require("./routes/admin.js")(app,
							models.student,
							models.admin,
							models.SentenceMatchingScores,
							models.PictureMatchingScores,
							models.GoodSadScores,
							models.sequelize,
							models.sentenceQuestions,
							models.questionImages,
							models.emotPrompts);
require("./routes/sentenceRoutes.js")(app,
										models.sentenceQuestions,
										models.student,
										models.SentenceMatchingScores);
require("./routes/expressionRoutes.js")(app,
										models.questionImages,
										models.student,
										models.PictureMatchingScores);
require("./routes/goodsadRoutes.js")(app,
									models.emotPrompts,
									models.student,
									models.GoodSadScores);
require("./routes/student.js")(app,
								models.student);