/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $ */
module.exports = function (app) {
  "use strict";
  var Slave = {};
  Slave.redis = app.Redis.createClient();
  
  Slave.stop = function () {
    clearInterval(Slave.watchTimer);
    app.log.debug('stop slave ', app.nodeId);
    Slave.redis.end();
  };
  Slave.timer = 256;
  Slave.newTimer = 256;
  Slave.start = function () {
    Slave.watchTimer = setInterval(Slave.fetchMsg, Slave.timer);
    app.log.debug('start slave ', app.nodeId);
  };
  Slave.fetchMsg = function () {
    Slave.redis.lpop('msg:source', function (err, result) {
      if (!err && result) {
        Slave.newTimer = Slave.newTimer / 2;
        if (Slave.newTimer === 2) {
          Slave.newTimer = 4;
        }
        if (Slave.timer / Slave.newTimer === 8) {
          Slave.timer = Slave.newTimer;
          clearInterval(Slave.watchTimer);
          Slave.watchTimer = setInterval(Slave.fetchMsg, Slave.timer);
        }
        
        Slave.eventHandler(result, Slave.compliteHandler);
      } else {
        Slave.newTimer = Slave.newTimer * 2;
        if (Slave.newTimer === 4096) {
          Slave.newTimer = 2048;
        }
        if (Slave.newTimer / Slave.timer === 8) {
          Slave.timer = Slave.newTimer;
          clearInterval(Slave.watchTimer);
          Slave.watchTimer = setInterval(Slave.fetchMsg, Slave.timer);
        }
      }
    });
  };
  Slave.compliteHandler = function (error, msg) {
    if (error) {
      Slave.redis.rpush('msg:errors', msg);
    } else {
      app.log.debug(msg);
    }
  };
  Slave.eventHandler = function (msg, callback) {

    function onComplete() {
      var error = Math.random() > 0.85;

      callback(error, msg);
    }

    // processing takes time...

    setTimeout(onComplete, Math.floor(Math.random() * 1000));
  };
  return Slave;
};