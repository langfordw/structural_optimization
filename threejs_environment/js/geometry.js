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
	_nodes[force_node].addExternalForce( new THREE.Vector3(100,0,0));

	return {
		nodes: _nodes,
		beams: _beams,
		constraints: _constraints 
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

function deformGeometryBending(geom,u,scale=1.0,angular_scale=1.0) {
	var index = 0;
	for (var i = 0; i < geom.nodes.length; i++) {
		if (!geom.nodes[i].fixed) {
			geom.nodes[i].setPosition(new THREE.Vector3(geom.nodes[i].x0+scale*u[index],0,geom.nodes[i].z0-scale*u[index+1]));
			// geom.nodes[i].setPosition(geom.nodes[i].getPosition().clone().add(new THREE.Vector3(scale*u[index],0,scale*u[index+1])));
			// geom.nodes[i].theta = angular_scale*u[index+2];
			geom.nodes[i].theta = u[index+2];
			index+=3;
		}
	}
	sceneClearBeam();
	_.each(geom.beams, function(beam) {
		beam.angular_deformation_scale = beam.len/2.*angular_scale;
		beam.updateBeam();
	});
	// displayForces(geom.beams,globals.beam_forces);
	displayBeamForces(geom.beams);
	globals.view_mode.deformed = true;
	// $('#deform_cbox').checked = true;
	$("#deform_cbox").prop("checked", true);
}

function undeformGeometryBending(geom) {
	var index = 0;
	for (var i = 0; i < geom.nodes.length; i++) {
		if (!geom.nodes[i].fixed) {
			geom.nodes[i].setPosition(new THREE.Vector3(geom.nodes[i].x0,0,geom.nodes[i].z0));
			// geom.nodes[i].setPosition(geom.nodes[i].getPosition().clone().add(new THREE.Vector3(scale*u[index],0,scale*u[index+1])));
			geom.nodes[i].theta = geom.nodes[i].theta0;
		}
	}
	sceneClearBeam();
	_.each(geom.beams, function(beam) {
		beam.updateBeam();
	});
	resetBeamColor(geom.beams);

	globals.view_mode.deformed = false;
	$("#deform_cbox").prop("checked", false);
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

function displayForces(beams,forces) {
	displayMagnitude = true;
	if (displayMagnitude) {
		_.map(forces, function(force) { Math.abs(force) });
	}
	var minf = _.min(forces)
	var maxf = _.max(forces)
	_.each(forces, function(force, i) {
		if (displayMagnitude) {
			console.log(force)
			beams[i].setHSLColor(force,minf,maxf);
		} else {
			if (force > 0) {
				beams[i].setTensionCompressionColor(force,maxf)
			} else {
				beams[i].setTensionCompressionColor(force,minf)
			}
		}
	});
}

function displayBeamForces(beams) {
	var minf = 1000000;
	var maxf = -10000000;
	_.each(beams, function(beam) {
		if(beam.f_local._data[0] < minf) {
			minf = beam.f_local._data[0];
		} else if (beam.f_local._data[0] > maxf) {
			maxf = beam.f_local._data[0];
		}
	});

	_.each(beams, function(beam) {
		if (dg_controls.force_mode == "axial") {
			beam.setHSLColor(beam.f_local._data[0],minf,maxf);
		} else if (dg_controls.force_mode == "shear") {
			beam.setHSLColor(beam.f_local._data[1],minf,maxf);
		} else if (dg_controls.force_mode == "moment") {
			beam.setHSLColor(beam.f_local._data[1],minf,maxf);
		}
	});
}


