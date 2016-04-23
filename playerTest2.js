"use strict";
var fs = require('fs');
var ms = require('memory-streams');
var ffmpeg = require('fluent-ffmpeg');
var lame = require('lame');
var Speaker = require('speaker');
var util  = require('util');
var stream = require('stream');
var wav = require('wav');

// pcm_s16le

const passThru$ = new stream.PassThrough();

const speaker = new Speaker({
	channels:2,
	bitDepth:16,
	sampleRate:44100
});

passThru$.on('data', function(chunk) {
	//speaker.write(chunk);
	console.log(chunk.length);
});

var reader = new wav.Reader();
reader.on('format', function(format) {
	reader.pipe(new Speaker(format));
});

setTimeout(function() {
	passThru$.pause();
	setTimeout(function() {
		passThru$.resume();

	}, 2000);

}, 5000);


var command = ffmpeg('test.m4a')
	.audioCodec('pcm_s16le')
	.audioChannels(2)
	.audioFrequency(44100)
	.format('wav')
	.on('codecData', function(data) {
		//	console.log(data);
		
	})
	.on('error', function(err) { console.log('ERROR', err);})
	.on('progress', function(data) {
		//console.log(data.percent);
		return data;
	})
	.on('end', function() {
		//console.log('end')
	}).pipe(passThru$);

passThru$.pipe(reader);
