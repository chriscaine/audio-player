
module.exports = {
    Tracks: function () { },
    Track:  function (key) {
        var fs = require('fs');
        var meta = require('musicmetadata');

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
            if (err) { _this._failed = true; console.log(err); return; }
         //   for (var key in _this) {
           //     if (metadata[key]) { _this[key] = metadata[key]; }
          //  }
            //_this._file.dispose();
           // console.log(_this.title);
            _this._callback(metadata);
        }
        this.Init = function (callback) {
            _this._callback = callback;
            _this._file = fs.createReadStream(_this.Key);
            try {
                meta(_this._file, _this.Fill);
            } catch (e) {
                console.log('ERROR ON:');
                console.log(_this._file);
                console.log(err);
            }
            
        }
        return this;
    },
    List: function (data) {
        this.List = data ? data : {};
        this.Add = function (items, file) {
            if (Object.prototype.toString.call(items) === '[object Array]') {
                if (items) {
                    for (var i = 0; i < items.length; i += 1) {
                        if (this.List[items[i]] === undefined) {
                            this.List[items[i]] = [];
                        }
                        if(this.List[items[i]].indexOf(file) === -1){
                            this.List[items[i]].push(file);
                        }
                    }
                }
            } else {
                this.List[items] = items;
            }
        }
        this.ToArray = function () {
            return Object.keys(this.List);
        }
        var _this = this;
        return this;
    }
}