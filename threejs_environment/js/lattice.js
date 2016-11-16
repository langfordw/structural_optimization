var globals = {
	nwide: 2,
	ntall: 2,
	linear_scale: 1.0,
	angular_scale: 1.0,
	beam_forces: [],
	view_mode: { deformed: false },
	geom: null,
	solved: false,
	control_parameters: {
		deformGeometry: false,
		forceMode: "axial",
		deformationScale: 1.0,
		hideArrows: false,
		solve: function() {
			if (globals.geom != null) {
				setup_solve('frame',globals.geom);
				solve('frame',globals.geom);
				this.deformGeometry = true;
				gui.updateDisplay();
			}
		},
		reset: function() {
			if (globals.geom != null) {
				// sceneClear();
				// sceneAdd(beamWrapper);
				// sceneClearBeam();
				// globals.geom = null;
				// initLattice();
				// render();
				resetLattice();
			}
		}
	}
};

var displacements = [];

var solver;

var gui = new dat.GUI();
var deformation_scale_control = gui.add(globals.control_parameters, 'deformationScale', 0, 30);
var force_mode_control = gui.add(globals.control_parameters, 'forceMode', [ 'axial', 'shear', 'moment' ] );
gui.add(globals.control_parameters,'solve');
gui.add(globals.control_parameters,'hideArrows').onChange((function(value) {
	if (!value) {
		_.each(globals.geom.nodes, function(node) {
			if(node.arrow != null) {
				node.arrow.visible = true;
			}
		})
	} else {
		_.each(globals.geom.nodes, function(node) {
			if(node.arrow != null) {
				node.arrow.visible = false;
			}
		})
	}
}));
gui.add(globals.control_parameters,'deformGeometry').onChange((function(value) {
	if (value) {
		if (globals.solved) {
			deformGeometryBending(globals.geom,globals.linear_scale,globals.angular_scale);
		}
	} else {
		undeformGeometryBending(globals.geom);
	}
}));
gui.add(globals.control_parameters,'reset');

deformation_scale_control.onChange(function(value) {
	globals.linear_scale = value;
	if (globals.control_parameters.deformGeometry) {
 		deformGeometryBending(globals.geom,globals.linear_scale,globals.angular_scale);
	}
});

force_mode_control.onChange(function(value) {
	displayBeamForces(globals.geom.beams);
});

function initLattice() {
	// ******** GENERATE GEOMETRY ********
	globals.geom = generateGeometry();
	// geom = generateBeamGeometry();
	// geom = generateBeamGeometry2();
	// geom = angled_cantilever();

	console.log("initial state:")
	console.log(globals.geom)

	undeformGeometryBending(globals.geom);

	setup_solve('frame',globals.geom);
}

function resetLattice() {
	globals.solved = false;
	globals.control_parameters.deformGeometry = false;
	gui.updateDisplay();
	undeformGeometryBending(globals.geom);

	var num_dofs = (globals.geom.nodes.length - globals.geom.constraints.length)*3;
	var num_beams = globals.geom.beams.length;

	solver.X = math.zeros(num_dofs);
	solver.assemble_X();

	solver.Ksys = math.zeros(num_dofs, num_dofs);
	solver.calculate_Ksys();

	solver.u = math.zeros(num_dofs);
	solver.f = math.zeros(num_beams);

	_.each(globals.geom.beams, function(beam) {
		beam.k_prime = math.zeros(6,6);
		beam.assemble_k_prime();

		beam.full_T = math.zeros(6,6);
		beam.assemble_full_T();

		beam.T = math.matrix([0]);
		beam.assemble_T();

		beam.k = {
			n00: null,
			n11: null,
			n01: null,
			n10: null,
			full: null
		};
		beam.k.n00 = math.zeros(3,3);
		beam.k.n11 = math.zeros(3,3);
		beam.k.n01 = math.zeros(3,3);
		beam.k.n10 = math.zeros(3,3);
		beam.k.full = math.zeros(3,3);
		beam.calculate_4ks();

		beam.u_local = math.zeros(6,1);
		beam.f_local = math.zeros(6,1);
	});
}

function setup_solve(type='frame',geom) {
	if (type == 'frame') {
		solver = new FrameSolver(geom.nodes,geom.beams,geom.constraints);
		console.log("solver setup:")
		console.log(solver)
	} else if (type == 'axial') {
		// axial solve
		// solver = new DirectStiffnessSolver(geom.nodes,geom.beams,geom.constraints);
		// deformGeometry(solver.u._data);
		// var forces = _.flatten(solver.f._data);
		// updateForces(geom.beams,forces);
		// displayForces(geom.beams,forces);
	} else if (type == 'kinematic') {
		// kinematic solve:
		// solveNums = calculateSolveNums();
		// var x = new Array(solveNums.n);
		// var con = new Array(solveNums.m);
		// x = getX(x);
	}
}

function solve(type='frame',geom=globals.geom) {
	if (type == 'frame') {
		// ****** SOLVE ******
		var start = new Date().getTime();
		solver.solve();
		globals.solved = true;
		console.log("solver results:")
		console.log(solver)

		var dt = new Date().getTime() - start;
		console.log('Solved in ' + dt + 'ms');

		// ****** DEFORM / UPDATE GEOMETRY *****
		_.each(this.beams, function(beam) {
			// var f = Math.sqrt(Math.pow(beam.f_local._data[0],2) + Math.pow(beam.f_local._data[1],2));
			var f = Math.abs(beam.f_local._data[0]);
			globals.beam_forces.push(f);
		})

		solver.u.forEach(function (value, index, matrix) {
	  		displacements.push(value);
		});

	
		deformGeometryBending(geom,globals.linear_scale,globals.angular_scale);

		console.log("end state:")
		console.log(geom);	
	} else if (type == 'axial') {
		// axial solve
		// solver = new DirectStiffnessSolver(geom.nodes,geom.beams,geom.constraints);
		// deformGeometry(solver.u._data);
		// var forces = _.flatten(solver.f._data);
		// updateForces(geom.beams,forces);
		// displayForces(geom.beams,forces);
	} else if (type == 'kinematic') {
		// kinematic solve:
		// solveEquilibrium(solveNums);
	}
}




