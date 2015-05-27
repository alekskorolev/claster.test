/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $ */
module.exports = function (app) {
  "use strict";
  var Master = {};
  Master.redis = app.Redis.createClient();
  
  Master.stop = function () {
    clearInterval(Master.generateTimer);
    app.log.debug('stop master ', app.nodeId);
    Master.redis.end();
  };
  
  Master.start = function () {
    Master.generateTimer = setInterval(Master.sendMsg, 500);
    app.log.debug('start master ', app.nodeId);
  };
  
  Master.sendMsg = function () {
    var msg = Master.getMessage();
    if (msg > 1000000) {
      Master.stop();
      app.voter.stop();
    }
    if ((msg % 1000) === 0) {
      app.log.debug(msg);
    }
    Master.redis.rpush('msg:source', msg);
  };
  
  Master.getMessage = function () {

    this.cnt = this.cnt || 0;

    return (this.cnt += 1);
    
  };
  return Master;
};