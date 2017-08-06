"use strict";

//const Collection = require('./collection.js');

//var collection = new Collection();
//collection.Load();



//console.log(collection.Query(['year', '1998']));


//console.log(buildFilter(search));
//console.log(dc.query().filter(buildFilter(search)).values());
//fs.writeFileSync('data/current.json', JSON.stringify({ List: [], Id: null, Index: 0 }));


const fs = require('fs');
var cors = require('cors');
const Cast = require('./Cast.js');

var collection = JSON.parse(fs.readFileSync('data/collection.json'));


var trk = collection.Tracks['f0303657-4290-44d8-954a-253e49b03cba'];
var cast = new Cast({});


const config = JSON.parse(fs.readFileSync('config.json'));

const Rx = require('rxjs/Rx');
const Express = require('express');
const express = Express();
const http = require('http').Server(express);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');


//express.use(Express.static('public'));


express.get('/audio/:id', cors(), function (req, res) {
    var trk = collection.Tracks[req.params.id];
    if (trk) {
        var fileParts = trk.file.split('.');
        var ext = fileParts[fileParts.length - 1];
        var file = config.dir + trk.file;
        var filestream = fs.createReadStream(file);
        res.setHeader('Content-disposition', 'inline; filename=' + trk.title);
        res.setHeader('Content-type', 'audio/' + ext);
        filestream.pipe(res);
    }
});
http.listen(8080);


cast.Play(trk);

//var player = require('chromecast-player')();
//var media = escape('http://localhost:8080/audio/c74e4b69-707f-49aa-a471-6e5468a386b9');
//console.log(media);
//player.launch(media, function (err, p) {
//    console.log(err);
//    p.once('playing', function () {
//        console.log('playback has started.');
//    });
//});

/*
playerState : 'IDLE',
idleReason: 'FINISHED'

m2ediaSessionId
playbackRate
playerState : 'PLAYING' / 'BUFFERING'
currentTime
supportedMediaCommands
volume : level : 1, muted : bool
activeTrackIds : []
media : contentId, contentType, duration
currentItemId :
items : [ obj ]
repeatMode : 'REPEAT_OFF'

*/