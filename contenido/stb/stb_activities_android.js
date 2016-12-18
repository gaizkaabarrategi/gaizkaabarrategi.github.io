function OpenActivity(group, element){
	this.group = group;
	this.uuid = element.attr("uuid");
	this.element = element;
	this.files = [];
	var activity = this;
	// precargar
	
	this.generateHTML = function(){
		var activity_div = $("<div class='stb_activity' />");

		var question = $('<div/>');
		question.addClass('stb_question');
		question.append(element.find('stb_question').contents());
		reload(question);
		activity_div.append(question);

		activity.textarea = $("<textarea />");
		activity_div.append(activity.textarea);
		
		activity.selector = $('<button type="button" />');
		activity.selector.append("Select media");
		activity_div.append(activity.selector);
		activity.selector.click(function(){
			STB.selectMedia(activity.group.uuid, activity.uuid);
		});
		
		activity.gallery = $('<div />');
		activity_div.append(activity.gallery);
		
		return activity_div;
	};
	
	this.save = function(){
		var data = {
			'text': activity.textarea.val(),
		};
		return data;
	};
	
	this.load =  function(data){
		if ('text' in data){
			activity.textarea.val(data['text']);
		}
	};
	
	this.mediaLoaded = function(media, type){
		activity.files.push(media);
		if (type == 'PIC'){
			var img = $("<img />").addClass("icon").attr("src",media);
			activity.gallery.append(img);
		} else if (type == 'SND'){
			var img = $("<img />").addClass("icon").attr("src",assetsBase + "/img/mic.png");
			activity.gallery.append(img);
		} else if (type == 'GAL'){
			var img = $("<img />").addClass("icon").attr("src",assetsBase + "/img/photo.gif");
			activity.gallery.append(img);
		} else if (type == 'VID'){
			var img = $("<img />").addClass("icon").attr("src",assetsBase + "/img/video.gif");
			activity.gallery.append(img);
		}
	};
	
	this.getFiles = function(){
		return activity.files;
	};
};

function mediaLoadedForActivity(group_iid,act_uuid,file_path,type){
	for (var g = 0; g < groups.length; g++){
		var group = groups[g];
		if (group.uuid != group_iid) continue;
		var activity = group.activities[act_uuid];
		if (activity.mediaLoaded) activity.mediaLoaded(file_path,type);
	}
}

