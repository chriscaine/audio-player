"use strict";
const Rx = require('rxjs/Rx');
const Obs = Rx.Observable;
const chromecastjs = require('chromecast-js')

const Cast = function (config) {
    const _config = config;
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
          pause$.next(e);
    }
    this.Stop = function (e) {
          stop$.next(e);
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
    var pauseWhenReady$ = pause$.withLatestFrom(deviceReady$);
    var stopWhenReady$ = stop$.withLatestFrom(deviceReady$);
    var _device = null;
    playWhenReady$.subscribe(function (arr) {
        var device = arr[0];
        _device = device;
        var track = arr[1];
        console.log(track);
        var url = 'http://{0}:{1}/audio/{2}'.replace(/\{([0-9]{1,3})\}/g, (i, v) => [_config.ip, _config.port, track.id][parseInt(v)]);
        console.log(url);

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
        let device = _device;
        if (device && device.player) {
            if (device.player.media.currentSession.playerState === "PAUSED") {
                device.unpause(function () {
                    console.log('Un-Paused!')
                });
            } else {
                device.pause(function () {
                    console.log('Paused!')
                });
            }
        }
    });

    stopWhenReady$.subscribe(function (arr) {
        let device = _device;
        if (device && device.player) {
            device.stop(function () {
                console.log('Stopped!')
            });
        }
    });


    return this;
}
module.exports = Cast;