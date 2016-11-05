var globals = {
	nwide: 10,
	ntall: 10,
	needToRefresh: false
};

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

			// positive slope diagonals
			if (j > 0 && i > 0){
				var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
				_beams.push(beam)
				beam_index++;

			// 	if ((i == 1 || i == globals.nwide-1) && j != 1 && j != globals.ntall-1){
			// 		var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 		_beams.push(beam)
			// 		beam_index++;
			// 	}
			// 	if ((j == 1 || j == globals.ntall-1) && i !=1 && i != globals.nwide-1){
			// 		var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 		_beams.push(beam)
			// 		beam_index++;
			// 	}

			}	

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
			geom.nodes[i].setPosition(geom.nodes[i].getPosition().clone().add(new THREE.Vector3(u[index][0],0,u[index+1][0])));
			index+=2;
		}
	}
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

function displayForces(beams,forces) {
	displayStyle = 'magnitude';
	if (displayStyle == 'magnitude') {
		_.map(forces, function(force) { Math.abs(force) });
	}
	var minf = _.min(forces)
	var maxf = _.max(forces)
	_.each(forces, function(force, i) {
		if (displayStyle == 'magnitude') {
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
	geom = generateGeometry()
	console.log(geom)

	// Fix nodes
	geom.nodes[globals.ntall].setFixed(true,{x:1,z:1});
	geom.nodes[globals.ntall*(globals.nwide-2)].setFixed(true,{x:1,z:1});

	// prescribe forces and displacements
	// geom.nodes[globals.ntall-1].addDisplacement( new THREE.Vector3(80,0,0));
	// geom.nodes[globals.nwide*globals.ntall-1].addDisplacement( new THREE.Vector3(-80,0,0));
	geom.nodes[globals.ntall-1].addExternalForce( new THREE.Vector3(80,0,0));
	geom.nodes[globals.nwide*globals.ntall-1].addExternalForce( new THREE.Vector3(-80,0,0));

	// setup solve
	// solveNums = calculateSolveNums();
	// var x = new Array(solveNums.n);
	// var con = new Array(solveNums.m);
	// x = getX(x);

	// solve
	var start = new Date().getTime();
	// solveEquilibrium(solveNums);

	solver = new DirectStiffnessSolver(geom.nodes,geom.beams,[
		geom.nodes[globals.ntall],geom.nodes[globals.ntall*(globals.nwide-2)]]);

	solver.solveForces()
	var dt = new Date().getTime() - start;
	console.log('Solved in ' + dt + 'ms');
	console.log(geom.nodes);

	deformGeometry(solver.u._data);
	var forces = _.flatten(solver.f._data);
	updateForces(geom.beams,forces);
	displayForces(geom.beams,forces);	
}


