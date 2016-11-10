var globals = {
	nwide: 3,
	ntall: 2,
	needToRefresh: false
};

function generateBeamGeometry() {
	_nodes = [];
	_beams = [];
	_h = -100;
	_l = 100;

	var node = new Node(new THREE.Vector3(0, 0, 0),0);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(0, 0, _h),1);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(_l, 0, _h),2);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(_l, 0, 0),3);
	_nodes.push(node);

	// var node = new Node(new THREE.Vector3(0, 0, 2*_h),4);
	// _nodes.push(node);

	// var node = new Node(new THREE.Vector3(_l, 0, 2*_h),5);
	// _nodes.push(node);

	var beam = new Beam([_nodes[0],_nodes[1]],0)
	_beams.push(beam)

	var beam = new Beam([_nodes[1],_nodes[2]],1)
	_beams.push(beam)

	var beam = new Beam([_nodes[2],_nodes[3]],2)
	_beams.push(beam)

	// var beam = new Beam([_nodes[1],_nodes[4]],3)
	// _beams.push(beam)

	// var beam = new Beam([_nodes[4],_nodes[5]],4)
	// _beams.push(beam)

	// var beam = new Beam([_nodes[5],_nodes[2]],5)
	// _beams.push(beam)

	// var beam = new Beam([_nodes[2],_nodes[0]],3)
	// _beams.push(beam)

	return {
		nodes: _nodes,
		beams: _beams 
	};
}

function generateGeometry() {
	_nodes = [];
	_beams = [];
	_h = -100;
	_l = 100;

	var index = 0;
	var beam_index = 0;
	for (var i=0; i < globals.nwide; i++) {
		for (var j=0; j < globals.ntall; j++) {

			// add node
			var node = new Node(new THREE.Vector3(_l*i, 0, _h*j),index)
			_nodes.push(node);

			// Horizontal beams
			if (i > 0){
				var beam = new Beam([_nodes[index],_nodes[index-globals.ntall]],beam_index)
				_beams.push(beam)
				beam_index++;
			}

			// Vertical Beams
			if (j > 0){
				var beam = new Beam([_nodes[index],_nodes[index-1]],beam_index)
				_beams.push(beam)
				beam_index++;
			}			

			// // positive slope diagonals
			// if (j > 0 && i > 0){
			// 	// var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 	// _beams.push(beam)
			// 	// beam_index++;

			// 	if (j < 2 || j > globals.ntall-2) {
			// 		var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 		_beams.push(beam)
			// 		beam_index++;
			// 	}

			// 	if (i < 2 || i > globals.nwide-2) {
			// 		var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 		_beams.push(beam)
			// 		beam_index++;
			// 	}

			// // 	if ((i == 1 || i == globals.nwide-1) && j != 1 && j != globals.ntall-1){
			// // 		var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// // 		_beams.push(beam)
			// // 		beam_index++;
			// // 	}
			// // 	if ((j == 1 || j == globals.ntall-1) && i !=1 && i != globals.nwide-1){
			// // 		var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// // 		_beams.push(beam)
			// // 		beam_index++;
			// // 	}

			// }	

			// // negative slope diagonals
			// if (j < globals.ntall-1 && i > 0){
			// 	var beam = new Beam([_nodes[index],_nodes[index-globals.ntall+1]],beam_index)
			// 	_beams.push(beam)
			// 	beam_index++;
			// }

			index = index +1;
		}
	}

	for (var i=0; i < _nodes.length; i++) {
		_nodes[i].attachSprings();
	}

	return {
		nodes: _nodes,
		beams: _beams 
	};
}

function potentialEnergy(_geom) {
	nodes = _geom.nodes;
	beams = _geom.beams;

	sum_PE = 0;
	for (var i=0; i < nodes.length; i++) {
		// console.log(nodes[i]);
		for (var j=0; j < nodes[i].springs.length; j++) {
			sum_PE += nodes[i].springs[j].getPE();
		}		
	}

	// for (var i=0; i < beams.length; i++) {
	// 	sum_PE += beams[i].getPE();
	// }

	return 0.5*sum_PE;
}

function updatePositions(x) {
	// this is rather expensive and accounts for ~10% of the running time of the objective function
	var index = 0;
	for (var i=0; i < geom.nodes.length; i++) {
		geom.nodes[i].setPosition(new THREE.Vector3(x[index],0,x[index+1]));
		index += 2;
	}
}

function getX(x) {
	var index = 0;
	for (var i=0; i < geom.nodes.length; i++) {
		x[index] = geom.nodes[i].getPosition().x;
		x[index+1] = geom.nodes[i].getPosition().z;
		index += 2;
	}
	return x
}

function objectiveFunction(n,m,x,con) {
	// console.log(x)
	updatePositions(x);

	//constraints
	var index = 0;

	// beam length
	for (var i=0; i < geom.beams.length; i++) {
		con[index] = geom.beams[i].len - geom.beams[i].len0
		con[index+1] = -(geom.beams[i].len - geom.beams[i].len0)
		index += 2
	}

	// fixed and displaced nodes
	for (var i = 0; i < geom.nodes.length; i++) {
		if (geom.nodes[i].fixed_dof.x) {
			con[index] = geom.nodes[i].getPosition().x - geom.nodes[i].x0;
			con[index+1] = -(geom.nodes[i].getPosition().x - geom.nodes[i].x0);
			index += 2;
		}
		if (geom.nodes[i].fixed_dof.z) {
			con[index] =  geom.nodes[i].getPosition().z - geom.nodes[i].z0
			con[index+1] =  -(geom.nodes[i].getPosition().z - geom.nodes[i].z0)
			index += 2;
		}
		if (geom.nodes[i].displacement != null) {
			con[index] = geom.nodes[i].getPosition().x - (geom.nodes[i].x0+geom.nodes[i].displacement.x);
			con[index+1] = -(geom.nodes[i].getPosition().x - (geom.nodes[i].x0+geom.nodes[i].displacement.x));
			index +=2;
		}
	}
	return potentialEnergy(geom)
}

function solveEquilibrium(solveNums) {
	var n=solveNums.n; 			// + of variables
	var x=new Array(n);
	var m=solveNums.m; 			// number of constraints
	var rhobeg = 5.0;	// Various Cobyla constants, see Cobyla docs in Cobyja.js
	var rhoend = 1.0e-6;
	var iprint = 1;
	var maxfun = 1000;

	x = getX(x);

	var r=FindMinimum(objectiveFunction, n,  m, x, rhobeg, rhoend,  iprint,  maxfun);
}

function calculateSolveNums() {
	var _n = geom.nodes.length*2; // number of variables
	var _m = 0; // number of constraints
	for (var i = 0; i < geom.nodes.length; i++) {
		if (geom.nodes[i].fixed) {
			if (geom.nodes[i].fixed_dof.x && geom.nodes[i].fixed_dof.z) {
				_m += 2;
			} else {
				_m +=1 ;
			}
		}
		if (geom.nodes[i].displacement != null) {
			_m += 1;
		}
	}
	_m += geom.beams.length;
	_m *= 2;

	return {
		n: _n,
		m: _m 
	};
}

function updateGeometry() {
	// solveEquilibrium();
}

function deformGeometry(u) {
	var index = 0;
	for (var i = 0; i < geom.nodes.length; i++) {
		if (!geom.nodes[i].fixed) {
			geom.nodes[i].setPosition(geom.nodes[i].getPosition().clone().add(new THREE.Vector3(u[index],0,u[index+1])));
			index+=2;
		}
	}
}

function deformGeometryBending(u,scale=1.0) {
	var index = 0;
	for (var i = 0; i < geom.nodes.length; i++) {
		if (!geom.nodes[i].fixed) {
			geom.nodes[i].setPosition(new THREE.Vector3(geom.nodes[i].x0+scale*u[index],0,geom.nodes[i].z0-scale*u[index+1]));
			// geom.nodes[i].setPosition(geom.nodes[i].getPosition().clone().add(new THREE.Vector3(scale*u[index],0,scale*u[index+1])));
			geom.nodes[i].theta = u[index+2];
			index+=3;
		}
	}
	sceneClearBeam();
	_.each(geom.beams, function(beam) {
		beam.updateBeam();
	});
}

function refreshPoints() {
	sceneClear();
	geom = generateGeometry();
	
	geom.nodes[0].setFixed(true);
	geom.nodes[globals.ntall*(globals.nwide-1)].setFixed(true);
}

function updateForces(beams,forces) {
	_.each(forces, function(force,i){
		beams[i].setForce(force);
	});	
}


function getEl(matrix, index){
	return matrix.subset(math.index(index[0],index[1]));
}

function displayForces(beams,forces) {
	displayMagnitude = true;
	if (displayMagnitude) {
		_.map(forces, function(force) { Math.abs(force) });
	}
	var minf = _.min(forces)
	var maxf = _.max(forces)
	_.each(forces, function(force, i) {
		if (displayMagnitude) {
			geom.beams[i].setHSLColor(force,minf,maxf);
		} else {
			if (force > 0) {
				geom.beams[i].setTensionCompressionColor(force,maxf)
			} else {
				geom.beams[i].setTensionCompressionColor(force,minf)
			}
		}
	});
}

function initLattice() {
	// Generate geometry
	// geom = generateGeometry();
	geom = generateBeamGeometry();
	console.log(geom)

	// Fix nodes
	constraints = [];
	geom.nodes[0].setFixed(true,{x:1,z:1,c:1});
	constraints.push(geom.nodes[0]);
	geom.nodes[3].setFixed(true,{x:1,z:1,c:1});
	constraints.push(geom.nodes[3]);
	// geom.nodes[globals.ntall].setFixed(true,{x:1,z:1});
	// geom.nodes[globals.ntall*(globals.nwide-2)].setFixed(true,{x:1,z:1});

	// prescribe forces and displacements
	// geom.nodes[globals.ntall-1].addDisplacement( new THREE.Vector3(80,0,0));
	// geom.nodes[globals.nwide*globals.ntall-1].addDisplacement( new THREE.Vector3(-80,0,0));
	geom.nodes[globals.ntall-1].addExternalForce( new THREE.Vector3(40,0,0));
	// geom.nodes[globals.nwide*globals.ntall-1].addExternalForce( new THREE.Vector3(-100,0,0));

	// setup solve
	// solveNums = calculateSolveNums();
	// var x = new Array(solveNums.n);
	// var con = new Array(solveNums.m);
	// x = getX(x);

	// solve
	var start = new Date().getTime();
	// solveEquilibrium(solveNums);

	solver = new FrameSolver(geom.nodes,geom.beams,constraints);
	solver.assemble_X();
	console.log(solver.X)
	solver.calculate_Ksys();
	console.log(solver.Ksys)
	solver.calculate_U();
	// solver.u = math.multiply(math.inv(solver.Ksys),solver.X)

	console.log(math.multiply(solver.Ksys,solver.u))

	var dt = new Date().getTime() - start;
	console.log('Solved in ' + dt + 'ms');

	displacements = [];
	solver.u.forEach(function (value, index, matrix) {
  		displacements.push(value);
	});
	console.log(displacements)
	deformGeometryBending(displacements,3.0);

	console.log(geom);
	// console.log(_.flatten(solver.u._data))

	// deformGeometry(solver.u._data);
	// var forces = _.flatten(solver.f._data);
	// updateForces(geom.beams,forces);
	// displayForces(geom.beams,forces);	
}


