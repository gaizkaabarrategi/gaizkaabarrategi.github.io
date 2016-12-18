var vActual=0;
var vMaximo=9;
var contenido;


function cambiar(id){
	if (!vActual) {
		vActual= id;
	}

	if( id!=vActual.value){
		var aux=vActual;
		if(document.getElementById('ID-' + aux))
			document.getElementById('ID-' + aux).className = '';

		document.getElementById('ID-' + id).className = 'escogido';

		vActual= id;
   	}
	
}

function mostrarItem(href, id )
{
	cambiar(id);
	contenido = document.getElementById("capa_contenidos");
	if(href !='' && href!=null && id!='' && id!=null){
		cadenaIframe="<iframe id='contenidoframe' name='contenidoframe' onload='redim();' ";
		cadenaIframe= cadenaIframe + " src='"+ href +"'";
		cadenaIframe= cadenaIframe + "scrolling='auto'  frameborder='0' marginheight='0' marginwidth='0' style='min-height:470px; width:500px; height:450px;margin-left:0;'>[Su agente de usuario no soporta marcos o está actualmente configurado para no mostrar marcos. Sin embargo, puede visitar <A href='"+ href +"'>Documento relacionado.</A>]</iframe><hr/>";

		if(contenido!=null)
				contenido.innerHTML=cadenaIframe ;
		
		
	}
	return false;
}


function siguiente(max)
{
	
	if(parseInt(vActual) < parseInt(max))
	{
		document.getElementById('ID-' + (parseInt(vActual)+1) ).onclick();
	}
}

function anterior()
{
	if(parseInt(vActual)>0)
	{
		document.getElementById('ID-' + (parseInt(vActual)-1) ).onclick();
	}
}

    /*
     * SCORM API
     */
     function GenericAPIAdaptor(){
     	this.LMSInitialize = LMSInitializeMethod;
     	this.LMSGetValue = LMSGetValueMethod;
     	this.LMSSetValue = LMSSetValueMethod;
     	this.LMSCommit = LMSCommitMethod;
     	this.LMSFinish = LMSFinishMethod;
     	this.LMSGetLastError = LMSGetLastErrorMethod;
     	this.LMSGetErrorString = LMSGetErrorStringMethod;
     	this.LMSGetDiagnostic = LMSGetDiagnosticMethod;
     }
     
     function GenericAPIAdaptor_2004(){
     	this.Initialize = LMSInitializeMethod;
     	this.Terminate = LMSFinishMethod;	
     	this.GetValue = LMSGetValueMethod;
     	this.SetValue = LMSSetValueMethod;
     	this.Commit = LMSCommitMethod;	
     	this.GetLastError = LMSGetLastErrorMethod;
     	this.GetErrorString = LMSGetErrorStringMethod;
     	this.GetDiagnostic = LMSGetDiagnosticMethod;
     }
     
     /*
     * LMSInitialize.
     */
     function LMSInitializeMethod(parameter){return "true";}
     /*
     * LMSFinish.
     */
     function LMSFinishMethod(parameter){return "true";}
     /*
     * LMSCommit.
     */
     function LMSCommitMethod(parameter){return "true";}
     /*
     * LMSGetValue.
     */
     function LMSGetValueMethod(element){return "";}
     /*
     * LMSSetValue.
     */
     function LMSSetValueMethod(element, value){return "true";}
     /*
     * LMSGetLastErrorString
     */
     function LMSGetErrorStringMethod(errorCode){return "No error";}
     /*
     * LMSGetLastError
     */
     function LMSGetLastErrorMethod(){return "0";}
     /*
     * LMSGetDiagnostic
     */
     function LMSGetDiagnosticMethod(errorCode){return "No error. No errors were encountered. Successful API call.";}
     
     var API = new GenericAPIAdaptor;
     var API_1484_11 = new GenericAPIAdaptor_2004;
