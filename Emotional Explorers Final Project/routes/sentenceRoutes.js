//routes

//Fisher-Yates shuffle method - https://bost.ocks.org/mike/shuffle/
function shuffle(array) {
  var m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

module.exports = function(app, questions,Student,Scores) {

	app.get('/sentences', function(req, res){
		Student.findOne({where:{email:req.user.email}}).then(function(student){
			var adminConn = student.dataValues.adminConn;
			Scores.findAll({where:{student_id:student.dataValues.id}}).then(function(studentScores){
				var questionsAsked = studentScores.map((question)=>{//question ids for the questions already answered
					return question.dataValues.question;
				});
				if(studentScores.length>0){
					var lastQCorrect = studentScores[studentScores.length-1].dataValues.correct;
					var Msg = lastQCorrect>0? "Great job! You got the last question you answered correct!" : "Alright, good effort! Unfortunately, you didn't get the last question you answered correct!";
					var msgColor = lastQCorrect>0? "green":"red";
				} else {
					var Msg = "Good luck!"
					var msgColor = "#2FA4DA";
				}	
				//select * from questions where id not in ()
				questions.findAll({where:{
					$and:{
						id:{$notIn:questionsAsked},
						from:{$in:["standard",adminConn]}
					}
				}}).then(function(remainingQs){
					if(remainingQs.length>0){
						Msg+=remainingQs.length>1? "":" Here's the last question! Good luck!";
						var randQ = Math.floor(Math.random()*remainingQs.length);
						var questionData = remainingQs[randQ].dataValues;
						var qID = questionData.id;
						var qNum = questionsAsked.length+1;
						var answerArr = questionData.incorrectAnswers.split(",");
						answerArr.push(questionData.correctAnswer);
						answerArr = shuffle(answerArr);
						res.render("sentenceModule",{
							noMoreQuestions:false,
							choices:answerArr,
							questionText:questionData.questionText,
							sentenceModule:true,
							moduleGame:"Sentence Matching",
							firstName:student.dataValues.firstname,
							qID:qID,
							qNum:qNum,
							Msg:Msg,
							msgColor:msgColor,
							student:true,
							chosenBackground:student.dataValues.chosenBackground});
					} else {
						res.render("sentenceModule",{
							noMoreQuestions:true,
							Msg:"You have answered all questions available to you. Please tell your parents to get more questions added.",
							msgColor:"blue",
							firstName:student.dataValues.firstname,
							sentenceModule:true,
							moduleGame:"Sentence Matching",
							student:true,
							chosenBackground:student.dataValues.chosenBackground
						});
					}
				});
			});
		});
	});

	app.post("/sentences/sentence_submit",function(req,res){
		var qID = parseInt(req.body.id);
		Student.findOne({where:{email:req.user.email}}).then(function(student){
			questions.findOne({where:{id:qID}}).then(function(question){
				var correctAnswer = question.dataValues.correctAnswer;
				var result = correctAnswer==req.body.chosenAns? 1:0;
				Scores.create({
					student_id: student.dataValues.id,
					emotion_group:question.dataValues.emotion_group,
					emotion:question.dataValues.correctAnswer,
					question:question.dataValues.id,
					correct:result,
					guessedAnswer:req.body.chosenAns
				}).then(function(data){
					var recentActivity = {mostRecentActivity:"sentence module"};
					Student.update(recentActivity,{where:{id:student.id}}).then(function(result){
						res.end();
					});
				});
			});
		});
	});

}
