var fs = require('fs');
var Files = require('./Files.js');
var Track = require('./Tracks.js')['Track'];
var List = require('./Tracks.js')['List'];
var Collection = require('./Collection.js');


//fs.writeFile('config.json', JSON.stringify({ "dir": "\\\\Robert\\Public\\My Music\\Music\\Alabama 3" }));

var directory = JSON.parse(fs.readFileSync('config.json')).dir;

var collection = new Collection();
collection.Load();
console.log('Library currently holds: ', Object.keys(collection.Tracks).length);
Files.GetFiles(directory, Files.GetTrackData(collection.Tracks, function (metadata, file) {
    collection.Artists.Add(metadata.artist, file);
    collection.Artists.Add(metadata.albumartist, file);
    collection.Albums.Add(metadata.album, file);
}, function () {
    console.log('SAVE DATA');
    console.log('Saving: ', Object.keys(collection.Tracks).length, ' items');
    collection.Save();
}));

