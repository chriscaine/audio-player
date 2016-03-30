var Files = require('./Files.js');
var Track = require('./Tracks.js')['Track'];
var List = require('./Tracks.js')['List'];
var Collection = require('./Collection.js');
var directory = "\\\\Robert\\Public\\My Music\\Music";

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