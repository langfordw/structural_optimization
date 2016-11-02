var globals = {
	nwide: 4,
	ntall: 3
};

var nodeMat = new THREE.MeshBasicMaterial({color: 0x259997});
var nodeGeo = new THREE.SphereGeometry(6,20,20);

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
	var material = new THREE.MeshBasicMaterial( {color: 0x4E0463} );
	var triangle = new THREE.Mesh(fixedGeo, material);
	triangle.position.add(node.getPosition());
	sceneAdd(triangle)
}

function Node(position, index) {

	// var nodeMat = new THREE.MeshLambertMaterial( { color: 0x0066ff, 
	// 	envMap: reflectionCube, 
	// 	combine: THREE.MixOperation, 
	// 	reflectivity: 0.3 } );

	this.index = index;
	this.object3D = new THREE.Mesh(nodeGeo, nodeMat);
	position = position.clone();
	this.object3D.position.set(position.x,position.y,position.z);
	sceneAdd(this.object3D);
	this.beams = [];
	this.fixed = false;
	this.externalForce = null;
	this.springs = [];
	this.x0 = position.x;
	this.z0 = position.z;
	this.displacement_vector = null;
}

Node.prototype.addDisplacement = function(displacement_vector) {
	this.displacement = displacement_vector;
}

Node.prototype.addExternalForce = function(force_vector) {
	if (this.fixed == false) {
		if (this.externalForce == null) {
		this.externalForce = force_vector;
		} else {
			this.externalForce.add(force_vector);
		}
	}
}

Node.prototype.addBeam = function(beam) {
	this.beams.push(beam);
}

Node.prototype.getPosition = function() {
	return this.object3D.position;
}

Node.prototype.move = function(position){
    this.object3D.position.set(position.x, position.y, position.z);
    for (i=0; i < this.beams.length; i++) {
        this.beams[i].updatePosition();
    }
}

Node.prototype.getIndex = function() {
	return this.index;
}

Node.prototype.setFixed = function(fixed) {
	this.fixed = fixed;
	displayFixedTriangle(this);
}

Node.prototype.attachSprings = function() {
	if (this.fixed) {
		// number of springs = number of links
		for (i=0; i < this.beams.length; i++) {
			this.attachSpring(new Spring(this, this.beams[i], null));
		}
	} else {
		// number of springs = number of links - 1
		for (i=0; i < this.beams.length-1; i++) {
			this.attachSpring(new Spring(this, this.beams[i], this.beams[i+1]));
		}
	}
}

Node.prototype.attachSpring = function(spring) {
	this.springs.push(spring);
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

function Beam(nodes, index) {
	this.index = index;
	nodes[0].addBeam(this);
	nodes[1].addBeam(this);
	this.vertices = [nodes[0].getPosition(), nodes[1].getPosition()];
	this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
	this.len0 = this.len;

	// BEAMS AS LINES
	var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: 10});
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = this.vertices;
	this.object3D = new THREE.Line(lineGeo, beamMat);

	// BEAMS AS CYLINDERS
	// this.object3D = drawCylinder(this.vertices[0],this.vertices[1])
	
	sceneAdd(this.object3D);
}

Beam.prototype.updatePosition = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
    // this.object3D.geometry.normalsNeedUpdate = true;
    // this.object3D.geometry.computeFaceNormals();
    // this.object3D.geometry.computeVertexNormals();
    this.object3D.geometry.computeBoundingSphere();
};

Beam.prototype.getAngle = function(fromNode) {
	var node2 = this.vertices[0];
    if (node2.equals(fromNode)) node2 = this.vertices[1];
	return Math.atan2(node2.z-fromNode.z, node2.x-fromNode.x);
};

function Spring(node, beam1, beam2) {
	this.node = node;
	this.beams = [];
	this.beams.push(beam1);
	this.fixed = node.fixed;
	this.k = 50;
	if (!this.fixed) {
		this.beams.push(beam2);
	}

	if (this.fixed) {
		this.init_angle = this.beams[0].getAngle(this.node.getPosition());
	} else {
		this.init_angle = this.beams[0].getAngle(this.node.getPosition())-this.beams[1].getAngle(this.node.getPosition());
	}

	this.angle = this.init_angle;
	this.dAngle = this.angle-this.init_angle;
}

Spring.prototype.getdAngle = function() {
	if (this.fixed) {
		this.angle = this.beams[0].getAngle(this.node.getPosition());
	} else {
		this.angle = this.beams[0].getAngle(this.node.getPosition())-this.beams[1].getAngle(this.node.getPosition());
	}
	this.dAngle = this.angle-this.init_angle;
	return this.dAngle;
}

Spring.prototype.getPE = function() {
	return this.k*Math.pow(this.getdAngle(),2);
}

function generateGeometry() {

	_nodes = [];
	_beams = [];
	_h = -100;
	_l = 100;

	index = 0;
	for (var i=0; i < globals.nwide; i++) {
		for (var j=0; j < globals.ntall; j++) {

			// add node
			var node = new Node(new THREE.Vector3(_l*i, 0, _h*j),index)
			_nodes.push(node);

			// Horizontal beams
			if (i > 0){
				var beam = new Beam([_nodes[index],_nodes[index-globals.ntall]])
				_beams.push(beam)
			}

			// Vertical Beams
			if (j > 0){
				var beam = new Beam([_nodes[index],_nodes[index-1]])
				_beams.push(beam)
			}			

			// positive slope diagonals
			if (j > 0 && i > 0){
				if (i == 2){
					var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]])
					_beams.push(beam)
				}
			}	

			// // negative slope diagonals
			// if (j < globals.ntall-1 && i > 0){
			// 	var beam = new Beam([_nodes[index],_nodes[index-globals.ntall+1]])
			// 	_beams.push(beam)
			// }

			index = index +1;
		}
	}

	for (var i=0; i < _nodes.length; i++) {
		_nodes[i].attachSprings();
	}

	return {
		nodes: _nodes,
		beams: _beams 
	};
}

function potentialEnergy(_geom) {
	nodes = _geom.nodes;
	beams = _geom.beams;

	sum_PE = 0;
	for (var i=0; i < nodes.length; i++) {
		// console.log(nodes[i]);
		for (var j=0; j < nodes[i].springs.length; j++) {
			sum_PE += nodes[i].springs[j].getPE();
		}		
	}
	// console.log(sum_PE);
	return 0.5*sum_PE;
}

function updatePositions(x) {
	var index = 0;
	for (var i=0; i < geom.nodes.length; i++) {
		geom.nodes[i].move(new THREE.Vector3(x[index],0,x[index+1]))
		index += 2;
	}
}

function getX(x) {
	var index = 0;

	for (var i=0; i < geom.nodes.length; i++) {
		x[index] = geom.nodes[i].getPosition().x;
		x[index+1] = geom.nodes[i].getPosition().z;
		index += 2;
	}

	return x
}

function objectiveFunction(n,m,x,con) {
	// console.log(x)
	updatePositions(x);

	//constraints
	var index = 0;
	for (var i=0; i < geom.beams.length; i++) {
		con[index] = geom.beams[i].len - geom.beams[i].len0
		con[index+1] = -(geom.beams[i].len - geom.beams[i].len0)
		index += 2
	}

	for (var i = 0; i < geom.nodes.length; i++) {
		if (geom.nodes[i].fixed) {
			con[index] = geom.nodes[i].getPosition().x - geom.nodes[i].x0
			con[index+1] = -(geom.nodes[i].getPosition().x - geom.nodes[i].x0)
			con[index+2] =  geom.nodes[i].getPosition().z - geom.nodes[i].z0
			con[index+3] =  -(geom.nodes[i].getPosition().z - geom.nodes[i].z0)
			index += 4;
		}

		if (geom.nodes[i].displacement != null) {
			con[index] = geom.nodes[i].getPosition().x - (geom.nodes[i].x0-geom.nodes[i].displacement.x);
			con[index+1] = -(geom.nodes[i].getPosition().x - (geom.nodes[i].x0-geom.nodes[i].displacement.x));
			index +=2;
		}
	}

	// con[index] = geom.nodes[1].getPosition().x - (geom.nodes[1].x0+60);
	// con[index+1] = -(geom.nodes[1].getPosition().x - (geom.nodes[1].x0+60));
	
	// console.log(con)
	return potentialEnergy(geom)
}

function solveEquilibrium() {
	var n=geom.nodes.length*2; 			// + of variables
	var x=new Array(n);
	var m=(geom.beams.length + 4 + 1)*2; 			// number of constraints
	var rhobeg = 5.0;	// Various Cobyla constants, see Cobyla docs in Cobyja.js
	var rhoend = 1.0e-6;
	var iprint = 1;
	var maxfun = 1500;

	x = getX(x);

	var r=FindMinimum(objectiveFunction, n,  m, x, rhobeg, rhoend,  iprint,  maxfun);
}

var f = 0;
var v = 0;
var t = 0;

function updateGeometry() {
	// for (i=0; i < 100; i++) {
		// f = 0.1*(geom.nodes[1].getPosition().x - 0);
		// v = (v + f/1.0)*0.95
		// geom.nodes[1].move(geom.nodes[1].getPosition().clone().add( new THREE.Vector3(-v,0,0) ));
		// console.log(f)
	// }
	// t += 0.1;
	// var displacement = Math.sin(t)*60
	// console.log(displacement)
	// geom.nodes[1].addDisplacement( new THREE.Vector3(displacement,0,0) )
	// solveEquilibrium();
}


function refreshPoints() {
	sceneClear();
	geom = generateGeometry();
	
	geom.nodes[0].setFixed(true);
	geom.nodes[globals.ntall*(globals.nwide-1)].setFixed(true);
}

function initLattice() {
	geom = generateGeometry()
	geom.nodes[0].setFixed(true);
	geom.nodes[globals.ntall*(globals.nwide-1)].setFixed(true);

	// geom.nodes[1].move(new THREE.Vector3(-30,0,-100));
	// potentialEnergy(geom);
	geom.nodes[2].addDisplacement( new THREE.Vector3(-100,0,0) )
	var start = new Date().getTime();
	solveEquilibrium();
	var dt = new Date().getTime() - start;
	console.log('Solved in ' + dt + 'ms');
	console.log(geom.nodes);
}


