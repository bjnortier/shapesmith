/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

Detector = {

    canvas : !! window.CanvasRenderingContext2D,
    webgl : ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
    workers : !! window.Worker,
    fileapi : window.File && window.FileReader && window.FileList && window.Blob,

    getWebGLErrorMessage : function () {

	var domElement = document.createElement( 'div' );

	if ( ! this.webgl ) {

	    domElement.innerHTML = window.WebGLRenderingContext ? [
		'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />',
		'<a href="https://www.google.com/chrome">Google Chrome</a> is recommended, or',
		'find out how to get it <a href="http://get.webgl.org/">here</a>.'
	    ].join( '\n' ) : [
		'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/><br/>',
		'<a href="https://www.google.com/chrome">Google Chrome</a> is recommended,<br/> or',
		'find out how to get a WebGL-enabled browser <a href="http://get.webgl.org/">here</a>.'
	    ].join( '\n' );

	}

	return domElement;

    },

    addGetWebGLMessage : function ( parameters ) {

	var parent, id, domElement;

	parameters = parameters || {};

	parent = parameters.parent !== undefined ? parameters.parent : document.body;
	id = parameters.id !== undefined ? parameters.id : 'oldie';

	domElement = Detector.getWebGLErrorMessage();
	domElement.id = id;

	parent.appendChild( domElement );

    }

};
