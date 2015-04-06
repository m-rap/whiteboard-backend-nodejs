function RoomModel() {
	var path = require('path');
	this.rootDir = path.resolve(__dirname + '../data');
	
	this.fs = require('fs');
}
RoomModel.prototype.create = function(roomName) {
	this.fs.mkdirSync(this.rootDir + '/' + roomName);
}
RoomModel.prototype.getVersion = function(roomName) {
	try {
		var version = this.fs.readFileSync(this.rootDir + '/' + roomName + '/version');
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
	this.fs.writeFileSync(this.rootDir + '/' + roomName + '/' + version, JSON.stringify(data));
	this.fs.writeFileSync(this.rootDir + '/' + roomName + '/version', version);
	return version;
}
RoomModel.prototype.load = function(roomName, version) {
	var currentVersion = this.getVersion(roomName);
	if (currentVersion == version)
		return false;
	
	var clientVersion = parseInt(version);
	var data = {
		'sheets': [
			{
				'id': 0,
				'lines': []
			},
		],
	};
	
	for (i = clientVersion + 1; i < currentVersion; i++) {
		var temp = JSON.parse(this.fs.readFileSync(this.rootDir + '/' + roomName + '/' + i));
		
		if (typeof(temp.sheets) == 'undefined')
			continue;
		
		for (j in temp.sheets) {
			var tempEl = temp.sheets[j];
			if (typeof(tempEl.id) == 'undefined' || typeof(tempEl.lines) == 'undefined')
				continue;
			
			for (k in data.sheets) {
				var datum = data.sheets[k];
				if (datum.id == tempEl.id) {
					for (l in tempEl.lines) {
						data.sheets[k].lines.push_back(tempEl.lines[l]);
					}
				}
			}
		}
		data.version = currentVersion;
		return data;
	}
}

module.exports.createRoomModel = function() {
	return new RoomModel();
}
