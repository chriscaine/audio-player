var fs = require('fs');
var DataCollection = require('data-collection');
var json;
var data;
try {
    json = fs.readFileSync('data/collection.json');
    data = JSON.parse(json);
} catch (e) {
    console.log(e);
}

var tracks = [];

for (var key in data.Tracks) {
    tracks.push(data.Tracks[key]);
}


var dc = new DataCollection(tracks);



console.log(dc.query().filter({ 'artist__contains' : 'Dolly' }).order('track__no', true).values());

