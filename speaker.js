var Speaker = require('speaker');


var speaker = new Speaker({
	channels:2,
	bitDepth:16,
	sampleRate:44100
});

process.stdin.pipe(speaker);