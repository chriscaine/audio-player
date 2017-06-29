var AudioEngine = function(playlist$, tracks$) {
    const _audioCtx = new AudioContext();
    const _playlist$ = playlist$;

    function load([index, playlist, tracks]) {
        var id = playlist.Items[index];
        var track = tracks.Items[id];
        console.log(index, playlist, tracks);

        var request = new XMLHttpRequest();
        request.open('GET', '/audio' + track.file, true);
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
                console.log(_track);
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
      
    }


    var playTrack$ = new Rx.Subject();
    var getNextTrack$ = new Rx.Subject();

    var scheduleTrack$ = Rx.Observable.merge(playTrack$, getNextTrack$).withLatestFrom(playlist$, tracks$).share();

    scheduleTrack$.subscribe(x => console.log(x));


    var scheduledTracks$ = scheduleTrack$.flatMap(load);
    var playNextTrack$ = new Rx.Subject();
    var zipped$ = Rx.Observable.zip(Rx.Observable.merge(playNextTrack$, playTrack$), scheduledTracks$).map(arr => arr[1]);

    zipped$.subscribe(function (track) {
        var fadeDur = 2;
        var currTime = _audioCtx.currentTime;
        console.log(track);
        var duration = track.source.buffer.duration;
        var startNewAt = currTime + duration - fadeDur;

        track.gain.gain.linearRampToValueAtTime(0, currTime);
        track.gain.gain.linearRampToValueAtTime(1, currTime + fadeDur);

        track.gain.gain.linearRampToValueAtTime(1, startNewAt);
        track.gain.gain.linearRampToValueAtTime(0, currTime + duration);
        
        track.gain.connect(_audioCtx.destination);

        track.source.start(0);

        getNextTrack$.onNext(track.index + 1);

        setTimeout(function () {
            playNextTrack$.onNext(true);
        }, (duration - fadeDur) * 1000);
    }, function () { }, function () { });
    


    this.Play = function (index) {
        console.log(index)
        playTrack$.onNext(index);
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