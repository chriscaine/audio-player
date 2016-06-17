var View = function (template) {
    var template = $('#' + template).html();
    Mustache.parse(template);   // optional, speeds up future uses
    this.Render = function (model) {
        return Mustache.render(template, model);
    }
}

var trackItemView = new View('track');

var socket = io.connect('http://localhost:8080/');
var CTRLS = {
    PLAY: 'PLAY',
    PAUSE: 'PAUSE',
    STOP: 'STOP',
    STOPAFTER: 'STOPAFTER',
    REMOVE: 'REMOVE',
    SHUTDOWN: 'SHUTDOWN'
}

var Utilities = {
    ByTag: function ByTag(tag) {
        var _tag = tag;
        return function (e) {
            return e.target.tagName === tag.toUpperCase();
        }
    },
    ByDataType: function byDataType(type, not) {
        var _type = type;
        var invert = not === true;
        return function (data) {
            if (invert) {
                return !data.type === _type;
            } else {
                return data.type === _type;
            }
        }
    },
    IsTransportCtrl: function (data) {
        return data.type != undefined && data.type != 'REMOVE';
    }
}





var Playlist = function (element) {
    var _this = this;
    this.El = element;
    this.Items = [];
    this.Fill = function (playlist) {
        while (this.Items.length > 0) this.Items.pop();
        var max = playlist.length;
        for (var i = 0; i < max; i += 1) {
            this.Items.push(playlist[i]);
        }
    }
    this.NowPlaying = function (id) {
        this.El.find('li').removeClass('now-playing').each(function (i, item) {
            if ($(item).attr('data-id') === id) $(item).addClass('now-playing');
        });
    }

    this.Draw = function (tracks) {
        _this.El.empty();
        var max = _this.Items.length;
        for (var i = 0; i < max; i += 1) {
            // this.El.append(this.GetElement(tracks[this.Items[i]]));
            _this.El.append(trackItemView.Render(tracks[_this.Items[i]]));
        }
    }
    this.Remove = function (id) {
        if (id) {
            var index = _this.Items.indexOf(id);
            if (index > -1) {
                _this.Items.splice(index, 1);
            }
        } else {
            if (confirm('Are you sure you want to empty the playlist?')) {
                while (_this.Items.length) _this.Items.pop();
            }
        }
    }
    this.Sync = function () {
        console.log(this, _this);
        socket.emit('playlist:sync', _this.Items);
    }
    this.Update = function () {
        // update playlist from view
        throw "Not Implimented";
    }
}

var Tracks = function () {
    this.Items = {};
    this.Fill = function (data) {
        for (var key in data) {
            this.Items[key] = data[key];
        }
    }
    this.FillFromArray = function (arr) {
        var max = arr.length;
        for (var i = 0; i < max; i += 1) {
            this.Items[arr[i].id] = arr[i];
        }
    }
    this.GetElement = function (track) {
        return $('<li />', { 'data-id': track.id, 'class': 'sortable list-group-item' }).text(track.title);
    }
    this.Draw = function (element, result) {
        var max = result.length;
        element.empty();
        for (var i = 0; i < max; i += 1) {
            element.append(trackItemView.Render(result[i]));
        }
    }
};

var playlist = new Playlist($('#playlist'));
var tracks = new Tracks();

var syncRequest$ = new Rx.Subject();
syncRequest$.throttle(2000).subscribe(playlist.Sync);

var searchRequest$ = Rx.Observable.fromEvent($('#txtSearch'), 'input')
        .map(function (e) { return e.target.value; })
        .filter(function (e) { return e.length > 2; })
        .debounce(300);


var allClickEvents$ = Rx.Observable.fromEvent(document.body, 'click').filter(Utilities.ByTag('button')).map(function (e) { return e.target.dataset; });

var transport$ = allClickEvents$.filter(Utilities.IsTransportCtrl);

var removeItemClick$ = allClickEvents$.filter(Utilities.ByDataType(CTRLS.REMOVE));
removeItemClick$.subscribe(function (data) {
    playlist.Remove(data.id);
    playlist.Draw(tracks.Items);
    playlist.Sync();
});

transport$.subscribe(function (data) { console.log(data); socket.emit('transport', data); });

var sortables = [];
$('ul.tracks').each(function (index, item) {
    var sortable = new Sortable(item, {
        group: {
            name: 'sortable',
            pull: 'clone',
            put: false
        }
    });
    sortables.push(sortable);
});

$('ul.playlist').each(function (index, item) {
    var sortable = new Sortable(item, {
        group: 'sortable',
        //handle: '.drag-handle',
        onAdd: function (evt) {
            var _playlist = [];
            $('ul.playlist li').each(function (index, item) {
                _playlist.push(item.dataset.id);
            });

            playlist.Fill(_playlist);
            syncRequest$.onNext(true);
        },
        onUpdate: function () {
            var _playlist = [];
            $('ul.playlist li').each(function (index, item) {
                _playlist.push(item.dataset.id);
            });

            playlist.Fill(_playlist);
            syncRequest$.onNext(true);
        }
    });
    console.log(sortable);
    sortables.push(sortable);
});

searchRequest$.subscribe(function (value) {
    console.log(value);
    socket.emit('search:query', value);// ['title', value]);
});

socket.on('transport:now-playing', function (track) {
    if (track) {
        $('#now-playing').text(track.title + ' by ' + track.artist[0]);
        playlist.NowPlaying(track.id);
    }
});

socket.on('playlist:load', function (data) {
    tracks.Fill(data.Tracks);
    playlist.Fill(data.Playlist);
    playlist.Draw(tracks.Items);
});

socket.on('search:result', function (data) {
    tracks.Draw($('#tracks'), data.result);
    tracks.FillFromArray(data.result);
});
