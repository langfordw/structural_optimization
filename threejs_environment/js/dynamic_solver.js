function DynamicSolver() {
	this.delT = 1;
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
}

// to do:
// handle fixed nodes


DynamicSolver.prototype.setup = function(geom) {
	this.numNodes = geom.nodes.length-geom.constraints.length;
	this.numBeams = geom.beams.length;

	// probably need to change these back to normal arrays for use with Numeric
	// this.position = new Float32Array(this.numNodes*3);
	// this.lastPosition = new Float32Array(this.numNodes*3);
	// this.nextPosition = new Float32Array(this.numNodes*3);
	// this.velocity = new Float32Array(this.numNodes*3);
	// this.acceleration = new Float32Array(this.numNodes*3);
	// this.externalForces = new Float32Array(this.numNodes*3);

	// this.position = new Array(this.numNodes*3);
	// this.lastPosition = new Array(this.numNodes*3);
	// this.nextPosition = new Array(this.numNodes*3);
	// this.velocity = new Array(this.numNodes*3);
	// this.acceleration = new Array(this.numNodes*3);
	// this.externalForces = new Array(this.numNodes*3);

	this.position = Array.vector(this.numNodes*3,0);
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
	_.each(geom.nodes, function(node) {
		if (!node.fixed) {
			this.indexMap[node.index] = index;
			var simNode = new SimNode(node)
			this.simNodes.push(simNode);

			this.externalForces[index] = simNode.externalForce[0];
			this.externalForces[index+1] = simNode.externalForce[1];
			this.externalForces[index+2] = simNode.externalForce[2];

			index += 3;
		}
	},this);

	console.log(this);
	this.firstStep();
}

DynamicSolver.prototype.firstStep = function() {
	for (var i=0; i < this.numNodes; i++) {
		this.lastPosition[i] = this.position[i]-this.delT*this.velocity[i] + this.acceleration[i]*Math.pow(this.delT,2)/2;
	}
	console.log("set last position:");
	console.log(this);

	this.calcPosition();
	console.log("first step:");
	console.log(this)
}

DynamicSolver.prototype.step = function() {
	this.calcPosition();
	this.calcAccleration();
	this.calcVelocity();
}

DynamicSolver.prototype.calcAccleration = function() {
	for (var i=0; i < this.numBeams; i++) {
		var Mel_inv = this.simBeams[i].Mel_inv;
		var Kel = this.simBeams[i].Kel;

		var node1index = this.simBeams[i].node1index;
		var node2index = this.simBeams[i].node2index;

		var pos = [this.position[this.indexMap[node1index]], 
				   this.position[this.indexMap[node1index]+1], 
				   this.position[this.indexMap[node1index]+2], 
				   this.position[this.indexMap[node2index]], 
				   this.position[this.indexMap[node2index]+1], 
				   this.position[this.indexMap[node2index]+2]];

		// var lastPos = [this.lastPosition[indexMap[node1index]], 
		// 			   this.lastPosition[indexMap[node1index]+1], 
		// 			   this.lastPosition[indexMap[node1index]+2],
		// 		   	   this.lastPosition[indexMap[node2index]], 
		// 		   	   this.lastPosition[indexMap[node2index]+1], 
		// 		   	   this.lastPosition[indexMap[node2index]+2]];

		var T = this.calcT(pos);
		var K_global = numeric.dot(numeric.transpose(T),numeric.dot(Kel,T));
		var M_global = numeric.dot(T,numeric.dot(Mel_inv,numeric.transpose(T)));

		var external_forces = [this.externalForces[node1index], this.externalForces[node1index+1], this.externalForces[node1index+2],
							   this.externalForces[node2index], this.externalForces[node2index+1], this.externalForces[node2index+2]];

		var internal_forces = numeric.dot(K_global,pos);
		
		var netforce = numeric.sub(external_forces - internal_forces);

		var accel = numeric.dot(M_global, netforce); // 6 x 1

		if (!this.simBeams[i].node1fixed) {
			this.acceleration[this.indexMap[node1index]] += accel[0];
			this.acceleration[this.indexMap[node1index]+1] += accel[1];
			this.acceleration[this.indexMap[node1index]+2] += accel[2];
		}
		if (!this.simBeams[i].node2fixed) {
			this.acceleration[this.indexMap[node2index]] += accel[3];
			this.acceleration[this.indexMap[node2index]+1] += accel[4];
			this.acceleration[this.indexMap[node2index]+2] += accel[5];
		}
	}
}

DynamicSolver.prototype.calcVelocity = function() {

	this.lastPosition = position;
	this.position = this.nextPosition;

	for (var i=0; i < this.numNodes; i++) {
		velocity[i] = numeric.div(this.position[i]-this.lastPosition[i],2*this.delT);
	}
}

DynamicSolver.prototype.calcPosition = function() {
	for (var i=0; i < this.numBeams; i++) {
		var Mel = this.simBeams[i].Mel;
		var Mel_inv = this.simBeams[i].Mel_inv;
		var Kel = this.simBeams[i].Kel;

		var node1index = this.simBeams[i].node1index;
		var node2index = this.simBeams[i].node2index;

		console.log(M_inv_global)
		return;

		var pos = [this.position[this.indexMap[node1index]], 
				   this.position[this.indexMap[node1index]+1], 
				   this.position[this.indexMap[node1index]+2], 
				   this.position[this.indexMap[node2index]], 
				   this.position[this.indexMap[node2index]+1], 
				   this.position[this.indexMap[node2index]+2]];

		var lastPos = [this.lastPosition[indexMap[node1index]], 
					   this.lastPosition[indexMap[node1index]+1], 
					   this.lastPosition[indexMap[node1index]+2],
				   	   this.lastPosition[indexMap[node2index]], 
				   	   this.lastPosition[indexMap[node2index]+1], 
				   	   this.lastPosition[indexMap[node2index]+2]];

		var T = this.calcT(pos);
		var K_global = numeric.dot(numeric.transpose(T),numeric.dot(Kel,T));
		var M_inv_global = numeric.dot(T,numeric.dot(Mel_inv,numeric.transpose(T)));
		var M_global = numeric.dot(numeric.transpose(T),numeric.dot(Mel,T));



		// var external_forces = [this.externalForces[node1index], this.externalForces[node1index+1], this.externalForces[node1index+2],
		// 					   this.externalForces[node2index], this.externalForces[node2index+1], this.externalForces[node2index+2]];

		// var internal_forces = numeric.dot(K_global,pos);
		
		// var netforce = numeric.sub(external_forces - internal_forces);

		// var term1 = numeric.mul(Math.pow(this.delT,2),external_forces);
		// var term2 = numeric.dot(numeric.sub(numeric.mul(2,M_global),numeric.mul(Math.pow(this.delT,2),K_global)),pos);
		// var term3 = numeric.dot(M_global,lastPos);

		// var new_pos = numeric.dot(M_inv_global,numeric.add(numeric.add(term1,term2),term3));

		// if (!this.simBeams[i].node1fixed) {
		// 	this.nextPosition[this.indexMap[node1index]] += new_pos[0];
		// 	this.nextPosition[this.indexMap[node1index]+1] += new_pos[1];
		// 	this.nextPosition[this.indexMap[node1index]+2] += new_pos[2];
		// }
		// if (!this.simBeams[i].node2fixed) {
		// 	this.nextPosition[this.indexMap[node2index]] += new_pos[3];
		// 	this.nextPosition[this.indexMap[node2index]+1] += new_pos[4];
		// 	this.nextPosition[this.indexMap[node2index]+2] += new_pos[5];
		// }
	}
}

DynamicSolver.prototype.updateForces = function() {

}

DynamicSolver.prototype.calcT = function(pos) {
	// pos is a 6x1 vector
	var len = Math.sqrt(Math.pow((pos[3]-pos[0]),2) + Math.pow((pos[4]-pos[1]),2));
	var c = (pos[3]-pos[0])/len;
	var s = (pos[4]-pos[1])/len;

	var T = Array.matrix(6,6,0);

	var i = 0;
	T[i][i] = c;
	T[i+1][i+1] = c;
	T[i][i+1] = s;
	T[i+1][i] = s;
	T[i+2][i+2] = 1;

	var i = 3;
	T[i][i] = c;
	T[i+1][i+1] = c;
	T[i][i+1] = s;
	T[i+1][i] = s;
	T[i+2][i+2] = 1;

	return T;
}