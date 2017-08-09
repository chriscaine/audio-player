"use strict";

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

const Rx = require('rxjs/Rx');
const Express = require('express');
const express = Express();
const http = require('http').Server(express);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');

const App = require('./App.js');
const Collection = require('./Collection.js');
const CTRLS = require('./Enums.js').CTRLS;
const collection = new Collection();
const cors = require('cors');

var player = null; 
if (config.live) {
    var Player = require('./Player.js');
    player = new Player();
} else {
    var Cast = require('./Cast.js');
    player = new Cast(config);
}

const app = new App(io, player, collection);

express.use(Express.static('public'));

//express.use('/audio', serveStatic(config.dir));

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

collection.Load();


io.on('connection', function (socket) {
    console.log('connection');

    socket.emit('playlist:load', {
        Playlist: collection.Playlist,
        Tracks : collection.GetSubset()
    });
    
    var searchQuery$ = Rx.Observable.fromEvent(socket, 'search:query');

    var requestTrack$ = Rx.Observable.fromEvent(socket, 'track:request');

    searchQuery$.subscribe(function (search) {
        console.log(search);
        if (search.length > 1) {
            socket.emit('search:result', { result: collection.Query(search) });
        }
    });

    requestTrack$.subscribe(function (id) {
        console.log(id);
        socket.emit('track:response',  collection.Tracks[id] );
    });

    var transportCtrl$ = Rx.Observable.fromEvent(socket, 'transport');
    var play$ = transportCtrl$.filter(e => e.type === CTRLS.PLAY);//.map(e => e.data);
    var pause$ = transportCtrl$.filter(e => e.type === CTRLS.PAUSE);//.map(e => e.data);
    var stop$ = transportCtrl$.filter(e => e.type === CTRLS.STOP);//.map(e => e.data);
    var stopAfter$ = transportCtrl$.filter(e => e.type === CTRLS.STOPAFTER);//.map(e => e.data);
    var shutdown$ = transportCtrl$.filter(e => e.type === CTRLS.SHUTDOWN);
    var syncfiles$ = transportCtrl$.filter(e => e.type === CTRLS.SYNC);
    var playlistSync$ = Rx.Observable.fromEvent(socket, 'playlist:sync');

    play$.subscribe(app.Play);
    pause$.subscribe(app.Pause);
    stop$.subscribe(app.Stop);
    stopAfter$.subscribe(app.StopAfter);
    shutdown$.subscribe(e => console.log('Shutting Down'));
    playlistSync$.subscribe(app.PlaylistSync);
    syncfiles$.subscribe(app.NetworkFilesSync);
    
    app.OnConnection();

});
