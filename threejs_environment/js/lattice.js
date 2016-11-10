var globals = {
	nwide: 7,
	ntall: 7,
	linear_scale: 1.0,
	angular_scale: 1.0,
	beam_forces: []
};

function initLattice() {
	// ******** GENERATE GEOMETRY ********
	geom = generateGeometry();
	// geom = generateBeamGeometry();

	// ***** CONSTRAIN NODES *******
	constraints = [];
	var bottomleft = globals.ntall*4
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
	// geom.nodes[globals.nwide*globals.ntall-1].addExternalForce( new THREE.Vector3(-100,0,0));

	console.log("initial state:")
	console.log(geom)

	// ****** SETUP SOLVE *******
	// kinematic solve:
	// solveNums = calculateSolveNums();
	// var x = new Array(solveNums.n);
	// var con = new Array(solveNums.m);
	// x = getX(x);

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
	// frame solve
	displacements = [];
	solver.u.forEach(function (value, index, matrix) {
  		displacements.push(value);
	});
	console.log("displacements:")
	console.log(displacements)
	deformGeometryBending(displacements,3.0);

	_.each(geom.beams, function(beam) {
		var f = Math.sqrt(Math.pow(beam.f._data[0][0],2) + Math.pow(beam.f._data[1][0],2));
		globals.beam_forces.push(f);
	})
	displayForces(geom.beams,globals.beam_forces);

	// axial solve
	// deformGeometry(solver.u._data);
	// var forces = _.flatten(solver.f._data);
	// updateForces(geom.beams,forces);
	// displayForces(geom.beams,forces);

	console.log("end state:")
	console.log(geom);	
}


