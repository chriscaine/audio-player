"use strict";
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');

var Speaker = require('speaker');
var util  = require('util');
var stream = require('stream');
var wav = require('wav');

// pcm_s16le

const Player = function() {
	var _this = this;
	var passThru$ = new stream.PassThrough();
	var reader;
	var speaker;
	this.events = {};
	this.on = function(name, fn) {
		var _this = this;
		_this.events[name] = fn;
	}
	this.off = function(name){
		var _this = this;
		delete _this.events[name];
	}

	this.Pause = function() {
		if(passThru$){
			passThru$.pause();
		}
	}

	var format = function(format) {
		speaker = new Speaker(format);
		reader.pipe(speaker);
		if(_this.events['format']) { _this.events['format'](format);}
	}

	var destroy = function() {
		reader = null;
		passThru$ = null;
		speaker = null;
		if(_this.events['end']) { _this.events['end']();}
	}

	var error = function(err){if(_this.events['error']) { _this.events['error']();}}
	var progress = function(progress){if(_this.events['progress']) { _this.events['progress']();}}
	var decoded = function() {if(_this.events['decoded']) { _this.events['decoded']();}}
	
	this.Play = function(file) {
		reader = null;
		passThru$ = null;
		speaker = null;
		console.log('Playing: ', file);
		var _this = this;
		passThru$ = new stream.PassThrough();
		passThru$.on('data', function(chunk) { console.log(chunk);});
		ffmpeg('test.m4a').audioCodec('pcm_s16le').audioChannels(2).audioFrequency(44100).format('wav').on('codecData', function(data) { })
			.on('error', error)
			.on('progress', progress)
			.on('end', decoded).pipe(passThru$);
		reader = new wav.Reader();
		passThru$.pipe(reader);
		reader.on('format', format).on('end', destroy);
	} 
	return this;
}
module.exports = Player;



