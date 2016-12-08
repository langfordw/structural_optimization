var T = Array.matrix(6,6,0);

function DynamicSolver() {
	this.delT = 1.0;
	this.position;
	this.lastPosition;
	this.nextPosition;
	this.velocity;
	this.acceleration;
	this.externalForces;
	this.nodeInfo;
	this.numNodes;
	this.numBeams;
	this.simBeams = [];
	this.indexMap = [];
	this.simNodes = [];
	this.debug = 2;
}


DynamicSolver.prototype.setup = function(geom) {
	this.numNodes = geom.nodes.length;
	this.numBeams = geom.beams.length;

	this.position = Array.vector(this.numNodes*3,0);
	this.global_position = Array.vector(this.numNodes*3,0);
	this.lastPosition = Array.vector(this.numNodes*3,0);
	this.nextPosition = Array.vector(this.numNodes*3,0);
	this.velocity = Array.vector(this.numNodes*3,0);
	this.acceleration = Array.vector(this.numNodes*3,0);
	this.externalForces = Array.vector(this.numNodes*3,0);

	this.indexMap = new Array(geom.nodes.length);
	var index = 0;
	_.each(geom.beams, function(beam) {
		this.simBeams.push(new SimBeam(beam));
	},this);

	var index = 0;
	for (var i=0; i < this.numNodes; i++) {
		var node = geom.nodes[i];
		var simNode = new SimNode(node);
		this.simNodes.push(simNode);

		this.externalForces[simNode.index*3] = simNode.externalForce[0];
		this.externalForces[simNode.index*3+1] = simNode.externalForce[1];
		this.externalForces[simNode.index*3+2] = simNode.externalForce[2];

		var pos = node.getPosition();
		this.global_position[simNode.index*3] = pos.x;
		this.global_position[simNode.index*3+1] = pos.z;
		this.global_position[simNode.index*3+2] = node.theta;
	}

	console.log(this);
	this.firstStep();
}

DynamicSolver.prototype.firstStep = function() {
	// for (var i=0; i < this.numNodes*3; i+=3) {
	// 	// this.lastPosition[i] = this.position[i]-this.delT*this.velocity[i] + this.acceleration[i]*Math.pow(this.delT,2)/2;
		
	// 	// this is probably wrong.... need to get initial acceleration from F/M
	// 	this.lastPosition[i] = this.position[i];
	// 	this.lastPosition[i+1] = this.position[i+1];
	// 	this.lastPosition[i+2] = this.position[i+2];
	// }
	// this.calcAccel();
	this.calcPosition();
	// this.lastPosition = this.position;
	// this.position = this.nextPosition;
	// this.global_position = numeric.add(this.global_position,numeric.sub(this.position,this.lastPosition));
	console.log("first step:");
	console.log(this)
}

DynamicSolver.prototype.step = function() {
	this.calcPosition();
	

	// this.calcAccleration();
	// this.calcVelocity();
	if(this.debug) console.log(this);
}

DynamicSolver.prototype.calcAccleration = function() {
	for (var beam_index=0; beam_index < this.numBeams; beam_index++) {
		var Mel_inv = this.simBeams[beam_index].Mel_inv;
		var Kel = this.simBeams[beam_index].Kel;

		var node1index = this.simBeams[beam_index].node1index;
		var node2index = this.simBeams[beam_index].node2index;

		var node1fixed = this.simBeams[beam_index].node1fixed;
		var node2fixed = this.simBeams[beam_index].node2fixed;

		var pos = [this.position[node1index*3], 
				   this.position[node1index*3+1], 
				   this.position[node1index*3+2], 
				   this.position[node2index*3], 
				   this.position[node2index*3+1], 
				   this.position[node2index*3+2]];

		var lastPos = [this.lastPosition[node1index*3], 
					   this.lastPosition[node1index*3+1], 
					   this.lastPosition[node1index*3+2], 
				   	   this.lastPosition[node2index*3], 
				   	   this.lastPosition[node2index*3+1], 
				   	   this.lastPosition[node2index*3+2]];

		var global_pos = [this.global_position[node1index*3], 
						  this.global_position[node1index*3+1], 
						  this.global_position[node1index*3+2], 
						  this.global_position[node2index*3], 
						  this.global_position[node2index*3+1], 
						  this.global_position[node2index*3+2]];

		var external_forces = [this.externalForces[node1index*3], 
							   this.externalForces[node1index*3+1], 
							   this.externalForces[node1index*3+2], 
							   this.externalForces[node2index*3], 
							   this.externalForces[node2index*3+1], 
							   this.externalForces[node2index*3+2]];

		var T = this.calcT(global_pos);
		var K_global = numeric.dot(numeric.transpose(T),numeric.dot(Kel,T));
		var M_global = numeric.dot(T,numeric.dot(Mel_inv,numeric.transpose(T)));

		if (node1fixed) {
			for (var i =0; i < 3; i++) {
				for (var j = 0; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
					}
				}
			}
			for (var i =0; i < 6; i++) {
				for (var j = 0; j < 3; j++) {
					if (i == j) {
						K_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
					}
				}
			}
		}

		if (node2fixed) {
			for (var i = 3; i < 6; i++) {
				for (var j = 0; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
					}
				}
			}
			for (var i = 0; i < 6; i++) {
				for (var j = 3; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
					}
				}
			}
		}

		var internal_forces = numeric.dot(K_global,pos);
		
		var netforce = numeric.sub(external_forces,internal_forces);

		var accel = numeric.dot(M_global, netforce); // 6 x 1

		// if (!this.simBeams[i].node1fixed) {
			this.acceleration[node1index*3] += accel[0];
			this.acceleration[node1index*3+1] += accel[1];
			this.acceleration[node1index*3+2] += accel[2];
		// }
		// if (!this.simBeams[i].node2fixed) {
			this.acceleration[node2index*3] += accel[3];
			this.acceleration[node2index*3+1] += accel[4];
			this.acceleration[node2index*3+2] += accel[5];
		// }
	}
}

DynamicSolver.prototype.calcVelocity = function() {

	// this.lastPosition = this.position;
	// this.position = this.nextPosition;
	// this.global_position = numeric.add(this.global_position,numeric.sub(this.position,this.lastPosition));

	for (var i=0; i < this.numNodes*3; i+=3) {
		var pos1 = [this.position[i],this.position[i+1],this.position[i+2]];
		var pos2 = [this.lastPosition[i],this.lastPosition[i+1],this.lastPosition[i+2]];
		var vel = numeric.div(numeric.sub(pos1,pos2),2*this.delT);
		this.velocity[i] = vel[0];
		this.velocity[i+1] = vel[1];
		this.velocity[i+2] = vel[2];
	}
}

DynamicSolver.prototype.calcAccel = function() {
	this.nextPosition = Array.vector(this.numNodes*3,0);
	this.acceleration = Array.vector(this.numNodes*3,0);
	this.velocity = Array.vector(this.numNodes*3,0);
	for (var beam_index=0; beam_index < this.numBeams; beam_index++) {
		var Mel = this.simBeams[beam_index].Mel;
		var Mel_inv = this.simBeams[beam_index].Mel_inv;
		var Kel = this.simBeams[beam_index].Kel;

		var node1index = this.simBeams[beam_index].node1index;
		var node2index = this.simBeams[beam_index].node2index;

		var node1fixed = this.simBeams[beam_index].node1fixed;
		var node2fixed = this.simBeams[beam_index].node2fixed;

		var pos = [this.position[node1index*3], 
				   this.position[node1index*3+1], 
				   this.position[node1index*3+2], 
				   this.position[node2index*3], 
				   this.position[node2index*3+1], 
				   this.position[node2index*3+2]];

		var lastPos = [this.lastPosition[node1index*3], 
					   this.lastPosition[node1index*3+1], 
					   this.lastPosition[node1index*3+2], 
				   	   this.lastPosition[node2index*3], 
				   	   this.lastPosition[node2index*3+1], 
				   	   this.lastPosition[node2index*3+2]];

		var global_pos = [this.global_position[node1index*3], 
						  this.global_position[node1index*3+1], 
						  this.global_position[node1index*3+2], 
						  this.global_position[node2index*3], 
						  this.global_position[node2index*3+1], 
						  this.global_position[node2index*3+2]];

		var external_forces = [this.externalForces[node1index*3], 
							   this.externalForces[node1index*3+1], 
							   this.externalForces[node1index*3+2], 
							   this.externalForces[node2index*3], 
							   this.externalForces[node2index*3+1], 
							   this.externalForces[node2index*3+2]];

		var T = this.calcT(global_pos);
		var K_global = numeric.dot(numeric.transpose(T),numeric.dot(Kel,T));
		// var M_inv_global = numeric.dot(T,numeric.dot(Mel_inv,numeric.transpose(T)));
		var M_global = numeric.dot(numeric.transpose(T),numeric.dot(Mel,T));
		
		
		
		if (node1fixed) {
			for (var i =0; i < 3; i++) {
				for (var j = 0; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						// M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						// M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
			for (var i =0; i < 6; i++) {
				for (var j = 0; j < 3; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						// M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						// M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
		}

		if (node2fixed) {
			for (var i = 3; i < 6; i++) {
				for (var j = 0; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						// M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						// M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
			for (var i = 0; i < 6; i++) {
				for (var j = 3; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						// M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						// M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
		}

		var M_inv_global = numeric.inv(M_global);
							   
		var internal_forces = numeric.dot(K_global,pos);
		var netforce = numeric.sub(external_forces,internal_forces);
		// var netforce = numeric.sub(internal_forces,external_forces);

		var term1 = numeric.mul(Math.pow(this.delT,2),external_forces);
		var term2 = numeric.dot(numeric.sub(numeric.mul(2,M_global),numeric.mul(Math.pow(this.delT,2),K_global)),pos);
		var term3 = numeric.dot(M_global,lastPos);

		var accel = numeric.dot(M_inv_global,netforce);
		this.acceleration[node1index*3] += accel[0];
		this.acceleration[node1index*3+1] += accel[1];
		this.acceleration[node1index*3+2] += accel[2];
	// }
	// if (!this.simBeams[i].node2fixed) {
		this.acceleration[node2index*3] += accel[3];
		this.acceleration[node2index*3+1] += accel[4];
		this.acceleration[node2index*3+2] += accel[5];

		if (this.debug) {
			console.log("beam: " + beam_index);
			console.log("nodes: " + node1index + " --> " + node2index);
			console.log("indexes: " + node1index*3 + " --> " + node2index*3);
			console.log("T: ");
			console.log(T);
			console.log("Pos: ");
			console.log(pos);

			console.log("K_global:");
			console.log(K_global);
			console.log("M_global:");
			console.log(M_global);
			console.log("M_inv:");
			console.log(M_inv_global);

			console.log("internal forces:")
			console.log(internal_forces)
			console.log("external forces:")
			console.log(external_forces)
			console.log("net force:")
			console.log(netforce)

			console.log("accel:")
			console.log(this.acceleration)
		}
	}
}


DynamicSolver.prototype.calcPosition = function() {
	this.velocity = Array.vector(this.numNodes*3,0);
	this.nextPosition = Array.vector(this.numNodes*3,0);
	this.acceleration = Array.vector(this.numNodes*3,0);
	for (var beam_index=0; beam_index < this.numBeams; beam_index++) {
		var Mel = this.simBeams[beam_index].Mel;
		var Mel_inv = this.simBeams[beam_index].Mel_inv;
		var Kel = this.simBeams[beam_index].Kel;

		var node1index = this.simBeams[beam_index].node1index;
		var node2index = this.simBeams[beam_index].node2index;

		var node1fixed = this.simBeams[beam_index].node1fixed;
		var node2fixed = this.simBeams[beam_index].node2fixed;

		var pos = [this.position[node1index*3], 
				   this.position[node1index*3+1], 
				   this.position[node1index*3+2], 
				   this.position[node2index*3], 
				   this.position[node2index*3+1], 
				   this.position[node2index*3+2]];

		var lastPos = [this.lastPosition[node1index*3], 
					   this.lastPosition[node1index*3+1], 
					   this.lastPosition[node1index*3+2], 
				   	   this.lastPosition[node2index*3], 
				   	   this.lastPosition[node2index*3+1], 
				   	   this.lastPosition[node2index*3+2]];

		var global_pos = [this.global_position[node1index*3], 
						  this.global_position[node1index*3+1], 
						  this.global_position[node1index*3+2], 
						  this.global_position[node2index*3], 
						  this.global_position[node2index*3+1], 
						  this.global_position[node2index*3+2]];

		var external_forces = [this.externalForces[node1index*3], 
							   this.externalForces[node1index*3+1], 
							   this.externalForces[node1index*3+2], 
							   this.externalForces[node2index*3], 
							   this.externalForces[node2index*3+1], 
							   this.externalForces[node2index*3+2]];

		this.calcT(global_pos,T);
		var K_global = numeric.dot(numeric.transpose(T),numeric.dot(Kel,T));
		var M_inv_global = numeric.dot(T,numeric.dot(Mel_inv,numeric.transpose(T)));
		var M_global = numeric.dot(numeric.transpose(T),numeric.dot(Mel,T));
		
		if (node1fixed) {
			for (var i =0; i < 3; i++) {
				for (var j = 0; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
			for (var i =0; i < 6; i++) {
				for (var j = 0; j < 3; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
		}

		if (node2fixed) {
			for (var i = 3; i < 6; i++) {
				for (var j = 0; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
			for (var i = 0; i < 6; i++) {
				for (var j = 3; j < 6; j++) {
					if (i == j) {
						K_global[i][j] = 1;
						M_inv_global[i][j] = 1;
						M_global[i][j] = 1;
					} else {
						K_global[i][j] = 0;
						M_inv_global[i][j] = 0;
						M_global[i][j] = 0;
					}
				}
			}
		}
		// M_global = numeric.diag([1,1,1,1,1,1])
		var M_inv_global = numeric.inv(M_global);
							   
		var internal_forces = numeric.dot(K_global,pos);
		var netforce = numeric.sub(external_forces,internal_forces);
		// var netforce = numeric.sub(internal_forces,external_forces);

		var term1 = numeric.mul(Math.pow(this.delT,2),external_forces);
		var term2 = numeric.dot(numeric.sub(numeric.mul(2,M_global),numeric.mul(Math.pow(this.delT,2),K_global)),pos);
		var term3 = numeric.dot(M_global,lastPos);

		var vel = numeric.sub(pos,lastPos);
		var beta = 0.1;
		var alpha = 0.1;
		var damping = numeric.add(numeric.mul(beta,K_global),numeric.mul(alpha,M_global));
		console.log("mass damping: ");
		console.log(numeric.dot(numeric.mul(alpha,M_global),vel))

		console.log("stiffness damping: ");
		console.log(numeric.dot(numeric.mul(beta,K_global),vel))

		numeric.subeq(netforce,numeric.dot(damping,vel));
		console.log("netforce:")
		console.log(netforce)

		var accel = numeric.dot(M_inv_global,netforce);
		
		var temp = numeric.sub(numeric.mul(2,pos),lastPos);

		var new_pos = numeric.add(temp,numeric.mul(Math.pow(this.delT,2),accel));
		// var new_pos = numeric.dot(M_inv_global,numeric.sub(numeric.add(term1,term2),term3));

		this.acceleration[node1index*3] += accel[0];
		this.acceleration[node1index*3+1] += accel[1];
		this.acceleration[node1index*3+2] += accel[2];

		this.acceleration[node2index*3] -= accel[3];
		this.acceleration[node2index*3+1] -= accel[4];
		this.acceleration[node2index*3+2] -= accel[5];
		
		this.velocity[node1index*3] += vel[0];
		this.velocity[node1index*3+1] += vel[1];
		this.velocity[node1index*3+2] += vel[2];

		this.velocity[node2index*3] -= vel[3];
		this.velocity[node2index*3+1] -= vel[4];
		this.velocity[node2index*3+2] -= vel[5];

		this.nextPosition[node1index*3] += new_pos[0];
		this.nextPosition[node1index*3+1] += new_pos[1];
		this.nextPosition[node1index*3+2] += new_pos[2];

		this.nextPosition[node2index*3] -= new_pos[3];
		this.nextPosition[node2index*3+1] -= new_pos[4];
		this.nextPosition[node2index*3+2] -= new_pos[5];


		console.log("accel:")
		console.log(accel);

		if (this.debug>=2) {
			console.log("beam: " + beam_index);
			console.log("nodes: " + node1index + " --> " + node2index);
			console.log("indexes: " + node1index*3 + " --> " + node2index*3);
			console.log("T: ");
			console.log(T);
			console.log("K:");
			console.log(Kel)
			console.log("Pos: ");
			console.log(pos);

			console.log("K_global:");
			console.log(K_global);
			console.log("M_global:");
			console.log(M_global);
			console.log("M_inv:");
			console.log(M_inv_global);

			console.log("internal forces:")
			console.log(internal_forces)
			console.log("external forces:")
			console.log(external_forces)
			console.log("net force:")
			console.log(netforce)

			console.log("accel:")
			console.log(accel)
			console.log("temp:")
			console.log(temp)
		}
	}
	this.lastPosition = this.position;
	this.position = this.nextPosition;
	this.global_position = numeric.add(this.global_position,numeric.sub(this.position,this.lastPosition));
}

DynamicSolver.prototype.updateForces = function() {

}

DynamicSolver.prototype.calcT = function(pos,T) {
	// pos is a 6x1 vector
	var len = Math.sqrt(Math.pow((pos[3]-pos[0]),2) + Math.pow((pos[4]-pos[1]),2));
	var c = -(pos[0]-pos[3])/len;
	var s = (pos[1]-pos[4])/len;

	if (this.debug>1) console.log("c: " + c + "  s: " + s);

	var i = 0;
	T[i][i] = c;
	T[i+1][i+1] = c;
	T[i][i+1] = s;
	T[i+1][i] = -s;
	T[i+2][i+2] = 1;

	var i = 3;
	T[i][i] = c;
	T[i+1][i+1] = c;
	T[i][i+1] = s;
	T[i+1][i] = -s;
	T[i+2][i+2] = 1;

	return T;
}
