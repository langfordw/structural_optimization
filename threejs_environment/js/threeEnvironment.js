var container, stats;

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer( { antialias: true } );
var camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, 
									window.innerHeight / 2, window.innerHeight / - 2, -1000, 10000 );

var wrapper = new THREE.Object3D();//object to set global scale and position
var beamWrapper = new THREE.Object3D();//object to set global scale and position

var reflectionCube;
var refractionCube;

function loadCubeMap() { 
// Define the urls for the cube map textures 
var path = "textures/cube/SwedishRoyalCastle/";
var format = '.jpg';
var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
reflectionCube = new THREE.CubeTextureLoader().load( urls );
reflectionCube.format = THREE.RGBFormat;

refractionCube = new THREE.CubeTextureLoader().load( urls );
refractionCube.mapping = THREE.CubeRefractionMapping;
refractionCube.format = THREE.RGBFormat;
}

function initThreeJS() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// top view
	camera_center = {x:150,z:-150};
	camera.position.x = camera_center.x;
	camera.position.z = camera_center.z;
	camera.position.y = 100;
	// camera.rotation.x = - Math.PI / 2;
	// camera.rotation.y = - Math.PI/2;
	// camera.rotation.z = 0;
	// camera.lookAt(new THREE.Vector3(100,0,-100))
	camera.updateProjectionMatrix();
	scene.add( camera );

	var helper = new THREE.GridHelper( 1000, 100, 0xfffff );
	helper.position.y = 0;
	helper.material.opacity = 0.5;
	helper.material.transparent = true;
	scene.add( helper );
	
	renderer.setClearColor( 0x404040 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	var ambient = new THREE.AmbientLight( 0xffffff );
	scene.add( ambient );

	pointLight = new THREE.PointLight( 0xffffff, 1 );
	pointLight.position.x = -200;
	scene.add( pointLight );

	var info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	options = document.createElement( 'div' );
	options.style.position = 'absolute';
	options.style.top = '30px';
	options.style.width = '100%';
	options.style.textAlign = 'center';

	container.appendChild( info );
	container.appendChild( options );

	stats = new Stats();
	// container.appendChild( stats.dom );

	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.damping = 0.2;
	// controls.enableRotate = false;
	controls.addEventListener( 'change', render );
	controls.target = new THREE.Vector3(camera_center.x,0,camera_center.z);
	controls.rotateLeft(Math.PI/2);

	sceneAdd(beamWrapper);
	scene.add(wrapper);

	// loadCubeMap();
}

function sceneAdd(object){
    wrapper.add(object);
}

function sceneAddBeam(object){
    beamWrapper.add(object);
}

function sceneClear(){
    wrapper.children = [];
}

function sceneClearBeam(){
    beamWrapper.children = [];
}

function render(){
	// updateGeometry();
    renderer.render(scene, camera);
}

function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
	controls.update();
}