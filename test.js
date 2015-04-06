var path = require('path');
var fs = require('fs');
var rootDir = path.resolve(__dirname, '../data');
//fs.readFile(rootDir + '/version', function(err, data) {
//	console.log('err');
//	console.log(err);
//	console.log('data');
//	console.log(data);
//});
fs.writeFileSync(rootDir + '/version', JSON.stringify({a: 123, b: 234}));
