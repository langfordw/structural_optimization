updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);

	function updateExternalForce(fx, fy) {
		if (globals.geom != null) {
			_.each(globals.geom.nodes, function(node) {
				if (node.externalForce != null) {
					node.setExternalForce(fx,-fy);
				}
			});
		}
	}

bakeGeometry();

	function bakeGeometry() {
		// _.each(globals.geom.nodes, function(node) {
		// 	if (node.u_cumulative == null) {
		// 		node.u_cumulative = [0,0,0];
		// 	}
		// 	node.u_cumulative[0] += node.u[0];
		// 	node.u_cumulative[1] += node.u[1];
		// 	node.u_cumulative[2] += node.u[2];
		// })

		_.each(globals.geom.beams, function(beam) {

			beam.len = Math.sqrt(Math.pow(beam.vertices[1].x-beam.vertices[0].x,2) + Math.pow(beam.vertices[1].z-beam.vertices[0].z,2));
			
			// beam.assemble_k_prime();

			// 	Beam.prototype.assemble_k_prime = function() {
			// 		this.k_prime.subset(math.index(0,0),this.a1);
			// 		this.k_prime.subset(math.index(1,1),12*this.a2);
			// 		this.k_prime.subset(math.index(2,1),6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(1,2),6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(2,2),4*Math.pow(this.len,2)*this.a2);
			// 		this.k_prime.subset(math.index(3,3),this.a1);
			// 		this.k_prime.subset(math.index(4,4),12*this.a2);
			// 		this.k_prime.subset(math.index(5,4),-6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(4,5),-6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(5,5),4*Math.pow(this.len,2)*this.a2);
			// 		this.k_prime.subset(math.index(0,3),-this.a1);
			// 		this.k_prime.subset(math.index(1,4),-12*this.a2);
			// 		this.k_prime.subset(math.index(2,4),-6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(1,5),6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(2,5),2*Math.pow(this.len,2)*this.a2);
			// 		this.k_prime.subset(math.index(3,0),-this.a1);
			// 		this.k_prime.subset(math.index(4,1),-12*this.a2);
			// 		this.k_prime.subset(math.index(5,1),6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(4,2),-6*this.len*this.a2);
			// 		this.k_prime.subset(math.index(5,2),2*Math.pow(this.len,2)*this.a2);
			// 		return this.k_prime;
			// 	}

			beam.assemble_kp();

				Beam.prototype.assemble_kp = function() {
					if (this.f_local == null) {
						this.f_local = math.zeros(6,1);
					}
					var p = this.f_local._data[0]-this.f_local._data[3];
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

			beam.assemble_full_T();

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

			beam.assemble_T();

				Beam.prototype.assemble_T = function() {
					var index = 0;
					var dof_count = 0;
					this.T = math.matrix([0]);
					_.each(this.nodes, function(node) {
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
					}, this);
					this.T = this.T.resize([6,dof_count]);
					return this.T
				}

			beam.calculate_4ks();

				Beam.prototype.calculate_4ks = function() {
					var k0 = math.add(this.k_prime,this.kp)
					node0 = this.nodes[0];
					node1 = this.nodes[1];
					if (!node0.fixed && !node1.fixed) {
						// K is 6x6
						this.k.full = math.multiply(math.multiply(math.transpose(this.T),k0),this.T);
						this.k.n00 = math.subset(this.k.full, math.index(math.range(0,3),math.range(0,3)));
						this.k.n11 = math.subset(this.k.full, math.index(math.range(3,6),math.range(3,6)));
						this.k.n01 = math.subset(this.k.full, math.index(math.range(0,3),math.range(3,6)));
						this.k.n10 = math.subset(this.k.full, math.index(math.range(3,6),math.range(0,3)));
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

		});
	}

// setup_solve('frame',globals.geom);

// 	solver = new FrameSolver(geom.nodes,geom.beams,geom.constraints);

// 		function FrameSolver(nodes, beams, constraints) {
// 			var num_dofs = (nodes.length - constraints.length)*3;
// 			var num_beams = beams.length;
// 			this.num_dofs = num_dofs
// 			this.num_beams = num_beams
// 			this.nodes = nodes;
// 			this.beams = beams;
// 			this.constraints = constraints;
// 			this.free_nodes = this.getFreeNodes();

// 			this.X = math.zeros(num_dofs);
// 			this.assemble_X();

// 				FrameSolver.prototype.assemble_X = function() {
// 					var index = 0;
// 					_.each(this.nodes, function(node) {
// 						if (!node.fixed) {
// 							if (node.externalForce != null) {
// 								this.X.subset(math.index(index),node.externalForce.x);
// 								this.X.subset(math.index(index+1),node.externalForce.z);
// 								this.X.subset(math.index(index+2),node.externalMoment);
// 							}
// 							index += 3;	
// 						}	
// 					}, this);

// 					return this.X;
// 				}

// 			this.Ksys = math.zeros(num_dofs, num_dofs);
// 			this.calculate_Ksys();

solver.Ksys = math.zeros(solver.num_dofs, solver.num_dofs);
solver.calculate_Ksys();

	FrameSolver.prototype.calculate_Ksys = function() {
		// to generalize this to non-fully constrained nodes,
		// might add a second array of a cumulative sum of DoF's
		// (in getFreeNodes)

		this.free_nodes = this.getFreeNodes();
		
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

solver.beams = globals.geom.beams;
solver.nodes = globals.geom.nodes;
u_max = solver.solve();

// u_max = solve('frame',globals.geom);

	// function solve(type='frame',geom=globals.geom,debug=false) {
		// solver.solve();

	FrameSolver.prototype.solve = function() {
	this.calculate_U();

		FrameSolver.prototype.calculate_U = function() {	
			this.u = math.lusolve(this.Ksys,this.X);
			return this.u
		}


	var index = 0;
	var max_u_norm = 0;
	_.each(this.nodes, function(node) {
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
	},this);

	_.each(this.beams, function(beam) {
		beam.assemble_u_local();

			Beam.prototype.assemble_u_local = function() {
				var ug1 = this.nodes[0].u;
				var ug2 = this.nodes[1].u;
				var u_global = math.flatten(math.matrix([ug1, ug2]));
				this.u_local = math.multiply(math.transpose(this.full_T),u_global);
			}

		beam.calculate_local_force();

			Beam.prototype.calculate_local_force = function() {
				this.f_local = math.multiply(this.k_prime,this.u_local);
			}

		beam.calculate_global_force();

			Beam.prototype.calculate_global_force = function() {
				this.f_global = math.multiply(this.full_T,this.f_local);
			}

	});

	return max_u_norm;
}


// 	// ****** DEFORM / UPDATE GEOMETRY *****
// 	globals.beam_forces = [];
// 	_.each(globals.geom.beams, function(beam) {
// 		// var f = Math.sqrt(Math.pow(beam.f_local._data[0],2) + Math.pow(beam.f_local._data[1],2));
// 		var f = Math.abs(beam.f_local._data[0]);
// 		globals.beam_forces.push(f);
// 	})

// 	var max_disp_node = null;
// 	var max_u_norm = 0;
// 	_.each(globals.geom.nodes, function(node) {
// 		var u_norm = Math.sqrt(Math.pow(node.u[0],2) + Math.pow(node.u[1],2));
// 		if (u_norm > max_u_norm) {
// 			max_u_norm = u_norm;
// 			max_disp_node = node;
// 		}
// 	});

// 	return max_u_norm;
// }

	
