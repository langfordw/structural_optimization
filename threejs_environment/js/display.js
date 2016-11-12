function displayFixedTriangle(node) {
	_sideLength = 30
	var y = Math.sqrt(Math.pow(_sideLength,2) - Math.pow(_sideLength/2,2));
	var fixedGeo = new THREE.Geometry();
	fixedGeo.vertices.push(new THREE.Vector3(-_sideLength/2,0,y),
						   new THREE.Vector3(0,0,0),
						   new THREE.Vector3(_sideLength/2,0,y));
	fixedGeo.faces.push( new THREE.Face3(0,2,1));
	fixedGeo.computeFaceNormals();
	// var material = new THREE.MeshLambertMaterial( { color: 0x4E0463, 
	// 	envMap: reflectionCube, 
	// 	combine: THREE.MixOperation, 
	// 	reflectivity: 0.1 } );
	if (node.fixed_dof.x && node.fixed_dof.z) {
		var material = new THREE.MeshBasicMaterial( {color: 0x4E0463} );
	} else {
		var material = new THREE.MeshBasicMaterial( {color: 0x9E0463} );
	}
	var triangle = new THREE.Mesh(fixedGeo, material);
	triangle.position.add(node.getPosition());
	sceneAdd(triangle)
	return triangle;
}



function drawCylinder(vstart, vend) {
    var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position  = vend.clone().add(vstart).divideScalar(2);

    var cylinder = new THREE.CylinderGeometry(3,3,distance,6,6,false);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	// var material = new THREE.MeshLambertMaterial( { color: 0xbbbbbb, 
	// 	envMap: reflectionCube, 
	// 	combine: THREE.MixOperation, 
	// 	reflectivity: 0.3 } );

    var orientation = new THREE.Matrix4();
    var offsetRotation = new THREE.Matrix4();
    var offsetPosition = new THREE.Matrix4();
    orientation.lookAt(vstart,vend,new THREE.Vector3(0,1,0));
    offsetRotation.makeRotationX(HALF_PI);
    orientation.multiply(offsetRotation);
    cylinder.applyMatrix(orientation)

    var mesh = new THREE.Mesh(cylinder,material);
    mesh.position.x=position.x;
    mesh.position.z=position.z;
	return mesh
}

function drawPlate(vstart,vend) {
	var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position  = vstart.clone().add(vend).divideScalar(2); //new THREE.Vector3(0,0,0);//

    var plate = new THREE.BoxGeometry(distance,5,50);
    // var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	var material = new THREE.MeshLambertMaterial( { color: 0xbbbbbb, 
		envMap: reflectionCube, 
		combine: THREE.MixOperation, 
		reflectivity: 0.3 } );

    var orientation = new THREE.Matrix4();
    var offsetRotation = new THREE.Matrix4();
    var offsetPosition = new THREE.Matrix4();
    orientation.lookAt(vstart,vend,new THREE.Vector3(0,1,0));
    offsetRotation.makeRotationX(HALF_PI);
    orientation.multiply(offsetRotation);
    plate.applyMatrix(orientation)

    var mesh = new THREE.Mesh(plate,material);
    // mesh.position.x=0;
    mesh.position.z=position.clone().add(new THREE.Vector3(0,0,-distance/2.)).z;

	return mesh
}