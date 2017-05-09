'use strict';
// node modules
const path = require('path');
const express = require('express');
// const logger = require('morgan');
const bodyParser = require('body-parser');
const request = require('request');
const schedule = require('node-schedule');
const crypto = require('crypto');


const facebook = require('./facebook');

// routers
const index = require('./routes/index');
const webhook = require('./routes/webhook');
const authorize = require('./routes/authorize');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(bodyParser.json({ verify: facebook.verification.verifyRequestSignature }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// using the routeres

app.use('/', index);
// app.use('/webhook', webhook);

// TESTING
var conversation = require('./conversation');

app.get('/', function (req, res) {
    console.log("GET call to webhook");
    if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

app.post('/', function (req, res) {
    console.log("POST call to webhook");

    var data = req.body;

    if (data.object === 'page') {
        data.entry.forEach(function (messagingEvent) {
            conversation.respond(messagingEvent);
        });
        res.sendStatus(200);
    }
});
// END TESTING

app.use('/authorize', authorize);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
