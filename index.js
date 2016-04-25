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

console.log();




io.on('search', function (obj) {
    /*
        obj = {
	        attribute:
            value:
            orderBy : ['attr', reverse]
    
    { 'artist__contains': 'Dolly' }
         }
    */

    // GetQuery(obj)

    io.emit('search', dc.query().filter(function (obj) {
        return obj.attribue + '__contains';
    }).order(obj.orderBy[0], obj.orderBy[1]).values());
});