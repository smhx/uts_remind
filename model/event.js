'use strict';

const driver = require('./driver');
const nodeSchedule = require('node-schedule');
const remind = require('../conversation/remind');
const chrono = require('chrono-node');

module.exports = {

    // TODO: Apostrophe's can screw up records!!!

    create: function (senderID, name) {
        // Each creator has at most one event
        const session = driver.session();
        return session
            .run(`MATCH (u:User) WHERE u.facebook_id=${senderID} CREATE (e:Event {name: '${name}', owner_id: ${senderID}, scheduled: false})-[:Reminds]->(u) RETURN e`)
            .then(() => {
                console.log("Created event in event!");
                session.close();
            })
            .catch((error) => {
                console.log("Error creating event", error);
                return new Promise((resolve, reject) => {
                    reject("A database error occured");
                });
            });
    },


    setDescription: function (senderID, description) {
        const session = driver.session();
        return session
            .run(`MATCH (e:Event) WHERE e.owner_id=${senderID} AND e.scheduled=false SET e.description='${description}' RETURN e`)
            .then(() => {
                console.log("set the description in event!");
                session.close();
            })
            .catch((error) => {
                console.log("Error adding description for event", error);
                return new Promise((resolve, reject) => {
                    reject("A database error occured");
                });
            });
    },

    setEventRemindTime: function (senderID, remindTime) {
        const session = driver.session();
        var chronoResults = chrono.parse(remindTime);

        return session
            .run(`MATCH (u:User) WHERE u.facebook_id=${senderID} RETURN u.timezone_offset AS timezoneOffset`)
            .then( (result) => {
                const timezoneOffset = result.records[0].get('timezoneOffset');
                chronoResults[0].start.assign('timezoneOffset', timezoneOffset);
                return chronoResults[0].start.date().toString();
            })
            .then((formattedTime) => {
                return session
                    .run(`MATCH (e:Event) WHERE e.owner_id=${senderID} AND e.scheduled=false SET e.remind_time='${formattedTime}' RETURN e`)
                    .then(() => {
                        console.log("Set the event remind time");
                        session.close();
                    })
                    .catch((error) => {
                        console.log("Error setting event remind time", error);
                        return new Promise( (resolve, reject) => {
                            reject("A database error occured");
                        });
                    })
            })
            .catch(() => {
                return new Promise((resolve, reject) => {
                    reject("A database error occured");
                });
            })
    },

    schedule: function (senderID) {
        const session = driver.session();

        session
            .run(`MATCH (e:Event)-[:Reminds]->(u:User) WHERE e.owner_id=${senderID} AND e.scheduled=false RETURN e.name AS eventName, e.description AS eventDescription, u.facebook_id AS userID, u.first_name AS firstName`)
            .then((result) => {
                var remindData = {
                    subscribers: []
                };

                result.records.forEach((q) => {
                    remindData.eventName = remindData.eventName || q.get('eventName');
                    remindData.eventDescription = remindData.eventDescription || q.get('eventDescription');
                    remindData.subscribers.push({
                        id: q.get('userID'),
                        first_name: q.get('firstName')
                    });
                })
                nodeSchedule.scheduleJob(remindData.remindTime, remind(remindData));
            })
            .catch(() => {
                reject("A database error occured");
            })
    },

}




