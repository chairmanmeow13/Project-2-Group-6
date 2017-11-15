var bCrypt = require("bcrypt-nodejs");//secures passwords
var isValidAccessKey = function(userAccessKey,accessKey){//function that will make sure that the entered password is the correct password for the user
	return bCrypt.compareSync(accessKey,userAccessKey);
	//passes password through same encrypting method and determines if provided password is the same as that in the database
	//returns true if they are the same and false if they are different
}

module.exports=function(app,students,admins,SentenceMatchingScores,PictureMatchingScores,GoodSadScores,sequelize,sentenceQDB,pictureQDB,gsQDB){
	var newQuestion = function(req,res){
		console.log(req.user);
		if(req.body.module=="sentence"){
			sentenceQDB.create({
				questionText:req.body.question,
				correctAnswer:req.body.correctAns,
				incorrectAnswers:req.body.incorrectAns,
				emotion_group:req.body.group,
				from:req.user.email
			}).then(function(data){res.send("Question added successfully");
			}).catch(function(data){res.send("Error in adding question")});
		} else {
			console.log("*****************here******************");
			gsQDB.create({
				question:req.body.question,
				topic:req.body.topic,
				from:req.user.email
			}).then(function(data){res.send("Question added successfully");
			}).catch(function(data){res.send("Error in adding question")});
		}
	
	}
	app.post("/search",function(req,res){ 
		students.findAll({where:{adminConn:req.user.email}}).then(function(adminStudents){
			var studentDisplayInfo = adminStudents.map(function(adminStudent,indx){
				return {
					id:indx,
					firstname:adminStudent.dataValues.firstname,
					lastname:adminStudent.dataValues.lastname,
					age:adminStudent.dataValues.age,
					grade:adminStudent.dataValues.grade,
					email:adminStudent.dataValues.email
				}
			});
			students.findOne({where:{email:req.body.email}}).then(function(student){
				if(!student){
					res.render("home_admin",{error:"student email not in the system",firstname:req.user.firstname||req.body.firstname,students:studentDisplayInfo,homePage:true});
				} else {
					if(student.adminConn === null){	
						if(!isValidAccessKey(student.accessKey,req.body.accessKey)){						
							res.render("home_admin",{error:"access key for this student is not correct",firstname:req.user.firstname||req.body.firstname,students:studentDisplayInfo,homePage:true})
						} else {
							studentDisplayInfo.push({
								id:studentDisplayInfo.length,
								firstname:student.dataValues.firstname,
								lastname:student.dataValues.lastname,
								age:student.dataValues.age,
								grade:student.dataValues.grade,
								email:student.dataValues.email
							})
							var adminEmail = {adminConn: req.user.email};
							students.update(adminEmail,{where:{id:student.id}}).then(function(result){
								res.render("home_admin",{success:"you have been successfully connected to the student",firstname:req.user.firstname||req.body.firstname,students:studentDisplayInfo,validAdmin:true,homePage:true})
							});
						}
					} else {
						res.render("home_admin",{error:"student is already connected to an admin",firstname:req.user.firstname||req.body.firstname,students:studentDisplayInfo,homePage:true});
					}
				}
			})
		})
	});

	app.get("/studentProfile-:id",function(req,res){

		var studentDisplayInfo;
		students.findAll({where:{adminConn:req.user.email}}).then(function(adminStudents){
			studentDisplayInfo = adminStudents.map(function(adminStudent,indx){
				return {
					id:adminStudent.dataValues.id,
					firstname:adminStudent.dataValues.firstname,
					lastname:adminStudent.dataValues.lastname,
					age:adminStudent.dataValues.age,
					grade:adminStudent.dataValues.grade,
					email:adminStudent.dataValues.email,
					recentActivity:adminStudent.dataValues.mostRecentActivity,
					recentActivityTime:adminStudent.dataValues.updatedAt
				}
			});
			var studentProfile = studentDisplayInfo[req.params.id];
			if(studentProfile){
				studentProfile.firstStudent = req.params.id==0? true:false;
				studentProfile.lastStudent = req.params.id==studentDisplayInfo.length-1? true:false;
				studentProfile.lastindx = studentDisplayInfo.length-1;
				SentenceMatchingScores.findAll({
					where:{student_id:studentProfile.id},
					group:["SentenceMatchingScores.emotion_group","SentenceMatchingScores.emotion","SentenceMatchingScores.correct"],
					attributes: ["emotion_group","emotion","correct",[sequelize.fn('COUNT', sequelize.col('emotion')), 'NumEmotionQuestions']]
				}).then(function(results_sentence){

					studentProfile.sentence_correct = results_sentence.filter((result)=>{
						return (result.correct==1);
					});
					studentProfile.sentence_incorrect = results_sentence.filter((result)=>{
						return (result.correct==0);
					});
					studentProfile.sentence_numCorrect = studentProfile.sentence_correct.length;
					studentProfile.sentence_totalAnswered = studentProfile.sentence_numCorrect+studentProfile.sentence_incorrect.length;
					studentProfile.sentence_percCorrect = (Math.round((studentProfile.sentence_numCorrect/studentProfile.sentence_totalAnswered)*10000)/100)+"%";
					studentProfile.sentences_hasCorrectAnswers = studentProfile.sentence_correct.length>0;
					studentProfile.sentences_hasIncorrectAnswers = studentProfile.sentence_incorrect.length>0;
					studentProfile.sentences_hasAnswers = results_sentence.length>0;
					var Emots = results_sentence.map((result,indx)=>{
						return result.emotion;
					});
					var uniqEmots = Emots.filter((Emot,indx)=>{
						return Emots.indexOf(Emot)==indx;
					});
					var emotCounts = [];
					for (var i = 0 ; i < uniqEmots.length ; i++){
						emotCounts[i]={};
						emotCounts[i].emot = uniqEmots[i];
						emotCounts[i].emotGroup = results_sentence.filter((result)=>{
							return (result.emotion == uniqEmots[i]);
						});
						emotCounts[i].emotGroup = emotCounts[i].emotGroup[0].dataValues.emotion_group;
						emotCounts[i].numCorrect = studentProfile.sentence_correct.filter((result)=>{
							return (result.emotion == uniqEmots[i]);
						});
						emotCounts[i].numCorrect = emotCounts[i].numCorrect.length>0? emotCounts[i].numCorrect[0].dataValues.NumEmotionQuestions:0;
						emotCounts[i].numIncorrect = studentProfile.sentence_incorrect.filter((result)=>{
							return (result.emotion == uniqEmots[i]);
						});
						emotCounts[i].numIncorrect = emotCounts[i].numIncorrect.length>0? emotCounts[i].numIncorrect[0].dataValues.NumEmotionQuestions:0;						
						emotCounts[i].numTotal = emotCounts[i].numIncorrect+emotCounts[i].numCorrect;
						emotCounts[i].percCorrect = (Math.round((emotCounts[i].numCorrect/emotCounts[i].numTotal)*10000)/100)+"%";
						console.log(emotCounts[i]);
					}
					studentProfile.dataForTotalsTable_sentences = emotCounts;
					PictureMatchingScores.findAll({
						where:{student_id:studentProfile.id},
						group:["PictureMatchingScores.emotion_group","PictureMatchingScores.emotion","PictureMatchingScores.correct"],
						attributes: ["emotion_group","emotion","correct",[sequelize.fn('COUNT', sequelize.col('emotion')), 'NumEmotionQuestions']]
					}).then(function(results_picture){
						studentProfile.picture_correct = results_picture.filter((result)=>{
							return (result.correct==1);
						});
						studentProfile.picture_incorrect = results_picture.filter((result)=>{
							return (result.correct==0);
						});
						var Emots = results_picture.map((result,indx)=>{
							return result.emotion;
						});
						var uniqEmots = Emots.filter((Emot,indx)=>{
							return Emots.indexOf(Emot)==indx;
						})
						studentProfile.picture_numCorrect = studentProfile.picture_correct.length;
						studentProfile.picture_totalAnswered = studentProfile.picture_numCorrect+studentProfile.picture_incorrect.length;
						studentProfile.picture_percCorrect = (Math.round((studentProfile.picture_numCorrect/studentProfile.picture_totalAnswered)*10000)/100)+"%";						
						studentProfile.picture_hasCorrectAnswers = studentProfile.picture_correct.length>0;
						studentProfile.picture_hasIncorrectAnswers = studentProfile.picture_incorrect.length>0;
						studentProfile.picture_hasAnswers = results_picture.length>0;
						var emotCounts = [];
						for (var i = 0 ; i < uniqEmots.length ; i++){
							emotCounts[i]={};
							emotCounts[i].emot = uniqEmots[i];
							emotCounts[i].emotGroup = results_picture.filter((result)=>{
								return (result.emotion == uniqEmots[i]);
							});
							emotCounts[i].emotGroup = emotCounts[i].emotGroup[0].dataValues.emotion_group;
							emotCounts[i].numCorrect = studentProfile.picture_correct.filter((result)=>{
								return (result.emotion == uniqEmots[i]);
							});
							emotCounts[i].numCorrect = emotCounts[i].numCorrect.length>0? emotCounts[i].numCorrect[0].dataValues.NumEmotionQuestions:0;
							emotCounts[i].numIncorrect = studentProfile.picture_incorrect.filter((result)=>{
								return (result.emotion == uniqEmots[i]);
							});
							emotCounts[i].numIncorrect = emotCounts[i].numIncorrect.length>0? emotCounts[i].numIncorrect[0].dataValues.NumEmotionQuestions:0;						
							emotCounts[i].numTotal = emotCounts[i].numIncorrect+emotCounts[i].numCorrect;
							emotCounts[i].percCorrect = (Math.round((emotCounts[i].numCorrect/emotCounts[i].numTotal)*10000)/100)+"%";
						}
						studentProfile.dataForTotalsTable_picture = emotCounts;
						GoodSadScores.findAll({
							where:{student_id:studentProfile.id},
							group:["GoodSadScores.goodSad","GoodSadScores.topic"],
							attributes: ["goodSad","topic",[sequelize.fn('COUNT', sequelize.col('topic')), 'NumTopicQuestions']]
						}).then(function(results_gs){
							studentProfile.results_gs = results_gs.map(function(result){
								if(result.dataValues.topic.indexOf(",")==-1){
									return result.dataValues;
								} else {
									result.dataValues.topic = result.dataValues.topic.replace(/, /g,",");
									return result.dataValues;
								}

							});
							studentProfile.gs_hasAnswers = studentProfile.results_gs.length>0?true:false;
							studentProfile.showInfo = true;
							studentProfile.adminObs = true;
							res.render("StudentProfile_admin",studentProfile);
						});
					});
				});
			} else {
				res.render("StudentProfile_admin",{error:"student not found"});
			}
		});
	});

	app.get("/studentProfile-:id/:quizType-:category-:result",function(req,res){
		students.findAll({where:{adminConn:req.user.email}}).then(function(studentList){
			var studentData = studentList[req.params.id].dataValues;
			var correct = req.params.result=="correct"? 1:0;

			if(req.params.quizType=="sentences"){
				SentenceMatchingScores.findAll({
					where: {$and: [
						{student_id:studentData.id},
						{emotion:req.params.category},
						{correct:correct}
						]}
				}).then(function(data){
					var results = data.map((dataItem)=>{
						return dataItem.dataValues;
					})
					var qIDs = results.map((result)=>{
						return result.question;
					})
					
					console.log(results);
					var query = qIDs.length >1 ? {where:{id:{$in:qIDs}}} : {where:{id:{$eq:qIDs[0]}}};
					sentenceQDB.findAll(query).then(function(questions){
						questions = questions.map((question)=>{
							return question.dataValues;
						});
						for (var i = 0 ; i< results.length ; i++){
							results[i].questionText = questions.filter((question)=>{
								return question.id == qIDs[i];
							})[0].questionText;
							results[i].type="sentence";
						}
						res.json(results);
					})
				})
			} else if(req.params.quizType=="picture"){
				PictureMatchingScores.findAll({
					where: {$and: [
						{student_id:studentData.id},
						{emotion:req.params.category},
						{correct:correct}
						]}
				}).then(function(data){
					var results = data.map((dataItem)=>{
						return dataItem.dataValues;
					})
					var qIDs = results.map((result)=>{
						return result.question;
					})
					
					console.log(results);
					var query = qIDs.length >1 ? {where:{id:{$in:qIDs}}} : {where:{id:{$eq:qIDs[0]}}};
					pictureQDB.findAll(query).then(function(questions){
						questions = questions.map((question)=>{
							return question.dataValues;
						});
						for (var i = 0 ; i< results.length ; i++){
							results[i].imageSource = questions.filter((question)=>{
								return question.id == qIDs[i];
							})[0].imageSource;
							results[i].type="picture";
						}
						res.json(results);
					})
				})
			} else if(req.params.quizType=="gs"){
				var goodSad = req.params.result;
				req.params.category = req.params.category.replace(/,/,", ");
				console.log(goodSad);
				console.log(req.params.category);
				GoodSadScores.findAll({
					where: {$and: [
						{student_id:studentData.id},
						{topic:req.params.category},
						{goodSad:goodSad}
						]}
				}).then(function(data){
					console.log(data);
					var results = data.map((dataItem)=>{
						return dataItem.dataValues;
					})
					var qIDs = results.map((result)=>{
						return result.question;
					})
					
					console.log(results);
					var query = qIDs.length >1 ? {where:{id:{$in:qIDs}}} : {where:{id:{$eq:qIDs[0]}}};
					gsQDB.findAll(query).then(function(questions){
						questions = questions.map((question)=>{
							return question.dataValues;
						});
						for (var i = 0 ; i< results.length ; i++){
							results[i].questionText = questions.filter((question)=>{
								return question.id == qIDs[i];
							})[0].question;
							results[i].type="gs";
						}
						res.json(results);
					})
				})				
			}
		});
	});

	app.post("/home/addQ",newQuestion);
	app.post("/search/addQ",newQuestion);

}