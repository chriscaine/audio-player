"use strict";
const Rx = require('rxjs/Rx');
const Obs = Rx.Observable;
const chromecastjs = require('chromecast-js')

const Cast = function(options) {
    var server = options.server;

    var browser = new chromecastjs.Browser()

    var startBrowser$ = new Rx.Subject();

    var browserReady$ = Rx.Observable.fromEvent(browser, 'deviceOn');

    var deviceReady$ = browserReady$.flatMap(function(x) { x.connect(); return Obs.fromEvent('connected'); });

    var play$ = new Rx.Subject();
    var pause$ = new Rx.Subject();
    var stop$ = new Rx.Subject();

    this.Play = function(e) {
        play$.onNext(e);
    }
    this.Pause = function(e) {
        pause$.onNext(e);
    }
    this.Stop = function(e) {
        stop$.onNext(e);
    }


    var playWhenReady$ = Obs.combineLatest(deviceReady$, play$);
    var pauseWhenReady$ = Obs.combineLatest(deviceReady$, pause$);
    var stopWhenReady$ = Obs.combineLatest(deviceReady$, stop$);

    playWhenReady$.subscribe(function(arr) {
        var device = arr[0];
        var track = arr [1];

        var url = server + '/audio' + track.file;
        var media = {

            // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
            contentId: url,
            contentType: 'audio/m4a',
            streamType: 'BUFFERED', // or LIVE

            // Title and cover displayed while buffering
            metadata: {
                type: 0,
                metadataType: 0,
                title: track.title, 
                images: [
                  { url: url }
                ]
            }        
        };;

        device.play(media, 0, function(){
            console.log('Playing in your chromecast!')
        });
    });

    pauseWhenReady$.subscribe(function(arr) {
        var device = arr[0];
        device.pause(function(){
            console.log('Paused!')
        });
    });

    stopWhenReady$.subscribe(function(arr) {
        var device = arr[0];
        device.stop(function(){
            console.log('Stoped!')
        });
    });

  
    return this;
}
module.exports = Cast;