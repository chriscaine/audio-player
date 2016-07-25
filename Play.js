"use strict";

var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var Speaker = require('speaker');
var util  = require('util');
var stream = require('stream');
var wav = require('wav');
var passThru$ = new stream.PassThrough();
var reader;
var speaker;

var format = function(format) {
	speaker = new Speaker(format);
	reader.pipe(speaker);
	//if(_this.events['format']) { process.send(format);}
}
var destroy = function() {
 	if(passThru$) passThru$.unpipe();
	reader = null;
	passThru$ = null;
	speaker = null;
	process.send({ Type : 'end', Data : null });
}
var error = function(err){ process.send(err); }
var progress = function(progress){ process.send({ Type : 'progress', Data : progress }); }
var decoded = function() {  }

// Break this function to accept multiple messages

process.on('message', function(track) {
	reader = null;
	passThru$ = null;
	speaker = null;

	passThru$ = new stream.PassThrough();
	//passThru$.on('data', function(chunk) { console.log(chunk);});
	ffmpeg(track).audioCodec('pcm_s16le').audioChannels(2).audioFrequency(44100).format('wav')
		.on('error', error)
		.on('progress', progress)
		.on('end', decoded).pipe(passThru$);
	reader = new wav.Reader();
	passThru$.pipe(reader);
	reader.on('format', format).on('end', destroy);
});
