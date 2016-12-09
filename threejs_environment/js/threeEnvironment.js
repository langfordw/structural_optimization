var container, stats;

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer( { antialias: true } );
var camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, 
									window.innerHeight / 2, window.innerHeight / - 2, -1000, 10000 );

var wrapper = new THREE.Object3D();//object to set global scale and position
var beamWrapper = new THREE.Object3D();//object to set global scale and position
var gridHelper;

// var reflectionCube;
// var refractionCube;

// function loadCubeMap() { 
// 	// Define the urls for the cube map textures 
// 	var path = "textures/cube/SwedishRoyalCastle/";
// 	var format = '.jpg';
// 	var urls = [
// 			path + 'px' + format, path + 'nx' + format,
// 			path + 'py' + format, path + 'ny' + format,
// 			path + 'pz' + format, path + 'nz' + format
// 		];
// 	reflectionCube = new THREE.CubeTextureLoader().load( urls );
// 	reflectionCube.format = THREE.RGBFormat;

// 	refractionCube = new THREE.CubeTextureLoader().load( urls );
// 	refractionCube.mapping = THREE.CubeRefractionMapping;
// 	refractionCube.format = THREE.RGBFormat;
// }

function initThreeJS() {
	// container = document.createElement( 'div' );
	// container = $("#threeDiv");
	// console.log(container)
	
	var container = document.getElementById("threeDiv")
	renderer.setSize( window.innerWidth, window.innerHeight );
	// $("#threeDiv").append(renderer.domElement);
	// document.body.appendChild( renderer.domElement );
	container.appendChild(renderer.domElement)

	// renderer.setClearColor( 0x404040 );
	// renderer.setPixelRatio( window.devicePixelRatio );

	// renderer.shadowMap.enabled = true;
	// $("#threeDiv").appendChild( renderer.domElement );

	// renderer.setSize( window.innerWidth, window.innerHeight );
	// container.append(renderer.domElement);
	// scene.background = new THREE.Color(0x404040);
	// scene.background = new THREE.Color(0xffffff);
	scene.background = new THREE.Color(0xdedede);
	

	// top view
	camera_center = {x:150,z:-150};
	camera.position.x = camera_center.x;
	camera.position.z = camera_center.z;
	camera.position.y = 100;
	camera.updateProjectionMatrix();
	scene.add( camera );

	// var helper = new THREE.GridHelper( 10000, 1000, 0xfffff );
	// helper.position.y = 0;
	// helper.material.opacity = 0.5;
	// helper.material.transparent = true;
	// scene.add( helper );

	gridHelper = new THREE.GridHelper( 10000, 1000, 0x202020 );
	gridHelper.position.y = -20;
	gridHelper.material.opacity = 0.25;
	gridHelper.material.transparent = true;
	scene.add( gridHelper );
	
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

	// container.appendChild( info );
	// container.appendChild( options );

	// stats = new Stats();
	// container.appendChild( stats.dom );

	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.damping = 0.2;
	controls.enableRotate = false;
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
	tracer.reset();
    wrapper.children = [];
}

function sceneClearBeam(){
    beamWrapper.children = [];
}

function render(){
	if (globals.isAnimating) return;
    renderer.render(scene, camera);
}

function startAnimation(callback){
    if (globals.isAnimating){
        console.warn("already animating");
        return;
    }
    console.log("starting animation");
    globals.isAnimating = true;
    loop(function(){
        callback();
        render();
    });

}
function stopAnimation(){
    if (globals.isAnimating) console.log("stopping animation");
    globals.isAnimating = false;
}

function loop(callback){
    callback();
    requestAnimationFrame(function(){
        if (globals.isAnimating) loop(callback);
    });
}

// function animate() {
// 	requestAnimationFrame( animate );
// 	render();
// 	controls.update();
// }

function onWindowResizeThree() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.left = -window.innerWidth / 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = -window.innerHeight / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}