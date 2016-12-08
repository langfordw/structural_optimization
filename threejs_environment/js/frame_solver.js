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
				setEl1(this.X,index,node.externalForce.x);
				setEl1(this.X,index+1,node.externalForce.z);
				setEl1(this.X,index+2,node.externalMoment);
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
	// console.log(this.Ksys)
	this.u = math.lusolve(math.slu(this.Ksys,3,0),this.X);
	// this.u = math.lusolve(this.Ksys,this.X);
	// var L = cholesky(this.Ksys);
	// this.u = math.lsolve(L,this.X);
	// console.log(this.u)

	return this.u
}

FrameSolver.prototype.solve = function(calc_local=false,updateNodes=true) {
	this.calculate_U();
	// this.u = math.zeros(this.num_dofs,1);

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

			if (updateNodes) {
				// if (node.u[0] > 10) throw this
				node.u_cumulative[0] += node.u[0];
				node.u_cumulative[1] += node.u[1];
				node.u_cumulative[2] += node.u[2];
			}

			var u_norm = Math.sqrt(Math.pow(node.u[0],2) + Math.pow(node.u[1],2));
			if (u_norm > max_u_norm) { max_u_norm = u_norm; }
		}
	}

	if (calc_local) {
		for (var i=0; i < this.beams.length; i++) {
			var beam = this.beams[i];
			beam.assemble_full_T();
			beam.assemble_u_local();
			beam.calculate_local_force(); // do need this to update kp...
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

		// for (var i = 0; i < this.nodes.length; i++) {
		// 	this.nodes[i].u = [0,0,0];
		// 	this.nodes[i].u_cumulative = [0,0,0];
		// }

		this.u = math.zeros(this.num_dofs);

		this.X = math.zeros(this.num_dofs);

		this.init_Ksys();
	}

	this.assemble_X();
	
	this.Ksys = math.zeros(this.num_dofs, this.num_dofs, 'sparse');
	this.calculate_Ksys();
}

FrameSolver.prototype.setupIteration = function() {
	this.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
	// // do these every evaluation:
	// this.nodes = globals.geom.nodes;
	// this.beams = globals.geom.beams;
	// this.constraints = globals.geom.constraints;
	// for (var i = 0; i < this.beams.length; i++) {
	// 	var beam = this.beams[i];
		
	// 	// beam.reset();

	// 	beam.assemble_T();
	// 	beam.assemble_kp(); // this is pointless unless i also update u_local and f_local
	// 	beam.calculate_4ks();
	// }

	// this.u = math.zeros(this.num_dofs);
	// this.assemble_X();
	// this.calculate_Ksys();
}

function cholesky(A) {
	var n = A._size[0];
	// var L = Array.matrix(n,n,0);
	var L = math.zeros(n,n,'sparse');
	var s = 0;
	console.log(L)
	for (var i = 0; i < n; i++)
        for (var j = 0; j < (i+1); j++) {
            s = 0;
            for (var k = 0; k < j; k++) {
                // s += L[i * n + k] * L[j * n + k];
                s += getEl(L,[i,k]) * getEl(L,[j,k]);

            }

            // L[i * n + j] = (i == j) ? Math.pow(A[i * n + i] - s,2) : (1.0 / L[j * n + j] * (A[i * n + j] - s));
            setEl(L,[i,j],(i == j) ? Math.pow(getEl(A,[i,i]) - s,2) : (1.0 / getEl(L,[j,j]) * (getEl(A,[i,j]) - s)));

        }
 
    return L;
}