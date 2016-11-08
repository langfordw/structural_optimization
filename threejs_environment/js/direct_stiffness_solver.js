function DirectStiffnessSolver(nodes, beams, constraints) {
	var num_dofs = (nodes.length - constraints.length)*2;
	var num_beams = beams.length;
	this.num_dofs = num_dofs
	this.num_beams = num_beams
	this.nodes = nodes;
	this.beams = beams;
	this.constraints = constraints;

	this.A = math.zeros(num_beams, num_dofs);
	this.A = math.transpose(this.A);
	this.X = math.zeros(num_dofs);
	this.k = math.zeros(num_beams, num_beams);
	this.Ksys = math.zeros(num_dofs, num_dofs);

	this.u = math.zeros(num_dofs);
	this.f = math.zeros(num_beams);
}

DirectStiffnessSolver.prototype.assemble_AX = function() {
	var index = 0;
	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		if (!node.fixed) {
			for (var j=0; j < node.beams.length; j++) {
				var beam = node.beams[j];
				this.A.subset(math.index(index,beam.index),Math.cos(beam.getAngle(node.getPosition())));
				this.A.subset(math.index(index+1,beam.index),Math.sin(beam.getAngle(node.getPosition())));
			}
			if (node.externalForce != null) {
				this.X.subset(math.index(index),node.externalForce.x);
				this.X.subset(math.index(index+1),node.externalForce.z);
			}
			index += 2;
		}
	}
	return {
		A: this.A,
		X: this.X
	}
}

DirectStiffnessSolver.prototype.assemble_k = function() {
	for (var i = 0; i < this.beams.length; i++) {
		var beam = this.beams[i];
		this.k.subset(math.index(i,i),beam.k);
	}
	return this.k
}

DirectStiffnessSolver.prototype.calculate_K = function() {
	this.Ksys = math.multiply(math.multiply(this.A,this.k),math.transpose(this.A));
	return this.Ksys
}

DirectStiffnessSolver.prototype.calculate_U = function() {	
	this.u = math.lusolve(this.Ksys,this.X);
	return this.u
}

DirectStiffnessSolver.prototype.calculate_f = function() {
	this.f = math.multiply(math.multiply(this.k,math.transpose(this.A)),this.u)
	return this.f
}

DirectStiffnessSolver.prototype.solveForces = function() {
	var debug = false;
	if (debug) {
		console.log(solver.assemble_AX());
		console.log(solver.assemble_k());
		console.log(solver.calculate_K());
		console.log(solver.calculate_U());
		console.log(solver.calculate_f());
	} else {
		solver.assemble_AX();
		solver.assemble_k();
		solver.calculate_K();
		solver.calculate_U();
		solver.calculate_f();
	}
}
