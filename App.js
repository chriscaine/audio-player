"use strict";
module.exports = function App(io, player, collection) {
    const _io = io;
    const _player = player;
    const _collection = collection;
    this.Play = function (data) {
        let id;
        if (data && data.id) {
            id = data.id;
            if (_player) _player.Stop();
            // play selected
        } else {
            id = _collection.GetNext();
            // play next
        }
	let track = _collection.GetTrack(id);
			console.log('PLAYING: ', track.title);
     if(_player && track)  _player.Play(track.file);
     if (_player) _player.on('end', this.Play);
    }
    this.Pause = function (data) {
        if (_player) _player.Pause();
        console.log('pause');
    }
    this.Stop = function (data) {
        console.log('stop');
        if (_player) _player.off('end');
        if (_player) _player.Stop();
    }
    this.StopAfter = function (data) {
        console.log('stop after');
        if (_player) _player.off('end');
    }

    this.PlaylistSync = function (playlist) {
        _collection.SyncPlaylist(playlist);
      //  _io.emit('playlist:tracksubset', _collection.GetSubset());
    }

    return this;
}

