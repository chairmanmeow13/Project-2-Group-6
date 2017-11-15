module.exports = function(app,students){

	app.post("/home/changeLayout",function(req,res){
		var layout = {
			chosenBackground:req.body.chosenBGPic,
			chosenPicture:req.body.chosenPic
		};
		console.log(layout);
		students.update(layout,{where:{email:req.user.email}}).then(function(userData){
			res.end();
		});

	});
}