import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ThreeWind from './index'; 


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
        this.texture = { value: null }
        this.threeWind = new ThreeWind();
        this.init();
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
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 15, 15);
        this.camera = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.setDom(renderer.domElement);
        document.body.appendChild(renderer.domElement);
        
        this.renderer = renderer;

        this.controls = new OrbitControls( camera, renderer.domElement );

        this.controls.update();
    }

    initMesh () { 
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.5 });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 2.5, 0);
     
        this.scene.add(mesh);
        this.scene.add(new THREE.GridHelper(40, 20));

        this.texture = new THREE.CanvasTexture(this.threeWind.renderer.domElement);
        this.texture.needsUpdate = true;
        const geometry1 = new THREE.PlaneGeometry(10, 10);
        const material1 = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            map: this.texture
        })

        const plane = new THREE.Mesh(geometry1, material1)
        this.plane = plane;
        plane.position.set(10, 5);

        this.scene.add(plane);

    }

    animate () {
        this.id = requestAnimationFrame(this.animateBind);

        const { renderer, scene, camera, controls } = this;

        controls.update();

        if (this.threeWind) {
            this.threeWind.draw()
            // if(!this.plane.material.map) {
            //     this.plane.material.map = this.threeWind.texture;
            // } else {
            // }
            // this.threeWind.needsUpdate = true;
            if (this.plane.material.map) {
                this.plane.material.map.needsUpdate = true;
            }
        }

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