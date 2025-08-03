import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
// import { FilmShader } from 'three/addons/shaders/FilmShader.js';

import { FXAAShader  } from "./shaders/FXAAShader.js";
import { FilmShader  } from "./shaders/FilmShader.js";

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';


export default class ShaderDemo5 { 
    constructor() {
        this.clock = new THREE.Clock();
        this._animate = this.animate.bind(this);
        
        this.init();
        this.setupComposer();
        this.initMesh();
        this.animate();
    }

    setDom(dom) {
        dom.style.position = 'fixed'
        dom.style.left = '0px';
        dom.style.top = '0px'
        dom.style.zIndex =  0;
    }

    init () { 
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            devicePixelRatio: window.devicePixelRatio
        });

        this.renderer.autoClear = false;

        this.setDom(this.renderer.domElement);

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, .1, 50000 );
        this.camera.position.set(0, 10, 10)

        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0x000000);

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.update();
    }

    setupComposer() {
        const { renderer, scene, camera } = this;
        this.composer = new EffectComposer( renderer );
        this.composer.addPass( new RenderPass( scene, camera ));

        let effect1 = new ShaderPass( FXAAShader );
        effect1.uniforms[ 'resolution' ].value.set( 1 / (window.innerWidth * window.devicePixelRatio), 1 / (window.innerHeight * window.devicePixelRatio) );
        this.composer.addPass( effect1 );

        let effect2 = new ShaderPass( FilmShader );
        effect2.renderToScreen = true;
        this.composer.addPass( effect2 );
        effect2.uniforms['grayscale'].value = false;
        effect2.uniforms['nIntensity'].value = 0;
        effect2.uniforms['sIntensity'].value = .26;
        this.filmEffect = effect2;
    }

    getTextureData() { 
        const texture = new THREE.TextureLoader().load( '/texture/rgb-perlin-seamless-512.png' );
        // const texture = new THREE.TextureLoader().load( '/texture/terrian.png' );
        // const texture = new THREE.TextureLoader().load( '/texture/image.png' );
        // const texture = new THREE.TextureLoader().load( '/texture/noise2.png' );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }


    initMesh () {
        const material = new THREE.ShaderMaterial( {
            transparent: true,
            wireframe: true,
            wireframe: true,
            uniforms: {
                "uTime":           { value: 0.0 },
                "tDiffuse":        { value: this.getTextureData() },
                "uZoomMultiplyer": { value: 12 / (new THREE.Vector3().distanceTo(this.camera.position)) }
            },
            depthTest:      false,
            vertexShader:   vertexShader,
            fragmentShader: fragmentShader
        })

        const geomatry = new THREE.PlaneGeometry( 10, 10, 512, 512 );
        const plane = new THREE.Mesh( geomatry, material );
        plane.scale.set(5, 5, 5);
        plane.position.z = 0;

        this.plane = plane;
        this.scene.add( plane );

        // this.scene.add(new THREE.GridHelper(10, 10))
    }
    

    onWindowResize() {
        const { camera, renderer } = this;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}

    update() {
        if (this.plane) {
            this.plane.material.uniforms['uTime'].value = this.clock.getElapsedTime() * .00012;
            this.plane.rotation.y += .05 * Math.PI / 180;
            this.plane.rotation.x += .025 * Math.PI / 180;
        }
    }
    cameraUpdate() { 
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.position.y -= (this.camera.position.y -  0.2) * .005;
        this.camera.position.x -= (this.camera.position.x -  0.2) * .005;
    }


    animate () {
		this.filmEffect.uniforms['time'].value = Math.random() * 100 + 2;
		requestAnimationFrame( this._animate );
        this.update();
        // this.cameraUpdate();
        this.controls.update();
        this.renderer.render(this.scene, this.camera)
	}

    dispose() {
       if(this.renderer) {
            this.renderer.dispose();
            document.body.removeChild(this.renderer.domElement);
            this.renderer = null;
        }
    }
}

