/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $, describe, after, it */
var assert = require("assert"),
  should = require('should'),
  App = require('../app/index.js');

describe('app', function () {
  "use strict";
  var app1 = new App({
    logLevel: 'debug',
//    redisConnect: 
  }),
    app2 = new App({
      logLevel: 'debug',
  //    redisConnect: 
    }),
    test;
/*  after(function () {
    server.stop();
  });*/
  it('should be created', function () {
    test = app1.should.be.ok;
  });
  it('should be have uniq nodeId', function () {
    app1.nodeId.should.not.equal(app2.nodeId);
  });
});