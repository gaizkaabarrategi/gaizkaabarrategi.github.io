M_START_EVENT = "touchstart";
M_MOVE_EVENT = "touchmove";
M_END_EVENT = "touchend";

function getPageX(e){
	if (e.originalEvent.touches[0])
		return e.originalEvent.touches[0].pageX;
	else
		return e.originalEvent.changedTouches[0].pageX;
};
function getPageY(e){
	if (e.originalEvent.touches[0])
		return e.originalEvent.touches[0].pageY;
	else
		return e.originalEvent.changedTouches[0].pageY;
};

$(window).load(function(){
	init();
});

function getPageInfo(page,callback){
	var r = STB.getPageInfo(page);
	var v = JSON.parse(r);
	username = v['username'];
	return v;
}

function saveCurrentPos(page,offset){
	STB.savePos(page,offset);
}

function showLoading(){
	console.log("Showing");
	STB.showLoading();
}

function hideLoading(){
	console.log("Hiding");
	STB.hideLoading();
}

function openAnnotationDialog(annotation){
	STB.openAnnotationDialog(JSON.stringify(annotation));
}

function openCreateConsultationDialog(ids,text){
	STB.openCreateConsultationDialog(ids,text);
}

function loadAnnotations(page){
	var r = STB.loadAnnotations(page);
	r = JSON.parse(r);
	return r;
}

function loadExternalAnnotations(page){
	var r = STB.loadExternalAnnotations(page);
	r = JSON.parse(r);
	return r;
}

function loadConsultations(page){
	var r = STB.loadConsultations(page);
	r = JSON.parse(r);
	return r;
}

function storeUnderlines(ids,color){
	STB.storeUnderlines(ids,color);
}

function showConsultation(consultation){
	STB.showConsultation(JSON.stringify(consultation));
}

function storeSelectedIds(items){
	var ids = new Array();
	var selected_items = $(".selected");
	var selected_items_length = selected_items.length;
	for (var selected_pos = 0; selected_pos < selected_items_length; selected_pos++){
		var item = $(selected_items.get(selected_pos));
		ids[ids.length] = item.attr('id');
	}
	STB.storeSelectedIds(ids.length,JSON.stringify(ids));
}

function clearSelectedIds(){
	STB.clearSelectedIds();
}

function addSelectedIds(id,text){
	STB.addSelectedIds(id,text);
}

function removeSelectedIds(id){
	STB.removeSelectedIds(id);
}

function notify(text){
	STB.notify(text);
}

function speak(){
	$("span.sentence, img").each(function(){
		if (this.nodeName == 'img') {
			if ($(this).attr('alt')){
				STB.speak($(this).attr('alt'));
			}
		} else
			STB.speak($(this).text());
	});
}

function generateWebLabURL(lab_id, cb){
	showLoading();
	try {
		var r = STB.generateWebLabURL(lab_id);
		cb(r);
	} catch (error 	){
		console.log("generateWebLabURL Error: "+ error);
	}
	hideLoading();
}

function showSendResultsDialog(data, activity_group, files){
	STB.showSendResultsDialog(JSON.stringify(data),activity_group.uuid, JSON.stringify(files));
}

function getResults(group,cb){
	showLoading();
	try {
		var results = STB.getResults(group.uuid);
		if (results != null) {
			var r = JSON.parse(results);
			if ('score' in r)
				cb(r);
			notify("Results received...");
		} else {
			notify("Error receiving results...");
		}
	} catch (error) {
		console.log(error);
	};
	hideLoading();
}

function I18N(key){return STBI18N.translate(key);};
function I18N(key,a1){return STBI18N.translate(key,a1);};
