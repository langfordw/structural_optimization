function Beam(nodes, index) {
	this.index = index;
	this.nodes = [nodes[0], nodes[1]];
	nodes[0].addBeam(this);
	nodes[1].addBeam(this);
	this.vertices = [nodes[0].getPosition(), nodes[1].getPosition()];
	this.theta0 = [this.getAngle(this.vertices[1]), this.getAngle(this.vertices[1])];
	this.theta = [this.nodes[0].theta, this.nodes[1].theta];
	this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
	this.len0 = this.len;
	this.force = 0
	this.f;
	this.highlighted = false;

	this.a1 = 100;
	this.a2 = 1;

	this.k_prime = math.zeros(6,6);
	this.assemble_k_prime();

	this.T = math.matrix([0]);
	this.assemble_T();

	this.k = {
		n00: null,
		n11: null,
		n01: null,
		n10: null,
		full: null
	};
	this.k.n00 = math.zeros(3,3);
	this.k.n11 = math.zeros(3,3);
	this.k.n01 = math.zeros(3,3);
	this.k.n10 = math.zeros(3,3);
	this.k.full = math.zeros(3,3);
	this.calculate_4ks();

	// BEAMS AS LINES
	// var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: 10});
	// var lineGeo = new THREE.Geometry();
	// lineGeo.dynamic = true;
	// lineGeo.vertices = this.vertices;
	// this.object3D = new THREE.Line(lineGeo, beamMat);

	// BEAMS AS CUBIC BEZIERS
	var l = this.len/3;
	var dtheta = [this.theta0[0]-this.theta[0], this.theta0[1]+this.theta[1]];
	var curve = new THREE.CubicBezierCurve3(
		this.vertices[0],
		this.vertices[0].clone().add(new THREE.Vector3( l*Math.cos(dtheta[0]), 0, l*Math.sin(dtheta[0]) )),
		this.vertices[1].clone().add(new THREE.Vector3( -l*Math.cos(dtheta[1]), 0, -l*Math.sin(dtheta[1]) )),
		this.vertices[1]
	);
	var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: 10});
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = curve.getPoints( 50 );
	this.object3D = new THREE.Line( lineGeo, beamMat );
	this.lastColor = this.object3D.material.color.clone();
	this.object3D._myBeam = this;
}

Beam.prototype.updateBeam = function() {
	this.theta = [-this.nodes[0].theta, -this.nodes[1].theta];
	
	var l = this.len/3;
	var dtheta = [this.theta0[0]-this.theta[0], this.theta0[1]+this.theta[1]];
	var curve = new THREE.CubicBezierCurve3(
		this.vertices[0],
		this.vertices[0].clone().add(new THREE.Vector3( l*Math.cos(dtheta[0]), 0, l*Math.sin(dtheta[0]) )),
		this.vertices[1].clone().add(new THREE.Vector3( -l*Math.cos(dtheta[1]), 0, -l*Math.sin(dtheta[1]) )),
		this.vertices[1]
	);
	var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: 10});
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = curve.getPoints( 50 );
	this.object3D = new THREE.Line( lineGeo, beamMat );
	this.object3D._myBeam = this;
	this.lastColor = this.object3D.material.color.clone();
	sceneAddBeam(this.object3D);
}

Beam.prototype.assemble_k_prime = function() {
	this.k_prime.subset(math.index(0,0),this.a1);
	this.k_prime.subset(math.index(1,1),12*this.a2);
	this.k_prime.subset(math.index(2,1),6*this.len*this.a2);
	this.k_prime.subset(math.index(1,2),6*this.len*this.a2);
	this.k_prime.subset(math.index(2,2),4*Math.pow(this.len,2)*this.a2);
	this.k_prime.subset(math.index(3,3),this.a1);
	this.k_prime.subset(math.index(4,4),12*this.a2);
	this.k_prime.subset(math.index(5,4),-6*this.len*this.a2);
	this.k_prime.subset(math.index(4,5),-6*this.len*this.a2);
	this.k_prime.subset(math.index(5,5),4*Math.pow(this.len,2)*this.a2);
	this.k_prime.subset(math.index(0,3),-this.a1);
	this.k_prime.subset(math.index(1,4),-12*this.a2);
	this.k_prime.subset(math.index(2,4),-6*this.len*this.a2);
	this.k_prime.subset(math.index(1,5),6*this.len*this.a2);
	this.k_prime.subset(math.index(2,5),2*Math.pow(this.len,2)*this.a2);
	this.k_prime.subset(math.index(3,0),-this.a1);
	this.k_prime.subset(math.index(4,1),-12*this.a2);
	this.k_prime.subset(math.index(5,1),6*this.len*this.a2);
	this.k_prime.subset(math.index(4,2),-6*this.len*this.a2);
	this.k_prime.subset(math.index(5,2),2*Math.pow(this.len,2)*this.a2);
	return this.k_prime;
}

Beam.prototype.getAngle = function(fromNode) {
	var node2 = this.vertices[0];
    if (node2.equals(fromNode)) node2 = this.vertices[1];
	return Math.atan2(fromNode.z-node2.z, fromNode.x-node2.x);
};

Beam.prototype.assemble_T = function() {
	var index = 0;
	var dof_count = 0;
	this.T = math.matrix([0]);
	_.each(this.nodes, function(node) {
		// var c = Math.abs(Math.cos(this.getAngle(node.getPosition())));
		// var s = Math.abs(Math.sin(this.getAngle(node.getPosition())));

		var c = (this.nodes[1].getPosition().x - this.nodes[0].getPosition().x)/this.len;
		var s = (this.nodes[1].getPosition().z - this.nodes[0].getPosition().z)/this.len;

		// othernode = this.nodes[1]
		// if (othernode.index == node.index) {
		// 	othernode = this.nodes[0]
		// }

		// var c = (othernode.getPosition().x - node.getPosition().x)/this.len;
		// var s = (othernode.getPosition().z - node.getPosition().z)/this.len;
		
		if (!node.fixed_dof.x) {
			dof_count++;
			setEl(this.T,[index,dof_count-1],c);
		}
		if (!node.fixed_dof.z) {
			dof_count++;
			setEl(this.T,[index+1,dof_count-1],c); 
		}
		if (!node.fixed_dof.x && !node.fixed_dof.z) {
			setEl(this.T,[index+1,dof_count-2],s);
			setEl(this.T,[index,dof_count-1],-s); 
		}
		if (!node.fixed_dof.c) {
			dof_count++;
			setEl(this.T,[index+2,dof_count-1],1);
		}
		index += 3
	}, this);
	this.T = this.T.resize([6,dof_count]);
	return this.T
}

Beam.prototype.calculate_k = function() {
	if (this.T._size[1] > 0){
		if (this.index == -1) {
			this.k = this.k_prime;
			return this.k;
		} else {
			this.k = math.multiply(math.multiply(math.transpose(this.T),this.k_prime),this.T);
			return this.k;
		}
		
	} else {
		return null;
	}
}

Beam.prototype.calculate_4ks = function() {
	// return series of 3x3 matrices:
		// one for each un-fixed node
		// and two more for their interaction (0's if one is fixed)

	node0 = this.nodes[0];
	node1 = this.nodes[1];
	if (!node0.fixed && !node1.fixed) {
		// K is 6x6
		this.k.full = math.multiply(math.multiply(math.transpose(this.T),this.k_prime),this.T);
		this.k.n00 = math.subset(this.k.full, math.index(math.range(0,3),math.range(0,3)));
		this.k.n11 = math.subset(this.k.full, math.index(math.range(3,6),math.range(3,6)));
		this.k.n01 = math.subset(this.k.full, math.index(math.range(0,3),math.range(3,6)));
		this.k.n10 = math.subset(this.k.full, math.index(math.range(3,6),math.range(0,3)));
	} else if (!node0.fixed) {
		// only node0 is free, K is 3x3
		this.k.full = math.multiply(math.multiply(math.transpose(this.T),this.k_prime),this.T);
		this.k.n00 = this.k.full
		this.k.n11 = null;
		this.k.n01 = null;
		this.k.n10 = null;
	} else if (!node1.fixed) {
		// only node1 is free, K is 3x3
		this.k.full = math.multiply(math.multiply(math.transpose(this.T),this.k_prime),this.T);
		this.k.n11 = this.k.full
		this.k.n00 = null;
		this.k.n01 = null;
		this.k.n10 = null;
	}
	return {
		n00: this.k.n00,
		n11: this.k.n11,
		n01: this.k.n01, 
		n10: this.k.n10,
		full: this.k.full
	};
}

Beam.prototype.updatePosition = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
    // this.object3D.geometry.normalsNeedUpdate = true;
    // this.object3D.geometry.computeFaceNormals();
    // this.object3D.geometry.computeVertexNormals();
    // this.object3D.geometry.computeBoundingSphere(); // this is very expensive (roughly doubles the compute time for an update)
};

Beam.prototype.highlight = function() {
	if (!this.highlighted) {
		this.lastColor = this.object3D.material.color.clone();
		this.object3D.material.color.set(0xffff00);
	}
	this.highlighted = true;
}

Beam.prototype.unhighlight = function() {
	this.object3D.material.color.set(this.lastColor);
	this.highlighted = false;
}

Beam.prototype.getPE = function() {
	return (this.a1 * Math.pow(this.len-this.len0,2));
};

Beam.prototype.getIndex = function() {
	return this.index;
};

Beam.prototype.setForce = function(forceMag) {
	this.force = forceMag;
}

Beam.prototype.setColor = function() {
	if (this.force > 0) {
		this.object3D.material.color.setHex(0x0000ff);
	}
	if (this.force < 0) {
		this.object3D.material.color.setHex(0xff0000);
	}
}

Beam.prototype.setHSLColor = function(val, max, min){
    if (val === null){
        this.object3D.material.color.setHex(0x000000);
        return;
    }
    var scaledVal = (val - min)/(max - min) * 0.7;
    var color = new THREE.Color();
    color.setHSL(scaledVal, 1, 0.5);
    this.object3D.material.color.set(color);
    this.lastColor = this.object3D.material.color.clone();
};

Beam.prototype.setTensionCompressionColor = function(val, max){
    var scaledVal = Math.pow(val/max, 1/2) + 0.25;
    if (val < 0){
        this.object3D.material.color.setRGB(scaledVal, 0, 0);
    } else {
        this.object3D.material.color.setRGB(0, 0, scaledVal);
    }
    this.lastColor = this.object3D.material.color.clone();
};