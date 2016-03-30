
var fs = require('fs');

module.exports = {
    GetFiles: function (rootDir, callback) {
        console.log('GET FILES');
        var files = [];
        var Progress = function (callback) {
            var values = {};
            this.New = function (val) {
                values[val] = true;
            }
            this.Remove = function (val) {
                delete values[val];
                if (Object.keys(values).length === 0) {
                    callback(files);
                    console.log('GET FILES COMPLETE');
                }
            }
        };

        var progress = new Progress(callback);

        function isMusicTrack(file) {
            return /\.(mp3|m4a|m4p)$/i.exec(file) !== null;
        }

        function getChildDirectory(dir) {
            progress.New(dir);
            fs.readdir(dir, function (err, items) {
                if (err) return;
                for (var i = 0; i < items.length; i += 1) {
                    var file = dir + '\\' + items[i];
                    if (fs.statSync(file).isDirectory()) {
                        getChildDirectory(file);
                    } else {
                        if (isMusicTrack(file)) {
                            files.push(file);
                        }
                    }
                }
                progress.Remove(dir);
            });
        }
        getChildDirectory(rootDir);
    },
    GetTrackData: function (tracks, callback, completed) {
        var Track = require('./Tracks.js')['Track'];

       return function (files) {
            var next = 0;
            var nextFile = function () {
                setTimeout(function (obj) {
                    if (files[next]) {
                        var file = files[next];
                        if (tracks[file] === undefined) {
                            var trk = new Track(file);
                            trk.Init(function(metadata){
                                callback(metadata);
                                next++;
                                nextFile();
                            });
                            tracks[trk.Key] = trk;
                        }
                    }

                    if (next === files.length) {
                        completed();
                    }
                }, 0);
            };
            nextFile();
        }
    }
};