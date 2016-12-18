
//************************* WebAudioApi **********************************

AndroidSTBAudioBridge.prototype = {

load: function(url,cb){
	STBAudioNative.loadMainAudio(this.uuid,url);
	cb();
},

play: function(){
	return STBAudioNative.play(this.uuid);
},

getDuration: function(){
	return STBAudioNative.getDuration(this.uuid);
},

getTotalFrames: function(){
	return STBAudioNative.getTotalFrames(this.uuid);
},

getMinMaxValues: function(a,b){
	var data = STBAudioNative.getMinMaxValues(this.uuid,a,b);
	return JSON.parse(data);
},

getNumChannels: function(){
	return STBAudioNative.getNumChannels(this.uuid);
},

isPlaying: function(){
	return STBAudioNative.isPlaying(this.uuid);
},

stop: function(){
	return STBAudioNative.stop(this.uuid);
},

getCurrentTime: function(){
	return STBAudioNative.getCurrentTime(this.uuid);
},

setInitialTime: function(t){
	return STBAudioNative.setInitialTime(this.uuid,t);
},

registerFragment: function(f,cb){
	console.log(f);
	STBAudioNative.registerFragment(this.uuid,JSON.stringify(f));
	cb();
},

unregisterFragment: function(f){
	STBAudioNative.unregisterFragment(this.uuid,f);
},

};

function AndroidSTBAudioBridge (parent){
	this.parent = parent;
	this.uuid = STBAudioNative.initialize();
}