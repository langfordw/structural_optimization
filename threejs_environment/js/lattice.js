var globals = {
	nwide: 4,
	ntall: 2
};

var nodeMat = new THREE.MeshBasicMaterial({color: 0x000000});
var nodeGeo = new THREE.SphereGeometry(6,20,20);

var beamMat = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 10});

function displayFixedTriangle(node) {
	_sideLength = 30
	var y = Math.sqrt(Math.pow(_sideLength,2) - Math.pow(_sideLength/2,2));
	var fixedGeo = new THREE.Geometry();
	fixedGeo.vertices.push(new THREE.Vector3(-_sideLength/2,0,y),
						   new THREE.Vector3(0,0,0),
						   new THREE.Vector3(_sideLength/2,0,y));
	fixedGeo.faces.push( new THREE.Face3(0,2,1));
	fixedGeo.computeFaceNormals();
	this.object3D = new THREE.Mesh(fixedGeo, new THREE.MeshNormalMaterial());
	this.object3D.position.add(node.getPosition());
	sceneAdd(this.object3D)
}

function Node(position, index) {
	this.index = index;
	this.object3D = new THREE.Mesh(nodeGeo, nodeMat);
	position = position.clone();
	this.object3D.position.set(position.x,position.y,position.z);
	sceneAdd(this.object3D);
	this.beams = [];
	this.fixed = false;
}

Node.prototype.addBeam = function(beam) {
	this.beams.push(beam);
}

Node.prototype.getPosition = function() {
	return this.object3D.position;
}

Node.prototype.getIndex = function() {
	return this.index;
}

Node.prototype.setFixed = function(fixed) {
	this.fixed = fixed;
	displayFixedTriangle(this);
}

function Beam(nodes, index) {
	this.index = index;
	nodes[0].addBeam(this);
	nodes[1].addBeam(this);
	this.vertices = [nodes[0].getPosition(), nodes[1].getPosition()];

	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = this.vertices;

	this.object3D = new THREE.Line(lineGeo, beamMat);
	sceneAdd(this.object3D);
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
				var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]])
				_beams.push(beam)
			}	

			// negative slope diagonals
			if (j < globals.ntall-1 && i > 0){
				var beam = new Beam([_nodes[index],_nodes[index-globals.ntall+1]])
				_beams.push(beam)
			}

			index = index +1;
		}
	}

	return {
		nodes: _nodes,
		beams: _beams 
	};
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

	console.log(geom);
}


