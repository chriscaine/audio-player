var Playlist = function (element, view, tracks$) {
    var _view = view;
    var _this = this;
    this.El = element;
    this.Items = [];
    var that = this;

    const playlist$ = new Rx.Subject();
    const _nowPlaying$ = new Rx.Subject();
    var _audio = new AudioEngine(playlist$, tracks$, _nowPlaying$);
    playlist$.onNext(that.Items);
    this.Continue = true;
    this.Fill = function (playlist) {
        while (this.Items.length > 0) this.Items.pop();
        var max = playlist.length;
        for (var i = 0; i < max; i += 1) {
            this.Items.push(playlist[i]);
        }
    }


    this.NowPlaying = function (id) {
        that.El.find('li').removeClass('now-playing').each(function (i, item) {
            if ($(item).attr('data-id') === id) $(item).addClass('now-playing');
        });
    }
    _nowPlaying$.subscribe(that.NowPlaying, x => { }, x => { });

    this.Draw = function (tracks) {
        _this.El.empty();
        _this.Items.forEach(function (item, index) { 
            var trk = tracks[item];
            trk.index = index;
            _this.El.append(_view.Render(trk));
        });
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
        //      console.log(this, _this);
        playlist$.onNext(that.Items);
        socket.emit('playlist:sync', _this.Items);
    }
    this.Update = function () {
        // update playlist from view
        throw "Not Implimented";
    }
    this.Play = function (id) {
        _audio.Play(_this.Items.indexOf(id));
    }
    this.Next = function (id) {
        if (that.Continue) {
            var index = this.Items.indexOf(id);
            var nextItem = this.Items[index + 1];
            that.Play(nextItem);
        } else {
            _audio = null;
        }
    }
    this.Pause = function () {
        _audio.Pause();
    }
    this.StopAfter = function () {
        _audio.StopAfter();
//        that.Continue = false;
    }
}