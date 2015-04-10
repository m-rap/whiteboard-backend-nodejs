//console.log(process.env.PORT, process.env.IP);

//var fs = require('fs');
//var vm = require('vm');
//var includeInThisContext = function(path) {
//    console.log('including ' + path + '...');
//    var code = fs.readFileSync(path, 'utf8');
//    console.log(code);
//    eval(code);
//    //vm.runInThisContext(code, path)(exports, require, module, __filename, __dirname);
//}.bind(this);
//includeInThisContext(__dirname + '/model.js');

//var server = require("http").createServer(function(req, res) {
//    res.end("hello world!");
//}).listen(process.env.PORT, process.env.IP);
//var io = require('socket.io')(server);

console.log('starting server.js');

var roomModel = require(__dirname + '/model.js').createRoomModel();
var io = require('socket.io')(process.env.PORT);

io.sockets.on('connection', function(socket) {
    var lastLoadVer = null;
    socket.on('start', function(data) {
        console.log('new client connected');
        socket.join(data.room);
        socket.emit('start');
    });
    socket.on('load', function(data) {
        if (data.version == lastLoadVer)
            return;
        
        lastLoadVer = data.version;
        
        var loadLoop = function(version) {
            roomModel.load(data.room, version, function(initData) {
                if (!socket.connected) {
                    return;
                }
                socket.emit('load', initData);
                console.log(data.room + ': ' + initData.lineCount + ', ' + initData.version + '/' + initData.lastVersion);
                if (initData.version == initData.lastVersion)
                    console.log('load done');
                //initData = null;
                //global.gc();
            });
        }
        loadLoop(data.version);
    });
    socket.on('submit', function(data) {
		var version = roomModel.save(data.room, data.data);
		data.data.version = version;
		data.data.lastVersion = version;
		socket.emit('submitSuccess');
		io.to(data.room).emit('load', data.data);
		//data = null;
		//global.gc();
	});
});
