'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;

// Models
const Messages = require("./messages");


// Class
class Organizations {
  
  static findByID (orgID) {
    return new Promise((fulfill, reject) => {
      db("orgs")
        .where("orgid", orgID)
        .limit(1)
      .then((orgs) => {
        return fulfill(orgs[0]);
      }).catch(reject);
    });
  }

}

module.exports = Organizations;