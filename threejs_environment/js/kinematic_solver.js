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

function getX(x) {
	var index = 0;
	for (var i=0; i < geom.nodes.length; i++) {
		x[index] = geom.nodes[i].getPosition().x;
		x[index+1] = geom.nodes[i].getPosition().z;
		index += 2;
	}
	return x
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
