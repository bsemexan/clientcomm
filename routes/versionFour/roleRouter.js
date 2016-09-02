

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../models/models");
const Alerts        = modelsImport.Alerts;
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const Convo         = modelsImport.Convo;
const Message       = modelsImport.Message;
const Communication = modelsImport.Communication;
const Organizations = modelsImport.Organizations;
const Departments   = modelsImport.Departments;


// Twilio library tools and secrets
var credentials     = require("../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("./utilities/errorHandling");
var error_500       = errorHandling.error_500;


// ROUTES
// General style notes:
// 1. camelCase throughout
// 2. new naming conventions to "generalize" and influence future database changes


// Standard checks for every role, no matter
router.use(function (req, res, next) {
  Alerts.findByUser(req.user.cmid)
  .then((alerts) => {
    res.locals.ALERTS_FEED = alerts;
    next();
  }).catch(error_500(res));
});

// Add organization
router.use(function (req, res, next) {
  Organizations.findByID(req.user.org)
  .then((org) => {
    res.locals.organization = org;
    next();
  }).catch(error_500(res));
});

// Add department
router.use(function (req, res, next) {
  Departments.findByID(req.user.department)
  .then((department) => {
    res.locals.department = department;
    next();
  }).catch(error_500(res));
});

// Reroute from standard drop endpoint
router.get("/", function (req, res) {
  if (["owner", "supervisor", "developer", "primary", "support"].indexOf(req.user.class) > -1) {
    res.redirect(`/v4/orgs/${req.user.org}/users/${req.user.cmid}/${req.user.class}`);
  } else {
    res.redirect("/404")
  }
});


// To do: Some sort of handling for the type of user
// Then direct to the appropriate sub-directory of routes

var owner = require("./roles/owner");
router.use("/users/:userID/owner", owner);

var supervisor = require("./roles/supervisor");
router.use("/users/:userID/supervisor", supervisor);

var primary = require("./roles/primary");
router.use("/users/:userID/primary", primary);

var alerts = require("./support/alerts");
router.use("/alerts", alerts);




// EXPORT ROUTER OBJECt
module.exports = router;


