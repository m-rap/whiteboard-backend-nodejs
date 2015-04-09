function roughSizeOfObject( object ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}


function RoomModel() {
	var path = require('path');
	this.rootDir = path.resolve(__dirname + '/data');
}
RoomModel.prototype.create = function(roomName) {
	try {
		var fs = require("fs");
		fs.mkdirSync(this.rootDir + '/' + roomName);
	} catch (e) {
	}
}
RoomModel.prototype.getVersion = function(roomName) {
	try {
		var fs = require("fs");
		var version = fs.readFileSync(this.rootDir + '/' + roomName + '/version');
		if (version == '')
			return 0;
		return parseInt(version);
	} catch (e) {
	}
	return 0;
}
RoomModel.prototype.save = function(roomName, data) {
	var version = this.getVersion(roomName);
	version++;
	try {
		var fs = require("fs");
		fs.writeFileSync(this.rootDir + '/' + roomName + '/' + version, JSON.stringify(data));
		fs.writeFileSync(this.rootDir + '/' + roomName + '/version', version);
		data = null;
		global.gc();
		return version;
	} catch (e) {
		data = null;
		global.gc();
		return version - 1;
	}
}
RoomModel.prototype.load = function(roomName, version, callback) {
	var currentVersion = this.getVersion(roomName);
	
	if (currentVersion == 0) {
		this.create(roomName);
	}
	
	if (currentVersion == version)
		return false;
	
	var clientVersion = parseInt(version);
	var data = {
		sheets: new Array(),
		version: clientVersion,
		isLast: false,
	};
	
	var path = this.rootDir + '/' + roomName;
	
	var i = clientVersion + 1;
	data.lastVersion = currentVersion;
	
	
	var realParseVer = function(temp) {
		//console.log('ver ' + i);
		
		if (i == currentVersion)
			nextVer();
		
		for (var j in temp) {
			var tempEl = temp[j];
			
			var sheetExists = false;
			
			if (typeof(data.sheets) != 'undefined') {
			
				for (var k in data.sheets) {
					var datum = data.sheets[k];
					if (datum.id == tempEl.id) {
						sheetExists = true;
						for (var l in tempEl.lines) {
							data.sheets[k].lines.push(tempEl.lines[l]);
						}
					}
				}
				
			}
			
			if (!sheetExists) {
				if (tempEl.lines instanceof Array) {
					data.sheets.push(tempEl);
				}
			}
		}
		
		nextVer();
	}
	
	var parseVer = function() {
		parseVer1();
		//parseVer2();
		//parseVer3();
	}
	
	var parseVer1 = function() {
		var fs = require("fs");
		fs.readFile(path + '/' + i, 'utf8', function(err, fileStr) {
			if (err != null) {
				console.log(err);
				nextVer();
				return;
			}
			
			var temp = JSON.parse(fileStr);
			
			if (typeof(temp.sheets) == 'undefined') {
				nextVer();
			}
			
			realParseVer(temp.sheets);
		});
	}
	
	var parseVer2 = function() {
		var fs = require("fs");
		var JSONStream = require('JSONStream');
		var es = require("event-stream");
		
		var stream = fs.createReadStream(path + '/' + i, {encoding: 'utf8'});
		stream.on('error', function(e) {
			console.log('problem reading ' + path + '/' + i); 
		});
		stream.on('readable', function() {
			var parser = JSONStream.parse('*');
			stream.pipe(parser).on('error', function(e) {
				console.log('problem parsing ' + path + '/' + i + ': ' + e);
			}).pipe(es.mapSync(function(temp) {
				realParseVer(temp);
			})).on('error', function(e) {
				console.log('problem parsing ' + path + '/' + i + ': ' + e);
				nextVer();
			});
		});
	}
	
	var parseVer3 = function() {
		var fs = require("fs");
		var stream = fs.createReadStream(path + '/' + i, {encoding: 'utf8'});
		var buf = '';
		stream.on('data', function(d) {
			buf += d.toString();
			//pump();
		});
		stream.on('end', function(d) {
		    var temp = JSON.parse(buf);
			
			if (typeof(temp.sheets) == 'undefined') {
				nextVer();
			}
			
			realParseVer(temp.sheets);
		});
		
		var pump = function() {
			var pos;

		    while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
		        if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
		            buf = buf.slice(1); // discard it
		            continue; // so that the next iteration will start with data
		        }
		        process(buf.slice(0,pos)); // hand off the line
		        buf = buf.slice(pos+1); // and slice the processed data off the buffer
		    }
		}
	}
	
	var nextVer = function() {
		i++;
		if (i == currentVersion || i % 50 == 0) {
			data.version = i;
			callback(data);
			data = null;
			global.gc();
			return;
		}
		parseVer();
	}
	
	parseVer();
}

module.exports.createRoomModel = function() {
	return new RoomModel();
}
