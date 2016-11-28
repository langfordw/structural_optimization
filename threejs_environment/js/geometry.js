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
	_nodes[force_node].addExternalForce( new THREE.Vector3(globals.control_parameters.fv_x,0,-globals.control_parameters.fv_y));
	var force_node = globals.ntall*globals.nwide-1;
	_nodes[force_node].addExternalForce( new THREE.Vector3(globals.control_parameters.fv_x,0,-globals.control_parameters.fv_y));

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

function deformGeometryBending(geom,linear_scale=1.0) {
	_.each(geom.nodes, function(node) {
		if (node.u_cumulative == null) {
			_.each(globals.geom.nodes, function(node) {
				node.u_cumulative = node.u;
			});	
		}
		node.setPosition(new THREE.Vector3(node.x0+linear_scale*node.u_cumulative[0],0,node.z0-linear_scale*node.u_cumulative[1]));
		node.theta = node.theta0 + linear_scale*node.u_cumulative[2];
		// node.moveBy(linear_scale*node.u[0],linear_scale*node.u[1],node.u[2]);
		// node.theta = node.theta0 + node.u[2];
	});

	sceneClearBeam();
	_.each(geom.beams, function(beam) {
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
	var f = 0;

	if (globals.control_parameters.forceMode == "axial") {
		f_index = 0;
	} else if (globals.control_parameters.forceMode == "shear") {
		f_index = 1;
	} else if (globals.control_parameters.forceMode == "moment") {
		f_index = 2;
	}

	_.each(beams, function(beam) {
		// var f = Math.abs(beam.f_local._data[f_index]);
		
		if (f_index < 2) {
			f = Math.abs(beam.f_local._data[f_index]-beam.f_local._data[f_index+3]);
		} else {
			// for moment
			f = Math.abs(beam.f_local._data[f_index])+Math.abs(beam.f_local._data[f_index+3]);
		}
		
		// console.log(beam.index)
		// console.log(f)
		if(f < minf) {
			minf = f;
		} else if (f > maxf) {
			maxf = f;
		}
	});

	_.each(beams, function(beam) {
		if (f_index < 2) {
			beam.setHSLColor(Math.abs(beam.f_local._data[f_index]-beam.f_local._data[f_index+3]),minf,maxf);
		} else {
			beam.setHSLColor(Math.abs(beam.f_local._data[f_index])+Math.abs(beam.f_local._data[f_index+3]),minf,maxf);
		}
		
	});
}

function removeBeam(beam,this_node=null) {
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
	if (node.externalForce != null) {
		node.removeExternalForce();
	}

	if (node.fixed) {
		node.setFixed(false);
		var index = globals.geom.constraints.indexOf(node);
		globals.geom.constraints.splice(index,1);
	}

	_.each(node.beams, function(beam) {
		removeBeam(beam,node);
	})

	reindex(globals.geom.beams);
	wrapper.remove(node.object3D);
	var index = globals.geom.nodes.indexOf(node);
	globals.geom.nodes.splice(index,1);
}

function updateExternalForce(fx, fy) {
	if (globals.geom != null) {
		_.each(globals.geom.nodes, function(node) {
			if (node.externalForce != null) {
				node.setExternalForce(fx,-fy);
			}
		});
	}
}

function subdivideBeam(beam) {
	var node1 = beam.nodes[0];
	var node4 = beam.nodes[1];
	var angle = beam.getAngle(node1.getPosition());
	var x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.25;
	var z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.25;
	var node2 = new Node(new THREE.Vector3(x, 0, z),0);
	globals.geom.nodes.push(node2)
	var x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.75;
	var z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.75;
	var node3 = new Node(new THREE.Vector3(x, 0, z),0);
	globals.geom.nodes.push(node3)
	// removeBeam(beam,node1);
	removeBeam(beam);
	console.log('removing beam ' + beam.index + ' wrt node' + node1.index);
	var beam = new Beam([node1,node2],0,[10000000,500000]);
	beam.type = '2DoF';
	globals.geom.beams.push(beam);
	var beam = new Beam([node2,node3],0);
	beam.type = '2DoF';
	globals.geom.beams.push(beam)
	var beam = new Beam([node3,node4],0,[10000000,500000]);
	beam.type = '2DoF';
	globals.geom.beams.push(beam);

	reindex(globals.geom.beams);
	reindex(globals.geom.nodes);
	console.log(globals.geom)
}

function subdivideBeam1DoF(beam) {
	var node1 = beam.nodes[0];
	var node4 = beam.nodes[1];
	var angle = beam.getAngle(node1.getPosition());
	var x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.375;
	var z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.375;
	var node2 = new Node(new THREE.Vector3(x, 0, z),0);
	globals.geom.nodes.push(node2)
	var x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.625;
	var z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.625;
	var node3 = new Node(new THREE.Vector3(x, 0, z),0);
	globals.geom.nodes.push(node3)
	// removeBeam(beam,node1);
	removeBeam(beam);
	console.log('removing beam ' + beam.index);
	var beam = new Beam([node1,node2],0);
	beam.type = '1DoF';
	globals.geom.beams.push(beam);
	var beam = new Beam([node2,node3],0,[10000000,500000]);
	beam.type = '1DoF';
	globals.geom.beams.push(beam)
	var beam = new Beam([node3,node4],0);
	beam.type = '1DoF';
	globals.geom.beams.push(beam);

	reindex(globals.geom.beams);
	reindex(globals.geom.nodes);
	console.log(globals.geom)
}

function changePartType(nodes, type) {
	var shared_beam = null;
	// _.each(nodes[1].beams, function(beam) {
	// 	if (_.contains(nodes[0].beams, beam)) {
	// 		shared_beam = beam;
	// 	}
	// });
	var shared_beams = [];
	var node_connectivity = [];
	var node_connections = [];
	_.each(nodes, function(node) {
		var count = 0;
		_.each(node.beams, function(beam) {
			if (_.contains(nodes,beam.nodes[0]) && _.contains(nodes,beam.nodes[1])) {
				shared_beams.push(beam);
				count++;
			}
		});
		node_connectivity.push(count);
		// node_connections.push({node:node,count:count});
	});
	shared_beams = _.uniq(shared_beams);
	console.log(shared_beams);
	console.log(node_connectivity)

	var edge_nodes = _.filter(nodes, function(node,i) {
		console.log(node_connectivity[i]);
		return node_connectivity[i] == 1;
	})
	console.log(edge_nodes);

	// remove old beams and nodes
	if (shared_beams.length == 0) {
		console.log("no shared beam");
		edge_nodes = nodes;
	} else if (shared_beams.length == 1) {
		// single rigid beam
		removeBeam(shared_beams[0]);
	} else {
		// a flexible beam with 3 elements... remove inner nodes
		_.each(node_connectivity, function(beamcount,i) {
			if (beamcount > 1) {
				console.log('remove node' + nodes[i].index);
				removeNode(nodes[i]);
			}
		});
	}

	console.log(nodes)
	
	// add new beams/nodes
	if (type == 'none') {
		// need to check if we left a node stranded <<<<<<<<<<< -------------  ***** 
	} else if (type == 'rigid') {
		var beam = new Beam([edge_nodes[0],edge_nodes[1]],0);
		globals.geom.beams.push(beam);
	} else if (type == '2DoF'){
		var beam = new Beam([edge_nodes[0],edge_nodes[1]],0);
		globals.geom.beams.push(beam);
		subdivideBeam(beam);
	} else if (type == '1DoF'){
		var beam = new Beam([edge_nodes[0],edge_nodes[1]],0);
		globals.geom.beams.push(beam);
		subdivideBeam1DoF(beam);
	}

	reindex(globals.geom.beams);
	reindex(globals.geom.nodes);



	// if (shared_beam == null) {
	// 	console.log("no shared beam");
	// 	// no need to remove anything just add new beam types
	// 	if (type != 'none') {
	// 		if (type == 'rigid') {
	// 			var beam = new Beam([nodes[0],nodes[1]],0);
	// 			globals.geom.beams.push(beam);
	// 		}
	// 		else if (type == '2DoF') {
	// 			var beam = new Beam([nodes[0],nodes[1]],0);
	// 			subdivideBeam(beam);
	// 		}
	// 		else if (type == '1DoF') {
	// 			var beam = new Beam([nodes[0],nodes[1]],0);
	// 			subdivideBeam1DoF(beam);
	// 		}
	// 	}
		
	// 	return;
	// } else {
	// 	console.log("shared beam:");
	// 	console.log(shared_beam);

	// 	// remove beams/nodes
	// 	if (shared_beam.type == 'rigid') {
	// 		removeBeam(shared_beam);
	// 	}
	// 	reindex(globals.geom.beams);
	// 	reindex(globals.geom.nodes);

	// 	// add new beams/nodes
	// 	if (type != 'none') {
	// 		if (type == 'rigid') {
	// 			var beam = new Beam([nodes[0],nodes[1]],0);
	// 			globals.geom.beams.push(beam);
	// 		} else if (type == '2DoF'){
	// 			var beam = new Beam([nodes[0],nodes[1]],0);
	// 			subdivideBeam(beam);
	// 		}
	// 		else if (type == '1DoF'){
	// 			var beam = new Beam([nodes[0],nodes[1]],0);
	// 			subdivideBeam1DoF(beam);
	// 		}
	// 	} else {
	// 		// need to catch node by itself problem
	// 	}

	// }

	// reindex(globals.geom.beams);
	// reindex(globals.geom.nodes);
	
	// if (shared_beam.type == type) {
	// 	console.log("Already " + type);
	// 	return;
	// }

	// if (type == 'rigid') {

	// }


}
