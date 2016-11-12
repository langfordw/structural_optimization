var globals = {
	nwide: 3,
	ntall: 3,
	linear_scale: 1.0,
	angular_scale: 1.0,
	beam_forces: [],
	view_mode: { deformed: false }
};

var displacements = [];
var constraints = [];

function initLattice() {
	// ******** GENERATE GEOMETRY ********
	geom = generateGeometry();
	// geom = generateBeamGeometry();

	// ***** CONSTRAIN NODES *******
	var bottomleft = 0
	geom.nodes[bottomleft].setFixed(true,{x:1,z:1,c:1});
	constraints.push(bottomleft);
	var bottomright = globals.ntall*(globals.nwide-1);
	geom.nodes[bottomright].setFixed(true,{x:1,z:1,c:1});
	constraints.push(geom.nodes[bottomright]);
	
	// geom.nodes[globals.ntall].setFixed(true,{x:1,z:1});
	// geom.nodes[globals.ntall*(globals.nwide-2)].setFixed(true,{x:1,z:1});

	// **** PRESCRIBE FORCES AND DISPLACEMENTS ******
	// geom.nodes[globals.ntall-1].addDisplacement( new THREE.Vector3(80,0,0));
	// geom.nodes[globals.nwide*globals.ntall-1].addDisplacement( new THREE.Vector3(-80,0,0));
	geom.nodes[globals.ntall-1].addExternalForce( new THREE.Vector3(0,0,-40));
	// geom.nodes[globals.ntall-1].addExternalForce( new THREE.Vector3(40,0,0));
	// geom.nodes[globals.ntall*3].addExternalForce( new THREE.Vector3(0,0,40));
	// geom.nodes[globals.nwide*globals.ntall-1].addExternalForce( new THREE.Vector3(-100,0,0));

	console.log("initial state:")
	console.log(geom)

	// ****** SETUP SOLVE *******
	// kinematic solve:
	// solveNums = calculateSolveNums();
	// var x = new Array(solveNums.n);
	// var con = new Array(solveNums.m);
	// x = getX(x);

	// solve('frame');

	// axial solve
	// deformGeometry(solver.u._data);
	// var forces = _.flatten(solver.f._data);
	// updateForces(geom.beams,forces);
	// displayForces(geom.beams,forces);

	undeformGeometryBending();
}

function solve(type='frame') {
	if (type == 'frame') {
		// ****** SOLVE ******
		var start = new Date().getTime();

		// kinematic solve:
		// solveEquilibrium(solveNums);

		// frame solve:
		solver = new FrameSolver(geom.nodes,geom.beams,constraints);
		console.log("solver setup:")
		console.log(solver)
		solver.solve();
		console.log("solver results:")
		console.log(solver)
		solver.calculate_beam_forces();

		var dt = new Date().getTime() - start;
		console.log('Solved in ' + dt + 'ms');

		// ****** DEFORM / UPDATE GEOMETRY *****
		_.each(geom.beams, function(beam) {
			var f = Math.sqrt(Math.pow(beam.f._data[0][0],2) + Math.pow(beam.f._data[1][0],2));
			// var f = Math.abs(beam.f._data[0][0]);
			globals.beam_forces.push(f);
		})

		solver.u.forEach(function (value, index, matrix) {
	  		displacements.push(value);
		});

		console.log("displacements:")
		console.log(displacements)

		deformGeometryBending(displacements,globals.linear_scale,globals.angular_scale);

		console.log("end state:")
		console.log(geom);	
	}	
}


