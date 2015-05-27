/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $ */
module.exports = function (app) {
  "use strict";
  var eprint = {};
  eprint.redis = app.Redis.createClient();
  
  eprint.start = function () {
    eprint.timer = setInterval(eprint.getNext, 0);
  };
  eprint.getNext = function () {
    eprint.redis.lpop('msg:errors', function (err, msg) {
      if (!err && msg) {
        app.log.debug(msg);
      } else {
        clearInterval(eprint.timer);
        eprint.redis.end();
      }
    });
  };
  eprint.start();
  return eprint;
};