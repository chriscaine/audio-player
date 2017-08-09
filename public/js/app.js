var socket = io.connect(location.origin);
var View = function (template) {
    var template = $('#' + template).html();
    Mustache.parse(template);   // optional, speeds up future uses
    this.Render = function (model) {
        return Mustache.render(template, model);
    }
}

var trackItemView = new View('track');

var trackList$ = Rx.Observable.fromEvent(socket, 'track:response');


var tracks = new Tracks(trackItemView, trackList$);
var tracks$ = new Rx.Subject();



var playlist = new Playlist($('#playlist'), trackItemView, tracks$);
tracks$.onNext(tracks.Items);
var syncRequest$ = new Rx.Subject();
syncRequest$.throttle(2000).subscribe(playlist.Sync);

var searchRequest$ = Rx.Observable.fromEvent($('#txtSearch'), 'input')
        .map(function (e) { return e.target.value; })
        .filter(function (e) { return e.length > 2; })
        .debounce(800);


var allClickEvents$ = Rx.Observable.fromEvent(document.body, 'click').filter(Utilities.ByTag('button')).map(function (e) { return e.target.dataset; });

var transportCtrl$ = allClickEvents$.filter(Utilities.IsTransportCtrl);
transportCtrl$.subscribe(function (data) { socket.emit('transport', data); });
var play$ = transportCtrl$.filter(e => e.type === CTRLS.PLAY);//.map(e => e.data);
var pause$ = transportCtrl$.filter(e => e.type === CTRLS.PAUSE);//.map(e => e.data);
var stop$ = transportCtrl$.filter(e => e.type === CTRLS.STOP);//.map(e => e.data);
var stopAfter$ = transportCtrl$.filter(e => e.type === CTRLS.STOPAFTER);//.map(e => e.data);
var shutdown$ = transportCtrl$.filter(e => e.type === CTRLS.SHUTDOWN);
var syncfiles$ = transportCtrl$.filter(e => e.type === CTRLS.SYNC);

var requestTracks$ = new Rx.Subject();


/*
play$.subscribe(function (e) {
    console.log(e);
    playlist.Pause();
    playlist.Play(e.id);
});
pause$.subscribe(function (e) {
    console.log('pause');
    playlist.Pause();
});
stopAfter$.subscribe(function (e) {
    playlist.StopAfter(e.id);
});
*/
var removeItemClick$ = allClickEvents$.filter(Utilities.ByDataType(CTRLS.REMOVE));
removeItemClick$.subscribe(function (data) {
    playlist.Remove(data.id);
    playlist.Draw(tracks.Items);
    playlist.Sync();
});


var sortables = [];
$('ul.tracks').each(function (index, item) {
    var sortable = new Sortable(item, {
        group: {
            name: 'sortable',
            pull: 'clone',
            put: true,
	        handle : '.drag'
        }
    });
    sortables.push(sortable);
});

$('ul.playlist').each(function (index, item) {
    var sortable = new Sortable(item, {
        group: 'sortable',
        handle: '.drag',
        onAdd: function (evt) {
            var _playlist = [];
            var ids = evt.item.dataset.id;
            var arrIds = ids.split(',');
            var index = -1;

            if (arrIds.length > 1) {
                $('ul.playlist li').each(function (i, item) {
                    if (item.dataset.id === ids) {
                        index = i;
                    }
                });

                $(evt.item).remove();
                
                arrIds.forEach(function (item, i) {
                    var trk = tracks.Items[item];
                    console.log(trk);
                    if (trk) {
                        trk.class = 'track';
                        $('ul.playlist li').eq(index + i -1).after(trackItemView.Render(trk));
                    }
                });
            }
            $('ul.playlist li').each(function (index, item) {
                var ids = item.dataset.id.split(',');
                ids.forEach(function (id, i) {
                    _playlist.push(id);
                });
            });
            
            playlist.Fill(_playlist);
            playlist.Sync();
        },
        onUpdate: function () {
            var _playlist = [];
            $('ul.playlist li').each(function (index, item) {
                var ids = item.dataset.id.split(',');
                ids.forEach(function (id, i) {
                    _playlist.push(id);
                });
            });
       //     playlist.Draw(tracks);
            playlist.Fill(_playlist);
            syncRequest$.onNext(true);
        }
    });
    sortables.push(sortable);
});

searchRequest$.subscribe(function (value) {
  
    socket.emit('search:query', value);// ['title', value]);
});

socket.on('transport:now-playing', function (track) {
    if (track) {
        $('#now-playing-track').text(track.title + ' by ' + track.artist[0]);
        playlist.NowPlaying(track.id);
      //  play(track);
    }
});

socket.on('playlist:load', function (data) {
    console.info('pl:load');
    tracks.Fill(data.Tracks);
    playlist.Fill(data.Playlist);
    playlist.Draw(tracks.Items);
});

socket.on('search:result', function (data) {
    data.result.Albums.forEach(function (item, i) {
        item.ids.forEach(function (id, i) {
            requestTracks$.onNext(id);
        });
    });


    tracks.Draw($('#tracks'), data.result);
    tracks.FillFromArray(data.result);
});

socket.on('sync:message', function (message) {
    $('#message').text(message);
});
var timeEl = $('#time');
socket.on('progress', function(data) {
    timeEl.text(data.timemark.substring(3, 8));
  
});
function getTwoDigit(val) {
    if (val < 10) return '0' + val;
    return val;
}
socket.on('status', function (data) {
    if (data.track !== undefined) {
        var minutes = Math.floor(data.timeRemaining / 60);
        var seconds = getTwoDigit(Math.round(data.timeRemaining % 60));
        timeEl.text(' : ' + (minutes ? minutes + '\'' : '') + seconds + '"');
        playlist.NowPlaying(data.track.id);
        $('#now-playing-track').text(data.track.title + ' by ' + data.track.artist[0]);
    }
});


//trackList$ 

requestTracks$.subscribe(function (id) {
    socket.emit('track:request', id);    
});



