/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $ */
module.exports = function (app) {
  "use strict";
  var Voter = {};
  
  // коннект для подписки на сообщения
  Voter.subscriber = app.Redis.createClient();
  // коннект для отправки сообщений
  Voter.publisher = app.Redis.createClient();
  // при получении сообщения раскидываем в соотвтетствии с каналом
  Voter.subscriber.on("message", function (channel, message) {
    
    if (channel === 'master') { // контроль живости мастера
      Voter.check(message);
    } else if (channel === 'master.voting1') { // первый раунд голосования
      
      // Если нода масте а выборы начались, значит что-то идет не так
      // становимся не мастером
      if (Voter.isMaster) {
        Voter.stopMaster();
      } else {
        Voter.becomeMaster(message);
      }
    } else if (channel === 'master.voting2') { // второй раунд голосования
      Voter.becomeMaster2(message);
    }
  });
  Voter.time = function () {
    return 600 + Math.ceil(Math.random() * 200);
  };
  // запускаем проверку наличия мастера
  Voter.start = function () {
    Voter.subscriber.subscribe('master');
    Voter.checkTimeout = setTimeout(Voter.check, Voter.time() * 3);
  };
  // проверка наличия мастера
  Voter.check = function (voteMsg) {
    app.log.debug('voter check');
    // если это не запуск, сбрасываем таймер
    if (Voter.checkTimeout) {
      clearTimeout(Voter.checkTimeout);
      Voter.checkTimeout = null;
    }
    // если есть сообщение, значит мастер жив
    if (voteMsg) {
      app.log.debug('master is alive');
      // ставим таймер на следующую проверку
      Voter.checkTimeout = setTimeout(Voter.check, Voter.time() * 3);
    } else {
      // иначе запускаем начало голосования
      app.log.debug('subscribe level 1');
      Voter.subscriber.subscribe('master.voting1');
      Voter.becomeTimeout = setTimeout(Voter.becomeMaster, Voter.time());
    }
  };
  
  // Проводим выборы мастера
  Voter.becomeMaster = function (vote) {
    app.log.debug(vote);
    // если таймер первого вызова еще установлен - сбрасываем
    if (Voter.becomeTimeout) {
      clearTimeout(Voter.becomeTimeout);
      Voter.becomeTimeout = null;
    }
    
    // если функция вызвана с "голосом", чекаем "голос"
    if (vote) {
      vote = JSON.parse(vote);
      // если голос наш переходим на второй раунд голосования
      if (vote.id === app.nodeId) {
        Voter.subscriber.unsubscribe('master.voting1');
        Voter.subscriber.subscribe('master.voting2');
        Voter.becomeTimeout2 = setTimeout(Voter.becomeMaster2, Voter.time());
        app.log.debug('next level ', vote.id);
      // если не наш - выходим из голосования
      } else {
        app.log.debug('other node is master level 1 ', app.nodeId);
        Voter.subscriber.unsubscribe('master.voting1');
        Voter.checkTimeout = setTimeout(Voter.check, Voter.time() * 3);
      }
    // если функция вызвана без "голоса", отправляем свой "голос" 
    // для первого раунда голосования
    } else {
      app.log.debug('send vote level 1 ', app.nodeId);
      Voter.publisher.publish('master.voting1', JSON.stringify({
        id: app.nodeId
      }));
    }
  };
  Voter.becomeMaster2 = function (vote) {
    // если таймер первого вызова еще установлен - сбрасываем
    if (Voter.becomeTimeout2) {
      clearTimeout(Voter.becomeTimeout2);
      Voter.becomeTimeout2 = null;
    }
    if (vote) {
      vote = JSON.parse(vote);
      // если голос наш становимся мастером
      if (vote.id === app.nodeId) {
        // останавливаем клиента
        app.slave.stop();
        // запускаем мастера
        app.master.start();
        // запускаем сообщения что мастер жив
        Voter.startMaster();
        // устанавливаем признак что нода мастер
        Voter.isMaster = true;
        app.log.debug('i`m a master ', app.nodeId);
      // если не наш - выходим из голосования
      } else {
        app.log.debug('other node is master level 2 ', app.nodeId);
        Voter.subscriber.unsubscribe('master.voting2');
        Voter.checkTimeout = setTimeout(Voter.check, Voter.time() * 3);
      }
    // если функция вызвана без "голоса", отправляем свой "голос" 
    // для первого раунда голосования
    } else {
      Voter.publisher.publish('master.voting2', JSON.stringify({
        id: app.nodeId
      }));
    }
  };
  // запускаем оповещения что масте жив
  Voter.startMaster = function () {
    // отписываемся от оповещений
    Voter.subscriber.unsubscribe('master');
    // запускаем оповещения с интервалом
    Voter.masterMsgInterval = setInterval(function () {
      Voter.publisher.publish('master', 'alive');
    }, 600);
  };
  Voter.stopMaster = function () {
    Voter.isMaster = false;
    clearInterval(Voter.masterMsgInterval);
    // ждем 2 секунды и начинаем слушать мастера
    setTimeout(Voter.start, 2000);
  };
  Voter.stop = function () {
    clearInterval(Voter.masterMsgInterval);
    clearTimeout(Voter.checkTimeout);
    clearTimeout(Voter.becomeTimeout);
    clearTimeout(Voter.becomeTimeout2);
    Voter.subscriber.end();
    Voter.publisher.end();
  }
  return Voter;
};