var socket  = require('socket.io-client').connect('http://localhost:8000');
var logger  = require('redis').createClient();
var argv    = require('optimist')
  .default('id', 0)
  .default('delay_ms', 5000)
  .argv;

var id = argv.id;
var intervalId;
socket.on('connect', function() {
  var sendMsg = function() {
    socket.emit('msg', { id: id, timestamp: (new Date()).getTime() });
  };
  sendMsg();
  intervalId = setInterval(sendMsg, 5000);
  socket.on('msg', function(msg) {
    var now = (new Date()).getTime();
    var delay = now - msg.timestamp;
    if (delay > argv.delay_ms) {
      logger.lpush('socketio:delays', 'on: ' + id + ' from: ' + msg.id + ' delay: ' + delay);
    }
  });
  socket.on('disconnect', function() {
    clearInterval(intervalId);
    logger.incr('socketio:client_disconnects', function() {
      process.exit();
    });
  });
});