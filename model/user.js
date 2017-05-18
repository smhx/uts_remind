'use strict';
var driver = require('./driver');


module.exports = 
{
    createNewUser : (id, success, failure) => {
        console.log("constructor for user with id " + id);
        const session = driver.session();

        return session
            .run(`CREATE (n:User {facebook_id: ${id}, input_state: 'DEFAULT') RETURN n.id`)
            .then( (result) => {
                console.log("successfully created user");
                session.close();
            })
            .catch( () => {
                return new Promise( (resolve, reject) => {
                    reject("A database error occured");
                } );
            });
    },

    setName : (id, name) => {
        console.log("in name");
        const session = driver.session();
        return session
            .run(`MATCH (p:User) WHERE p.facebook_id=${id} SET p.name='${name}' RETURN p`)
            .then( () => {
                session.close();
            })
            .catch( () => {
               return new Promise( (resolve, reject) => {
                    reject("A database error occured");
               });
            });
    },

    futureEvents : (id) => {
        var futureEvents = [];
        return;
        // session 
        //     .run("match all events that remind user with id")
        //     .then(function (result) {
                
        //     })
        //     .catch(function (error) {
        //         return false;
        //     });
       // You might have to do this twice. For groups right?
    },

    getInputState : (id) => {
        const session = driver.session();
        return session
            .run(`MATCH (p:User) WHERE p.facebook_id=${id} RETURN p.input_state AS inputState`)
            .then( (result) => {
                session.close();
                return result.record[0].get('inputState');
            })
            .catch( () => {
                return new Promise( (resolve) => {
                    resolve("DEFAULT");
                });
            });
    },

    setInputState : function(id, state) {
        const session = driver.session();
        return session
            .run(`MATCH (p:User) WHERE p.facebook_id=${id} SET p.input_state='${state}' RETURN p`)
            .then( () => {
                session.close();
            })
            .catch( () => {
                return new Promise( (resolve, reject) => {
                    reject("A database error occured");
                } );
            });
    }
}