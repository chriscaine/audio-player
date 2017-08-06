"use strict";
const Rx = require('rxjs/Rx');
const Obs = Rx.Observable;
const chromecastjs = require('chromecast-js')

const Cast = function () {
    var browser = new chromecastjs.Browser();

    var startBrowser$ = new Rx.Subject();

    var browserReady$ = Rx.Observable.fromEvent(browser, 'deviceOn');

    var deviceReady$ = browserReady$.flatMap(function (device) {
        return Obs.create(function (observe) {
            device.connect();
            device.on('connected', function () { observe.next(device); });
        });
    }).share();
    var play$ = new Rx.Subject();
    var pause$ = new Rx.Subject();
    var stop$ = new Rx.Subject();

    this.Play = function (e) {
        play$.next(e);
    }
    this.Pause = function (e) {
        console.log('Pause : not implemented');
     //   pause$.next(e);
    }
    this.Stop = function (e) {
        console.log('Stop : not implemented');
        //    stop$.next(e);
    }

    this.events = {};
    this.on = function (name, fn) {
        var _this = this;
        _this.events[name] = fn;
    }
    this.off = function (name) {
        var _this = this;
        delete _this.events[name];
    }
    var _this = this;

    deviceReady$.subscribe(function (e) {
        console.log('device ready');
    });



    var status$ = deviceReady$.flatMap(function (device) {
        if (device && device.player) {
            return Obs.create(function (observe) {
                setInterval(function () {
                    device.getStatus(function (status) {
                        observe.next(status);
                    });
                }, 500);
            });
        }
    });

    var Status = function (arr) {
        var [deviceStatus, track] = arr;
        if (deviceStatus) {
            this.track = track
            this.timeRemaining = deviceStatus.media.duration - deviceStatus.currentTime;
            this.currentTime = deviceStatus.currentTime;
            this.status = deviceStatus.playerState;
            this.volume = deviceStatus.volume.level;
            this.muted = deviceStatus.volume.muted;
        } 
        return this;
    }
    Status.Init = x => new Status(x);

    status$.withLatestFrom(play$).map(Status.Init).subscribe(function (status) {
        if (status) {
            if (Math.floor(status.timeRemaining) === 0) { _this.events['end'](); }
            if (_this.events['status']) { _this.events['status'](status); }
        }
    });

    var playWhenReady$ = Obs.combineLatest(deviceReady$, play$);
    var pauseWhenReady$ = Obs.combineLatest(deviceReady$, pause$);
    var stopWhenReady$ = Obs.combineLatest(deviceReady$, stop$);

    playWhenReady$.subscribe(function (arr) {
        var device = arr[0];
        var track = arr[1];
        console.log(track);
        var url = 'http://192.168.1.107:8080/audio/' + track.id;

        var fileParts = track.file.split('.');
        var ext = fileParts[fileParts.length - 1];
        var media = {

            // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
            contentId: url,
            contentType: 'audio/' + ext,
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
        console.log(url);
        device.play(url, 0, function (e) {
            console.log('Playing in your chromecast!');
        });
    });

    pauseWhenReady$.subscribe(function (arr) {
        var device = arr[0];
        device.pause(function () {
            console.log('Paused!')
        });
    });

    stopWhenReady$.subscribe(function (arr) {
        var device = arr[0];
        device.stop(function () {
            console.log('Stopped!')
        });
    });


    return this;
}
module.exports = Cast;