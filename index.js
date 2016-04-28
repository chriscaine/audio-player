"use strict";
var Rx = require('rxjs/Rx');

var fs = require('fs');
var meta = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
http.listen(8080);



var DataCollection = require('data-collection');
var json;
var data;
try {
    json = fs.readFileSync('data/collection.json');
    data = JSON.parse(json);
} catch (e) {
    console.log(e);
}


var tracks = [];

for (var key in data.Tracks) {
    tracks.push(data.Tracks[key]);
}
var dc = new DataCollection(tracks);

function buildFilter(search) {
    var find = {};
    find[search[0] + '__icontains'] = search[1];
    return find;
}

var search = ['title', 'hello'];
console.log(buildFilter(search));
console.log(dc.query().filter(buildFilter(search)).values());


io.on('connection', function(socket) {
	console.log('connection');

 socket.on('searchquery', function (search) {
     console.log(search);
     if (search[1].length > 3) {
         socket.emit('searchresult', { result: dc.query().filter(buildFilter(search)).values() });
     }
 });

});
