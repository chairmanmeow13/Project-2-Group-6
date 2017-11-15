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

module.exports = function(app, questions,Student,PromptsAnswered) {

	app.get('/goodSad', function(req, res){
		Student.findOne({where:{email:req.user.email}}).then(function(student){
			var adminConn = student.dataValues.adminConn;
			PromptsAnswered.findAll({where:{student_id:student.dataValues.id}}).then(function(studentPrompts){
				var PromptsAsked = studentPrompts.map((question)=>{//question ids for the questions already answered
					return question.dataValues.question;
				});
				var Msg = "Here's the next prompt!"
				var msgColor = "#2FA4DA";					

				//select * from questions where id not in ()
				questions.findAll({where:{
					$and:{
						id:{$notIn:PromptsAsked},
						from:{$in:["standard",adminConn]}
					}
				}}).then(function(remainingPrompts){
					if(remainingPrompts.length>0){
						Msg=remainingPrompts.length==1? "Here's the last prompt!":"Here's the next prompt!";
						var randPromptIndx = Math.floor(Math.random()*remainingPrompts.length);
						var questionPrompt = remainingPrompts[randPromptIndx].dataValues;
						var qID = questionPrompt.id;
						var qNum = PromptsAsked.length+1;
						res.render("goodsadModule",{
							noMoreQuestions:false,
							promptText:questionPrompt.question,
							goodsadModule:true,
							moduleGame:"Good Sad",
							firstName:student.dataValues.firstname,
							qID:qID,
							qNum:qNum,
							Msg:Msg,
							msgColor:msgColor,
							student:true,
							chosenBackground:student.dataValues.chosenBackground});
					} else {
						res.render("goodsadModule",{
							noMoreQuestions:true,
							Msg:"You have answered all questions available to you. Please tell your parents to get more questions added.",
							msgColor:"blue",
							firstName:student.dataValues.firstname,
							goodsadModule:true,
							moduleGame:"Good Sad",
							student:true,
							chosenBackground:student.dataValues.chosenBackground
						});
					}
				});
			})
		});
	});

	app.post("/goodSad/goodsad_submit",function(req,res){
		var qID = parseInt(req.body.id);
		Student.findOne({where:{email:req.user.email}}).then(function(student){
			questions.findOne({where:{id:qID}}).then(function(question){
				//selected answer?

				PromptsAnswered.create({
					student_id: student.dataValues.id,
					goodSad: req.body.goodSad,
					topic:question.dataValues.topic,
					question:question.dataValues.id,
					answer: req.body.answer,
				}).then(function(data){
					var recentActivity = {mostRecentActivity:"goodsad module"};
					Student.update(recentActivity,{where:{id:student.id}}).then(function(result){
						res.end();
					});
				});
			});
		});
	});

}
