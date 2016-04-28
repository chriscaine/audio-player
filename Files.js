"use strict";
var fs = require('fs');

module.exports = {
    GetFiles: function (rootDir, callback) {
        console.log('GET FILES');
        var files = [];
        try {
            files = JSON.parse(fs.readFileSync('data/files.json'));
            if (files.length > 0) {
                callback(files);
                return;
            }
        } catch (e) {
           
        }
        var Progress = function (callback) {
            var values = {};
            this.New = function (val) {
                console.log(val);
                values[val] = true;
            }
            this.Remove = function (val) {
                delete values[val];
                console.log(Object.keys(values).length);
                if (Object.keys(values).length === 0) {
                    fs.writeFile('data/files.json', JSON.stringify(files));
                    callback(files);
                    console.log('files found: ', files.length);
                    console.log('GET FILES COMPLETE');
                }
            }
        };

        var progress = new Progress(callback);

        function isMusicTrack(file) {
            return /\.(mp3|m4a)$/i.exec(file) !== null;
        }

        function getChildDirectory(dir) {
            progress.New(dir);
            fs.readdir(dir, function (err, items) {
                if (err) return;
                for (var i = 0; i < items.length; i += 1) {
                    var file = dir + '/' + items[i];
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
            console.log(files.length, ' Files Found');
            var nextFile = function () {
                setTimeout(function () {
                    if (files[next]) {
                        var file = files[next];
                        if (tracks[file] === undefined) {
                            var trk = new Track(file);
                            trk.Init(function (metadata) {
                                callback(metadata, file);
                                console.log(metadata.title);
                                next++;
                                nextFile();
                            });
                         //   tracks[trk.Key] = trk;
                        } else {
                            nextFile();
                        }
                    }
                }, 0);
                if (next === files.length) {
                    completed();
                }

            };
            nextFile();
        }
    }
};