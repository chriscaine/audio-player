"use strict";
var Rx = require('rxjs/Rx');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const Collection = require('./Collection.js');

const collection = new Collection();

collection.Load();

app.use(express.static('public'));
http.listen(8080);

var CTRLS = {
    PLAY: 'PLAY',
    PAUSE:'PAUSE',
    STOP: 'STOP',
    STOPAFTER: 'STOPAFTER'
}

var App = function(io) {
    var _io = io;
    this.Play = function(data) {
        console.log(data);
        if(data.id) {
            // play selected
        } else {
            // play next
        }
    }
    this.Pause = function(data) {
        console.log(data);
    }
    this.Stop = function(data) {
        console.log(data);
    }
    this.StopAfter = function(data) {
        console.log(data);
    }

    this.PlaylistSync = function(playlist) {

        // collection.SyncPlaylist(playlist);
        //_io.emit('playlist:tracksubset', collection.GetSubset());
        _io.emit('playlist:tracksubset', playlist);
    }



    return this;
}

var app = new App(io);

    io.on('connection', function(socket) {
        console.log('connection');
 
        var searchQuery$ = Rx.Observable.fromEvent(socket, 'search:query');

        searchQuery$.subscribe(function (search) {
            if (search.length > 2) {
                socket.emit('search:result', { result: collection.Query(search) });
            }
        });
    
        var transportCtrl$ = Rx.Observable.fromEvent(socket, 'transport');
        var play$ = transportCtrl$.filter(e => e.type === CTRLS.PLAY).map(e => e.data);
        var pause$ = transportCtrl$.filter(e => e.type === CTRLS.PAUSE).map(e => e.data);
        var stop$ = transportCtrl$.filter(e => e.type === CTRLS.STOP).map(e => e.data);
        var stopAfter$ = transportCtrl$.filter(e => e.type === CTRLS.STOPAFTER).map(e => e.data);
      
        var playlistSync$ = Rx.Observable.fromEvent(socket, 'playlist:sync');
        
        play$.subscribe(app.Play);
        pause$.subscribe(app.Pause);
        stop$.subscribe(app.Stop);
        stopAfter$.subscribe(app.StopAfter);

        playlistSync$.subscribe(app.PlaylistSync);


    });
