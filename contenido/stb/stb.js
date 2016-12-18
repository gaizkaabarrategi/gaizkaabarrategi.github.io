fileMD5 = null;
currentPage = null;
loginToken = null;
assetsBase = null;

annotations = new Array();
extAnnotations = new Array();
consultations = new Array();
screenHeight = 0;
scrollDisabled = false;
underlineColor = null;

function pad(num, size) {
	var s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}


function isBlank(str) {
	return (!str || /^\s*$/.test(str));
}

function divideInto(nodes, separator, class_name){
	nodes.contents().each(function(){
		if (this.nodeName == 'iframe' ||
				this.nodeName == 'stb_ag')
			return;
		var n = $(this);
		if (this.nodeType === 3 ){
			var sentences = n.text().split(separator);
			var len = sentences.length;
			var wrapper = $("<span />");
			for(var i=0; i<len; i++) {
				var sentence = sentences[i];
				if (!isBlank(sentence)){
					var ne = $('<span />');
					ne.addClass(class_name);
					if (i != len -1) sentence += separator;
					ne.text(sentence);
					wrapper.append(ne);
				}
			}
			n.replaceWith(wrapper);
		} else {
			divideInto(n, separator, class_name);
		}
	});
}

saving = false;

function scrollManage(){
	if (!saving){
		saving = true;
		saveCurrentPos(document.location.href,$(window).scrollTop());
		saving = false;
	}
};

function sentenceClick(){
	$(this).toggleClass("selected");
}

function underlineSentenceClick(){
	$(this).toggleClass("selected")
	.css('background-color',underlineColor);
}

function enableAnnotationMode(){
	disableAll();
	$("span.sentence").on("click",null,null,sentenceClick);
	$("body").prepend("<div class=\"confirm_selection_size\"></div>");
	$("body").append("<button id=\"confirm_selection\" class=\"confirm_selection_size\">" + I18N('confirm_annotation_selection') + "</button>");
	$("#confirm_selection").css("top",$(window).scrollTop());
	$("#confirm_selection").click(function(){
	
		$(".confirm_selection_size").remove();
		$("span.sentence").off("click",null,null,sentenceClick);
		
		if ($(".selected").length > 0) {
			
			var ids = new Array();
			var selected_items = $(".selected");
			var selected_items_length = selected_items.length;
			for (var selected_pos = 0; selected_pos < selected_items_length; selected_pos++){
				var item = $(selected_items.get(selected_pos));
				ids[ids.length] = item.attr('id');
			}
			$(".selected").removeClass("selected");
			openAnnotationDialog({"ids":JSON.stringify(ids)});
		} else {
			reloadAnnotations(false);
		}
	});
	return true;
}

function enableConsultationMode(){
	disableAll();
	$("span.sentence").on("click",null,null,sentenceClick);
	$("body").prepend("<div class=\"confirm_selection_size\"></div>");
	$("body").append("<button id=\"confirm_selection\" class=\"confirm_selection_size\">" + I18N('confirm_annotation_selection') + "</button>");
	$("#confirm_selection").css("top",$(window).scrollTop());
	$("#confirm_selection").click(function(){
	
		$(".confirm_selection_size").remove();
		$("span.sentence").off("click",null,null,sentenceClick);
		
		if ($(".selected").length > 0) {
			
			var ids = new Array();
			var text = '';
			var selected_items = $(".selected");
			var selected_items_length = selected_items.length;
			for (var selected_pos = 0; selected_pos < selected_items_length; selected_pos++){
				var item = $(selected_items.get(selected_pos));
				ids[ids.length] = item.attr('id');
				text += item.text();
			}
			$(".selected").removeClass("selected");
			openCreateConsultationDialog(JSON.stringify(ids),text);
		} else {
			reloadAnnotations(false);
		}
	});
	return true;
}

function enableUnderlineMode(color){
	underlineColor = color;
	disableAll();
	$("span.sentence").on("click",null,null,underlineSentenceClick);
	$("body").prepend("<div class=\"confirm_selection_size\"></div>");
	$("body").append("<button id=\"confirm_selection\" class=\"confirm_selection_size\">" + I18N('confirm_annotation_selection') + "</button>");
	$("#confirm_selection").css("top",$(window).scrollTop());
	$("#confirm_selection").click(function(){
	
		$(".confirm_selection_size").remove();
		$("span.sentence").off("click",null,null,underlineSentenceClick);
		
		if ($(".selected").length > 0) {
			var ids = new Array();
			var selected_items = $(".selected");
			var selected_items_length = selected_items.length;
			for (var selected_pos = 0; selected_pos < selected_items_length; selected_pos++){
				var item = $(selected_items.get(selected_pos));
				ids[ids.length] = item.attr('id');
			}
			$(".selected").removeClass("selected");
			storeUnderlines(JSON.stringify(ids),underlineColor);
		}
		reloadAnnotations(false);
	});
	return true;
}

selected_sentences = 0;
first_sentence = -1;
last_sentence = -1;

function selectionMode(color){
	underlineColor = color;
	selected_sentences = 0;
	first_sentence = -1;
	last_sentence = -1;
	clearSelectedIds();
	disableAll();
	
	$("span.sentence").on("click",null,null,function(){
		var pthis = $(this);
		var currentId = parseInt(pthis.attr("data_sentence"));
		if (selected_sentences == 0){
			first_sentence = currentId;
			last_sentence = currentId;
			pthis.addClass("selected").css('background-color',underlineColor);
			addSelectedIds(pthis.attr("id"),pthis.text());
			selected_sentences++;
		} else {
			if ((currentId == (first_sentence - 1)) || (currentId == (last_sentence + 1))){
				pthis.addClass("selected").css('background-color',underlineColor);
				addSelectedIds(pthis.attr("id"),pthis.text());
				if (currentId < first_sentence) first_sentence = currentId;
				if (currentId > last_sentence) last_sentence = currentId;
				selected_sentences++;
			} else if ((currentId == first_sentence) || (currentId == last_sentence)) {
				pthis.removeClass("selected").css('background-color','');
				removeSelectedIds(pthis.attr("id"));
				if (currentId == first_sentence) first_sentence++;
				if (currentId == last_sentence) last_sentence--;
				selected_sentences--;
			}
		}
	});
	return true;
}

function reloadAnnotations(total_reload){
	if (total_reload === true){
		annotations = loadAnnotations(currentPage);
	}
	
	var annotations_length = annotations.length;
	for (var i = 0; i < annotations_length; i++){
		var annotation = annotations[i];
		var ids = JSON.parse(annotation['ids']);
		for (var id_pos = 0; id_pos < ids.length; id_pos++){
			var id = ids[id_pos];
			$("#"+id)
				.css('background-color', annotation['color'])
				.addClass("annotation");
		}
		if (annotation['underline'] != 1){
			var id = ids[0];
			$("<img></img>")
				.addClass("mark")
				.attr("alt",I18N("annotation"))
				.attr("src",assetsBase + "/img/annotation.png")
				.attr("annotation",i)
				.click(function(){
					var annotation_pos = $(this).attr("annotation");
					var annotation = annotations[annotation_pos];
					openAnnotationDialog(annotation);
				})
				.insertBefore($("#"+id));
		}
	}
}

function reloadConsultations(total_reload){
	if (total_reload === true){
		consultations = loadConsultations(currentPage);
	}
	
	var consultations_length = consultations.length;
	for (var i = 0; i < consultations_length; i++){
		var consultation = consultations[i];
		var ids = JSON.parse(consultation['ids']);
		var id = ids[0];
		$("<img></img>")
			.addClass("mark")
			.attr("alt",I18N("consultation"))
			.attr("src",assetsBase + "/img/consultation.png")
			.attr("consultation",i)
			.click(function(){
				var pos = $(this).attr("consultation");
				var consultation = consultations[pos];
				showConsultation(consultation);
			})
		.insertBefore($("#"+id));
	}
}

function disableAll(){
	$(".mark").remove();
	$(".selected").off("click").css('background-color', '').removeClass("selected");
	$("span.sentence").off("click");
	$(".consultation").off("click").removeClass(".consultation");
	$(".annotation").off("click").css('background-color', '').removeClass("annotation");
}


function reloadInfo(reload) {
	disableAll();
	reloadAnnotations(reload);
	reloadConsultations(reload);
}

function init(){
	try {
		currentPage = document.location.href;
		var pageInfo = getPageInfo(currentPage);
		if (pageInfo == null) {
			hideLoading();
			console.log("No page info...");
			return;
		}
		fileMD5 = pageInfo['md5'];
		var previousPage = pageInfo["prev"];
		var nextPage = pageInfo['next'];
		var offset = pageInfo['offset'];
		var fragmentId = pageInfo['fragmentId'];
		loginToken = pageInfo['loginToken'];
		screenHeight = pageInfo['screenHeight'];
		assetsBase = pageInfo['assetsBase'];

		if (previousPage){
			var link_image = $("<img />");
			link_image.attr("src",assetsBase + "/img/arrow_left.png");
			link_image.width("100px");
			link_image.height("100px");
			link_image.click(function(){
				showLoading();
				saveCurrentPos(previousPage,-1);
				document.location.href = previousPage;
			});
			$("body").prepend(link_image);
		}
		if (nextPage){
			var container = $("<div />");
			container.width("100%");
			container.css("clear","both");
			var link_image = $("<img />");
			link_image.attr("src",assetsBase + "/img/arrow_right.png");
			link_image.width("100px");
			link_image.height("100px");
			link_image.css("float", "right");
			link_image.click(function(){
				showLoading();
				saveCurrentPos(nextPage,1);
				document.location.href = nextPage;
			});
			container.append(link_image);
			$("body").append(container);
		}
			// TODO swipe
			// TODO scroll
			// TODO flechas
			// TODO adv pag / Re pag
			// TODO swipe left / right
			
			
		// divide into sentences
		divideInto($("body"),".","sentence");
		var last_pos = $("span.sentence").length - 1;
		$("span.sentence").each(function(pos,value){
			$(this).attr("id","sentence_" + pad(pos,5)).attr("data_sentence",pos);
			if (pos == last_pos){
				reloadInfo(true);
			}
		});
		
		initActivities();
		
		var scrollPoint = 5;
		
		if (offset > 0){
			scrollPoint = offset;
		} else if (offset == -1){
			scrollPoint = document.body.scrollHeight - screenHeight - 1;
		} else {
			var fragmentElement = $("#"+fragmentId);
			if (fragmentElement.length){
				scrollPoint = fragmentElement.offset().top;
			}
		}
		
		setTimeout("$(document).scrollTop(" + scrollPoint + "); $(window).scroll($.debounce( 250, scrollManage )); hideLoading();", 500);
	} catch (error) {
		// FIXME mensaje de error o algo
		console.log("Error: " + error);
	}
	hideLoading();
};
