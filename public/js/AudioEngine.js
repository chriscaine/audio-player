var AudioEngine = function (playlist$, tracks$, nowPlaying$) {
    const _audioCtx = new AudioContext();

    const _nowPlaying$ = nowPlaying$;
    //const stateEvt$ = Rx.Observable.fromEvent(_audioCtx, 'statechange');
    //const completeEvt$ = Rx.Observable.fromEvent(_audioCtx, 'complete');
    //const endedEvt$ = Rx.Observable.fromEvent(_audioCtx, 'ended');
    //const messageEvt$ = Rx.Observable.fromEvent(_audioCtx, 'message');
    //const loadedEvt$ = Rx.Observable.fromEvent(_audioCtx, 'loaded');
    //const audioProcessEvt$ = Rx.Observable.fromEvent(_audioCtx, 'audioprocess');
    //const nodeCreateEvt$ = Rx.Observable.fromEvent(_audioCtx, 'nodecreate');

    //Rx.Observable.merge(stateEvt$, completeEvt$, endedEvt$, messageEvt$, loadedEvt$, audioProcessEvt$, nodeCreateEvt$).subscribe(x => console.log(x));

    function pair(arr, item) {
        if (arr.length > 1) arr.shift();
        arr.push(item);
        return arr;
    }

    const _playlist$ = playlist$;

    function load([item, playlist, tracks]) {
        var index;
        var id;
        if (typeof item == 'object') {
            let _tempIndex = playlist.indexOf(item.id);

            if (_tempIndex === -1) index = item.index;
            else index = _tempIndex + 1;
        } else {
            index = item;/////
        }

        id = playlist[index];


        var track = tracks[id];
        var request = new XMLHttpRequest();
        if (track) {
            request.open('GET', '/audio/' + track.id, true);
            request.responseType = 'arraybuffer';
            request.send();

            return Rx.Observable.create(function (observer) {
                var _track = track;
                request.onload = function () {
                    _track.index = index;
                    _track.source = _audioCtx.createBufferSource();
                    _track.gain = _audioCtx.createGain();
                    _track.source.connect(_track.gain);
                    _track.gain.connect(_audioCtx.destination);

                    // create function to add fade in the play section
                    _audioCtx.decodeAudioData(request.response, function (buffer) {
                        _track.source.buffer = buffer;
                        observer.onNext(_track);
                        observer.onCompleted();
                    });
                }
                request.onerror = function () {
                    observer.onError();
                }
                return function () { };
            });
        } else {
            return Rx.Observable.empty();
        }
    }


    var playTrack$ = new Rx.Subject();
    var getNextTrack$ = new Rx.Subject();
    var playState$ = new Rx.Subject();
    var pauseTrack$ = new Rx.Subject();

    var scheduleTrack$ = Rx.Observable.merge(playTrack$, getNextTrack$).withLatestFrom(playlist$, tracks$).share();

   // scheduleTrack$.subscribe(x => console.log(x));


    var scheduledTracks$ = scheduleTrack$.flatMap(load).share();
    var playNextTrack$ = new Rx.Subject();
    var zipped$ = Rx.Observable.zip(Rx.Observable.merge(playNextTrack$, playTrack$), scheduledTracks$).map(arr => arr[1]);

    zipped$.withLatestFrom(playState$).subscribe(function ([track, state]) {
        if (!state) return;
        var fadeDur = 2;
        var currTime = _audioCtx.currentTime;
        console.log('track', track.title);
        var duration =  track.source.buffer.duration;;
        var startNewAt = currTime + duration - fadeDur;

        track.gain.gain.linearRampToValueAtTime(0, currTime);
        track.gain.gain.linearRampToValueAtTime(1, currTime + fadeDur);

        track.gain.gain.linearRampToValueAtTime(1, startNewAt);
        track.gain.gain.linearRampToValueAtTime(0, currTime + duration);

        track.gain.connect(_audioCtx.destination);

        track.source.start(0);
        _nowPlaying$.onNext(track.id);

        setTimeout(function () { getNextTrack$.onNext(track); }, (duration - 10) * 1000);
        setTimeout(function () { playNextTrack$.onNext(true); }, (duration - fadeDur) * 1000);


    }, function () { }, function () { });

    pauseTrack$.withLatestFrom(scheduledTracks$.scan(pair, [])).subscribe(function ([pause, tracks]) {
        playState$.onNext(true);
        tracks.forEach((item, i) => { try { item.source.stop(); } catch (e) { } });
    });

    this.Play = function (index) {
        playState$.onNext(true);
        playTrack$.onNext(index);
    }
    this.Pause = function () {
        pauseTrack$.onNext();
    }

    this.StopAfter = function () {
        playState$.onNext(false);
    }
    /* 
        Start playlist at position

            1) fetch track
            2) load track
            3) schedule track

            4) play track
            5) fetch next track
            6) load next track
            7) on ending ( event based on timing or ended event)
                goto 4....
     */




}