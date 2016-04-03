var fs = require('fs');

var text = fs.readFileSync('data/files.json');

var files = JSON.parse(text);

console.log(files.length);