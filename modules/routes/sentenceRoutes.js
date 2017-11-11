//routes
module.exports = function(app, questions) {
	app.get('/', function(req, res){
		res.render("home");
	});

	app.get('/sentences', function(req, res){
		questions.findOne({}).then(function(question){
			var questionData = question.dataValues;
			var answerArr = questionData.incorrectAnswers.split(",");
			answerArr.push(questionData.correctAnswer);
			console.log(answerArr);
			res.render("matchmodule",{choices:answerArr,questionText:questionData.questionText});
		})
	});

}
