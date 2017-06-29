var Playlist = function (element, view) {
    var _view = view;
    var _this = this;
    this.El = element;
    this.Items = [];
    var that = this;
    var _audio = null;
    this.Continue = true;
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
            _this.El.append(_view.Render(tracks[_this.Items[i]]));
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
        //      console.log(this, _this);
        socket.emit('playlist:sync', _this.Items);
    }
    this.Update = function () {
        // update playlist from view
        throw "Not Implimented";
    }
    this.Play = function (id) {
        var track = tracks.Items[id];
        that.Continue = true;

        if (track !== undefined) {
            if(_audio === null) {
                _audio = new Audio('/audio' + track.file);
                _audio.addEventListener('ended', e => that.Next(id));
            }

            _audio.play();
        }
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
        if (_audio) _audio.pause();
    }
    this.StopAfter = function () {
        that.Continue = false;
    }
}