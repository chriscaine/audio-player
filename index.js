var Rx = require('rxjs/Rx');

var fs = require('fs');
var meta = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
http.listen(80);



var DataCollection = require('data-collection');
var json;
var data;
try {
    json = fs.readFileSync('data/collection.json');
    data = JSON.parse(json);
} catch (e) {
    console.log(e);
}
var dc = new DataCollection(tracks);

var tracks = [];

for (var key in data.Tracks) {
    tracks.push(data.Tracks[key]);
}


var find = {};
find['title__contains'] ='Hello';

console.log(dc.query().filter(find).values());



io.on('connection', function(socket) {
	console.log('connection');

 socket.on('searchquery', function (obj) {
    console.log(obj);



    socket.emit('searchresult', dc.query().filter(find).values());

	//.order(obj.orderBy[0], obj.orderBy[1])
 });

});