var spawn = require('child_process').spawn;
var path  = require('path');
var redis = require('redis').createClient();
var argv  = require('optimist')
  .usage('Usage: $0 --library=[socketio|engineio|sockjs] [--delay_ms=NUM] [--max_delays=NUM] [--max_disconnects=NUM] [--spawn_ms=[NUM]')
  .default('delay_ms', 5000)
  .default('max_delays', 10)
  .default('max_disconnects', 10)
  .default('spawn_ms', 50)
  .demand(['library'])
  .argv;

var children = [];
var teardown = function() {
  while(children.length) {
    var child = children.pop();
    child.kill();
  }
  process.exit();
};
process.on('uncaughtException', function(err) {
  console.error('error occurred, shutting down');
  teardown();
});

var disconnects_key = argv.library + ':client_disconnects';
var delays_key = argv.library + ':delays';
redis.del(disconnects_key);
redis.del(delays_key);

var client_path = path.join(path.dirname(process.argv[1]), argv.library, 'client.js');
var i = 0;
var spawnChild = function() {
  redis.get(disconnects_key, function(err, disconnects) {
    redis.llen(delays_key, function(err, delays) {
      var exit = false;
      if (disconnects && disconnects > argv.max_disconnects) {
        exit = true;
      }
      if (delays && delays > argv.max_delays) {
        exit = true;
      }
      if (exit) {
        console.info(i + 'clients spawned');
        console.info((disconnects || 0) + ' disconnects');
        console.info((delays || 0) + ' delays (of >' + argv.delay_ms + 'ms)');
        teardown();
        return;
      }
      i = i+1;
      var child = spawn('node', [client_path, '--id=' + i, '--delay_ms=' + argv.delay_ms]);
      children.push(child);
      setTimeout(spawnChild, argv.spawn_ms);
    });
  });
};

spawnChild();