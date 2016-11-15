var globals = {
	nwide: 3,
	ntall: 3,
	linear_scale: 1.0,
	angular_scale: 1.0,
	beam_forces: [],
	view_mode: { deformed: false },
	geom: null
};

var displacements = [];


function initLattice() {
	// ******** GENERATE GEOMETRY ********
	globals.geom = generateGeometry();
	// geom = generateBeamGeometry();
	// geom = generateBeamGeometry2();
	// geom = angled_cantilever();

	console.log("initial state:")
	console.log(globals.geom)

	// ****** SETUP SOLVE *******
	// kinematic solve:
	// solveNums = calculateSolveNums();
	// var x = new Array(solveNums.n);
	// var con = new Array(solveNums.m);
	// x = getX(x);

	// solve('frame');

	undeformGeometryBending(globals.geom);
}

function solve(type='frame',geom) {
	if (type == 'frame') {
		// ****** SOLVE ******
		var start = new Date().getTime();

		// kinematic solve:
		// solveEquilibrium(solveNums);

		// frame solve:
		solver = new FrameSolver(geom.nodes,geom.beams,geom.constraints);
		console.log("solver setup:")
		console.log(solver)
		solver.solve();
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

	
		deformGeometryBending(geom,displacements,globals.linear_scale,globals.angular_scale);

		console.log("end state:")
		console.log(geom);	
	} else if (type == 'axial') {
		// axial solve
		// solver = new DirectStiffnessSolver(geom.nodes,geom.beams,geom.constraints);
		// deformGeometry(solver.u._data);
		// var forces = _.flatten(solver.f._data);
		// updateForces(geom.beams,forces);
		// displayForces(geom.beams,forces);
	}
}


