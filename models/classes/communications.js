'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// TO DOS
// Check if arrays are indeed arrays and that they have length > 0


// Class
class Communications {
  static findById(id) {
    return new Promise((fulfill, reject) => {
      db("comms")
      .where("commid", id)
      .limit(1)
      .then(function (comms) {
        if (comms.length > 0) {
          fulfill(comms[0])
        } else {
          fulfill()
        }
      })
      .catch(reject)      
    })
  }
}

module.exports = Communications