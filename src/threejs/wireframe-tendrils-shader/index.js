import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { FilmShader } from 'three/addons/shaders/FilmShader.js';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';


export default class ShaderDemo5 { 
    constructor() {
        this.actors = [];
	    this.ready = false;

        this.clock = new THREE.Clock();
        this._animate = this.animate.bind(this);

        this.init();
    }

    init () { 
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            devicePixelRatio: DPR
        });

        this.renderer.autoClear = false;

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, .1, 50000 );
        this.camera.position.z = 0;

        this.scene = new THREE.Scene();

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.update();
    }

    setupComposer() {
        const { renderer, scene, camera } = this;
        this.composer = new EffectComposer( renderer );
        this.composer.addPass( new RenderPass( scene, camera ));

        let effect1 = new ShaderPass( FXAAShader );
        effect1.uniforms[ 'resolution' ].value.set( 1 / (window.innerWidth * DPR), 1 / (window.innerHeight * DPR) );
        this.composer.addPass( effect1 );

        let effect2 = new ShaderPass( FilmShader );
        effect2.renderToScreen = true;
        this.composer.addPass( effect2 );
        effect2.uniforms['grayscale'].value = false;
        effect2.uniforms['intensity'].value = .26;
        this.filmEffect = effect2;
    }

    getTextureData() { 
        const texture = new THREE.TextureLoader().load( '/texture/rgb-perlin-seamless-512.png' );
        texture.wrapS = exture.wrapT = THREE.RepeatWrapping;
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
        this.scene.add( plane );
    }
    

    onWindowResize() {
        const { camera, renderer } = this;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}


    animate () {
		this.filmEffect.uniforms['time'].value = Math.random() * 100 + 2;
		requestAnimationFrame( this._animate );
        this.controls.update();
	}
}

