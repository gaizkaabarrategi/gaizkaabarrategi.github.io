M_START_EVENT = "mousedown";
M_MOVE_EVENT = "mousemove";
M_END_EVENT = "mouseup";

function getPageX(e){
	return e.pageX;
};
function getPageY(e){
	return e.pageY;
};

$(window).load(function(){
	init();
	loginToken = "b4bbe5a7-893d-4d67-8e48-893359f7ec7b";
	username = 'test';
});

function getPageInfo(page,callback){
	return {
	};
}

function saveCurrentPos(page,offset){
}

function showLoading(){
}

function hideLoading(){
}

function openAnnotationDialog(annotation){
}

function openCreateConsultationDialog(ids,text){
}

function loadAnnotations(page){
	return [];
}

function loadExternalAnnotations(page){
}

function loadConsultations(page){
	return [];
}

function storeUnderlines(ids,color){
}

function showConsultation(consultation){
}

function storeSelectedIds(items){
}

function clearSelectedIds(){
}

function addSelectedIds(id,text){
}

function removeSelectedIds(id){
}

function notify(text){
	alert(text);
}

function generateWebLabURL(lab_id, cb){
	try {
		$.ajax({
			type: "GET",
			url: "http://127.0.0.1:8083/stbserver/weblab",
			data: {
				"token" : loginToken,
				"activity" : lab_id,
			},
			contentType: "text/plain",
			accepts: "text/plain",
			error: function(jqXHR, textStatus, errorThrown){
				console.log("jqXHR: " + jqXHR);
				console.log(jqXHR.status);
				console.log("textStatus: " + textStatus);
				console.log("errorThrown: " + errorThrown);
			},
			success: function(url,textStatus, jqXHR) {
	
				cb(data);
			}
		});
	} catch (error 	){
		console.log("generateWebLabURL Error: "+ error);
	}
}

function I18N(key){return key;};
function I18N(key,a1){return key;};
