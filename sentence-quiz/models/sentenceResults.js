module.exports = function(sequelize, Sequelize){
	var sentenceResults = sequelize.define("sentenceResults", {
		 student_id:{
            type:Sequelize.INTEGER,
            allowNull:false
        },
        emotion_group:{
            type:Sequelize.STRING,
            allowNull:false
        },            
        emotion:{
            type:Sequelize.STRING,
            allowNull:false
        },
        question:{
            type:Sequelize.INTEGER,
            allowNull:false
        },
        correct:{
            type:Sequelize.INTEGER,
            allowNull:false
        }
    });

    return sentenceResults;
}
