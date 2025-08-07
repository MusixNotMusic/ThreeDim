import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { defaultRampColors, getColorRamp } from './colors';

// import vertexShader from './shaders/quad.vert.glsl';
import vertexShader from './glsl/quad2.vert.glsl';
import fragmentShader from './glsl/screen2.frag.glsl';

import quadVertexShader from './glsl/quad.vert.glsl';
import updateFragmentShader from './glsl/update.frag.glsl'

import drwaVertexShader from './glsl/draw.vert.glsl';
import drawFragmentShader from './glsl/draw.frag.glsl';


export default class ThreeWind2 {

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

        this.fadeOpacity = 0.996; // how fast the particle trails fade on each frame
        this.speedFactor = 0.25; // how fast the particles move
        this.dropRate = 0.003; // how often the particles move to a random place
        this.dropRateBump = 0.01; 

        const width = 512;
        const height = 512;

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.NearestFilter,    // 最小化过滤
            magFilter: THREE.NearestFilter,    // 最大化过滤
            format: THREE.RGBAFormat,         // 颜色格式
            type: THREE.UnsignedByteType,     // 数据类型
            stencilBuffer: false,             // 是否使用模板缓冲区
            depthBuffer: false 
        });

        this.animateBind = this.animate.bind(this);

        this.init();
        
        this.initMesh();

        // this.initPlane();

        this.drawPoints();

        this.animate();
    }

    init () { 
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.000001, 100000);
        camera.position.set(0, 40, 0);
        this.camera = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        this.renderer = renderer;

        this.controls = new OrbitControls( camera, renderer.domElement );

        this.controls.update();
    }

    initMesh () { 
        // const geometry = new THREE.BoxGeometry(5, 5, 5);
        // const material = new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.5 });

        // const mesh = new THREE.Mesh(geometry, material);
        // mesh.position.set(0, 2.5, 0);
     
        // this.scene.add(mesh);
        this.scene.add(new THREE.GridHelper(40, 20));
       
    }


    initPlane () {
        const geometry = new THREE.PlaneGeometry(30, 30);
         const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                u_screen: { value: new THREE.TextureLoader().load( '/wind/2016112000.png' ) },
                u_opacity: { value: this.fadeOpacity }
            },
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
        })

        const plane = new THREE.Mesh(geometry, material)
        this.plane = plane;
        plane.rotateX(Math.PI * 0.5);
        plane.position.set(0, 2, 0);

        this.scene.add(plane);
    }

    // setTexture (data, width, height, filter, format, type) {
    //     const texture = new THREE.DataTexture(data, width, height);
    //     texture.minFilter = texture.maxFilter = filter || THREE.NearestFilter;
    //     texture.format = format || THREE.UnsignedByteType;
    //     texture.unpackAlignment = format || THREE.UnsignedByteType;
    //     texture.needsUpdate = true;

    //     return texture;
    // }

    setTexture (data, width, height, filter) {
        const texture = new THREE.DataTexture(data, width, height);
        texture.minFilter = texture.maxFilter = filter || THREE.NearestFilter;
        if (data instanceof Uint8Array) {
            texture.format = THREE.RGBAFormat;
            texture.type = THREE.UnsignedByteType;
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            texture.format = THREE.RGBAFormat;
            texture.type = THREE.FloatType;
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
        texture.needsUpdate = true;
        return texture;
    }


    drawPoints () {
        this.numParticles = 256 * 256;
        const particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(this.numParticles));

        const particleState = new Uint8Array(this.numParticles * 4);
        for (let i = 0; i < particleState.length; i++) {
            // particleState[i] = i % 4 > 1 ? 0 : Math.floor(Math.random() * 256); // randomize the initial particle positions
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }

        const particleIndices = new Float32Array(this.numParticles);
        for (let i = 0; i < this.numParticles; i++) particleIndices[i] = i;

        const positionTex = this.setTexture(particleState, particleRes, particleRes);
        const colorTex = this.setTexture(getColorRamp(defaultRampColors), 16, 16);

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(particleState, 4))

        geometry.setAttribute('a_index', new THREE.BufferAttribute(particleIndices, 1));

        const quad = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
        geometry.setAttribute('a_pos', new THREE.BufferAttribute(quad, 1));


        const material = new THREE.ShaderMaterial({
            vertexShader: drwaVertexShader,
            fragmentShader: drawFragmentShader,
            uniforms: {
                u_wind:             { value: new THREE.TextureLoader().load( '/wind/2016112000.png' ) },
                u_wind_min:         { value: [this.windData.uMin, this.windData.vMin] },
                u_wind_max:         { value: [this.windData.uMax, this.windData.vMax]},
                u_color_ramp:       { value: colorTex    },
                u_particles:        { value: positionTex },
                u_particles_res:    { value: particleRes }
            },
            transparent: true,
            opacity: 1,
            depthTest: false,
            blending: THREE.AdditiveBlending,
        })

        const points = new THREE.Points(geometry, material)
        this.points = points;
        points.rotateX(Math.PI * 0.5);
        points.position.set(0, 2, 0);

        this.scene.add(points);
    }

    update() {
        this.numParticles = 256 * 256;
        const particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(this.numParticles));

        const particleState = new Uint8Array(this.numParticles * 4);
        for (let i = 0; i < particleState.length; i++) {
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }

        const particleIndices = new Float32Array(this.numParticles);
        for (let i = 0; i < this.numParticles; i++) particleIndices[i] = i;

        const positionTex = this.setTexture(particleState, particleRes, particleRes);
        const colorTex = this.setTexture(getColorRamp(defaultRampColors), 16, 16);

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(particleState, 4))
        geometry.setAttribute('a_index', new THREE.BufferAttribute(particleIndices, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader:   vertexShader,
            fragmentShader: drawFragmentShader,
            uniforms: {
                u_wind:             { value: new THREE.TextureLoader().load( '/wind/2016112000.png' ) },
                u_particles:        { value: positionTex },
                u_rand_seed:        { value: Math.random() },
                u_wind_res:         { value: [this.windData.width, this.windData.height] },
                u_wind_min:         { value: [this.windData.uMin, this.windData.vMin] },
                u_wind_max:         { value: [this.windData.uMax, this.windData.vMax] },
                u_speed_factor:     { value: this.speedFactor },
                u_drop_rate:        { value: this.dropRate },
                u_drop_rate_bump:   { value: this.dropRateBump }
            },
            transparent: true,
            opacity: 1,
            depthTest: false,
            blending: THREE.AdditiveBlending,
        })

        const points = new THREE.Points(geometry, material)
        this.points = points;
        points.rotateX(Math.PI * 0.5);
        points.position.set(0, 2, 0);

        this.scene.add(points);
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
}