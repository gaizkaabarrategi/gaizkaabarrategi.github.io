// JavaScript Document
function startHideShowInfo() {
$("#hideshow").click(function() {
	$("#infoContent").toggle(400);
	event.preventDefault();
});
	$("#infoContent").hide();
}

function resizeText(multiplier) {
  if (document.body.style.fontSize == "") {
    document.body.style.fontSize = "1.0em";
  }
  document.body.style.fontSize = parseFloat(document.body.style.fontSize) + (multiplier * 0.2) + "em";
}

var newwin = null;
function MM_openBrWindow(theURL,winName,features) { //v2.0
newwin =  window.open(theURL,winName,features);
newwin.focus();
}

function introCountdownTimer(){
	setTimeout(introCountdownExecution,6050);
}

function introCountdownExecution(){
	location.href='introduccion.html';
}

function showEbazpena(id){
	$("#ebazpena" + id).show();
	$("#ebazpenaButton"+id).hide();
}