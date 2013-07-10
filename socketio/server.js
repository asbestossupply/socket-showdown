var store   = require('socket.io/lib/stores/redis');

var io = require('socket.io').listen(8000);
io.set('store', new store({
  redis:        require('redis'),
  redisPub:     require('redis').createClient(),
  redisSub:     require('redis').createClient(),
  redisClient:  require('redis').createClient()
}));

var logger = require('redis').createClient();

io.sockets.on('connection', function (socket) {
  socket.on('msg', function (data) {
    console.log('PING');
    io.sockets.emit('msg', data);
  });
  socket.on('disconnect', function() {
    logger.incr('socketio:server_disconnects');
  });
});