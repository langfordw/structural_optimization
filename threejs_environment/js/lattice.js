var globals = {
	nwide: 5,
	ntall: 5,
	needToRefresh: false
};

function initLattice() {
	// ******** GENERATE GEOMETRY ********
	geom = generateGeometry();
	// geom = generateBeamGeometry();

	// ***** CONSTRAIN NODES *******
	constraints = [];
	geom.nodes[0].setFixed(true,{x:1,z:1,c:1});
	constraints.push(geom.nodes[0]);
	var bottomright = globals.ntall*(globals.nwide-1);
	geom.nodes[bottomright].setFixed(true,{x:1,z:1,c:1});
	constraints.push(geom.nodes[bottomright]);
	
	// geom.nodes[globals.ntall].setFixed(true,{x:1,z:1});
	// geom.nodes[globals.ntall*(globals.nwide-2)].setFixed(true,{x:1,z:1});

	// **** PRESCRIBE FORCES AND DISPLACEMENTS ******
	// geom.nodes[globals.ntall-1].addDisplacement( new THREE.Vector3(80,0,0));
	// geom.nodes[globals.nwide*globals.ntall-1].addDisplacement( new THREE.Vector3(-80,0,0));
	geom.nodes[globals.ntall-1].addExternalForce( new THREE.Vector3(40,0,0));
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
	solver.assemble_X();
	console.log("external forces:")
	console.log(solver.X)

	solver.calculate_Ksys();
	solver.calculate_U();
	console.log("forces:")
	console.log(math.multiply(solver.Ksys,solver.u))

	console.log("solver:")
	console.log(solver)

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

	// axial solve
	// deformGeometry(solver.u._data);
	// var forces = _.flatten(solver.f._data);
	// updateForces(geom.beams,forces);
	// displayForces(geom.beams,forces);

	console.log("end state:")
	console.log(geom);	
}


