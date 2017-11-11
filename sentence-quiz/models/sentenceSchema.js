module.exports = function(sequelize, Sequelize){
	var sentenceQuestions = sequelize.define("sentenceQuestions", {
		questionText: {
			type: Sequelize.STRING,
			allowNull: false
		}, 
		correctAnswer: {
			type: Sequelize.STRING,
			allowNull: false
		},
		incorrectAnswers: {
			type: Sequelize.STRING,
			allowNull: false
		},
		emotion_group: {
			type: Sequelize.STRING, 
			allowNull: false
		}
	});

	return sentenceQuestions;
}