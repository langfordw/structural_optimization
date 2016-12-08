// function Beam(nodes, index, a1a2=[10000000,10000000],type='rigid') {
function Beam(nodes, index, a1a2=[10000000,100000000],type='rigid') {
	this.index = index;
	this.part = null;
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
	this.type = type;

	this.a1 = a1a2[0]/this.len0; // AE/L 100GPa * 100 mm^2
	this.a2 = a1a2[1]/Math.pow(this.len0,3); // EI/L^3 100GPa * 10mm^4/12
	this.rho = 1.0e1;//2.7e2; //e-6 aluminum = 2.7g/cm^3 (in kg/mm^3) //2700;//kg/m^3
	this.A = 100; // 10 x 10 mm

	this.k_prime = math.zeros(6,6);
	this.assemble_k_prime();

	this.kp = math.zeros(6,6,'sparse');
	this.assemble_kp();

	this.full_T = math.zeros(6,6,'sparse');
	this.assemble_full_T();

	this.T = math.matrix([0],'sparse');
	this.assemble_T();

	this.angular_deformation_scale = this.len/4.

	this.k = {
		n00: null,
		n11: null,
		n01: null,
		n10: null,
		full: null
	};
	this.k.n00 = math.zeros(3,3,'sparse');
	this.k.n11 = math.zeros(3,3,'sparse');
	this.k.n01 = math.zeros(3,3,'sparse');
	this.k.n10 = math.zeros(3,3,'sparse');
	this.k.full = math.zeros(3,3,'sparse');
	this.calculate_4ks();

	this.u_local = math.zeros(6,1);

	this.f_local = math.zeros(6,1);

	// BEAMS AS LINES
	// var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: 10});
	// var lineGeo = new THREE.Geometry();
	// lineGeo.dynamic = true;
	// lineGeo.vertices = this.vertices;
	// this.object3D = new THREE.Line(lineGeo, beamMat);

	// BEAMS AS CUBIC BEZIERS
	var l = this.angular_deformation_scale;
	var dtheta = [this.theta0[0]+this.theta[0], this.theta0[1]+this.theta[1]];
	var curve = new THREE.CubicBezierCurve3(
		this.vertices[0],
		this.vertices[0].clone().add(new THREE.Vector3( l*Math.cos(dtheta[0]), 0, l*Math.sin(dtheta[0]) )),
		this.vertices[1].clone().add(new THREE.Vector3( -l*Math.cos(dtheta[1]), 0, -l*Math.sin(dtheta[1]) )),
		this.vertices[1]
	);
	var thickness = null;
	if (this.type == 'rigid') { thickness = 10; }
	else { thickness = 3; }

	var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: thickness});
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = curve.getPoints( 50 );
	this.object3D = new THREE.Line( lineGeo, beamMat );
	this.lastColor = this.object3D.material.color.clone();
	this.object3D._myBeam = this;
	sceneAddBeam(this.object3D);
}

Beam.prototype.updateBeam = function() {
	// beamWrapper.remove(this.object3D);
	this.theta = [-this.nodes[0].theta, -this.nodes[1].theta];
	
	var l = this.angular_deformation_scale;
	var dtheta = [this.theta0[0]+this.theta[0], this.theta0[1]+this.theta[1]];
	var curve = new THREE.CubicBezierCurve3(
		this.vertices[0],
		this.vertices[0].clone().add(new THREE.Vector3( l*Math.cos(dtheta[0]), 0, l*Math.sin(dtheta[0]) )),
		this.vertices[1].clone().add(new THREE.Vector3( -l*Math.cos(dtheta[1]), 0, -l*Math.sin(dtheta[1]) )),
		this.vertices[1]
	);
	var thickness = null;
	if (this.type == 'rigid') { thickness = 10; }
	else { thickness = 3; }

	var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: thickness}); //2+(this.len0/10)
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

Beam.prototype.assemble_full_T = function() {
	var c = (this.nodes[1].getPosition().x - this.nodes[0].getPosition().x)/this.len;
	var s = (this.nodes[1].getPosition().z - this.nodes[0].getPosition().z)/this.len;

	var index = 0;
	setEl(this.full_T,[index,index],c);
	setEl(this.full_T,[index+1,index+1],c);
	setEl(this.full_T,[index,index+1],s);
	setEl(this.full_T,[index+1,index],-s);
	setEl(this.full_T,[index+2,index+2],1);

	var index = 3;
	setEl(this.full_T,[index,index],c);
	setEl(this.full_T,[index+1,index+1],c);
	setEl(this.full_T,[index,index+1],s);
	setEl(this.full_T,[index+1,index],-s);
	setEl(this.full_T,[index+2,index+2],1);

	return this.full_T;
}

Beam.prototype.reset = function() {
	this.k_prime = math.zeros(6,6,'sparse');
	this.assemble_k_prime();

	this.kp = math.zeros(6,6,'sparse');
	this.assemble_kp();

	this.full_T = math.zeros(6,6,'sparse');
	this.assemble_full_T();

	this.T = math.matrix([0],'sparse');
	this.assemble_T();

	this.angular_deformation_scale = this.len/4.

	this.k = {
		n00: null,
		n11: null,
		n01: null,
		n10: null,
		full: null
	};
	this.k.n00 = math.zeros(3,3,'sparse');
	this.k.n11 = math.zeros(3,3,'sparse');
	this.k.n01 = math.zeros(3,3,'sparse');
	this.k.n10 = math.zeros(3,3,'sparse');
	this.k.full = math.zeros(3,3,'sparse');
	this.calculate_4ks();

	this.u_local = math.zeros(6,1);

	this.f_local = math.zeros(6,1);
}

Beam.prototype.assemble_T = function() {
	var index = 0;
	var dof_count = 0;
	this.T = math.matrix([0]);
	for (var i=0; i < this.nodes.length; i++) {
		var node = this.nodes[i];

		var c = (this.nodes[1].getPosition().x - this.nodes[0].getPosition().x)/this.len;
		var s = (this.nodes[1].getPosition().z - this.nodes[0].getPosition().z)/this.len;
		
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
	}
	this.T = this.T.resize([6,dof_count]);
	return this.T
}

Beam.prototype.calculate_4ks = function() {
	// return series of 3x3 matrices:
		// one for each un-fixed node
		// and two more for their interaction (0's if one is fixed)
	var k0 = math.add(this.k_prime,this.kp)
	// var k0 = this.k_prime;

	node0 = this.nodes[0];
	node1 = this.nodes[1];
	if (!node0.fixed && !node1.fixed) {
		// K is 6x6
		this.k.full = math.multiply(math.multiply(math.transpose(this.T),k0),this.T);
		get3x3subset(this.k.full, [0,0], this.k.n00);
		get3x3subset(this.k.full, [3,3], this.k.n11);
		get3x3subset(this.k.full, [0,3], this.k.n01);
		get3x3subset(this.k.full, [3,0], this.k.n10);
	} else if (!node0.fixed) {
		// only node0 is free, K is 3x3
		this.k.full = math.multiply(math.multiply(math.transpose(this.T),k0),this.T);
		this.k.n00 = this.k.full
		this.k.n11 = null;
		this.k.n01 = null;
		this.k.n10 = null;
	} else if (!node1.fixed) {
		// only node1 is free, K is 3x3
		this.k.full = math.multiply(math.multiply(math.transpose(this.T),k0),this.T);
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

Beam.prototype.assemble_kp = function() {
	if (this.f_local == null) {
		this.f_local = math.zeros(6,1);
	}

	var p = getEl(this.f_local,[0,0])-getEl(this.f_local,[3,0]);
	var l = this.len;

	var i = 0;
	var j = 0;
	setEl(this.kp,[i+1,j+1],6*p/(5*l));
	setEl(this.kp,[i+2,j+1],p/10);
	setEl(this.kp,[i+1,j+2],p/10);
	setEl(this.kp,[i+2,j+2],2*p*l/15);

	i = 3;
	j = 0;
	setEl(this.kp,[i+1,j+1],-6*p/(5*l));
	setEl(this.kp,[i+2,j+1],p/10);
	setEl(this.kp,[i+1,j+2],-p/10);
	setEl(this.kp,[i+2,j+2],-p*l/30);

	i = 0;
	j = 3;
	setEl(this.kp,[i+1,j+1],-6*p/(5*l));
	setEl(this.kp,[i+2,j+1],-p/10);
	setEl(this.kp,[i+1,j+2],p/10);
	setEl(this.kp,[i+2,j+2],-p*l/30);

	i = 3;
	j = 3;
	setEl(this.kp,[i+1,j+1],6*p/(5*l));
	setEl(this.kp,[i+2,j+1],-p/10);
	setEl(this.kp,[i+1,j+2],-p/10);
	setEl(this.kp,[i+2,j+2],2*p*l/15);
}

Beam.prototype.assemble_u_local = function() {
	var ug1 = this.nodes[0].u;
	var ug2 = this.nodes[1].u;
	var u_global = math.flatten(math.matrix([ug1, ug2]));
	this.u_local = math.multiply(math.transpose(this.full_T),u_global);
}

Beam.prototype.calculate_local_force = function() {
	this.f_local = math.multiply(this.k_prime,this.u_local);
}

Beam.prototype.calculate_global_force = function() {
	this.f_global = math.multiply(this.full_T,this.f_local);
}

Beam.prototype.updatePosition = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.updateLength();
};

Beam.prototype.updateLength = function() {
	this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
}

Beam.prototype.highlight = function() {
	if (!this.highlighted) {
		this.lastColor = this.object3D.material.color.clone();
		// this.object3D.material.color.set(0x7fff00);
		this.object3D.material.color.set(0xff00ff);
	}
	this.highlighted = true;
}

Beam.prototype.unhighlight = function() {
	this.object3D.material.color.set(this.lastColor);
	this.highlighted = false;
}

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

Beam.prototype.string = function() {
	// return '{"index":' + this.index + ',"node1":' + this.nodes[0].index + ',"node2":' + this.nodes[1].index + '}';
	var string = JSON.stringify({index:this.index,
						   node1:this.nodes[0].index,
						   node2:this.nodes[1].index});
	console.log(string)
	return string;
	// return JSON.stringify({index:this.index,
	// 					   node1:this.nodes[0],
	// 					   node2:this.nodes[1]})
}

Beam.prototype.addPart = function(part) {
	this.part = part;
	this.nodes[0].addPart(part);
	this.nodes[1].addPart(part);
	// part.addBeam(this);
}

Beam.prototype.attachToPart = function(part) {
	this.part = part;
}

Beam.prototype.create = function() {
	globals.geom.beams.push(this);
}

Beam.prototype.destroy = function() {
	console.log("destroy beam " + this.index)
	this.nodes[0].detachBeam(this);
	this.nodes[1].detachBeam(this);

	// detachFromPart?
	// this.detachPart();

	beamWrapper.remove(this.object3D);
	var index = globals.geom.beams.indexOf(this);
	globals.geom.beams.splice(index,1);
}

Beam.prototype.subdivide = function() {

}

// Beam.prototype.destroy = function(reindex=false) {
// 	// modes:
// 		// normal: remove beam from geometry list, remove from wrapper, remove reference from part,
// 		//			remove unconnected nodes, ( remove reference from other node (not this_node) ? ),
// 		// standalone: all of the above + reindex nodes and beams

// 	// var node = beam.nodes[0]

// 	// if (this_node != null) {
// 	// 	// remove beam reference from other node
// 	// 	if (this_node == node) {
// 	// 		node = beam.nodes[1]
// 	// 	}
// 	// 	node.removeBeam(beam);
// 	// } else {
// 	// 	// remove beam reference from both nodes
// 	// 	beam.nodes[0].removeBeam(beam);
// 	// 	beam.nodes[1].removeBeam(beam);
// 	// }
	
// 	this.nodes[0].removeBeamRef(this);
// 	this.nodes[1].removeBeamRef(this);
// 	this.part.removeBeamRef();

// 	beamWrapper.remove(this.object3D);
// 	var index = globals.geom.beams.indexOf(this);
// 	globals.geom.beams.splice(index,1);
	
// 	if (reindex) {
// 		reindex(globals.geom.nodes);
// 		reindex(globals.geom.beams);
// 	}
// }