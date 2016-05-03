"use strict";
const Rx = require('rxjs/Rx');
const Express = require('express');
const express = Express();
const http = require('http').Server(express);
const io = require('socket.io')(http);
//const Player = require('./Player.js');
const App = require('./App.js');
const Collection = require('./Collection.js');
const CTRLS = require('./Enums.js').CTRLS;
const collection = new Collection();
const player = null;// new Player();
const app = new App(io, player, collection);

express.use(Express.static('public'));
http.listen(8080);

collection.Load();




io.on('connection', function (socket) {
    console.log('connection');

    socket.emit('playlist:load', {
        Playlist: collection.Playlist,
        Tracks : collection.GetSubset()
    });
    
    var searchQuery$ = Rx.Observable.fromEvent(socket, 'search:query');

    searchQuery$.subscribe(function (search) {
        console.log(search);
        if (search.length > 1) {
            socket.emit('search:result', { result: collection.Query(search) });
        }
    });

    var transportCtrl$ = Rx.Observable.fromEvent(socket, 'transport');
    var play$ = transportCtrl$.filter(e => e.type === CTRLS.PLAY);//.map(e => e.data);
    var pause$ = transportCtrl$.filter(e => e.type === CTRLS.PAUSE);//.map(e => e.data);
    var stop$ = transportCtrl$.filter(e => e.type === CTRLS.STOP);//.map(e => e.data);
    var stopAfter$ = transportCtrl$.filter(e => e.type === CTRLS.STOPAFTER);//.map(e => e.data);
    var shutdown$ = transportCtrl$.filter(e => e.type === CTRLS.SHUTDOWN);
    var playlistSync$ = Rx.Observable.fromEvent(socket, 'playlist:sync');

    play$.subscribe(app.Play);
    pause$.subscribe(app.Pause);
    stop$.subscribe(app.Stop);
    stopAfter$.subscribe(app.StopAfter);
    shutdown$.subscribe(e => console.log('Shutting Down'));
    playlistSync$.subscribe(app.PlaylistSync);
    
    app.OnConnection();

});
