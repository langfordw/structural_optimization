function FrameSolver(nodes, beams, constraints) {
	var num_dofs = (nodes.length - constraints.length)*3;
	var num_beams = beams.length;
	this.num_dofs = num_dofs
	this.num_beams = num_beams
	this.nodes = nodes;
	this.beams = beams;
	this.constraints = constraints;
	this.free_nodes = this.getFreeNodes();

	this.X = math.zeros(num_dofs);
	this.assemble_X();

	this.Ksys = math.zeros(num_dofs, num_dofs);
	this.calculate_Ksys();

	this.u = math.zeros(num_dofs);
	this.f = math.zeros(num_beams);
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
	_.each(this.free_nodes, function(node_index) {
		node = this.nodes[node_index];
		if (node.externalForce != null) {
			this.X.subset(math.index(index),node.externalForce.x);
			this.X.subset(math.index(index+1),node.externalForce.z);
			this.X.subset(math.index(index+2),node.externalMoment);
		}
		index += 3;	
	}, this);

	return this.X;
}

FrameSolver.prototype.calculate_Ksys = function() {
	// to generalize this to non-fully constrained nodes,
	// might add a second array of a cumulative sum of DoF's
	// (in getFreeNodes)
	
	_.each(this.beams, function(beam) {
		// first add all the unfixed nodes to the diagonals
		var index0 = _.indexOf(this.free_nodes,beam.nodes[0].index);
		var index1 = _.indexOf(this.free_nodes,beam.nodes[1].index);

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
			
	},this);
	
	return this.Ksys
}

FrameSolver.prototype.calculate_U = function() {	
	this.u = math.lusolve(this.Ksys,this.X);
	return this.u
}

// FrameSolver.prototype.calculate_beam_forces = function() {
// 	_.each(this.beams, function(beam) {

// 		var index0 = _.indexOf(this.free_nodes,beam.nodes[0].index);
// 		var index1 = _.indexOf(this.free_nodes,beam.nodes[1].index);
// 		var f_index = 0;

// 		var u_nodes = math.matrix([0]);

// 		if (index0 != -1) {
// 			setEl(u_nodes, [f_index,0], getEl(this.u,[index0,0]));
// 			setEl(u_nodes, [f_index+1,0], getEl(this.u,[index0+1,0]));
// 			setEl(u_nodes, [f_index+2,0], getEl(this.u,[index0+2,0]));
// 			f_index += 3;
// 		}

// 		if (index1 != -1) {
// 			setEl(u_nodes, [f_index,0], getEl(this.u,[index1,0]));
// 			setEl(u_nodes, [f_index+1,0], getEl(this.u,[index1+1,0]));
// 			setEl(u_nodes, [f_index+2,0], getEl(this.u,[index1+2,0]));
// 		}
// 		console.log(u_nodes)
// 		// get the forces
// 		if (index0 != -1 || index1 != -1) {
// 			var f = math.multiply(beam.k.full,u_nodes)
// 			beam.f = f;
// 		} else {
// 			beam.f = math.zeros(6);
// 		}

// 	},this);
// }

FrameSolver.prototype.solve = function() {
	this.calculate_U();

	var index = 0;
	_.each(this.nodes, function(node) {
		if (node.fixed) {
			node.u = [0, 0, 0];
		} else {
			node.u = [getEl(this.u,[index,0]),
				      getEl(this.u,[index+1,0]),
				      getEl(this.u,[index+2,0])];
			index+=3;
		}
	},this);

	_.each(this.beams, function(beam) {
		beam.assemble_u_local();
		beam.calculate_local_force();
		beam.calculate_global_force();
	});
}
