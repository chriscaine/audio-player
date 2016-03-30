var Rx = require('rxjs/Rx');
var directory = "\\\\Robert\\Public\\My Music\\Music";

var fs = require('fs');
var meta = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.get('/', function (req, res) {
    res.sendFile('index.html');
});
app.get('/js/app.js', function (req, res) {
    res.sendFile('js/app.js');
});

http.listen(8080);



var List = function () {
    this.List = {};
    this.Add = function (items) {
        if (Object.prototype.toString.call(items) === '[object Array]') {
            if (items) {
                for (var i = 0; i < items.length; i += 1) {
                    this.List[items[i]] = items[i];
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

var Collection = {
    Tracks : {},
    Albums : new List(),
    Artists : new List()
}



var Track = function (key) {
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
        if (err) { _this._failed = true; return; }
        for (var key in metadata) {
            if(key !== 'picture') _this[key] = metadata[key];
        }
        //_this._file.dispose();
        io.emit('data', _this.title);
        Collection.Artists.Add(metadata.artist);
        Collection.Artists.Add(metadata.albumartist);
        Collection.Albums.Add(metadata.album);
        _this._callback();
    }
    this.Init = function (callback) {
        _this._callback = callback;
        _this._file = fs.createReadStream(_this.Key);
        meta(_this._file, _this.Fill);
    }
    return this;
}

var Files = function (rootDir, callback) {
    var files = [];

    function isMusicTrack(file) {
        return /\.(mp3|m4a|m4p)$/i.exec(file) !== null;
    }

    function getChildDirectory(dir) {
        fs.readdir(dir, function (err, items) {
            if (err) return;
            for (var i = 0; i < items.length; i += 1) {
                var trk = new Track(dir + '\\' + items[i]);
                if (fs.statSync(trk.Key).isDirectory()) {
                    getChildDirectory(trk.Key);
                } else {
                    if (isMusicTrack(trk.Key)) {
                        files.push(trk.Key);
                    }
                }
            }
        });
    }
    setTimeout(function () {
        getChildDirectory(directory, true);
        callback(files);
    }, 0);
}


//app.use(express.static('public'));

//var timer$ = Rx.Observable.timer(0, 100);

var tracks = JSON.parse(fs.readFileSync('files.json'));

var next = 0;

var nextFile = function () {
    setTimeout(function (obj) {
        //console.log(files);
        //fs.writeFile('files.json', JSON.stringify(files));
        if (tracks[next]) {
            var file = tracks[next];
            var trk = new Track(file);
            console.log(trk.Key);
            trk.Init(function () {
                nextFile();
            });
            Collection.Tracks[trk.Key] = trk;

            next++;
            
        }

        if (next === tracks.length) {
            fs.writeFile('collection.json', JSON.stringify(Collection));
            console.log('COMPLETE');
        }

       
    }, 0);
};
nextFile();
//timer$.subscribe();

//getChildDirectory(directory, true);