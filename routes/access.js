var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];
var pass = require("../utils/utils.js")["pass"];
var isSuper = pass.isSuper;
var isLoggedIn = pass.isLoggedIn;

module.exports = function (app, db, utils, passport) {

	app.get("/", function (req, res) {
		res.render("index");
	});

	app.get("/login", function (req, res) {
		// check if the user is already logged in
		if (req.hasOwnProperty("user")) {
			res.redirect("/cms");
		} else {
			res.render("login");
		}
	});

  app.post("/login", passport.authenticate("local-login", {
      successRedirect: "/cms",
      failureRedirect: "/login"
    })
  );

	app.get("/logout", isLoggedIn, function (req, res) {
		req.logout();
		req.flash("success", "Successfully logged out.");
		res.redirect("/")
	});

};
