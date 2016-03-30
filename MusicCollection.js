var Files = require('./Files.js');
var Track = require('./Tracks.js')['Track'];
var List = require('./Tracks.js')['List'];
var Collection = require('./Collection.js');
var directory = "\\\\Robert\\Public\\My Music\\Music\\Air";

var collection = new Collection();

collection.Load();
console.log('NEXT', Object.keys(collection.Tracks).length);
Files.GetFiles(directory, Files.GetTrackData(collection.Tracks, function (metadata) {
    collection.Artists.Add(metadata.artist);
    collection.Artists.Add(metadata.albumartist);
    collection.Albums.Add(metadata.album);
}, function () {
    console.log('SAVE DATA');
    if(Object.keys(collection).length === 3){
        collection.Save();
    }
}));