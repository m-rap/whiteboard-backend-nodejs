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

console.logCopy = console.log.bind(console);

console.log = function()
{
    if (arguments.length)
    {
        var args = Array.prototype.slice.call(arguments, 0);
        var timestamp = '[' + new Date().toUTCString() + '] ';
        args.unshift(timestamp);
        this.logCopy.apply(this, args);
    }
};

console.log('starting server.js');

var roomModel = require(__dirname + '/model.js').createRoomModel();
var io = require('socket.io')(process.env.PORT);
var clients = new Array();
var colors = ['black', 'blue', 'fuchsia', 'green',
              'maroon', 'navy', 'olive', 'orange', 'purple', 'red', 
              'teal'];
var curColor = 0;

io.sockets.on('connection', function(socket) {
    console.log('new client ' + socket.id + ', ip: ' + socket.request.connection.remoteAddress);
    var lastLoadVer = null;
    var room = null;
    var id = null;
    
    socket.on('disconnect', function() {
        console.log('client ' + socket.id + ((room != null) ? ' (' + room + ') ' : '') + ' has been disconnected');
        if (room != null && id != null) {
            clients[id] = null;
            io.to(room).emit('client disconnected', id);
        }
    });
    
    socket.on('start', function(data) {
        var emptySlot = false;
        var i = 0;
        for (i in clients) {
            if (clients[i] == null) {
                emptySlot = true;
                break;
            }
        }
        var clientInfo = null;
        if (emptySlot) {
            id = i;
            clients[i] = {id: i, color: colors[curColor], room: data.room};
        } else {
            id = clients.length;
            clients.push({id: clients.length, color: colors[curColor], room: data.room});
        }
        clientInfo = clients[id];
        curColor = (curColor + 1) % colors.length;
        
        socket.join(data.room);
        room = data.room;
        console.log('client ' + socket.id + ' has joined to ' + room + ' room');
        var clientsInRoom = new Array();
        for (i in clients) {
            if (clients[i] == null)
                continue;
            if (i != clientInfo.id && clients[i].room == room) {
                clientsInRoom.push(clients[i]);
            }
        }
        socket.emit('start', {clientInfo: clientInfo, clients: clientsInRoom});
        io.to(data.room).emit('new client', clientInfo);
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
                //console.log(data.room + ': ' + initData.lineCount + ', ' + initData.version + '/' + initData.lastVersion);
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
		io.to(data.room).emit('load', data.data);
		//data = null;
		//global.gc();
	});
	socket.on('chat message', function(m) {
	    if (room == null)
	        return;
	    io.to(room).emit('chat message', m);
	});
});
