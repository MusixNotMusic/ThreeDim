import * as THREE from "three";

export default class PerspectiveScene { 
  constructor(canvas, cameraOpt = { fov: 75, near: 0.1, far: 1000 }) { 
    this.canvas = canvas;
    this.cameraOpt = cameraOpt;
    this.init();
    this.resize();
  }

  init() { 

    const { width, height } = this.getWindowView(this.canvas);
    const { fov, near, far } = this.cameraOpt;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(fov, width / height, near, far);

    if (this.canvas) {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    } else {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        document.body.appendChild( this.renderer.domElement );
    }
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
  }

  onResize(event) {
    const { width, height } = this.getWindowView(this.canvas);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( width, height );
  }

  resize() {
    this.onResizeBind = this.onResize.bind(this);
    window.addEventListener( "resize", this.onResizeBind);
  }

  /**
   *    获取视图大小
   * @param {*} canvas 
   * @returns 
   */
  getWindowView(canvas) {
    if (canvas) {
        return {
            width: canvas.clientWidth,
            height: canvas.clientHeight
        }
    } else {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        }
    }
  }

  dispose() {
    window.removeEventListener( "resize", this.onResizeBind);
    this.onResizeBind = null;

    this.renderer.setAnimationLoop( null );
    this.renderer.dispose();
  }
}