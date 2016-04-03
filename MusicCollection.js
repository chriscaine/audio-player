var fs = require('fs');
var Files = require('./Files.js');
var Track = require('./Tracks.js')['Track'];
var List = require('./Tracks.js')['List'];
var Collection = require('./Collection.js');

var directory = JSON.parse(fs.readFileSync('config.json')).dir;

var collection = new Collection();
collection.Load();
console.log('Library currently holds: ', Object.keys(collection.Tracks).length);
Files.GetFiles(directory, Files.GetTrackData(collection.Tracks, function (metadata, file) {
    collection.Tracks[file] = {
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
    collection.Artists.Add(metadata.artist, file);
    collection.Artists.Add(metadata.albumartist, file);
    collection.Albums.Add(metadata.album, file);
    collection.Save();
}, function () {
    console.log('SAVE DATA');
    console.log('Saving: ', Object.keys(collection.Tracks).length, ' items');
    collection.Save();
}));

