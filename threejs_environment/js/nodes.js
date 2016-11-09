var nodeMat = new THREE.MeshBasicMaterial({color: 0x259997});
var nodeGeo = new THREE.SphereGeometry(6,20,20);
var arrowColor = 0xff0088;

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
	this.fixed_dof = {x:0,z:0,c:0};
	this.externalForce = null;
	this.externalMoment = 0;
	this.springs = [];
	this.x0 = position.x;
	this.z0 = position.z;
	this.displacement = null;
	this.arrow = null;
	this.theta = 0;
	
}

Node.prototype.addDisplacement = function(displacement_vector) {
	this.displacement = displacement_vector;
	this.drawArrow();
}

Node.prototype.addExternalForce = function(force_vector) {
	if (this.fixed == false) {
		if (this.externalForce == null) {
			this.externalForce = force_vector;
		} else {
			this.externalForce.add(force_vector);
		}
		this.drawArrow();
	}
}

Node.prototype.addBeam = function(beam) {
	this.beams.push(beam);
}

Node.prototype.getPosition = function() {
	return this.object3D.position;
}

Node.prototype.setPosition = function(position){
	// this routine is expensive
	var deltaPos = (new THREE.Vector3(0,0,0)).subVectors(position,this.object3D.position);
    this.object3D.position.set(position.x, position.y, position.z);
    for (i=0; i < this.beams.length; i++) {
        this.beams[i].updatePosition();
    }
    if (this.arrow != null) {
    	this.updateArrow(deltaPos);
	}
}

Node.prototype.getIndex = function() {
	return this.index;
}

Node.prototype.setFixed = function(fixed,dof_object) {
	this.fixed = fixed;
	this.fixed_dof = dof_object;
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

Node.prototype.drawArrow = function(position) {
	var arrow = null;
	var vector = null;
	if (position == null) {
		position = this.getPosition().clone();
	}
	if (this.displacement != null) {
		vector = this.displacement;
	} else if (this.externalForce != null) {
		vector = this.externalForce;
	} else {
		return;
	}
	var offsetOrigin = this.externalForce.clone().normalize().multiplyScalar(5);
	var arrow = new THREE.ArrowHelper( vector, position.sub(vector).sub(offsetOrigin), 
									   vector.length(), arrowColor, 10, 20 );
	arrow.line.material = new THREE.LineBasicMaterial( { color: arrowColor, linewidth: 14});
	this.arrow = arrow;
	sceneAdd(arrow);
}

Node.prototype.updateArrow = function(deltaPos) {
	var position = this.arrow.position.add(deltaPos);
	this.arrow.line.position.set(position);
}