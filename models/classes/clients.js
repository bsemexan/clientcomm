'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


const CommConns = require("./commConns");
const Users     = require("./users");


// Class
class Clients {

  static findByDepartment (departmentID, activeStatus) {
    if (typeof activeStatus == "undefined") activeStatus = true;
    return new Promise((fulfill, reject) => {
      Users.findByDepartment(departmentID, activeStatus)
      .then((users) => {
        const userIDs = users.map(function (user) { return user.cmid; });
        return Clients.findByUsers(userIDs, activeStatus)
      }).then((clients) => {
        fulfill(clients);
      }).catch(reject);
    });
  }

  static findByManager (userIDs, active) {
    // findByManager deprecated, use findByUsers
    console.log("Warning! Clients method findByManager() deprecated, use findByUsers()");
    if (!Array.isArray(userIDs)) userIDs = [userIDs];
    return new Promise((fulfill, reject) => {
      Clients.findAllByUsers(userIDs, active)
      .then((clients) => {
        fulfill(clients);
      }).catch(reject);
    });
  }

  static findAllByUser (userIDs) {
    console.log("Warning! Clients method findAllByUser() deprecated, use findAllByUsers()");
    if (!Array.isArray(userIDs)) userIDs = [userIDs];
    return new Promise((fulfill, reject) => {
      Clients.findAllByUsers(userIDs)
      .then((clients) => {
        fulfill(clients);
      }).catch(reject);
    });
  }

  static findAllByUsers (userIDs) {
    if (!Array.isArray(userIDs)) userIDs = [userIDs];
    return new Promise((fulfill, reject) => {
      var clientsOpen;
      Clients.findByUsers(userIDs, true)
      .then((clients) => {
        clientsOpen = clients;
        return Clients.findByUsers(userIDs, false)
      }).then((clientsClosed) => {
        fulfill(clientsOpen.concat(clientsClosed));
      }).catch(reject);
    });
  }

  static findByUser (userIDs, active) {
    console.log("Warning! Clients method findAllByUser() deprecated, use findByUsers()");
    return new Promise((fulfill, reject) => {
      Clients.findByUsers(userIDs, active)
      .then((clients) => {
        fulfill(clients);
      }).catch(reject);
    });
  }

  static findByUsers (userIDs, active) {
    if (typeof active == "undefined") active = true;
    if (!Array.isArray(userIDs)) userIDs = [userIDs];

    return new Promise((fulfill, reject) => {
      var finalClientsObject;

      db("clients")
        .select("clients.*", 
                "cms.cmid as user_id",
                "cms.first as user_first",
                "cms.middle as user_middle",
                "cms.last as user_last",
                "color_tags.color as color_tag", 
                "color_tags.name as color_name")

        // Join with color tag table
        .leftJoin(
          db("color_tags")
            .where("active", true)
            .as("color_tags"),
          "color_tags.color_tag_id", "clients.color_tag")

        .leftJoin("cms", "clients.cm", "cms.cmid")

        // Only where active T/F and case manager matches
        .whereIn("clients.cm", userIDs)
        .andWhere("clients.active", active)
        .orderBy(
          db.raw("upper(left(clients.last, 1)), (substring(clients.last from 2) || '')::varchar"), 
          "asc")
      .then(function (clients) {

        // Need to make sure there is a default color_tag color
        finalClientsObject = clients.map(function (client) {
          if (!client.color_tag) client.color_tag = "#898989";
          if (!client.color_tag) client.color_name = "None";
          return client;
        });

        // Get unread messages and add them to client list
        return Clients.getUnreadMessages(userIDs)
      }).then((unreads) => {
        finalClientsObject = finalClientsObject.map(function (client) {
          client.unread = 0;
          unreads.forEach(function (unread) {
            if (unread.client == client.clid) client.unread = Number(unread.unread);
          });
          return client;
        });

        // Now get all clientIDs to get Comm. Connections
        var clientIDs = finalClientsObject.map(function (client) {
          return client.clid
        });

        return CommConns.findByClientIDs(clientIDs)
      }).then((commconns) => {
        // Add each communication method to relevant client
        finalClientsObject = finalClientsObject.map(function (client) {
          client.communications = [];
          commconns.forEach(function (commconn) {
            if (client.clid == commconn.client) {
             client.communications.push(commconn) 
            }
          });
          return client;
        });
        fulfill(finalClientsObject);
      }).catch(reject);
    });
  }

  static getUnreadMessages (userIDs) {
    if (!Array.isArray(userIDs)) userIDs = [userIDs];
    return new Promise((fulfill, reject) => {
      db("msgs")
        .select(db.raw("count(msgs.read) as unread, client"))
        .leftJoin("convos", "convos.convid", "msgs.convo")
        .whereIn("convos.cm", userIDs)
        .andWhere("msgs.read", false)
        .groupBy("convos.client")
      .then(function (unreads) {
        fulfill(unreads)
      }).catch(reject);
    })
  }
  
}

module.exports = Clients


