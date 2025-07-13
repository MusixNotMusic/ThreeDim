import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { defaultRampColors, getColorRamp } from './colors';

import drawVert from './shaders/draw.vert.glsl';
import drawFrag from './shaders/draw.frag.glsl';

import quadVert from './shaders/quad.vert.glsl';

import screenFrag from './shaders/screen.frag.glsl';
import updateFrag from './shaders/update.frag.glsl';

export default class ThreeWind {

    constructor() {
        this.windData = {
            "source": "http://nomads.ncep.noaa.gov",
            "date": "2016-11-20T00:00Z",
            "width": 360,
            "height": 180,
            "uMin": -21.32,
            "uMax": 26.8,
            "vMin": -21.57,
            "vMax": 21.42
        }

        this.animateBind = this.animate.bind(this);

        this.init();
        this.initMesh();
        this.animate();
    }

    init () { 
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;
        this.camera = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        this.renderer = renderer;

        this.controls = new OrbitControls( camera, renderer.domElement );

        this.controls.update();
    }

    initMesh () { 
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.5 });

        const mesh = new THREE.Mesh(geometry, material);

        this.scene.add(mesh);
    }

    animate () {
        this.id = requestAnimationFrame(this.animateBind);

        const { renderer, scene, camera, controls } = this;

        controls.update();

        renderer.render(scene, camera);
    }

    destroy() { 
        cancelAnimationFrame(this.id);
        if(this.renderer) {
            this.renderer.dispose();
            document.body.removeChild(this.renderer.domElement);
            this.renderer = null;
        } 

    }

    setTexture (data, width, height, filter) {
        const texture = new THREE.DataTexture(data, width, height);
        texture.minFilter = texture.maxFilter = filter || THREE.NearestFilter;
        texture.needsUpdate = true;

        return texture;
    }

    initParma () {
        this.fadeOpacity = 0.996; // how fast the particle trails fade on each frame
        this.speedFactor = 0.25; // how fast the particles move
        this.dropRate = 0.003; // how often the particles move to a random place
        this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed
    }

    initTexture () {
        const width = 512;
        const height = 512;
        const emptyPixels = new Uint8Array(width * height * 4);

        this.backgroundTexture = this.setTexture(emptyPixels, width, height);

        this.screenTexture = this.setTexture(emptyPixels, width, height);

        this.colorRampTexture = this.setTexture(getColorRamp(defaultRampColors), 16, 16, THREE.LinearFilter);
    }


    set numParticles(numParticles) {

        // we create a square texture where each pixel will hold a particle position encoded as RGBA
        const particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
        this._numParticles = particleRes * particleRes;

        const particleState = new Uint8Array(this._numParticles * 4);

        for (let i = 0; i < particleState.length; i++) {
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }
        // textures to hold the particle state for the current and the next frame
        this.particleStateTexture0 = this.setTexture(particleState, particleRes, particleRes);
        this.particleStateTexture1 = this.setTexture(particleState, particleRes, particleRes);

        const particleIndices = new Float32Array(this._numParticles);
        for (let i = 0; i < this._numParticles; i++) particleIndices[i] = i;
        this.particleIndexBuffer = util.createBuffer(gl, particleIndices);
    }
    get numParticles() {
        return this._numParticles;
    }
}