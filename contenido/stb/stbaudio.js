
function STBAudio_WebAudioAPI_isSupported (){
	return !(typeof webkitAudioContext === 'undefined');
}

function AndroidSTBAudioBridge_isSupported (){
	return !(typeof AndroidSTBAudioBridge === 'undefined');
}

function STBAudio() {
	this.loaded = false;
	this.pblisteners = [];
	this.loadlisteners = [];

	if (STBAudio_WebAudioAPI_isSupported())
		this.impl = new STBAudio_WebAudioAPI(this);
	else if (AndroidSTBAudioBridge_isSupported())
		this.impl = new AndroidSTBAudioBridge(this);
	else
		console.log("audio not supported"); 
};

STBAudio.prototype = {
// redirections
getDuration 		: function()	{ return this.impl.getDuration(); },
getTotalFrames		: function()	{ return this.impl.getTotalFrames(); },
getNumChannels		: function()	{ return this.impl.getNumChannels(); },
isPlaying			: function()	{ return this.impl.isPlaying(); },
getCurrentTime		: function()	{ return this.impl.getCurrentTime(); },
setInitialTime		: function(a)	{ return this.impl.setInitialTime(a); },
registerFragment	: function(a,b)	{ return this.impl.registerFragment(a,b); },
unregisterFragment	: function(a)	{ return this.impl.unregisterFragment(a); },
getMinMaxValues		: function(a,b)	{ return this.impl.getMinMaxValues(a,b); },

// own functions

play : function()	{
	var ret = this.impl.play();
	if (ret){
		if (!this.pbinterval){
			var pthis = this;
			this.pbinterval = setInterval(function(){ pthis.notifyCurrentTime(); },100);
		}
	};
	return ret;
},

stop : function()	{
	var ret = this.impl.stop();
	if (ret){
		if (this.pbinterval){
			clearInterval(this.pbinterval);
			this.pbinterval=null;
		};
	};
	return ret;
},

getSupportedExtension: function(){
	var v = document.createElement("audio");
	if(v.canPlayType && v.canPlayType('audio/mpeg').replace(/no/, '')) {
		return ".mp3";
	}
	if(v.canPlayType && v.canPlayType('audio/ogg').replace(/no/, '')) {
		return ".ogg";
	}
	return "";
},

listenPlayback: function (cb){
	this.pblisteners.push(cb);
},

notifyCurrentTime: function (){
	var ctime = this.getCurrentTime();
	for (var i = 0; i < this.pblisteners.length; i++){
		this.pblisteners[i](ctime);
	};
},

load: function(url){
	var pthis = this;
	var ret = this.impl.load(url,function(){
		for (var i = 0; i < pthis.loadlisteners.length; i++){
			pthis.loadlisteners[i]();
		};
		pthis.loaded = true;
	});
	return ret;
},

onload: function (cb){
	if (this.loaded){
		cb();
	} else {
		this.loadlisteners.push(cb);
	}
},

};

// ************************* WebAudioApi **********************************

STBAudio_WebAudioAPI.prototype = {

load: function(url,cb){
	var pthis = this;
	var ext = this.parent.getSupportedExtension();

	var request = new XMLHttpRequest();
	request.open('GET', url+ext, true);
	request.responseType = 'arraybuffer';
	// Decode asynchronously
	request.onload = function() {
		pthis.context.decodeAudioData(request.response, function(buffer) {
			pthis.buffer = buffer;
			pthis.loaded = true;
			cb();
		}, null);
 	};
	request.send();
},

play: function(){
	if (!this.loaded) return false;
	this.sources = [];
	var s = this.context.createBufferSource();
	s.buffer = this.buffer;

	s.connect(this.context.destination);
	s.start(this.context.currentTime,this.initialTime);
	this.sources.push(s);
	for (var i = 0; i < this.fragments.length;i++){
		var f = this.fragments[i];
		var b = this.fragmentsBuffers[f.filename];
		if (this.initialTime < (f.init + b.duration)){
			s = this.context.createBufferSource();
			s.buffer = b;
			s.connect(this.context.destination);
			s.start(f.init - this.initialTime + this.context.currentTime,Math.max(0,this.initialTime - f.init));
			this.sources.push(s);
		}
		
	};


	this.playing = true;
	this.playingStartTime = this.context.currentTime;
	return true;
},

getDuration: function(){
	if (this.buffer)
		return this.buffer.duration;
	else
		return 0;
},

getTotalFrames: function(){
	if (this.buffer)
		return this.buffer.length;
	else
		return 0;
},

getMinMaxValues: function(a,b){
	var r = {
		min: 0,
		max: 0,
	};

	for (var c = 0; c < this.buffer.numberOfChannels; c++){
		var channelData = this.buffer.getChannelData(c);
		for (var f = a; f <= b; f++){
			var v = channelData[f];
			if (v){
				r.min = Math.min(r.min,v);
				r.max = Math.max(r.max,v);
			} else {
				throw new Error("blah: " + f);
			};
		};
	};
	return r;
},

getNumChannels: function(){
	if (this.buffer)
		return this.buffer.numberOfChannels;
	return 0;
},

isPlaying: function(){
	return this.playing;
},

stop: function(){
	if (!this.playing) return false;
	for (var i = 0; i < this.sources.length; i++){
		var s = this.sources[i];
		s.stop(0);
		s.disconnect();
	};
	this.playing = false;
	return true;
},

getCurrentTime: function(){
	if (this.isPlaying())
		return (this.context.currentTime - this.playingStartTime + this.initialTime);
	else
		return 0;
},

setInitialTime: function(t){
	this.initialTime = t;
},

registerFragment: function(f,cb){
	this.stop();
	this.fragments.push(f);

	if (!this.fragmentsBuffers[f.filename]){
		this.loaded = false;
		var pthis = this;
		var ext = this.parent.getSupportedExtension();
		var url = f.filename;
		var request = new XMLHttpRequest();
		request.open('GET', url+ext, true);
		request.responseType = 'arraybuffer';
		// Decode asynchronously
		request.onload = function() {
			pthis.context.decodeAudioData(request.response, function(buffer) {
				pthis.fragmentsBuffers[f.filename] = buffer;
				pthis.loaded = true;
				cb();
			}, null);
		};
		request.send();
	} else {
		cb();
	};
},

unregisterFragment: function(f){
	var pos = this.fragments.indexOf(f);
	if (pos != -1)
		this.fragments.splice(pos,1);
},

};

function STBAudio_WebAudioAPI (parent){
  try {
    this.parent = parent;
    this.context = new webkitAudioContext();
    this.playing = false;
    this.loaded = false;
    this.playingStartTime = 0;
    this.initialTime = 0;
    this.fragments = [];
    this.sources = [];
    this.fragmentsBuffers = [];
  }
  catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
}

// *********************** AUDIO PLAYER *********************

function STBAudioPlayer( params ){
	var pthis = this;
	this.rootView = $("<div/>");
	this.selectedX = -1;
	this.marks = [];
	this.marksListeners = [];
	this.statusListeners = [];
	this.selectedMark = null;
	this.newRangeInit = -1;
	this.audio = new STBAudio();
	this.audio.load(params.audiofile);
	this.init_selection = params.init_selection;

	var w = params.width?params.width:300;
	var h = params.height?params.height:50;
	this.rootView.addClass("player").addClass("gradient").css({
		'display' : 'inline-block',
		'vertical-align' : 'middle',
		'width':w,
		'height':h,
	});

	// creating player
	this.waveform = $("<canvas/>").css({
		'background':"white",
		'border': '1px solid #999999',
		'position': 'absolute',
		'width': w - 54,
		'height': h - 12,
		'left':'44px',
	}).attr({'width': w - 54,
		'height': h - 12,
	});
	this.rootView.append(this.waveform);

	this.pb_position = $("<canvas/>").attr("id","pb").css({
		'position': 'absolute',
		'border': '1px solid #999999',
		'left':'44px',
	}).attr({'width': w - 54,
		'height': h - 12,
	});
	this.rootView.append(this.pb_position);
	
	this.marks_div = $("<canvas/>").attr("id","marks").css({
		'position': 'absolute',
		'border': '1px solid #999999',
		'left':'44px',
	}).attr({'width': w - 54,
		'height': h - 12,
	});
	this.rootView.append(this.marks_div);
	this.marks_canvas_width = w - 54;

	this.loading_div = $("<div/>").attr("class","loading").css({
		'border': '1px solid #999999',
		'position': 'absolute',
		'width': w - 54,
		'height': h - 12,
		'left':'44px',
	});
	this.rootView.append(this.loading_div);

	var play_button = $("<a />").addClass("button gradient audio_player_play");
	play_button.click(function(){
		var res;
		if (pthis.audio.isPlaying()){
			res = pthis.audio.stop();
			pthis.paintPBPosition();
		} else {
			res = pthis.audio.play();
		};
		for (var i = 0; i < pthis.statusListeners.length; i++){
			pthis.statusListeners[i](pthis.audio.isPlaying());
		};
		if (res)
			play_button.toggleClass("audio_player_play").toggleClass("audio_player_stop");
	});
	this.rootView.append(play_button);

	this.audio.onload(function(){
		pthis.paintWaveform();
		pthis.loading_div.hide();
	});
	this.audio.listenPlayback(function(time){
		pthis.paintPBPosition(time);
	});

	this.rootView.delegate("canvas",M_START_EVENT,function(e){
		console.log("start");
		var x = getPageX(e) - pthis.marks_div.offset().left;
		e.preventDefault();
		for (var i = 0; i < pthis.marks.length; i++){
			var m = pthis.marks[i];
			var xinit = Math.floor(m.init / pthis.audio.getDuration() * pthis.marks_canvas_width);
			var xend = Math.floor(m.end / pthis.audio.getDuration() * pthis.marks_canvas_width);
			if (x >= xinit && x <= xend){		
				return;
			};
		};
		pthis.newRangeInit = x;
	});
	this.rootView.delegate("canvas",M_MOVE_EVENT,function(e){
		var x = getPageX(e) - pthis.marks_div.offset().left;
		console.log("move");
		if (pthis.newRangeInit<0) return;
		pthis.newRangeEnd = x;
		pthis.paintMarks();
		console.log("move_end");
	});
	this.rootView.delegate("canvas",M_END_EVENT,function(e){
		var x = getPageX(e) - pthis.marks_div.offset().left;
		console.log("END");
		
		// SELECTION
		
		var newSelectedMark = null;
		for (var i = 0; i < pthis.marks.length; i++){
			var m = pthis.marks[i];
			var xinit = Math.floor(m.init / pthis.audio.getDuration() * pthis.marks_canvas_width);
			var xend = Math.floor(m.end / pthis.audio.getDuration() * pthis.marks_canvas_width);
			if (x >= xinit && x <= xend){		
				newSelectedMark = m;
				break;
			};
		};
		var redraw = false;
		if (pthis.selectedMark != newSelectedMark){
			if (pthis.selectedMark)
				pthis.selectedMark.alpha = 0.33;
			if (newSelectedMark)
				newSelectedMark.alpha = 0.75;
			pthis.selectedMark = newSelectedMark;
			pthis.notifyMarkSelected(newSelectedMark);
			redraw = true;
		};
		if (pthis.init_selection){
			console.log("init_selection: " + pthis.init_selection);
			pthis.selectedX = x;
			console.log(x);
			pthis.audio.setInitialTime( x / pthis.marks_canvas_width * pthis.audio.getDuration());
			redraw = true;
		}
		
		// RANGES
		
		if (!pthis.selectedMark){
			if ((pthis.newRangeInit > 0) &&
			    (Math.abs(pthis.newRangeInit - x) > 3)){
				var r = {
					init:		pthis.newRangeInit / pthis.marks_canvas_width * pthis.audio.getDuration(),
					end:		x / pthis.marks_canvas_width * pthis.audio.getDuration(),
					solution:	null,
					show:		true,
					accuracy:	0,
					fixed:		false,
				};
				console.log(" new range ");	
				pthis.addMark(r);
				redraw = true;
			}
			pthis.newRangeInit = -1;
			pthis.newRangeEnd = -1;

		}
		
		if (redraw) pthis.paintMarks();
	});
}
STBAudioPlayer.prototype.getRootDiv = function(){
	return this.rootView;
};
STBAudioPlayer.prototype.onAudioLoad = function(cb){
	this.audio.onload(cb);
};
STBAudioPlayer.prototype.paintWaveform = function (){
	var w = this.waveform[0].width;
	var h = this.waveform[0].height;
	var context = this.waveform[0].getContext("2d");
	context.clearRect(0, 0, w, h);
	console.log("waveform");
	console.log(w);
	console.log(this.audio.getTotalFrames());
	var framesPerPixel = this.audio.getTotalFrames() / w;
	console.log(framesPerPixel);
	var h2 = h / 2;
	context.strokeStyle = "black";
	for (var x = 0; x < w; x++){
		var min_frame = Math.floor(x * framesPerPixel);
		var max_frame = Math.floor(((x+1) * framesPerPixel) - 1);
		var r = this.audio.getMinMaxValues(min_frame,max_frame);
		context.beginPath();
		context.moveTo(x+0.5,(r.min+1)*h2+0.5);
		context.lineTo(x+0.5,(r.max+1)*h2+0.5);
		context.closePath();
		context.stroke();
	};


};
STBAudioPlayer.prototype.paintPBPosition = function(time){
	var canvas = this.pb_position[0];
	var playing = this.audio.isPlaying();
	var x = time / this.audio.getDuration() * canvas.width;
	console.log("****************");
	console.log(time);
	console.log(this.audio.getDuration());
	console.log(canvas.width);
	console.log(x);
	var context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
	if (playing){
		context.strokeStyle = "green";
		context.beginPath();
		context.moveTo(x+0.5,0);
		context.lineTo(x+0.5,canvas.height+1);
		context.closePath();
		context.stroke();
	};
};
STBAudioPlayer.prototype.paintMarks = function(){
	console.log("painting marks");
	var canvas = this.marks_div[0];
	var h = canvas.height;
	var context =canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < this.marks.length; i++){
		var m = this.marks[i];
		context.fillStyle = m.getColor();
		var xinit = Math.floor(m.init / this.audio.getDuration() * canvas.width);
		var xend = Math.floor(m.end / this.audio.getDuration() * canvas.width);
		context.beginPath();
		context.rect(xinit,0,xend-xinit,h);
		context.fill();

		if (m.tag){
			var ts = context.measureText(m.tag);
			var textx = xinit + ((xend -xinit - ts.width) / 2);
			context.font = "bold 15px Arial";
			var oldAlpha = m.alpha;
			m.alpha = 1;
			context.fillStyle = "white";
			context.fillText(m.tag,textx,(h + 13)/2);
			m.alpha = oldAlpha;
		};
	};

	if (this.newRangeInit >= 0){
		console.log("painting new range...");
		context.fillStyle = "rgba(0,0,0,0.5)";
		context.beginPath();
		context.rect(this.newRangeInit,0,this.newRangeEnd-this.newRangeInit,h);
		context.fill();
	}

	console.log(this.selectedX);
	if (this.selectedX >= 0){
		context.strokeStyle = "blue";
		context.beginPath();
		context.moveTo(this.selectedX+0.5,0);
		context.lineTo(this.selectedX+0.5,canvas.height+1);
		context.closePath();
		context.stroke();
	};
};
STBAudioPlayer.prototype.addMark = function(m){
	m.red = Math.floor(Math.random()*255);
	m.green = Math.floor(Math.random()*255);
	m.blue = Math.floor(Math.random()*255);
	m.alpha = 0.33;
	m.getColor = function(){
		return "rgba("+this.red+","+this.green+","+this.blue+","+ this.alpha + ")";
	};
	this.marks.push(m);
	this.paintMarks();
};
STBAudioPlayer.prototype.notifyMarkSelected = function(m){
	for (var i = 0; i < this.marksListeners.length; i++){
		this.marksListeners[i](m);
	};
};
STBAudioPlayer.prototype.onMarkSelected = function(cb){
	this.marksListeners.push(cb);
};
STBAudioPlayer.prototype.setMarkAudio = function(mark, audio){
	var pthis = this;
	if (mark.fragment){
		pthis.audio.unregisterFragment(mark.fragment);
	};
	if (audio){
		pthis.loading_div.show();
		mark.fragment = {
			init : mark.init,
			filename : audio,
		};
		pthis.audio.registerFragment(mark.fragment,function(){
			pthis.loading_div.hide();
		});
	};
	this.paintMarks();
};
STBAudioPlayer.prototype.addStatusListener = function(cb){
	this.statusListeners.push(cb);
	if (this.audio.isPlaying()) cb(this.audio.isPlaying());
};
