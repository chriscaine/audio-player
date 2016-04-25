

var Player = require('./Player.js');

var tracks = ['test.mp3', 'test.m4a'];

var player = new Player();


// Player Events
// format
// end
// error
// progress
// decoded



player.on('end', function () {
    player.Play(tracks[1]);
    player.on('end', function () {
        console.log('kill');
    });
});

player.Play(tracks[0]);

