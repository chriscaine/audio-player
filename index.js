"use strict";
var Rx = require('rxjs/Rx');

var fs = require('fs');
var meta = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const Collection = require('./Collection.js');

const collection = new Collection();

collection.Load();

app.use(express.static('public'));
http.listen(8080);


io.on('connection', function(socket) {
	console.log('connection');

 socket.on('searchquery', function (search) {
     
     if (search.length > 2) {
         socket.emit('searchresult', { result: collection.Query(search) });
     }
 });

});
