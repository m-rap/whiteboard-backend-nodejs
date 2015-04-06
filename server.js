var fs = require('fs');
//var vm = require('vm');
//var includeInThisContext = function(path) {
//    console.log('including ' + path + '...');
//    var code = fs.readFileSync(path, 'utf8');
//    console.log(code);
//    eval(code);
//    //vm.runInThisContext(code, path)(exports, require, module, __filename, __dirname);
//}.bind(this);
//includeInThisContext(__dirname + '/model.js');

var io = require('socket.io').listen(1235);
console.log('instansiate roommodel');
var roomModel = require(__dirname + '/model.js').createRoomModel();

io.sockets.on('connection', function(socket) {
    socket.on('start', function(data) {
        console.log(data);
        socket.join(data.room);
        var initData = roomModel.load(data.room, 0);
        socket.emit('load', initData);
    });
    socket.on('add lines', function(data) {
		var version = roomModel.save(data.room, data.data);
		data.data.version = version;
		io.to(data.room).emit('load', data.data);
	});
});
