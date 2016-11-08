function FrameSolver(nodes, beams, constraints) {
	var num_dofs = (nodes.length - constraints.length)*3;
	var num_beams = beams.length;
	this.num_dofs = num_dofs
	this.num_beams = num_beams
	this.nodes = nodes;
	this.beams = beams;
	this.constraints = constraints;

	this.T = math.zeros(3, 6);
	this.X = math.zeros(num_dofs);
	this.k_prime = math.zeros(6,6);
	this.k = math.zeros(num_beams*3, num_beams*6);
	this.Ksys = math.zeros(num_dofs, num_dofs);

	this.u = math.zeros(num_dofs);
	this.f = math.zeros(num_beams);
}

FrameSolver.prototype.assemble_T = function() {
	var index = 0;
	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		if (!node.fixed) {
			for (var j=0; j < node.beams.length; j++) {
				var beam = node.beams[j];
				this.T.subset(math.index(index,beam.index),Math.cos(beam.getAngle(node.getPosition())));
				this.T.subset(math.index(index+1,beam.index),Math.sin(beam.getAngle(node.getPosition())));
				this.T.subset(math.index(index+2,beam.index),1);
			}
			if (node.externalForce != null) {
				this.X.subset(math.index(index),node.externalForce.x);
				this.X.subset(math.index(index+1),node.externalForce.z);
				this.X.subset(math.index(index+2),node.externalMoment);
			}
			index += 3;
		}
	}
	return {
		T: this.T,
		X: this.X
	}
}

function elementAdd(matrix, index, value){
	return matrix.subset(math.index(index[0],index[1]),matrix.subset(math.index(index[0],index[1]))+value);
}

FrameSolver.prototype.assemble_k = function() {
	// for (var i = 0; i < this.beams.length; i+=3) {
	// 	var beam = this.beams[i];
	// 	this.k.subset(math.index(i,i),beam.a1);
	// 	this.k.subset(math.index(i+1,i+1),12*beam.a2);
	// 	this.k.subset(math.index(i+2,i+1),6*beam.len*beam.a2);
	// 	this.k.subset(math.index(i+1,i+2),6*beam.len*beam.a2);
	// 	this.k.subset(math.index(i+2,i+2),4*Math.pow(beam.len,2)*beam.a2);
	// }
	// var k_local = math.multiply(math.multiply(math.transpose(this.T),beam.k_prime),this.T);

	for (var k = 0; k < this.beams.length; k++) {
		var beam = this.beams[k];
		var i = beam.nodes[1].index*3;
		var j = beam.nodes[0].index*3;
		console.log("nodes = " + i + ", " + j)

		console.log(beam.nodes)
		var c1 = Math.cos(beam.getAngle(beam.nodes[0].getPosition()));
		var c2 = Math.cos(beam.getAngle(beam.nodes[1].getPosition()));
		var s1 = Math.sin(beam.getAngle(beam.nodes[0].getPosition()));
		var s2 = Math.sin(beam.getAngle(beam.nodes[1].getPosition()));

		elementAdd(this.k,[i,i],beam.a1);
		elementAdd(this.k,[i+1,i+1],12*beam.a2);
		elementAdd(this.k,[i+2,i+1],6*beam.len*beam.a2);
		elementAdd(this.k,[i+1,i+2],6*beam.len*beam.a2);
		elementAdd(this.k,[i+2,i+2],4*Math.pow(beam.len,2)*beam.a2);

		// elementAdd(this.k,[j,j],beam.a1);
		// elementAdd(this.k,[j+1,j+1],12*beam.a2);
		// elementAdd(this.k,[j+2,j+1],6*beam.len*beam.a2);
		// elementAdd(this.k,[j+1,j+2],6*beam.len*beam.a2);
		// elementAdd(this.k,[j+2,j+2],4*Math.pow(beam.len,2)*beam.a2);

		// elementAdd(this.k,[i,j],-beam.a1);
		// elementAdd(this.k,[i+1,j+1],-12*beam.a2);
		// elementAdd(this.k,[i+2,j+1],-6*beam.len*beam.a2);
		// elementAdd(this.k,[i+1,j+2],6*beam.len*beam.a2);
		// elementAdd(this.k,[i+2,j+2],4*Math.pow(beam.len,2)*beam.a2);

		// elementAdd(this.k,[j,i],-beam.a1);
		// elementAdd(this.k,[j+1,i+1],-12*beam.a2);
		// elementAdd(this.k,[j+2,i+1],6*beam.len*beam.a2);
		// elementAdd(this.k,[j+1,i+2],-6*beam.len*beam.a2);
		// elementAdd(this.k,[j+2,i+2],4*Math.pow(beam.len,2)*beam.a2);


		elementAdd(this.T,[i,i],c1);
		elementAdd(this.T,[i+1,i+1],c1);
		elementAdd(this.T,[i,i+1],-s1);
		elementAdd(this.T,[i+1,i],s1);
		elementAdd(this.T,[i+2,i+2],1);

		// elementAdd(this.T,[j,j],c1);
		// elementAdd(this.T,[j+1,j+1],c1);
		// elementAdd(this.T,[j,j+1],-s1);
		// elementAdd(this.T,[j+1,j],s1);
		// elementAdd(this.T,[j+2,j+2],1);

		// this.k.subset(math.index(math.range(0,3),math.range(0,6)));
	}

	return {
		k: this.k,
		T: this.T
	};
}

FrameSolver.prototype.calculate_K = function() {
	console.log(math.transpose(this.T))
	console.log(this.k)
	console.log(this.T)
	this.Ksys = math.multiply(math.multiply(this.T,math.transpose(this.k)),this.T);
	// this.Ksys = math.multiply(math.multiply(this.T,this.k),math.transpose(this.T));
	// this.Ksys = math.multiply(math.multiply(math.transpose(this.T),this.k),this.T);

	// need to remove fixed elements from Ksys (rows and columns)
	return this.Ksys
}

FrameSolver.prototype.calculate_U = function() {	
	this.u = math.lusolve(this.Ksys,this.X);
	return this.u
}

FrameSolver.prototype.calculate_f = function() {
	this.f = math.multiply(math.multiply(this.k,math.transpose(this.T)),this.u)
	return this.f
}

FrameSolver.prototype.solveForces = function() {
	var debug = true;
	if (debug) {
		// console.log(solver.assemble_T());
		console.log(solver.assemble_k());
		console.log(solver.calculate_K());
		console.log(solver.calculate_U());
		console.log(solver.calculate_f());
	} else {
		solver.assemble_T();
		solver.assemble_k();
		solver.calculate_K();
		solver.calculate_U();
		solver.calculate_f();
	}
}
