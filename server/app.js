// credentials loading
var credentials = require("../credentials");
var ACCOUNT_SID = credentials.accountSid,
		AUTH_TOKEN = credentials.authToken,
		SESS_SECRET = credentials.sessionSecret;

// app initialization
var express = require("express");
var app = express();
var db  = require("./db");

// dependencies
var twilio = require("twilio");
var bodyParser = require('body-parser');
var session = require("express-session");
var cookieParser = require("cookie-parser");

app.get("/", function (req, res) {
	res.send("hello world");
});

app.get("/", function (req, res) {
	res.send("hello world");
});

var port = 4000;
app.listen(port, function () { console.log("Listening on port", port); });