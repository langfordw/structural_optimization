function generateBeamGeometry() {
	var _nodes = [];
	var _beams = [];
	var _constraints = [];
	var _h = -100;
	var _l = 100;

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

	// ***** CONSTRAIN NODES *******
	var bottomleft = 0
	var bottomright = globals.ntall*(globals.nwide-1);

	_nodes[bottomleft].setFixed(true,{x:1,z:1,c:1});
	_constraints.push(_nodes[bottomright]);
	
	_nodes[bottomright].setFixed(true,{x:1,z:1,c:1});
	_constraints.push(_nodes[bottomright]);
	
	// **** PRESCRIBE FORCES AND DISPLACEMENTS ******
	var force_node = globals.ntall-1;
	_nodes[force_node].addExternalForce( new THREE.Vector3(100,0,0));

	return {
		nodes: _nodes,
		beams: _beams,
		constraints: _constraints 
	};
}

function angled_cantilever() {
	_nodes = [];
	_beams = [];
	_h = -100;
	_l = 100;
	var angle = Math.PI/4;

	var node = new Node(new THREE.Vector3(0, 0, 0),0);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(-_h*Math.sin(angle), 0, _h*Math.cos(angle)),1);
	_nodes.push(node);


	var beam = new Beam([_nodes[0],_nodes[1]],0)
	_beams.push(beam)

	// var beam = new Beam([_nodes[2],_nodes[0]],3)
	// _beams.push(beam)

	return {
		nodes: _nodes,
		beams: _beams 
	};
}

function generateBeamGeometry2() {
	_nodes = [];
	_beams = [];
	_h = -100;
	_l = 100;

	var node = new Node(new THREE.Vector3(0, 0, 0),0);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(0, 0, _h),1);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(0, 0, 2*_h),2);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(_l, 0, 2*_h),3);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(2*_l, 0, 2*_h),4);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(2*_l, 0, _h),5);
	_nodes.push(node);

	var node = new Node(new THREE.Vector3(2*_l, 0, 0),6);
	_nodes.push(node);

	var beam = new Beam([_nodes[0],_nodes[1]],0)
	_beams.push(beam)

	var beam = new Beam([_nodes[1],_nodes[2]],1)
	_beams.push(beam)

	var beam = new Beam([_nodes[2],_nodes[3]],2)
	_beams.push(beam)

	var beam = new Beam([_nodes[3],_nodes[4]],3)
	_beams.push(beam)

	var beam = new Beam([_nodes[4],_nodes[5]],4)
	_beams.push(beam)

	var beam = new Beam([_nodes[5],_nodes[6]],5)
	_beams.push(beam)

	// var beam = new Beam([_nodes[2],_nodes[0]],3)
	// _beams.push(beam)

	return {
		nodes: _nodes,
		beams: _beams 
	};
}

function generateGeometry() {
	var _nodes = [];
	var _beams = [];
	var _constraints = [];
	var _h = -100;
	var _l = 100;

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

			// 	// if (j < 2 || j > globals.ntall-2) {
			// 	// 	var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 	// 	_beams.push(beam)
			// 	// 	beam_index++;
			// 	// }

			// 	// if (i < 2 || i > globals.nwide-2) {
			// 	// 	var beam = new Beam([_nodes[index],_nodes[index-1-globals.ntall]],beam_index)
			// 	// 	_beams.push(beam)
			// 	// 	beam_index++;
			// 	// }

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

	// ***** CONSTRAIN NODES *******
	var bottomleft = 0
	var bottomright = globals.ntall*(globals.nwide-1);

	_nodes[bottomleft].setFixed(true,{x:1,z:1,c:1});
	_constraints.push(_nodes[bottomright]);
	
	_nodes[bottomright].setFixed(true,{x:1,z:1,c:1});
	_constraints.push(_nodes[bottomright]);
	
	// **** PRESCRIBE FORCES AND DISPLACEMENTS ******
	var force_node = globals.ntall-1;
	_nodes[force_node].addExternalForce( new THREE.Vector3(0,0,-100));
	var force_node = globals.ntall*globals.nwide-1;
	_nodes[force_node].addExternalForce( new THREE.Vector3(0,0,-100));

	return {
		nodes: _nodes,
		beams: _beams,
		constraints: _constraints 
	};
}

// function updatePositions(x) {
// 	// this is rather expensive and accounts for ~10% of the running time of the objective function
// 	var index = 0;
// 	for (var i=0; i < geom.nodes.length; i++) {
// 		geom.nodes[i].setPosition(new THREE.Vector3(x[index],0,x[index+1]));
// 		index += 2;
// 	}
// }


// function deformGeometry(u) {
// 	var index = 0;
// 	for (var i = 0; i < geom.nodes.length; i++) {
// 		if (!geom.nodes[i].fixed) {
// 			geom.nodes[i].setPosition(geom.nodes[i].getPosition().clone().add(new THREE.Vector3(u[index],0,u[index+1])));
// 			index+=2;
// 		}
// 	}
// }

function deformGeometryBending(geom,linear_scale=1.0,angular_scale=1.0) {
	_.each(geom.nodes, function(node) {
		node.setPosition(new THREE.Vector3(node.x0+linear_scale*node.u[0],0,node.z0-linear_scale*node.u[1]));
		node.theta = node.u[2];
	});

	sceneClearBeam();
	_.each(geom.beams, function(beam) {
		beam.angular_deformation_scale = beam.len/2.*angular_scale;
		beam.updateBeam();
	});

	displayBeamForces(geom.beams);
}

function undeformGeometryBending(geom) {
	_.each(geom.nodes, function(node) {
		node.setPosition(new THREE.Vector3(node.x0,0,node.z0));
		node.theta = node.theta0;
	})

	sceneClearBeam();
	_.each(geom.beams, function(beam) {
		beam.updateBeam();
	});
	resetBeamColor(geom.beams);
}

function resetBeamColor(beams) {
	_.each(beams, function(beam) {
		beam.object3D.material.color.set(0xCCC91E);
	});
}

function updateForces(beams,forces) {
	_.each(forces, function(force,i){
		beams[i].setForce(force);
	});	
}

// function displayForces(beams,forces) {
// 	displayMagnitude = true;
// 	if (displayMagnitude) {
// 		_.map(forces, function(force) { Math.abs(force) });
// 	}
// 	var minf = _.min(forces)
// 	var maxf = _.max(forces)
// 	_.each(forces, function(force, i) {
// 		if (displayMagnitude) {
// 			console.log(force)
// 			beams[i].setHSLColor(force,minf,maxf);
// 		} else {
// 			if (force > 0) {
// 				beams[i].setTensionCompressionColor(force,maxf)
// 			} else {
// 				beams[i].setTensionCompressionColor(force,minf)
// 			}
// 		}
// 	});
// }

function displayBeamForces(beams) {
	var minf = 1000000;
	var maxf = -10000000;
	var f_index = 0;

	if (globals.control_parameters.forceMode == "axial") {
		f_index = 0;
	} else if (globals.control_parameters.forceMode == "shear") {
		f_index = 1;
	} else if (globals.control_parameters.forceMode == "moment") {
		f_index = 2;
	}

	_.each(beams, function(beam) {
		// var f = Math.abs(beam.f_local._data[f_index]);
		var f = Math.abs(beam.f_local._data[f_index]-beam.f_local._data[f_index+3]);
		console.log(beam.index)
		console.log(f)
		if(f < minf) {
			minf = f;
		} else if (f > maxf) {
			maxf = f;
		}
	});

	_.each(beams, function(beam) {
		beam.setHSLColor(Math.abs(beam.f_local._data[f_index]-beam.f_local._data[f_index+3]),minf,maxf);
	});
}

function removeBeam(beam,this_node=null) {
	console.log(beam)
	var node = beam.nodes[0]
	if (this_node != null) {
		if (this_node == node) {
			node = beam.nodes[1]
		}
		node.removeBeam(beam);
	} else {
		beam.nodes[0].removeBeam(beam);
		beam.nodes[1].removeBeam(beam);
	}
	
	beamWrapper.remove(beam.object3D);
	var index = globals.geom.beams.indexOf(beam);
	globals.geom.beams.splice(index,1);
}

function removeNode(node) {
	console.log(node.beams)
	_.each(node.beams, function(beam) {
		removeBeam(beam,node);
		console.log('remove beam ' + beam.index)
	})
	reindex(globals.geom.beams);
	wrapper.remove(node.object3D);
	var index = globals.geom.nodes.indexOf(node);
	globals.geom.nodes.splice(index,1);
}

