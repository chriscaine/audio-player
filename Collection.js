module.exports = function Collection() {
    var fs = require('fs');
    var List = require('./Tracks.js')['List'];
    this.Tracks = {};
    this.Albums = new List();
    this.Artists = new List();
    var _this = this;
    this.Load = function () {
        
        var collection;
        try {
            collection = JSON.parse(fs.readFileSync('data/collection.json'));
            console.log('LOADED');
        } catch (e) {
            console.log('error', e);
            collection = { Albums: {}, Artists: {}, Tracks : {}}
        }

        function _extend(original, extend) {
            for (var key in extend) {
               original[key] = extend[key];
            }
        }

        _this.Albums = new List(collection.Albums);
        _this.Artists = new List(collection.Artists);
        _this.Tracks = collection.Tracks;
        console.log('LOADED');
    };
    this.Save = function (collection) {
        try {
            console.log(_this);
            fs.writeFileSync('data/collection.json', JSON.stringify(_this));
            console.log('SAVED');
        } catch (e) {
            console.log(e);
        }
    };
    return this;
}