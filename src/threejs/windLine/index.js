import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import PerspectiveScene from '../base/PerspectiveScene'

export class WindLine extends PerspectiveScene {
    constructor(canvas) { 
        super(canvas, { fov: 30, near: 0.1, far: 1000 });
        this.initLight();
        this.initTerrain();
        this.initControls();
        this.animationLoopBind = this.animationLoop.bind(this)
        this.scene.background = new THREE.Color( 'deepskyblue' );
        this.camera.position.set( 0, 2.5, 8 );
        this.camera.lookAt( this.scene.position );
        this.renderer.setAnimationLoop( this.animationLoopBind );
    }

    initControls () {
        const { camera, renderer } = this;

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.enableDamping = true;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.5;

        this.controls = controls;
    }

    initLight () {
        const light = new THREE.DirectionalLight( 'white' );
        light.position.set( 1, 1, 1 );
        this.light = light;
        this.scene.add( light );
    }

    initTerrain() {
        const { scene, camera, renderer } = this;

        const geometry = new THREE.PlaneGeometry( 10, 10, 100, 100 )
		const pos = geometry.getAttribute( 'position' )
		const simplex = new SimplexNoise();

        this.simplex = simplex;

        for(let i = 0; i < pos.count; i++ ){
            pos.setZ( i, this.elevation( pos.getX(i), pos.getY(i) ) );
        }

        geometry.computeVertexNormals( );

        const material = new THREE.MeshPhysicalMaterial({
            roughness: 1,
            metalness: 0,
            color: 'seagreen'
        })

        const terrain = new THREE.Mesh(geometry, material );	
        terrain.rotation.x = -Math.PI/2;    
        scene.add( terrain );


        // texture
        const canvas = document.createElement( 'CANVAS' );
            canvas.width = 64;
            canvas.height = 8;

        const context = canvas.getContext( '2d' );

        const gradient = context.createLinearGradient( 0, 0, 64, 0 );
        gradient.addColorStop( 0.0, 'rgba(255,255,255,0)' );
        gradient.addColorStop( 0.5, 'rgba(255,255,255,128)' );
        gradient.addColorStop( 1.0, 'rgba(255,255,255,0)' );

        context.fillStyle = gradient;
        context.fillRect( 0, 0, 64, 8 );

        const texture = new THREE.CanvasTexture( canvas );

        // create lines

        const n = 10; // number of lines
        const lines = [];

        for( let i=0; i < n; i++ ){
            let line = new THREE.Mesh(
                new THREE.PlaneGeometry( 1, 1, 20, 1 ),
                new THREE.MeshBasicMaterial( {
                                map: texture,
                                side:THREE.DoubleSide,
                                transparent: true,
                                depthWrite: false,
                } )
            );
            line.pos = line.geometry.getAttribute( 'position' );
            line.rnda = Math.random();
            line.rndb = Math.random();
            line.rndc = Math.random();
            line.rndd = Math.random();
            lines.push( line );
        }

        this.lines = lines;
        scene.add( ...lines );
    }

    elevation( x, y ){
        const { simplex } = this;
        if( x*x > 24.9 ) return -1;
        if( y*y > 24.9 ) return -1;
    
        const major = 0.6*simplex.noise( 0.1*x, 0.1*y );
        const minor = 0.2*simplex.noise( 0.3*x, 0.3*y );
    
        return major + minor;
    }

    flowLine( time, line ) {
		time = time / 3000;
		for( let i=0; i < 42; i++ ) {
            let t = time + (i%21)/60,
                    x = 4*Math.sin( 5*line.rnda*t + 6*line.rndb ),
                    y = 4*Math.cos( 5*line.rndc*t + 6*line.rndd ),
                    z =  this.elevation( x, y ) + 0.5 + 0.04*(i>20?1:-1)*Math.cos((i%21-10)/8);
        
            line.pos.setXYZ( i, x, z, -y );
		}
		line.pos.needsUpdate = true;
    }

    animationLoop( t ) {
        const { scene, camera, renderer, controls, lines, light } = this;
        for( let line of lines ) {
            this.flowLine( t, line );
        }
        
        controls.update( );
        
        light.position.copy( camera.position );

        renderer.render( scene, camera );
    }

    dispose() {
        super.dispose();
    }
}