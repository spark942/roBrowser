/**
 * Renderer/Renderer.js
 *
 * Rendering sprite in 2D or 3D context
 *
 * This file is part of ROBrowser, Ragnarok Online in the Web Browser (http://www.robrowser.com/).
 *
 * @author Vincent Thibault
 */
define(function( require )
{
	"use strict";


	/**
	 * Load dependencies
	 */
	var WebGL         = require('Utils/WebGL');
	var jQuery        = require('Utils/jquery');
	var glMatrix      = require('Utils/gl-matrix');
	var Background    = require('UI/Background');
	var Cursor        = require('UI/CursorManager');
	var Mouse         = require('Controls/MouseEventHandler');
	var Camera        = require('Renderer/Camera');
	var mat4          = glMatrix.mat4;


	/**
	 * Renderer Namespace
	 */
	var Renderer = {};


	/**
	 * @var {HTML5 canvas}
	 */
	Renderer.canvas = document.createElement('canvas');


	/**
	 * @var {WebGLContext}
	 */
	Renderer.gl     = null;


	/**
	 * @var {integer} screen width
	 */
	Renderer.width = 0;


	/**
	 * @var {integer} screen height
	 */
	Renderer.height = 0;


	/**
	 * @var {integer} store the last time the windows was resize (to avoid to resize the context on each 16ms)
	 */
	Renderer.resizeTimeOut = 0;


	/**
	 * @var {integer} game tick
	 */
	Renderer.tick = 0;


	/**
	 * @var {function[]} callbacks to execute
	 */
	Renderer.renderCallbacks = [];


	/**
	 * Shime for requestAnimationFrame
	 */
	var _requestAnimationFrame =
			   window.requestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.oRequestAnimationFrame
			|| window.msRequestAnimationFrame
			|| function(callback, element){
				window.setTimeout( callback, 1000/60 );
			}
		;


	/**
	 * Initialize renderer
	 */
	Renderer.init = function Init( param )
	{
		if( !this.gl ) {
			this.canvas.style.position = "absolute";
			this.canvas.style.top      = "0px";
			this.canvas.style.left     = "0px";
			this.canvas.style.zIndex   =  0;

			this.gl = WebGL.getContext( this.canvas, param );

			jQuery(window).resize(this.onResize.bind(this));
			this.render(null);
		}

		this.resize();
		var gl = this.gl;

		gl.clearDepth( 1.0 );
		gl.enable( gl.DEPTH_TEST );
		gl.depthFunc( gl.LEQUAL );
	
		gl.enable( gl.BLEND );
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	};


	/**
	 * Show renderer
	 */
	Renderer.show = function Show(){
		if( !this.canvas.parentNode ) {
			document.body.appendChild(this.canvas);
		}
	};


	/**
	 * Remove renderer
	 */
	Renderer.remove = function Remove(){
		if( this.canvas.parentNode ) {
			document.body.removeChild(this.canvas);
		}
	};


	/**
	 * Get back WebGL Context
	 */
	Renderer.getContext = function GetContext()
	{
		return this.gl;
	};


	/**
	 * Ask for resizing the window, avoid flooding the function (can flood the context), wait for 500ms each time
	 */
	Renderer.onResize = function OnResize()
	{
		clearTimeout( this.resizeTimeOut );
		this.resizeTimeOut = setTimeout( this.resize.bind(this), 500 );
	};


	/**
	 * Resizing window
	 */
	Renderer.resize = function Resize()
	{
		this.width  = window.innerWidth  || document.body.offsetWidth;
		this.height = window.innerHeight || document.body.offsetHeight;

		Mouse.screen.width  = this.width;
		Mouse.screen.height = this.height;

		var quality = ( (window.ROConfig && ROConfig.quality) || 100 ) / 100;
		var width   = this.width  * quality;
		var height  = this.height * quality;

		this.canvas.width         = width;
		this.canvas.height        = height;
		this.canvas.style.width   = this.width + 'px';
		this.canvas.style.height  = this.height + 'px';

		this.gl.viewport( 0, 0, width, height );

		mat4.perspective( 20.0, width/height, 1, 1000, Camera.projection );

		Background.resize( this.width, this.height );
	};


	/**
	 * @var {boolean} Rendering ?
	 */
	Renderer.rendering = false;


	/**
	 * Rendering scene
	 */
	Renderer._render = function Render()
	{
		_requestAnimationFrame( this._render.bind(this), this.canvas );

		this.tick = Date.now();
		var i, count;

		for( i = 0, count = this.renderCallbacks.length; i < count; ++i ) {
			this.renderCallbacks[i]( this.tick, this.gl );
		}

		Cursor.render( this.tick );
	};


	/**
	 * Start rendering
	 */
	Renderer.render = function RenderCallback( fn )
	{
		if( fn ) {
			this.renderCallbacks.push(fn);
		}

		if( !this.rendering ) {
			this.rendering = true;
			this._render();
		}
	};


	/**
	 * Stop rendering
	 */
	Renderer.stop = function Stop( fn )
	{
		// No callback specified, remove all
		if( !arguments.length ) {
			this.renderCallbacks.length = 0;
			return;
		}

		var pos = this.renderCallbacks.indexOf(fn);
		if( pos > -1 ) {
			this.renderCallbacks.splice( pos, 1 );
		}
	};


	/**
	 * Export
	 */
	return Renderer;
});