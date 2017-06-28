"use strict";
const fs = require('fs');
const Files = require('./Files.js');
const Track = require('./Tracks.js')['Track'];
const List = require('./Tracks.js')['List'];
const Collection = require('./Collection.js');
const fsSync = require('fs-sync');

const config = JSON.parse(fs.readFileSync('config.json'));
const directory = config.dir;
const serverDir = config.server;
var collection = new Collection();
collection.Load();
console.log('Library currently holds: ', Object.keys(collection.Tracks).length);






function CreateFiles() {
    Files.GetFiles(directory, Files.GetTrackData(collection.Tracks, collection.Update, collection.Save));
}

function UpdateFiles() {


    /* UPDATE FILES IN LOCAL STORAGE FROM SERVER LOCATION
     * 1). Get new list of files
     *          a). Query new file location
     *          b). Create org and new file location table
     *          c). Check if new file location !exists create copy list
     * 2). Copy new files to local storage
     * 3). Create file list from copy table
     * 4). GEnerate new track details from file list.
     */
    
    var FileReference = function (file) {
        this.OriginalRef = file;
        this.ServerFile = file;
        this.LocalFile = file.replace(serverDir, directory);
        return this;
    }
    FileReference.prototype.Compare = function (fileToCompare) {
        return this.OriginalRef.toLower() === fileToCompare.toLower();//  this.RegExp.exec(fileToCompare) !== null;
    }
    FileReference.prototype.Copy = function () {
        fsSync.copy(this.ServerFile, this.LocalFile, {});
    }

    // 2).
    function CreateFileTable(files) {
        var table = [];
        var newFiles = [];
        files.forEach(function (item, index) {
            table.push(new FileReference(item));
        });
        table.forEach(function (item, index) {
            if (!collection.TrackExists(item.LocalFile)) {
                console.log('Copy: ', item.ServerFile);
                item.Copy();
                newFiles.push(item.LocalFile);
            }
        });
        console.log('Get Track Data');
        Files.GetTrackData(collection.Tracks, collection.Update, collection.Save)(newFiles);
    }

    // 1).
  
    Files.GetFiles(serverDir, CreateFileTable, false);
}
//UpdateFiles();
CreateFiles();