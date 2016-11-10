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
	this.Ksys = math.zeros(num_dofs, num_dofs);

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

// FrameSolver.prototype.calculate_Ksys = function() {
// 	var node_indices = [];
// 	var array_index = [];
// 	var sum_sizes = 0;
// 	_.each(this.beams, function(beam) {
// 		if (beam.k != null) {
// 			var self = this;
// 			var node = beam.nodes[0];
// 			var othernode = beam.nodes[1];
// 			if (node.fixed) {
// 				node = beam.nodes[1];
// 				othernode = beam.nodes[0];
// 			}
// 			if (!node.fixed) {

// 				var rows = beam.k._size[0];
// 				var cols = beam.k._size[1];

// 				index = _.indexOf(node_indices,node.index);
// 				if (index == -1) {
// 					console.log('node index not in stiffness matrix yet');
// 					node_indices.push(node.index);
// 					index = node_indices.length-1;
// 					if (rows > 3) {
// 						node_indices.push(othernode.index);
// 						index = sum_sizes;
// 						sum_sizes += 6;
// 					} else {
// 						index = sum_sizes;
// 						sum_sizes +=3;
// 					}
// 				}
// 				console.log('index = ' + index);

// 				console.log("size k = " + rows + " by " + cols);
// 				for (var i = 0; i < rows; i++) {
// 					for (var j = 0; j < cols; j++) {
// 						addEl(self.Ksys,[index+i,index+j],getEl(beam.k,[i,j]));
// 					}
// 				}

// 			}
// 		}

// 	},this);


// 	return this.Ksys
// }

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

// FrameSolver.prototype.calculate_f = function() {
// 	this.f = math.multiply(math.multiply(this.k,math.transpose(this.T)),this.u)
// 	return this.f
// }

// FrameSolver.prototype.solveForces = function() {
// 	var debug = true;
// 	if (debug) {
// 		// console.log(solver.assemble_T());
// 		console.log(solver.assemble_k());
// 		console.log(solver.calculate_K());
// 		console.log(solver.calculate_U());
// 		console.log(solver.calculate_f());
// 	} else {
// 		solver.assemble_T();
// 		solver.assemble_k();
// 		solver.calculate_K();
// 		solver.calculate_U();
// 		solver.calculate_f();
// 	}
// }
