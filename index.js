var Rx = require('rxjs/Rx');

var fs = require('fs');
var meta = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);



app.get('/api/collection/', function (req, res) {
    var data = fs.readFileSync('data/collection.json');

    var obj = JSON.parse(data);
    res.send(obj);


});


app.use(express.static('public'));


http.listen(8080);

