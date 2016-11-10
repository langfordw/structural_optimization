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

	var node = new Node(new THREE.Vector3(0, 0, 2*_h),4);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(_l, 0, 2*_h),5);
	_nodes.push(node);

	var beam = new Beam([_nodes[0],_nodes[1]],0)
	_beams.push(beam)

	var beam = new Beam([_nodes[2],_nodes[1]],1)
	_beams.push(beam)

	var beam = new Beam([_nodes[3],_nodes[2]],2)
	_beams.push(beam)

	var beam = new Beam([_nodes[3],_nodes[0]],3)
	_beams.push(beam)

	var beam = new Beam([_nodes[1],_nodes[4]],3)
	_beams.push(beam)

	var beam = new Beam([_nodes[4],_nodes[5]],4)
	_beams.push(beam)

	var beam = new Beam([_nodes[5],_nodes[2]],5)
	_beams.push(beam)

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

function updatePositions(x) {
	// this is rather expensive and accounts for ~10% of the running time of the objective function
	var index = 0;
	for (var i=0; i < geom.nodes.length; i++) {
		geom.nodes[i].setPosition(new THREE.Vector3(x[index],0,x[index+1]));
		index += 2;
	}
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

function updateForces(beams,forces) {
	_.each(forces, function(force,i){
		beams[i].setForce(force);
	});	
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