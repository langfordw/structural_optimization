function FrameSolver(nodes, beams, constraints) {
	var num_dofs = (nodes.length - constraints.length)*3;
	var num_beams = beams.length;
	this.num_dofs = num_dofs
	this.num_beams = num_beams
	this.nodes = nodes;
	this.beams = beams;
	this.constraints = constraints;
	this.free_nodes = this.getFreeNodes();

	this.indexMap0 = [];
	this.indexMap1 = [];

	this.X = math.zeros(num_dofs);
	this.assemble_X();

	this.Ksys = math.zeros(num_dofs, num_dofs, 'sparse');
	this.init_Ksys();
	this.calculate_Ksys();

	this.u = math.zeros(num_dofs);
}

FrameSolver.prototype.getFreeNodes = function() {
	var free_nodes = []
	_.each(this.nodes, function(node) {
		if (!node.fixed) {
			free_nodes.push(node.index);
		}
	},this);
	return free_nodes;
}

FrameSolver.prototype.assemble_X = function() {
	var index = 0;

	for (var i=0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		if (!node.fixed) {
			if (node.externalForce != null) {
				this.X.subset(math.index(index),node.externalForce.x);
				this.X.subset(math.index(index+1),node.externalForce.z);
				this.X.subset(math.index(index+2),node.externalMoment);
			}
			index += 3;	
		}	
	}

	return this.X;
}

FrameSolver.prototype.init_Ksys = function() {
	this.free_nodes = this.getFreeNodes();

	this.indexMap0 = [];
	this.indexMap1 = [];
	for (var i = 0; i < this.beams.length; i++) {
		var beam = this.beams[i]
		this.indexMap0.push(_.indexOf(this.free_nodes,beam.nodes[0].index));
		this.indexMap1.push(_.indexOf(this.free_nodes,beam.nodes[1].index));
	}
}

FrameSolver.prototype.calculate_Ksys = function() {
	// to generalize this to non-fully constrained nodes,
	// might add a second array of a cumulative sum of DoF's
	// (in getFreeNodes)

	for (var i = 0; i < this.beams.length; i++) {
		var beam = this.beams[i]
		// first add all the unfixed nodes to the diagonals
		var index0 = this.indexMap0[i];
		var index1 = this.indexMap1[i];

		if (index0 != -1) {
			add3x3El(this.Ksys,[index0*3,index0*3],beam.k.n00);
		}

		if (index1 != -1) {
			add3x3El(this.Ksys,[index1*3,index1*3],beam.k.n11);
		}

		// then add the off diagonals
		if (index0 != -1 && index1 != -1) {
			add3x3El(this.Ksys,[index0*3,index1*3],beam.k.n01);
			add3x3El(this.Ksys,[index1*3,index0*3],beam.k.n10);
		}
			
	}
	
	return this.Ksys
}

FrameSolver.prototype.calculate_U = function() {	
	// this.u = math.lusolve(math.lup(this.Ksys),this.X);
	this.u = math.lusolve(this.Ksys,this.X);

	return this.u
}

FrameSolver.prototype.solve = function(calc_local=false) {
	this.calculate_U();

	var index = 0;
	var max_u_norm = 0;
	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];

		if (node.fixed) {
			node.u = [0, 0, 0];
		} else {
			node.u = [getEl(this.u,[index,0]),
				      getEl(this.u,[index+1,0]),
				      getEl(this.u,[index+2,0])];
			index+=3;

			node.u_cumulative[0] += node.u[0];
			node.u_cumulative[1] += node.u[1];
			node.u_cumulative[2] += node.u[2];

			var u_norm = Math.sqrt(Math.pow(node.u[0],2) + Math.pow(node.u[1],2));
			if (u_norm > max_u_norm) { max_u_norm = u_norm; }
		}
	}

	if (calc_local) {
		for (var i=0; i < this.beams.length; i++) {
			var beam = this.beams[i];
			beam.assemble_full_T();
			beam.assemble_u_local();
			beam.calculate_local_force();
			beam.calculate_global_force();
		}
	}

	return max_u_norm;
}

FrameSolver.prototype.reset = function(nodes,beams,constraints) {
	var geomChange = false;

	if (nodes != undefined) {
		this.nodes = nodes;
		this.free_nodes = this.getFreeNodes();
		geomChange = true;
	}
	if (beams != undefined) {
		this.beams = beams;
		geomChange = true;
	}
	if (constraints != undefined) {
		this.constraints = constraints;
		geomChange = true;
	}

	if (geomChange) {

		var num_dofs = (this.nodes.length - this.constraints.length)*3;
		var num_beams = this.beams.length;
		this.num_dofs = num_dofs;
		this.num_beams = num_beams;

		for (var i = 0; i < this.beams.length; i++) {
			this.beams[i].reset();
		}

	}

	this.u = math.zeros(this.num_dofs);

	this.X = math.zeros(this.num_dofs);
	this.assemble_X();
	
	this.Ksys = math.zeros(this.num_dofs, this.num_dofs, 'sparse');
	this.init_Ksys();
	this.calculate_Ksys();
}

FrameSolver.prototype.setupIteration = function() {
	// do these every evaluation:

	for (var i = 0; i < this.beams.length; i++) {
		var beam = this.beams[i];

		beam.assemble_T();
		beam.assemble_kp();
		beam.calculate_4ks();
	}

	this.assemble_X();
	this.calculate_Ksys();
}
