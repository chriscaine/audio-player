var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var lame = require('lame');
var Speaker = require('speaker');

// fs.createWriteStream -- not working
// also using Speaker in pipe is not working
// is there a way to alter format in pipe?

var command = ffmpeg('test.mp3')
	.output('a file.wav')
	.audioCodec('pcm_s16le')
	.run();


//command.pipe(new Speaker);
/*
fs.createReadStream('test.mp3')
	.pipe(new lame.Decoder)
	.on('format', console.log)
	.pipe(new Speaker);
*/
// pcm_s16le