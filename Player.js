"use strict";
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var cp = require('child_process');
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
	var Play = cp.fork('./Play.js');
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
	this.Stop = function() {
		destroy();
	}

	var format = function(format) {
		speaker = new Speaker(format);
		reader.pipe(speaker);
		if(_this.events['format']) { _this.events['format'](format);}
	}

	var destroy = function() {
	 	if(passThru$) passThru$.unpipe();
		reader = null;
		passThru$ = null;
		speaker = null;
		if(_this.events['end']) { _this.events['end']();}
	}

	var error = function(err){}
	var progress = function(progress){}
	var decoded = function() {}
	
	this.Play = function(file) {
		console.log(file);
		try{
			Play.send(file);
			Play.on('message', function(obj){
			    if(obj.Type === 'end') {		
					if(_this.events['end']) { _this.events['end']();}
				} else if(obj.Type === 'progress') {
					if(_this.events['end']) { _this.events['progress'](obj.Data);}
				}
			});
		} catch(err) { console.log('ERROR', err);}

	//	var ls = run('node Play.js', [JSON.stringify(file)], { stdio : ['pipe', 'pipe', 'pipe']});
//
//		ls.stdout.on('data', (d) => console.log(d));
//		ls.stderr.on('data', (d) => console.log(d));
//		ls.on('close', (d) => console.log(d));
	} 
	return this;
}
module.exports = Player;



