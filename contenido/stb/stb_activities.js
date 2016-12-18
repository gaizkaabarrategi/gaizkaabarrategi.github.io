function shuffle (o){
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

// ************* DRAG'N'DROP

draggedElement = null;

function stb_drag(e){
	if (draggedElement){
		draggedElement.css({
			'left' : getPageX(e) - draggedElement.offsetX,
			'top' : getPageY(e) - draggedElement.offsetY,
		});
	}
};

function stb_drop(e){
	if (draggedElement){
		if (destinationActivity.isInsideImage(e)){
			destinationActivity.addElementToCanvas(draggedElement);
		}
		draggedElement.remove();
		draggedElement = null;
	}
	$(document).off(M_MOVE_EVENT,stb_drag);
	$(document).off(M_END_EVENT,stb_drop);
};

// *************************


function reload(e){
	e.contents().each(function(){
		var pthis = $(this);
		if (!this.tagName) return;
		if (this.tagName.toLowerCase() == 'img'){
			var new_img = $("<img/>");
			new_img.attr('src',pthis.attr('src'));
			new_img.attr('style',pthis.attr('style'));
			pthis.replaceWith(new_img);
		} else if (this.tagName.toLowerCase() == 'audio'){
			try {
				var src = pthis.find("source").attr("src");
				src = src.substring(0,src.lastIndexOf("."));
				var audio = new STBAudioPlayer({
					audiofile: src,
					init_selection: true,
				});
				pthis.replaceWith(audio.getRootDiv());
			} catch (error){};
		} else if (this.tagName.toLowerCase() == 'a'){
			var link = $("<a/>");
			link.attr("href",pthis.attr("href"));
			link.attr("target",pthis.attr("target"));
			link.append(pthis.contents());
			pthis.replaceWith(link);
		} else if (this.tagName.toLowerCase() == 'br'){
			pthis.replaceWith($("<br/>"));
		} else if (this.tagName.toLowerCase() == 'ul'){
			var list = $("<ul />");
			pthis.contents().each(function(){
				var pcthis = $(this);
				if (this.tagName == 'li'){
					var li = $('<li />');
					li.append(pcthis.contents());
					list.append(li);
				};
			});
			pthis.replaceWith(list);
		}
	});
	return e.contents();
};

function WeblabActivity(element){

	this.generateHTML = function(){
		var activity_div = $("<div class='stb_activity' />");

		var question = $('<div/>');
		question.addClass('stb_question');
		question.append(element.find('stb_question').contents());
		reload(question);
		activity_div.append(question);

		var lab_iframe = $("<iframe  width='100%' height='400' />");
		generateWebLabURL(element.find('laboratory').text(), function(url){
			lab_iframe.attr('src',url);
		});
		activity_div.append(lab_iframe);


		return activity_div;
	};
}

function AudioMarkingActivity(element) {
	this.uuid = element.attr("uuid");
	this.element = element;
	var activity = this;
	this.selectedX = 0;
	this.ranges = [];
	this.options = [];
	this.visibleoptions = [];
	this.selectedMark = null;

	this.generateHTML = function(){
		var activity_div = $("<div />").addClass("stb_activity");

		var question = $('<div/>');
		question.addClass('stb_question');
		question.append(element.find('stb_question').contents());
		reload(question);
		activity_div.append(question);

		var config = element.find("config");

		var player_width = 1000;
		var player_height = 50;

		var audio_player = new STBAudioPlayer({
			width:	player_width,
			height:	player_height,
			audiofile: config.attr("audiofile"),
			init_selection: true,
			create_ranges: config.attr("allow_create_ranges") == 'true',
		});
		activity_div.append(audio_player.getRootDiv());
		// known marks
		audio_player.onAudioLoad(function(){
			element.find("ranges range").each(function(){
				var pthis = $(this);
				if (pthis.attr("show") == 'true'){
					var r = {
						init:		parseFloat(pthis.attr("init")),
						end:		parseFloat(pthis.attr("end")),
						solution:	pthis.attr("solution"),
						accuracy:	pthis.attr("accuracy"),
						fixed:		true,
					};
					activity.ranges.push(r);
					audio_player.addMark(r);
				}
			});
		});
		var extra_div = $("<div/>").css({
			'border': '1px solid #000000',
			'display' : 'inline-block',
			'vertical-align' : 'middle',
			'margin' : '5px',
			'position':'relative',
			'left':'0px',
			'top':'0px',
			'height':'130px',
			'width':'200px',
		});
		var edit_div = $("<div/>").css({
			'position':'absolute',
			'padding': '5px',
			'left':0,
			'top':0,
		}).hide();
		edit_div.append($("<div/>")
			.append("Desde ")
			.append($("<input/>").addClass("from"))
			.append("Hasta ")
			.append($("<input/>").addClass("to"))
		);
		edit_div.append($("<div/>")
			.append("Etiqueta: ")
			.append($("<select/>").append($("<option/>").append("-")))
		);
		extra_div.append(edit_div);


		var dub_div = $("<div/>").css({
			'position':'absolute',
			'padding': '5px',
			'left':0,
			'top':0,
		});
		extra_div.append(dub_div);

		activity_div.append(extra_div);

		var options_div = $("<div />");

		var options_ids = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var id_pos = 0;

		element.find("options option").each(function(){
			var pthis = $(this);
			var opt = {
				id:		pthis.attr("id"),
				show:		pthis.attr("show"),
				text:		pthis.text().trim(),
				audiofile:	pthis.attr("audiofile"),
				type:		pthis.attr("audiofile")?"AUDIO":"HTML",
			};
			activity.options.push(opt);
			
			if (opt.show == 'true'){
				var option_div = $("<div />").css({
					'margin': '10px',
		
				});
				var index = options_ids.charAt(id_pos++);
				activity.visibleoptions[index] = opt;
				var index_div = $("<div />")
					.css({
						'border': '1px solid #000000',
						'padding': '5px',
						'width' : '25px',
						'height' : '25px',
						'text-align':'center',
						'display' : 'inline-block',
						'margin' : '5px',
					})
					.append($("<span/>").append(index).css('vertical-align','middle'));
				option_div.append(index_div);
				if (opt.audiofile){
					opt.content_div = $("<div/>").css({
						"display":"inline-block",
						'vertical-align':'middle',
					}).append(new STBAudioPlayer({
						audiofile: opt.audiofile,
					}).getRootDiv());
				} else {
					opt.content_div = $("<div/>").css('display', 'inline-block').append(pthis.contents().clone());
				}
				option_div.append(opt.content_div);
				options_div.append(option_div);
				edit_div.find("select").append(
					$("<option/>").append(index)
				);
			};
		});
		if (config.attr("allow_create_options") == 'true'){
			var create_option = $("<button />")
				.css({
					'padding': '5px',
					'width' : '37px',
					'height' : '37px',
					'text-align':'center',
					'display' : 'inline-block',
					'margin' : '15px',
				})
				.append($("<span/>").append("+").css('vertical-align','middle'))
				.click(function(){
					var option_div = $("<div />").css({
						'margin': '10px',
					});
					var opt = {
						id:		-1,
						show:		true,
						text:		'',
						audiofile:	null,
						type:		'INPUT',
					};
					var index = options_ids.charAt(id_pos++);
					activity.visibleoptions[index] = opt;
					var index_div = $("<div />")
						.css({
							'border': '1px solid #000000',
							'padding': '5px',
							'width' : '25px',
							'height' : '25px',
							'text-align':'center',
							'display' : 'inline-block',
							'margin' : '5px',
						})
						.append($("<span/>").append(index).css('vertical-align','middle'));
					option_div.append(index_div);
					opt.content_div = $("<div/>").css('display', 'inline-block').append($("<input/>"));
					option_div.append(opt.content_div);
					create_option.before(option_div);
					edit_div.find("select").append(
						$("<option/>").append(index)
					);
				});
			options_div.append(create_option);
		};

		activity_div.append(options_div);

		audio_player.onMarkSelected(function(m){
			activity.selectedMark = m;
			if (m){
				var disabled = m.fixed?"disabled":null;
				
				edit_div.show();
				dub_div.hide();
				edit_div.find(".from").val(m.init).attr("disabled",disabled);
				edit_div.find(".to").val(m.end).attr("disabled",disabled);
				if (m.tag){
					edit_div.find("select").val(m.tag);
				} else {
					edit_div.find("select").val("-");
				};

				edit_div.find("select").change(function(){
					var tag = edit_div.find("select").val();
					activity.selectedMark.tag = tag;
					if (tag == "-"){
						audio_player.setMarkAudio(activity.selectedMark,null);
					} else {
						if (activity.visibleoptions[tag].audiofile){
							audio_player.setMarkAudio(activity.selectedMark,activity.visibleoptions[tag].audiofile);
						} else {
							audio_player.setMarkAudio(activity.selectedMark,null);
						};
					};
				});
			} else {
				dub_div.show();
				edit_div.hide();
			};
		});

		audio_player.addStatusListener(function(playing){
			if (playing){
				edit_div.hide();
				dub_div.show();
			} else {
				edit_div.hide();
				dub_div.show();
			}
		});

		audio_player.audio.listenPlayback(function(time){
			var currentRange = null;
			for (var i = 0; i < activity.visible_ranges.length; i++){
				var r = activity.visible_ranges[i];
				if (r.init <= time && r.end >= time){
					currentRange = r;
					break;
				};
			};
			if (currentRange != activity.playingRange){
				activity.playingRange = currentRange;
				dub_div.empty();
				if (currentRange && currentRange.tag ){
					var opt = activity.visibleoptions[currentRange.tag];
					if (opt) {
						if (opt.type == "HTML"){
							dub_div.append(opt.content_div.clone());
						} else if (opt.type == "INPUT"){
							dub_div.append(opt.content_div.find("input").val());
						}
					};
				};
			};
		});

		return activity_div;
	};

	this.correct = function(){
	};
};

// *********************************************************+
// IMAGE MARKING
// *********************************************************+

function ImageMarkingActivity(element){
	this.uuid = element.attr("uuid");
	this.element = element;
	var activity = this;
	this.options = new Array();
	this.tags = new Array();
	this.serializer = new XMLSerializer();
	this.canvasElements = [];
	this.canvasElementsCorrections = [];
	this.canvasImages = {};

	this.generateHTML = function(){
		var activity_div = $("<div class='stb_activity' />");

		var table = $("<table />").attr("cellpadding","10");
		var table_row = $("<tr />");
		table.append(table_row);
		
		var left_cell = $("<td />");
		var right_cell = $("<td />");
		table_row.append(left_cell);
		table_row.append(right_cell);
		activity_div.append(table);
		
		var question = $('<div/>').css({
			'margin-bottom':'15px',
		});
		question.addClass('stb_question');
		question.append(element.find('stb_question').contents());
		reload(question);
		left_cell.append(question);

		this.canvas = $("<canvas/>");

		this.canvas.css({
			'border':'1px solid black',
			'display': 'inline-block',
		});

		this.canvas.bind(M_START_EVENT,function(e){
			var x = getPageX(e) - activity.canvas.offset().left;
			var y = getPageY(e) - activity.canvas.offset().top;
			for (var i = 0; i < activity.canvasElements.length; i++){
				var element = activity.canvasElements[i];
				if (x >= element['x'] && x <= (element['x'] + element['w']) &&
					y >= element['y'] && y <= (element['y'] + element['h'])){
					activity.selectedElement = element;
					activity.selectedElement.offsetX = x - element['x'];
					activity.selectedElement.offsetY = y - element['y'];
					break;
				};
			};
			e.preventDefault();
		});

		this.canvas.bind(M_MOVE_EVENT, function(e){
			if (activity.selectedElement == null) return;
			activity.selectedElement['x'] = getPageX(e) - activity.canvas.offset().left - activity.selectedElement.offsetX;
			activity.selectedElement['y'] = getPageY(e) - activity.canvas.offset().top - activity.selectedElement.offsetY;
			activity.redrawImage();
		});

		this.canvas.bind(M_END_EVENT, function(e){
			activity.selectedElement = null;
		});

		this.backgroundImage = new Image();
		this.backgroundImage.src = activity.element.find("config").attr('background_img');
		this.backgroundImage.onload = function (){
			activity.canvas[0].width = activity.backgroundImage.naturalWidth;
			activity.canvas[0].height = activity.backgroundImage.naturalHeight;
			activity.redrawImage();
		};
		right_cell.append(this.canvas);
		
		var elements_div = $('<div/>')
			.css({
				'border': '1px solid #CCCCCC',
				'display': 'block',
				});

		this.element.find('stb_option').each(function(index){
			var container = $('<div/>')
				.css({
					'position': 'relative',
					'top': '0px',
					'left': '0px',
				});
			
			var selector = $(this).find("selector");
			var description = $(this).find("description");
			
			var option = $('<div/>').css('display', 'inline-block').disableSelection();;
			
			if (selector.find("img").length == 0){
				option.css({
					'background-color': '#DDDDDD',
					'opacity': 0.6,
					'font-size': '15px',
					'font-family' : 'Arial',
				});
			}
			option.css('margin','5px 5px 5px 5px');
			option.css('padding','2px 2px 2px 2px');
			option.css('z-index', 1);
			option.element = selector;
			option.append(selector.contents().clone());
			option.pos = index;
			reload(option);
			activity.options[index] = option;
			option.bind(M_START_EVENT, function(e){
				destinationActivity = activity;
				draggedElement = option.clone();
				draggedElement.pos = option.pos;
				draggedElement.offsetX = getPageX(e) - option.offset().left + 5;
				draggedElement.offsetY = getPageY(e) - option.offset().top + 5;
				draggedElement.css({
					'position': 'absolute',
					'opacity': 0.5,
					'left' : getPageX(e) - draggedElement.offsetX,
					'top' : getPageY(e) - draggedElement.offsetY,
				});
				$('body').append(draggedElement);
				$('html').on(M_MOVE_EVENT,stb_drag);
				$('html').on(M_END_EVENT,stb_drop);
				e.preventDefault();
			});

			container.append(option);
			var option_desc = $("<div />").css('display', 'inline-block');
			option_desc.append(description.contents().clone());
			reload(option_desc);
			container.append(option_desc);

			elements_div.append(container);
		});

		left_cell.append(elements_div);

		
		return activity_div;
	};

	this.isInsideImage = function(e){
		var x = getPageX(e);
		var y = getPageY(e);
		var x1 = this.canvas.offset().left;
		var x2 = x1 + this.canvas.width();
		var y1 = this.canvas.offset().top;
		var y2 = y1 + this.canvas.height();

		return (x >= x1 && x <= x2 && y >= y1 && y <= y2);
	};

	this.addElementToCanvas = function(element_org){
		var element = {
			'x': element_org.offset().left - this.canvas.offset().left,
			'y': element_org.offset().top - this.canvas.offset().top,
			'text': element_org.text(),
			'pos' : element_org.pos,
		};
		if (element_org.find("img").length > 0){
			element['img'] = element_org.find("img").attr("src");
			if (!(element['img'] in this.canvasImages)){
				var img = new Image();
				img.src = element['img'];
				img.onload = function(){
					element['w'] = img.naturalWidth;
					element['h'] = img.naturalHeight;
				};
				this.canvasImages[element['img']] = img;
			} else {
				var img = activity.canvasImages[element['img']];
				element['w'] = img.naturalWidth;
				element['h'] = img.naturalHeight;
			};
		} else {
			var canvas = this.canvas[0];
			var context = canvas.getContext("2d");
			context.font = "15px Arial";
			var ts = context.measureText(element['text']);
			element['w'] = ts.width;
			element['h'] = 15;
		};
		this.canvasElements.push(element);
		this.redrawImage();
	};

	this.redrawImage = function(){
		var canvas = this.canvas[0];
		var context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(this.backgroundImage,0,0);
		var w = canvas.width;
		var h = canvas.height;
		for (var i = 0; i < this.canvasElements.length; i++){
			var element = this.canvasElements[i];
			var x = element['x'];
			var y = element['y'];
			var w = element['w'];
			var h = element['h'];
			var back = false;
			if (element.correct){
				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.fillStyle = 'rgba(0,255,0,0.3)';
				context.fill();
				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.strokeStyle = 'rgba(0,255,0,1)';
				context.stroke();
				back = true;
			} else if (element.failed){
				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.fillStyle = 'rgba(255,0,0,0.6)';
				context.fill();
				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.strokeStyle = 'rgba(255,0,0,1)';
				context.stroke();
				back= true;
			};

			if (element['img']){
				var img = this.canvasImages[element['img']];
				if (img)
					context.drawImage(img,x,y);
			} else {
				if (!back){
					context.beginPath();
					context.rect(x-2, y, w+4, h+4);
					context.fillStyle = 'rgba(221,221,221,0.6)';
					context.fill();
				};

				var text = element['text'];
				context.font = "15px Arial";
				context.fillStyle = 'black';
				context.fillText(text,x,y + h);
			};
		}
		for (var i = 0; i < this.canvasElementsCorrections.length; i++){
			var element = this.canvasElementsCorrections[i];
			var x = element['x'];
			var y = element['y'];
			var w = element['w'];
			var h = element['h'];
			if (element.correct){
				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.fillStyle = 'rgba(0,255,0,0.3)';
				context.fill();
				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.strokeStyle = 'rgba(255,0,0,1)';
				context.stroke();
			};

			if (element['img']){
				var img = this.canvasImages[element['img']];
				if (img)
					context.drawImage(img,x,y);
			} else {

				context.beginPath();
				context.rect(x-2, y, w+4, h+4);
				context.fillStyle = 'rgba(221,221,221,0.6)';
				context.fill();

				var text = element['text'];
				context.font = "15px Arial";
				context.fillStyle = 'black';
				context.fillText(text,x,y + h);
			};
		}
	}

	this.correct = function(){
		activity.canvasElementsCorrections = [];
		for (var i = 0; i < activity.canvasElements.length; i++){
			var element = activity.canvasElements[i];
			element.used = false;
			element.correct = false;
			element.failed = false;
		}

		this.element.find('stb_location').each(function(){
			var item = $(this);
			var item_x = parseFloat(item.attr('x'));
			var item_y = parseFloat(item.attr('y'));
			var correct_distance = parseFloat(item.attr('r'));
			var correct_option = parseInt(item.attr("pos"));
			for (var i = 0; i < activity.canvasElements.length; i++){
				var element = activity.canvasElements[i];
				if (element.used) continue;
				if (element.pos != correct_option) continue;
				var dx = (element['x'] + element['w']/2) / activity.canvas.width() - item_x;
				var dy = (element['y'] + element['h']/2) / activity.canvas.height() - item_y;
				var distance = Math.sqrt(dx * dx + dy * dy);
				if (distance < correct_distance){
					element.used = true;
					element.correct = true;
					return;
				};
			}
			var element_org = activity.options[correct_option];
			var element = {
				'x': item_x * activity.canvas.width(),
				'y': item_y * activity.canvas.height(),
				'text': element_org.text(),
				'pos' : element_org.pos,
			};
			element.correct = true;
			if (element_org.find("img").length > 0){
				element['img'] = element_org.find("img").attr("src");
				if (!(element['img'] in activity.canvasImages)){
					var img = new Image();
					img.src = element['img'];
					img.onload = function(){
						element['w'] = img.naturalWidth;
						element['h'] = img.naturalHeight;
						activity.redrawImage();
					};
					activity.canvasImages[element['img']] = img;
				} else {
					var img = activity.canvasImages[element['img']];
					element['w'] = img.naturalWidth;
					element['h'] = img.naturalHeight;
				};
			} else {
				var canvas = activity.canvas[0];
				var context = canvas.getContext("2d");
				context.font = "15px Arial";
				var ts = context.measureText(element['text']);
				element['w'] = ts.width;
				element['h'] = 15;
			};
			activity.canvasElementsCorrections.push(element);
		});

		for (var i = 0; i < activity.canvasElements.length; i++){
			var element = activity.canvasElements[i];
			if (!element.used)
				element.failed = true;
		}
		activity.redrawImage();
	};
	
	this.save = function(){
		return  this.canvasElements;
	};
	
	this.load = function(value){
		this.canvasElements = [];
		for (var i = 0; i < value.length; i++){
			var v = value[i];
			if ("img" in v){
				if (!(v['img'] in this.canvasImages)){
					var img = new Image();
					img.src = v['img'];
					this.canvasImages[v['img']] = img;
				}
			};
			this.canvasElements.push(v);
		}
		this.redrawImage();
	}
}

function UnderliningActivity(element){
	this.uuid = element.attr("uuid");
	var config = element.find("config");
	this.mark = config.attr('mark');
	var activity = this;

	this.generateHTML = function(){
		var activity_div = $("<div class='stb_activity' />");

		var question = $('<div class="stb_question"/>');
		question.append(element.find('stb_question').contents());
		activity_div.append(question);
		reload(question);

		this.content_div = $('<div />');
		this.content_div.append(element.find('stb_content').contents());
		reload(this.content_div);
		if (this.mark == 'word'){
			divideInto(this.content_div," ","stb_underlining_activity_item");
		} else if (this.mark == 'sentence'){
			divideInto(this.content_div,".","stb_underlining_activity_item");
		};
		this.content_div.find(".stb_underlining_activity_item").click(function(){
			$(this).toggleClass("stb_underlining_activity_selected");
		});
		activity_div.append(this.content_div);
		

		return activity_div;
	};

	this.correct = function(){
		this.content_div.find(".stb_correct").removeClass("stb_correct");
		this.content_div.find(".stb_fail").removeClass("stb_fail");
		this.content_div.find(".stb_correct_icon").remove();
		this.content_div.find(".stb_fail_icon").remove();
		this.content_div.find("stb_solution span.stb_underlining_activity_item").addClass("stb_correct");
		this.content_div.find("stb_solution span.stb_underlining_activity_item").each(function(){
			var mark_div;
			if ($(this).hasClass("stb_underlining_activity_selected"))
				mark_div = $("<div class='stb_correct_icon' />");
			else
				mark_div = $("<div class='stb_fail_icon' />");
			$(this).before(mark_div);
		});
		this.content_div.find("stb_solution .stb_underlining_activity_selected").removeClass("stb_underlining_activity_selected");
		this.content_div.find(".stb_underlining_activity_selected").addClass("stb_fail").each(function(){
			var mark_div = $("<div class='stb_fail_icon' />");
			$(this).before(mark_div);
		});;
		this.content_div.find(".stb_underlining_activity_selected").removeClass("stb_underlining_activity_selected");
	};
	
	this.save = function(){
		var serializer = new XMLSerializer();
		var value = {};
		this.content_div.find("span.stb_underlining_activity_item").each(function(index){
			if ($(this).hasClass("stb_underlining_activity_selected")){
				value[index] = $(this).hasClass("stb_underlining_activity_selected");
			}
		});
		return value;
	};
	
	this.load = function(value){
		this.content_div.find(".stb_underlining_activity_selected").removeClass("stb_underlining_activity_selected");
		this.content_div.find("span.stb_underlining_activity_item").each(function(index){
			if (index in value){
				$(this).addClass("stb_underlining_activity_selected");
			}
		});
	};
};

function ReplaceActivity(element){
	this.uuid = element.attr("uuid");
	this.children = element.contents();
	this.html_inputs = new Array();
	var activity = this;

	this.generateHTML = function(){
		var activity_div = $("<div class='stb_activity' />");

		var question = $('<div class="stb_question"/>');
		question.append(element.find('stb_question').contents());
		reload(question);
		activity_div.append(question);

		var content_div = $('<div />');
		content_div.append(element.find('stb_content').contents());
		reload(content_div);
		content_div.find('stb_item').each(function(){
			var element = $(this);

			var element_div = $('<div class="stb_inline" />');

			if (element.attr('options')){
				var input = $('<select class="stb_empty"/>');
				var options = element.attr('options').split(',');
				for (var j = 0; j < options.length; j++){
					var option_item = $('<option>');
					option_item.attr('value',options[j]);
					option_item.append(options[j]);
					input.append(option_item);
				};
			} else {
				var input = $('<input type="text"/>');
				input.attr('value',element.text());
			};
			input.solution = element.attr('solution');
			element_div.append(input);
			element.replaceWith(element_div);
			activity.html_inputs.push(input);
		});	


		activity_div.append(content_div);

		return activity_div;
	};

	this.correct = function(){
		for (var i = 0; i < this.html_inputs.length; i++){
			var input =  this.html_inputs[i];
			
			if (input.correction_mark)
				input.correction_mark.remove();
			if (input.correct_value_mark)
				input.correct_value_mark.remove();
			
			var mark_div;

			var value = input.val();
			var solutions = input.solution.split(",");
			input.removeClass('stb_empty');
			if (solutions.indexOf(value) != -1) {
				mark_div = $("<div class='stb_correct_icon' />");
				input.removeClass('stb_fail');
				input.addClass('stb_correct');
			} else {
				mark_div = $("<div class='stb_fail_icon' /> ");
				var correct_value = $('<div class="stb_correct" />');
				correct_value.append("[ "+input.solution +" ]");
				input.removeClass('stb_correct');
				input.addClass('stb_fail');
				input.before(correct_value);
				input.correct_value_mark = correct_value;
			};
			input.parent().before(mark_div);
			input.correction_mark = mark_div;
		};
	};
	
	this.save = function(){
		var value = new Array();
		for (var i = 0; i < this.html_inputs.length; i++){
			var input =  this.html_inputs[i];
			value[i] = input.val();
		}
		return value;
	};
	
	this.load = function(value){
		for (var i = 0; i < this.html_inputs.length; i++){
			var input =  this.html_inputs[i];
			input.val(value[i]);
		}
	}
};

function ColumnsActivity(element){
	this.uuid = element.attr("uuid");
	var column_activity = this;
	this.fixed = new Array();
	this.options = new Array();
	this.html_selects = new Array();

	element.find("stb_fixed").each(function(){
		var fixed_elements = $(this);
		fixed_elements.find("stb_item").each(function(index){
			var fixed_element = $(this);
			var solution = fixed_element.attr('solution');
			var fixed = {
				'content': fixed_element.contents(),
				'solution': solution,
				'pos': index,
			};
			column_activity.fixed.push(fixed);
			if (column_activity.options.indexOf(solution) == -1)
				column_activity.options.push(solution);
		});

		if (fixed_elements.attr('shuffle') === 'true'){
			column_activity.fixed = shuffle(column_activity.fixed);
		};
	});
	
	element.find("stb_options").each(function(){
		var options_elements = $(this);
		options_elements.find("stb_item").each(function(){
			var option = $(this).text();
			if (column_activity.options.indexOf(option) == -1)
				column_activity.options.push(option);
		});
		if (options_elements.attr('shuffle') === 'true'){
			column_activity.options = shuffle(column_activity.options);
		};
	});

	this.generateHTML = function(){
		var activity_div = $("<div class='stb_activity' />");

		var question = $('<div class="stb_question"/>');
		question.append(element.find('stb_question').contents());
		reload(question);
		activity_div.append(question);

		var table = $('<table class="stb_columns" />');
	
		for (var i = 0; i < this.fixed.length; i++){
			var fixed =  this.fixed[i];

			var row = $('<tr />');

			var fixed_cell = $('<td />');
			fixed_cell.append(fixed['content']);
			reload(fixed_cell);
			row.append(fixed_cell);

			var options_cell = $('<td />');
			var options_select = $('<select style="width: auto;" class="stb_empty"/>');
			for (var j = 0; j < this.options.length; j++){
				var option_item = $('<option />');
				option_item.attr('value',(this.options[j] == fixed['solution'])?1:0);
				option_item.append(this.options[j]);
				options_select.append(option_item);
			};
			options_select.row = row;
			options_select.pos = fixed['pos']; 
			this.html_selects.push(options_select);
			options_cell.append(options_select);
			row.append(options_cell);

			table.append(row);
		};

		activity_div.append(table);

		return activity_div;
	};

	this.correct = function(){
		for (var i = 0; i < this.html_selects.length; i++){
			var opt = this.html_selects[i];
			
			if (opt.correction_mark)
				opt.correction_mark.remove();
			if (opt.correct_value_mark)
				opt.correct_value_mark.remove();
			
			var mark_div;
			opt.removeClass('stb_empty');
			if (opt.val() == 1){
				mark_div = $("<div class='stb_correct_icon' />");
				opt.removeClass('stb_fail');
				opt.addClass('stb_correct');
			} else {
				mark_div = $("<div class='stb_fail_icon' />");
				opt.addClass('stb_fail');
				opt.removeClass('stb_correct');
				var correct_value = $('<span class="stb_correct" />');
				correct_value.append(opt.find("option[value=1]").text());
				var correct_value_cell = $('<td />');
				correct_value_cell.append(correct_value);
				opt.row.append(correct_value_cell);
				opt.correct_value_mark = correct_value_cell;
			};
			opt.before(mark_div);
			opt.correction_mark = mark_div;
		};
	};
	
	this.save = function(){
		var value = new Array();
		for (var i = 0; i < this.html_selects.length; i++){
			var opt = this.html_selects[i];
			value[opt.pos] = opt.find('option:selected').text();
		}
		return value;
	};
	
	this.load = function(value){
		for (var i = 0; i < this.html_selects.length; i++){
			var opt = this.html_selects[i];
			var text = value[opt.pos];
			opt.find("option").each(function(){
				var option = $(this);
				option.attr("selected",option.text() == text);
			});
		}
	}
};

function TestActivity(test_element){
	this.uuid = test_element.attr("uuid");
	this.options = new Array();
	var config = test_element.find("config");
	this.multiple = config.attr('multiple');
	this.shuffle = config.attr('shuffle');
	var test_activity = this;

	test_element.find("stb_option").each(function(index){
		var element = {
			'correct': $(this).attr('correct'),
			'content' : $(this).contents(),
			'pos': index,
		};
		test_activity.options.push(element);
	});

	if (this.shuffle === 'true'){
		test_activity.options = shuffle(test_activity.options);
	};

	this.correct = function(){
		for (var i = 0; i < this.options.length; i++){
			var opt = this.options[i];
			
			if (opt.correction_mark)
				opt.correction_mark.remove();
			
			var mark_div;
			if (opt['correct']){
				mark_div = $("<div class='stb_correct_icon' />");
			} else if (opt.opt_input.is(":checked")){
				mark_div = $("<div class='stb_fail_icon' />");
			} else {
				mark_div = $("<div class='stb_empty_icon' />");
			}
			opt.opt_input.before(mark_div);
			opt.correction_mark = mark_div;
		};
	};

	this.generateHTML = function(){
		var div = $("<div class='stb_activity' />");
		var query = $('<div class="stb_question" />');
		query.append(test_element.find('stb_question').contents());
		reload(query);
		div.append(query); 
		var form = $("<form></form>");
		// multiple
		for (var i = 0; i < this.options.length; i++){
			var opt_div = $("<div class='stb_test_option'></div>");
			if (this.multiple === 'true'){
				var opt_input = $("<input type='checkbox' name='opt'></input>");
			} else {
				var opt_input = $("<input type='radio' name='opt'></input>");
			}
			opt_div.append(opt_input);
			opt_div.append(this.options[i]['content']);
			reload(opt_div);
			this.options[i].opt_input = opt_input;
			form.append(opt_div);
		};
		div.append(form);
		return div;
	};

	this.save = function(){
		var value = new Array();
		for (var i = 0; i < this.options.length; i++){
			var opt = this.options[i];
			value[opt['pos']] = opt.opt_input.is(":checked");
		};
		return value;
	};
	
	this.load = function(value){
		for (var i = 0; i < this.options.length; i++){
			var opt = this.options[i];
			opt.opt_input.attr("checked",value[opt['pos']]);
		}
	};
};

function ActivityGroup(group_element){
	this.uuid = group_element.attr("uuid");
	this.activities = {};
	var activity_group = this;
	// test
	group_element.children().each(function(){
		var activity = null;
		if (this.nodeName == "stb_test")
			activity = new TestActivity($(this));
		else if (this.nodeName == 'stb_columns')
			activity = new ColumnsActivity($(this));
		else if (this.nodeName == 'stb_replace')
			activity = new ReplaceActivity($(this));
		else if (this.nodeName == 'stb_underlining')
			activity = new UnderliningActivity($(this));
		else if (this.nodeName == 'stb_image_marking')
			activity = new ImageMarkingActivity($(this));
		else if (this.nodeName == 'stb_audio_marking')
			activity = new AudioMarkingActivity($(this));
		else if (this.nodeName == 'stb_weblab')
			activity = new WeblabActivity($(this));
		else if (this.nodeName == 'stb_open'){
			try {
				activity = new OpenActivity($(this));
			} catch (error){
				console.log ("No OpenActivity implementation");
			};
		}
		if (activity)
			activity_group.activities[activity.uuid] = activity;
	});
	

	this.correct = function(){
		for (var uuid in activity_group.activities) {
			if (activity_group.activities[uuid].correct)
				activity_group.activities[uuid].correct();
		};
	};

	this.generateHTML = function(){
		activity_group.div = $("<div class='stb_ag'></div>");
		for (var uuid in this.activities) {
			var activityHTML = this.activities[uuid].generateHTML();
			activity_group.div.append(activityHTML);
		};
		// añadir botones de correcion
		if (group_element.attr("correction") != "false"){
			var correction_button = $("<button type='button'/>");
			correction_button.append(I18N("ZUZENDU"));
			correction_button.click(activity_group.correct);
			activity_group.div.append(correction_button);
		}
		
		if (group_element.attr("storage") != "false") {
			var save_button = $("<button type='button'/>");
			save_button.append(I18N('SAVE'));
			save_button.click(activity_group.save);
			activity_group.div.append(save_button);
			
			var load_button = $("<button type='button'/>");
			load_button.append(I18N('LOAD'));
			load_button.click(activity_group.load);
			activity_group.div.append(load_button);
		}
		
		if (group_element.attr("send") != "false") {
			var send_button = $("<button type='button'/>");
			send_button.append(I18N("SEND"));
			send_button.click(activity_group.send);
			activity_group.div.append(send_button);
			
			var check_button = $("<button type='button'/>");
			check_button.append(I18N("RESULTS"));
			check_button.click(activity_group.check);
			activity_group.div.append(check_button);
		}

		// check for existing results
		var results_key = activity_group.uuid + "_" + username + "_results";
		if (results_key in localStorage){
			var r = JSON.parse(localStorage[results_key]);
			activity_group.results = $("<div />");
			
			// score
			var score_d = $("<div />");
			score_d.append($("<b />").append("Score: "));
			score_d.append(r['score']);
			activity_group.results.append(score_d);
			
			// comments
			var comments_d = $("<div />");
			comments_d.append($("<b />").append("comments: "));
			comments_d.append(r['comments']);
			activity_group.results.append(comments_d);
			
			activity_group.div.append(activity_group.results);
		}

		
		
		return activity_group.div;
	};
	
	this.save = function(){
		var key = activity_group.uuid + "_" + username;
		var data = {};
		for (var uuid in activity_group.activities) {
			var activity = activity_group.activities[uuid];
			if (activity.save){
				var value = activity.save();
				data[uuid] = value;
			}
		};
		localStorage[key] = JSON.stringify(data);
		notify("Data saved...");
	};
	
	this.load = function(){
		var key = activity_group.uuid + "_" + username;
		if (key in localStorage) {
			var data = JSON.parse(localStorage[key]);
			for (var uuid in activity_group.activities) {
				var activity = activity_group.activities[uuid];
				if (activity.load){
					activity.load(data[uuid]);
				}
			};
			notify("Data loaded...");
		} else {
			notify("No data to load...");
		}
	};
	
	this.send = function() {
		var data = {};
		for (var uuid in activity_group.activities) {
			var activity = activity_group.activities[uuid];
			if (activity.save){
				var value = activity.save();
				data[uuid] = value;
			}
		};
		
		var files = {};
		
		for (var uuid in activity_group.activities) {
			var activity = activity_group.activities[uuid];
			if (activity.getFiles){
				files[uuid] = activity.getFiles();
			}
		};
		
		showSendResultsDialog(data,activity_group,files);
	};
	
	this.check = function(){
		if (activity_group.results)
			activity_group.results.remove();
		
		getResults(activity_group,function(r){
			activity_group.results = $("<div />");
			
			// score
			var score_d = $("<div />");
			score_d.append($("<b />").append("Score: "));
			score_d.append(r['score']);
			activity_group.results.append(score_d);
			
			// comments
			var comments_d = $("<div />");
			comments_d.append($("<b />").append("comments: "));
			comments_d.append(r['comments']);
			activity_group.results.append(comments_d);
			
			activity_group.div.append(activity_group.results);
			
			var key = activity_group.uuid + "_" + username + "_results";
			localStorage[key] = JSON.stringify(r);
		});
	};
}

function initActivities(){
	$("div.stb_activities").each(function(){
		showLoading();
		var div_this = $(this);
		$.ajax({
			type: "GET",
			cache: false,
			url: div_this.attr("data-file"),
			dataType: "xml",
			success: function(xml) {
				$(xml).find('stb_ag').each(function(){
	 				var group = $(this);
					var activity_group = new ActivityGroup(group);
					var group_div = activity_group.generateHTML();
					div_this.replaceWith(group_div);
				});
				hideLoading();
			}
		});
	});
}
