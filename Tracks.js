"use strict";
    const fs = require('fs');
        const meta = require('musicmetadata');
        const Guid = require('./Guid.js');

module.exports = {
    Tracks: function () { },
    Track: function (key) {
    

        this.title;     //str
        this.artist;    // [str]
        this.albumartist;   // [str]
        this.album;     // str
        this.year;      // str 
        this.track = { no: null, of: null };
        this.genre; // [str]
        this.disk = { no: null, of: null };
        this._failed;
        this.Key = key;
        var _this = this;
        this.Fill = function (err, metadata) {
            if (err) {
                _this._failed = true; console.log(err);
                _this._callback({
                    title: '',
                    artist: '',    // [str]
                    albumartist: '',   // [str]
                    album: '',     // str
                    year: '',      // str 
                    track: {},
                    genre: '',
                    disk: {},
                });
            }
            _this._callback(metadata);
        }
        this.Init = function (callback) {
            _this._callback = callback;

            try {
                meta(fs.createReadStream(_this.Key), _this.Fill);
            } catch (err) {
                console.log('ERROR ON:', err);
            }

        }
        return this;
    },
    List: function (data) {
        const _this = this;
        this.List = data  ? data : {};
        this.Add = function (items, key) {
            if (Object.prototype.toString.call(items) !== '[object Array]') {
                items = [items];
            }
            for (var i = 0; i < items.length; i += 1) {
                if (this.List[items[i]] === undefined) {
                    this.List[items[i]] = [];
                }
                if (this.List[items[i]].indexOf(key) === -1) {
                    this.List[items[i]].push(key);
                }
            }

        }
        this.ToArray = function () {
            return Object.keys(this.List);
        }
        this.ToArrayWithKeys = function () {
            var result = [];
            for (var key in this.List) {
                result.push({ 'name': key, 'ids': this.List[key] });
            }
            return result;
        }

        return this;
    }
}