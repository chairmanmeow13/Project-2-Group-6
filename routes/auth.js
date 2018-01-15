module.exports = function(app,passport,User,Student,Admin){
	
	app.get("/",function(req,res){//get signup page
		res.render("signup",{homePage:true});
	});

	app.get("/login",function(req,res){//get log in page
		res.render("login",{homePage:true});
	});

	app.get("/home", isLoggedIn,function(req,res){
		if(req.user.userType=="Student"){
			Student.findOne({where:{email:req.user.email}}).then(function(userData){
				var userData = userData.dataValues;
				userData.student = true;
				userData.homePage = true;
				userData.BGPicName = userData.chosenBackground.substr(0,userData.chosenBackground.indexOf("."));
				userData.PicName = userData.chosenPicture.substr(0,userData.chosenPicture.indexOf("."));
				res.render("home_student",userData);//req.user will exist if the current user is logged in
			});
		} else {
			Student.findAll({where:{adminConn:req.user.email}}).then(function(students){		
				var studentDisplayInfo = students.map(function(adminStudents,indx){
					console.log(adminStudents);
					return {
						id:indx,
						firstname:adminStudents.dataValues.firstname,
						lastname:adminStudents.dataValues.lastname,
						age:adminStudents.dataValues.age,
						grade:adminStudents.dataValues.grade,
						email:adminStudents.dataValues.email
					}
				})
				console.log(studentDisplayInfo);
				Admin.findOne({where:{email:req.user.email}}).then(function(userData){
					var userData = userData.dataValues;
					userData.students = studentDisplayInfo;
					userData.validAdmin = userData.students.length>0? true:false;
					userData.numStudents = studentDisplayInfo.length;
					userData.student = false;
					userData.homePage = true;
					res.render("home_admin",userData);//req.user will exist if the current user is logged in
				});
			});
		}	
	});

	app.get("/logout",function(req,res){
		req.session.destroy(function(err){
			res.redirect("/");
		})
	})

	app.get("/signuperror",function(req,res){
		res.render("signup",{message:"authentication failed",hasErrors:true});
	})

	app.post("/login",passport.authenticate("local-signin",{
		successRedirect: "/home",
		failureRedirect: "/signuperror"
	}));

	app.post("/signup",passport.authenticate("local-signup",{//use local strategy signup
		successRedirect: "/home",
		failureRedirect: "/signuperror"
	}));

	function isLoggedIn(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}
		res.redirect("/login");
	}

}

