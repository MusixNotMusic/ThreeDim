
var container, stats;

var camera, cameraHolder, cameraCounter = 1, scene, renderer, videoImageContext, composer, materials = [], controls, effect, video, videoTexture, directionalLight, sunlightTarget;
var mouseX = 0, mouseY = 0;
var NEAR = .1, FAR = 50000;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var filmEffect;

var uniforms, attributes;

var startTime, lastTime;

var ico, meshes = [];
var videoSphere;
var backgroundColor = 0x000022;
var mat;
var mouseDown = false, mousePos = { };
var videoRotationVel = 0.0;
// initialize a namespace
var APP = APP || {};
var levelBuffer = [];

var DPR = window.devicePixelRatio;

if(DPR <= 1) {
	DPR = 1;
} else {
	DPR = window.devicePixelRatio;
}
var cameraDestX = 0, cameraDestY = 0;

var cameraDestX = 0, cameraDestY = 0;

var activeActors = [];

THREE.StageManager = function() {

	var self = this;
	this.play;

	this.init = function() {
		startTime = lastTime = new Date().getTime();

		video = document.getElementById( 'video' );
		videoTexture = new THREE.Texture( video );

		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
		videoTexture.wrapS = videoTexture.wrapT = THREE.RepeatWrapping;

		videoTexture.format = THREE.RGBFormat;
		videoTexture.generateMipmaps = false;

		// create container
		container = document.createElement( 'div' );
		document.body.appendChild( container );

		// SCENE INITIALIZATION
		scene = new THREE.Scene();

		var w = 32, h = 16;

		// create camera
		camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, NEAR, FAR );
		camera.position.z = 0;
		camera.setLens(8, 7.49); // 16mm bolex

		//cameraHolder = new THREE.Object3D;
		//cameraHolder.add(camera);
		//cameraHolder.position.z = 32;
		//cameraHolder.rotation.x = 90 * Math.PI / 180;
		scene.add(camera);
		scene.fog = new THREE.FogExp2(backgroundColor, .075);

		this.createRenderer();
		this.setupComposer();

		container.appendChild( renderer.domElement );

		setupTouchHandlers();

		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		window.addEventListener( 'resize', onWindowResize, false );

		// initialize our current scene
		this.play.init();

		this.animate();
	}

	this.setupComposer = function() {

		composer = new THREE.EffectComposer( renderer );
		composer.addPass( new THREE.RenderPass( scene, camera ));
		// var effect = new THREE.ShaderPass( THREE.Technicolor3Shader );
		//composer.addPass( effect );

		var effect = new THREE.ShaderPass( THREE.FXAAShader );
		effect.uniforms[ 'resolution' ].value.set( 1 / (window.innerWidth * DPR), 1 / (window.innerHeight * DPR) );
		composer.addPass( effect );

		var effect = new THREE.ShaderPass( THREE.FilmShader );
		effect.renderToScreen = true;
		composer.addPass( effect );
		effect.uniforms['sIntensity'].value = 0;
		effect.uniforms['grayscale'].value = false;
		effect.uniforms['nIntensity'].value = .26;
		filmEffect = effect;
	}

	this.createRenderer = function() {
		renderer = new THREE.WebGLRenderer({
		  devicePixelRatio: DPR || 1,
		});
		if(typeof(renderer.setPixelRatio) !== "undefined") {
			renderer.setPixelRatio( DPR );
		}

		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.autoClear = false;
	}

	function onWindowResize() {

		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function onDocumentMouseDown( event ) {
		mouseDown = true;
		mousePos = { x: mouseX, y: mouseY };
	}

	function onDocumentMouseUp( event ) {
		mouseDown = false;
	}

	function onDocumentMouseMove( event ) {

		mouseX = ( event.clientX - windowHalfX ) / 2;
		mouseY = ( event.clientY - windowHalfY ) / 2;

	}


	window.addEventListener("mousedown", onDocumentMouseDown, false);
	window.addEventListener("mouseup", onDocumentMouseUp, false);

	function setupTouchHandlers() {
		// touch listeners
		var hammertime = new Hammer(renderer.domElement);
		hammertime.on('pan', function(ev) {
			mouseX = ( ev.center.x - windowHalfX ) / 2;
			mouseY = ( ev.center.y - windowHalfY ) / 2;

		    mouseDown = true;
		});

	}


	this.cameraUpdate = function() {

		camera.lookAt(new THREE.Vector3(0, 0, 0));
		//videoSphere.rotation.x += ((mouseY ) * .003) * Math.PI / 180;

		cameraDestY = (mouseY ) * .07 * Math.abs(camera.position.z / 4);
		cameraDestX = ( - mouseX ) * .07 * Math.abs(camera.position.z / 4);

		camera.position.y -= (camera.position.y - cameraDestY) * .005;
		camera.position.x -= (camera.position.x - cameraDestX) * .005;
	}

	this.animate = function(time) {

		// update our play
		if(typeof(self.play) != "undefined") self.play.update();
		self.cameraUpdate();
		requestAnimationFrame( self.animate );
		filmEffect.uniforms['time'].value = Math.random() * 100 + 2;
		self.render();
	}

	this.render = function() {

		if(video != null) {
			if( video.readyState === video.HAVE_ENOUGH_DATA ) {
				if ( videoTexture ) videoTexture.needsUpdate = true;

			}
		}
		renderer.clear();

		if(DPR >= 2 || APP.disableComposer === true) {
			renderer.render( scene, camera );
		} else {
			renderer.render( scene, camera );
		}
	}





}



var APP = APP || {};
var controls;
APP.ShaderDemo5 = function() {

	this.actors = [];
	this.ready = false;
	var self = this;



	this.init = function() {

		renderer.autoClear = false;
		//renderer.setClearColor( 0x000000, .15 );
		APP.disableComposer = true;
		APP.startTime = new Date().getTime();
		APP.updateInterval = 75;
		APP.nextUpdate = APP.updateInterval;
		APP.spawnThreshold = .3;

		APP.stageSize = 10;

		camera.setLens(13, 7.49); // 16mm bolex
		scene.fog = null;

		scene.remove(camera);

		APP.cameraHolder = new THREE.Object3D();
		APP.cameraHolder.add(camera);

		APP.noiseTex = THREE.ImageUtils.loadTexture("textures/rgb-perlin-seamless-512.png");
		APP.noiseTex.wrapT = APP.noiseTex.wrapS = THREE.RepeatWrapping;
		// APP.noiseTex.minFilter = APP.noiseTex.maxFilter = THREE.NearestFilter;

		camera.position.z = 6;
		camera.position.x = 2;
		camera.position.y = -1;
		camera.lookAt(new THREE.Vector3(0, 0, 0));

		controls = new THREE.TrackballControls( camera );

		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 2.2;
		controls.panSpeed = .3;

		controls.noZoom = false;
		controls.noPan = false;
		controls.noRoll = true;
		// controls.noRotate = true;

		// controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.25;

		scene.add(APP.cameraHolder);
		APP.zoomDivider = 12;

		APP.shaderMat = new THREE.ShaderMaterial( {
			transparent: true,
			wireframe: true,
			//shading: THREE.FlatShading,
			wireframe: true,
			uniforms: {
				"uTime": { type: "f", value: 0.0 },
				"tDiffuse": { type: "t", value: APP.noiseTex },
				"uZoomMultiplyer": { type: "f", value: APP.zoomDivider / (new THREE.Vector3().distanceTo(camera.position)) }
			},
			depthTest: false,
			vertexShader: document.getElementById( 'vertexShader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentShader' ).textContent
		} );

		// APP.shaderMat.lights = true;
		APP.shaderPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10, 512, 512), APP.shaderMat);
		APP.shaderPlane.scale.set(5, 5, 5);
		// scene.add(APP.shaderPlane2);
		// // APP.shaderPlane.rotation.x = -55 * Math.PI / 180;
		APP.shaderPlane.position.y = 0;
		scene.add(APP.shaderPlane);


		APP.stage.cameraUpdate = function() {

		}

		window.addEventListener("mousewheel", MouseWheelHandler, false);
		function MouseWheelHandler(e) {
			// // cross-browser wheel delta
			// var e = window.event || e; // old IE support
			// var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			// // camera.fov -= e.wheelDelta * .01;
			// camera.position.z -= e.wheelDelta * .0005;
			// if(camera.position.z < -10.5) camera.position.z = -4.5;
			// APP.shaderMat.uniforms['uZoomMultiplyer'].value = APP.zoomDivider / (new THREE.Vector3().distanceTo(camera.position));
			// // console.log(camera.position.z);
			// camera.lookAt(new THREE.Vector3(0., 0., 0.));
			// // console.log(camera.fov);
			// //camera.position.z -= e.wheelDelta * .01;
			// camera.updateProjectionMatrix();
		}


		scene.fog = null;//new THREE.FogExp2(0, .0005);

		// load all our assets
		this.setupAssets();
	}

	this.setupAssets = function() {

		APP.materials = APP.materials || {};
		APP.models = APP.models || {};

		self.ready = true;

	}

	this.tick = function() {

	}

	this.update = function() {
		controls.update();
		// update the time
		APP.time = new Date().getTime() - APP.startTime;
		APP.shaderMat.uniforms['uTime'].value = APP.time * .000000250;
		APP.shaderPlane.rotation.y += .05 * Math.PI / 180;
		APP.shaderPlane.rotation.x += .025 * Math.PI / 180;
		if(APP.time > APP.nextUpdate) {

			APP.nextUpdate = APP.time + APP.updateInterval;
			this.tick();
			// console.log("tick");
		}

	}

	this.add = function( actor ) {
		actor.init();
		this.actors.push(actor);
	}

	this.remove = function( actor ) {
		// remove actor from list
		var i = this.actors.indexOf(actor);
		if(i > -1) {
			this.actors.splice(i, 1);
		}
		actor.destroy();
	}

}

window.onload = function() {
	APP.stage = new THREE.StageManager();
	APP.stage.play = new APP.ShaderDemo5();
	APP.stage.init();

}
