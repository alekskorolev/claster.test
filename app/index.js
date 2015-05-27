/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $ */
var Redis = require('redis'),
  Logger = require('logger'),
  utils = require('./utils')(),
  Voter = require('./voting'),
  Master = require('./master'),
  Slave = require('./slave'),
  eprint = require('./eprint'),
  argv = require('minimist')(process.argv.slice(2));
module.exports = function (options) {
  "use strict";
  
  // create application object
  var App = {};
  
  // set uniq node id
  App.nodeId = utils.hash();
  
  // add logger to application
  App.log = Logger.createLogger();
  App.log.setLevel(options.logLevel);
  
  // make redis connection
  App.Redis = Redis;
  
  if (argv._[0] === "getErrors") {
    
    eprint(App);
    
  } else {
    // start master voting
    App.voter = new Voter(App);

    App.slave = new Slave(App);
    App.master = new Master(App);

    App.slave.start();
    App.voter.start();
  }
  

  // return application object
  return App;
};