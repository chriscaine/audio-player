var fs = require('fs');
var ms = require('memory-streams');
var ffmpeg = require('fluent-ffmpeg');
var lame = require('lame');
var Speaker = require('speaker');
var util  = require('util');
var stream = require('stream');
var Buffer = require('buffer');
// fs.createWriteStream -- not working
// also using Speaker in pipe is not working
// is there a way to alter format in pipe?

function BufferStream(source) {
	//if(!Buffer.isBuffer(source)) {
//		throw(new Error('source must be buffer'));
//	}

	stream.Readable.call(this);

	this._source = source;
	this._offset = 0;
	this._length = source.length;
	this.on('end', this._destroy);
}
util.inherits(BufferStream, stream.Readable);

BufferStream.prototype._destroy = function() {
	this._source = null;
	this._length = null;
	this._offset = null;
}

BufferStream.prototype._read = function(size) {
	if(this._offset < this.length) {
		this.push(this.source.slice(this._offset, (this._offset + size)));
		this._offset += size;
	}

	if(this._offset >= this._length) {
		this.push(null);
	}
}

var speaker = new Speaker({
	channels:2,
	bitDepth:16,
	sampleRate:44100
});


new BufferStream(fs.readFileSync('new.wav'))
		.pipe(speaker);


var write$ = new stream.Writable();
write$.data = [];
write$._write = function(chunk) {
	this.data.push(chunk);
};
write$.on('end',  function() {
	console.log('write ends');
	
	new BufferStream(Buffer.concat(this.data))
		.pipe(speaker);
	
	

});

ffmpeg('test.m4a')
	.audioCodec('pcm_s16le')
	.audioChannels(2)
	.audioFrequency(44100)
	.noVideo()
	.format('wav')
	.on('codecData', function(data) {
		console.log(data);
		
	})
	.on('end', function() {

	})
  	.pipe(write$);


// pcm_s16le