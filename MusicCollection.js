"use strict";
const fs = require('fs');
const Files = require('./Files.js');
const Track = require('./Tracks.js')['Track'];
const List = require('./Tracks.js')['List'];
const Collection = require('./Collection.js');
const Guid = require('./Guid.js');
var directory = JSON.parse(fs.readFileSync('config.json')).dir;

var collection = new Collection();
collection.Load();
console.log('Library currently holds: ', Object.keys(collection.Tracks).length);
Files.GetFiles(directory, Files.GetTrackData(collection.Tracks, function (metadata, file) {
    let guid = Guid();
    collection.Tracks[guid] = {
        title: metadata.title,
        artist: metadata.artist,    // [str]
        albumartist: metadata.albumartist,   // [str]
        album: metadata.album,     // str
        year: metadata.year,      // str 
        track: metadata.track,
        genre: metadata.genre,
        disk: metadata.disk,
        file:file
    }
    collection.Artists.Add(metadata.artist, guid);
    collection.Artists.Add(metadata.albumartist, guid);
    collection.Albums.Add(metadata.album, guid);
    collection.Save();
}, function () {
    console.log('SAVE DATA');
    console.log('Saving: ', Object.keys(collection.Tracks).length, ' items');
    collection.Save();
}));

