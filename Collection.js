"use strict";
module.exports = function Collection() {
    const fs = require('fs');
    const _this = this;
    const List = require('./Tracks.js')['List'];
    const DataCollection = require('data-collection');
    const playlistFile = 'data/current.json';
    const dataSets = {
        Tracks: null,
        Artists: null,
        Albums: null
    };
    var buildDataCollection = function () {
        var tracks = [];
        for (var key in _this.Tracks) {
            tracks.push(_this.Tracks[key]);
        }
        dataSets.Tracks = new DataCollection(tracks);
        dataSets.Albums = new DataCollection(_this.Albums.ToArrayWithKeys());
        dataSets.Artists = new DataCollection(_this.Artists.ToArrayWithKeys());
    }

    this.Tracks = {};
    this.Albums = new List();
    this.Artists = new List();
    this.Playlist = [];

    this.CurrentId = null;
    this.CurrentIndex = -1;
    this.Query = function (search) {
       
        if (dataSets.Tracks) {
            if (typeof search === "string") {
                return [dataSets.Albums.query().filter({ 'name__icontains': search }).values(),
                        dataSets.Artists.query().filter({ 'name__icontains': search }).values(),
                        dataSets.Tracks.query().filter({ 'title__icontains': search }).values()]
            } else {
                var searchObj = {};
                searchObj[search[0] + '__icontains'] = search[1];
                return [[],
                        [],
                     dataSets.Tracks.query().filter(searchObj).values()]
            }

        } else {
            throw "DataSets not filled";
        }
    }
    this.GetNext = function () {
        let index;
        if (this.CurrentId === null) {
            index = 0;
        } else {
            index = this.Playlist.indexOf(this.CurrentId);
            if (index === -1) index = 0;//this.CurrentIndex;
            index += 1;
        }
        return this.Playlist[index];
    }
    this.GetTrack = function (id) {
        let index = this.Playlist.indexOf(id);
        if (index > -1) {
            this.CurrentId = id;
            this.CurrentIndex = index;
        }
        return this.Tracks[id];
    }

    this.SyncPlaylist = function (playlist) {
        let max = playlist.length;
        while (this.Playlist.length) this.Playlist.pop();
        for (let i = 0; i < max; i += 1) {
            this.Playlist.push(playlist[i]);
        }
        this.SavePlaylist();
    }
    this.GetSubset = function (ids) {
        if (ids === undefined) ids = this.Playlist;
        var result = {};
        if (ids) {
            let max = ids.length;
            for (let i = 0; i < max; i += 1) {
                let id = ids[i];
                result[id] = this.Tracks[id];
            }
        }
        return result;
    }
    this.Load = function () {

        var collection;
        try {
            collection = JSON.parse(fs.readFileSync('data/collection.json'));
            console.log('TRACKS: LOADED');
        } catch (e) {
            console.log('ERROR: ', e);
            collection = { Albums: {}, Artists: {}, Tracks: {} }
        }

        function _extend(original, extend) {
            for (var key in extend) {
                original[key] = extend[key];
            }
        }

        _this.Albums = new List(collection.Albums.List);
        _this.Artists = new List(collection.Artists.List);
        _this.Tracks = collection.Tracks;

        buildDataCollection();
        try {
            let playlist = JSON.parse(fs.readFileSync(playlistFile));
            _this.SyncPlaylist(playlist.List);
            _this.CurrentId = playlist.Id;
            _this.CurrentIndex = playlist.Index;
            console.log('PLAYLIST: LOADED');
        } catch (e) {
            console.log('ERROR: ', e);
        }

    };
    this.Save = function () {
        try {
            fs.writeFileSync('data/collection.json', JSON.stringify(_this));
            console.log('SAVED: COLLECTION');
        } catch (e) {
            console.log(e);
        }
    };
    this.SavePlaylist = function () {
        try {
            fs.writeFileSync(playlistFile, JSON.stringify({ List: _this.Playlist, Id: _this.CurrentId, Index: 0 }));
            console.log('SAVED: PLAYLIST');
        } catch (e) {
            console.log(e);
        }
    }
    return this;
}