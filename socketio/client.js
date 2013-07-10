socket = require('socket.io-client').connect('http://localhost:8000');
logger = require('redis').createClient();
var intervalId;
var id = process.env.id || 0;
socket.on('connect', function() {
  intervalId = setInterval(function() {
    console.log('PING');
    socket.emit('msg', { id: id, timestamp: (new Date()).getTime() });
  }, 5000);
  socket.on('msg', function(msg) {
    var now = (new Date()).getTime();
    var delay = now - msg.timestamp;
    logger.sadd('socketio:delays:' + id, 'from: ' + msg.id + ' delay: ' + delay);
  });
  socket.on('disconnect', function() {
    clearInterval(intervalId);
    logger.incr('socketio:client_disconnects', function() {
      process.exit();
    });
  });
});