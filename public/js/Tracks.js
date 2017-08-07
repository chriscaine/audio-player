var Tracks = function (view, trackList$) {
    var _view = view;
    var _audio;
    this.Items = {};
    var _this = this;
    trackList$.subscribe(function (trk) {
        _this.Items[trk.id] = trk;
    });

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
        var max = result.Tracks.length;
        element.empty();
        var albums = result.Albums.map(x => { return { title : x.name, id : x.ids.join(','), isAlbum : true } });

        for (var i = 0; i < albums.length; i += 1) {
            albums[i].class = 'album';
            element.append(_view.Render(albums[i]));
        }

        for (var i = 0; i < max; i += 1) {
            result.Tracks[i].class = 'track';
            element.append(_view.Render(result.Tracks[i]));
        }
    }

};