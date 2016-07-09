"use strict";
const fs = require('fs');
const fsSync = require('fs-sync');

const Files = require('./Files.js');
const Track = require('./Tracks.js')['Track'];
const List = require('./Tracks.js')['List'];
const Collection = require('./Collection.js');

const config = JSON.parse(fs.readFileSync('config.json'));
const directory = config.dir;
const serverDir = config.server;


module.exports = function App(io, player, collection) {
    const _this = this;
    const _io = io;
    const _player = player;
    const _collection = collection;
    const _state = {updating : false}
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
        _io.emit('transport:now-playing', track);
        console.log('PLAYING: ', track.title);
        if (_player) _player.on('end', function () { console.log('track ends'); _this.Play(); });
        if (_player && track) _player.Play(track.file);

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
    this.OnConnection = function () {
        _io.emit('transport:now-playing', _collection.GetCurrent());
    }
    this.NetworkFilesSync = function () {

        /* UPDATE FILES IN LOCAL STORAGE FROM SERVER LOCATION
         * 1). Get new list of files
         *          a). Query new file location
         *          b). Create org and new file location table
         *          c). Check if new file location !exists create copy list
         * 2). Copy new files to local storage
         * 3). Create file list from copy table
         * 4). GEnerate new track details from file list.
         */

        var FileReference = function (file) {
            this.OriginalRef = file;
            this.ServerFile = file;
            this.LocalFile = file.replace(serverDir, directory);
            return this;
        }
        FileReference.prototype.Compare = function (fileToCompare) {
            return this.OriginalRef.toLower() === fileToCompare.toLower();//  this.RegExp.exec(fileToCompare) !== null;
        }
        FileReference.prototype.Copy = function () {
            fsSync.copy(this.ServerFile, this.LocalFile, {});
        }

        // 2).
        function CreateFileTable(files) {
            var table = [];
            var newFiles = [];
            files.forEach(function (item, index) {
                table.push(new FileReference(item));
            });
            table.forEach(function (item, index) {
                if (!_collection.TrackExists(item.LocalFile)) {
                    io.emit('sync:message', 'Copying: ' + item.ServerFile);
                    item.Copy();
                    newFiles.push(item.LocalFile);
                }
            });
            console.log('Get Track Data');
            Files.GetTrackData(_collection.Tracks, _collection.Update, function () {
                _collection.Save();
                _collection.UpdateIndex();
                _state.Updating = false;
            })(newFiles);
        }

        // 1).
        if (!_state.Updating) {
            _state.Updating = true;
            Files.GetFiles(serverDir, CreateFileTable, false);
        } else {
            io.emit('sync:message', 'System update in progress');
        }
    }
    return this;
}

