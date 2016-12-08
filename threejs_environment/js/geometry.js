function generateGeometry() {
	var _nodes = [];
	var _beams = [];
	var _constraints = [];
	var _parts = [];
	var _h = -100;
	var _l = 100;

	var index = 0;
	var beam_index = 0;
	for (var i=0; i < globals.control_parameters.nwide; i++) {
		for (var j=0; j < globals.control_parameters.ntall; j++) {

			// add node
			var node = new Node(new THREE.Vector3(_l*i, 0, _h*j),index)
			_nodes.push(node);

			// Horizontal beams
			if (i > 0){
				var beam = new Beam([_nodes[index],_nodes[index-globals.control_parameters.ntall]],beam_index)
				_beams.push(beam)
				_parts.push(new Part([beam],[],'rigid'))
				beam_index++;
			}

			// Vertical Beams
			if (j > 0){
				var beam = new Beam([_nodes[index],_nodes[index-1]],beam_index)
				_beams.push(beam)
				_parts.push(new Part([beam],[],'rigid'))
				beam_index++;
			}			

			index = index +1;
		}
	}

	// ***** CONSTRAIN NODES *******
	var bottomleft = 0
	var bottomright = globals.control_parameters.ntall*(globals.control_parameters.nwide-1);

	_nodes[bottomleft].setFixed(true,{x:1,z:1,c:1});
	_constraints.push(_nodes[bottomleft]);
	
	_nodes[bottomright].setFixed(true,{x:1,z:1,c:1});
	_constraints.push(_nodes[bottomright]);
	
	// **** PRESCRIBE FORCES AND DISPLACEMENTS ******
	var force_node = globals.control_parameters.ntall-1;
	_nodes[force_node].addExternalForce( new THREE.Vector3(globals.control_parameters.fv_x,0,-globals.control_parameters.fv_y));
	var force_node = globals.control_parameters.ntall*globals.control_parameters.nwide-1;
	_nodes[force_node].addExternalForce( new THREE.Vector3(globals.control_parameters.fv_x,0,-globals.control_parameters.fv_y));

	return {
		nodes: _nodes,
		beams: _beams,
		constraints: _constraints,
		parts: _parts 
	};
}

function deformGeometryBending(geom,linear_scale=1.0) {
	_.each(geom.nodes, function(node) {
		// if (node.u_cumulative == null) {
		// 	_.each(globals.geom.nodes, function(node) {
		// 		node.u_cumulative = node.u;
		// 	});	
		// }
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

function deformGeometryFast(geom) {
	for (var i=0; i < geom.nodes.length; i++) {
		var node = geom.nodes[i]
		if (node.u_cumulative == null) {
			node.u_cumulative = node.u;
		}
		node.setPosition(new THREE.Vector3(node.x0+node.u_cumulative[0],0,node.z0-node.u_cumulative[1]));
		node.theta = node.theta0 + node.u_cumulative[2];
	}
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
			f = Math.abs(getEl(beam.f_local,[f_index,0])-getEl(beam.f_local,[f_index+3,0]));
		} else {
			// for moment
			f = Math.abs(getEl(beam.f_local,[f_index,0]))+Math.abs(getEl(beam.f_local,[f_index+3,0]));
		}
		
		if(f < minf) {
			minf = f;
		} else if (f > maxf) {
			maxf = f;
		}
	});

	_.each(beams, function(beam) {
		if (f_index < 2) {
			beam.setHSLColor(Math.abs(getEl(beam.f_local,[f_index,0])-getEl(beam.f_local,[f_index+3,0])),minf,maxf);
		} else {
			beam.setHSLColor(Math.abs(getEl(beam.f_local,[f_index,0]))+Math.abs(getEl(beam.f_local,[f_index+3,0])),minf,maxf);
		}
		
	});
}

// function removeBeam(beam,this_node=null) {
// 	var node = beam.nodes[0]

// 	if (this_node != null) {
// 		// remove beam reference from other node
// 		if (this_node == node) {
// 			node = beam.nodes[1]
// 		}
// 		node.removeBeam(beam);
// 	} else {
// 		// remove beam reference from both nodes
// 		beam.nodes[0].removeBeam(beam);
// 		beam.nodes[1].removeBeam(beam);
// 	}
	
// 	beamWrapper.remove(beam.object3D);
// 	var index = globals.geom.beams.indexOf(beam);
// 	globals.geom.beams.splice(index,1);
// }

// function removeNode(node) {
// 	if (node.externalForce != null) {
// 		node.removeExternalForce();
// 	}

// 	if (node.fixed) {
// 		node.setFixed(false);
// 		var index = globals.geom.constraints.indexOf(node);
// 		globals.geom.constraints.splice(index,1);
// 	}

// 	// _.each(node.beams, function(beam) {
// 	// 	removeBeam(beam,node);
// 	// })

// 	_.times(node.beams.length, function() {
// 		console.log(node.beams[0])
// 		node.beams[0].destroy();
// 	})

// 	reindex(globals.geom.beams);
// 	wrapper.remove(node.object3D);
// 	var index = globals.geom.nodes.indexOf(node);
// 	globals.geom.nodes.splice(index,1);
// }

function updateExternalForce(fx, fy, updateDisplay=false) {
	
	if (globals.geom != null) {
		for (var i = 0; i < globals.geom.nodes.length; i++) {
			var node = globals.geom.nodes[i];
			if (node.externalForce != null) {
				node.setExternalForce(fx,-fy);
			}
		}
	}
	if (updateDisplay) {
		if (fx <= 1 || fy <= 1) {
			throw "force is zero"
		}
		globals.control_parameters.fv_x = fx;
		globals.control_parameters.fv_x = fy;
		gui.updateDisplay();
	}
}

function subdivideBeam(beam) {
	var part = beam.part;
	var node1 = beam.nodes[0];
	var node4 = beam.nodes[1];
	var angle = beam.getAngle(node1.getPosition());

	x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.25;
	z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.25;
	var node2 = new Node(new THREE.Vector3(x, 0, z),0);
	node2.internal = true;
	globals.geom.nodes.push(node2)

	var x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.75;
	var z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.75;
	var node3 = new Node(new THREE.Vector3(x, 0, z),0);
	node3.internal = true;
	globals.geom.nodes.push(node3)

	// part.ripup();
	part.dissociate();
	// removeBeam(beam);
	beam.destroy();
	console.log('removing beam ' + beam.index);

	var beam = new Beam([node1,node2],0,[10000000,500000]);
	beam.type = '2DoF';
	beam.addPart(part);
	globals.geom.beams.push(beam);
	var beam = new Beam([node2,node3],0);
	beam.type = '2DoF';
	beam.addPart(part);
	globals.geom.beams.push(beam)
	var beam = new Beam([node3,node4],0,[10000000,500000]);
	beam.type = '2DoF';
	beam.addPart(part);
	globals.geom.beams.push(beam);
	part.type = '2DoF'

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
	node2.internal = true;
	globals.geom.nodes.push(node2)

	x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.625;
	z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.625;
	var node3 = new Node(new THREE.Vector3(x, 0, z),0);
	node2.internal = true;
	globals.geom.nodes.push(node3)

	// removeBeam(beam);
	beam.destroy();
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

function reindex(list) {
	_.each(list, function(item,i) {
		item.index = i;
	});
}

function getParts(nodes) {
	// select the parts that are fully defined by the nodes
	var parts = [];
	_.each(nodes, function(node) {
		_.each(node.parts, function(part) {
			parts.push(part);
		})
	})

	parts = _.uniq(parts);

	parts = _.filter(parts, function(part) {
		return _.every(part.nodes, function(node) {
			return _.contains(nodes, node);
		})
	});

	console.log(parts);
	return parts;
}

// function ripupPart(part,parts=globals.geom.parts) {



// 	// // _.each(part.beams, function(beam) {
// 	// // 	removeBeam(beam);
// 	// // });
// 	// var parts = _.difference(parts,part);
// 	// console.log(part);
// 	// var nodes = _.filter(part.nodes, function(node) {
// 	// 	// if the node is only contained in this part, then delete it
// 	// 	// console.log(node)
// 	// 	return !_.some(parts, function(p) {
// 	// 		return _.contains(p.nodes,node);
// 	// 	})
// 	// })

// 	// console.log(nodes);
// }

function changePartType(part, toType) {
	if (part.type != toType) {
		// remove part
		// part.ripup();

		// replace part
		if (toType == 'rigid') {

		}

	} else {
		// do nothing
	}
}

function changePartType(nodes, type) {
	// this assumes nodes is 2 or 4 which encompase a full part
	var shared_beam = null;
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
}

function makeParts(beams) {
	var _parts = [];
	var index = 0;
	_.each(beams, function(beam) {
		var part = new Part(beam,'rigid')
		_parts.push(part);
	});
	return _parts;
}

function findNeighborNodes(thisnode) {
	var neighbors = [];
	var pos = thisnode.getPosition();
	// _.each(globals.geom.nodes, function(node) {
	_.each(globals.geom.parts, function(part) {
		_.each(part.nodes, function(node) {
			// check N/S
			if (node.getPosition().x == pos.x) {
				if (node.getPosition().z == pos.z+100) {
					neighbors.push(node);
				} else if (node.getPosition().z == pos.z-100) {
					neighbors.push(node);
				}
			}
			// check E/W
			if (node.getPosition().z == pos.z) {
				if (node.getPosition().x == pos.x+100) {
					neighbors.push(node);
				} else if (node.getPosition().x == pos.x-100) {
					neighbors.push(node);
				}
			}
		})
	})

	return neighbors
}

function addBeams(thisnode,othernodes) {
	// don't make redundant beams
	_.each(othernodes, function(othernode) {
		var beam_exists = false;
		if (othernode.beams.length == 0) {
			globals.geom.nodes.push(othernode);
			sceneAdd(othernode.object3D);
		}
		// _.each(globals.geom.beams, function(beam) {
		_.each(globals.geom.parts, function(part) {
			if (_.contains(part.nodes,thisnode) && _.contains(part.nodes,othernode)) {
				beam_exists = true;
				// console.log("part exists")
				// console.log(thisnode)
				// console.log(othernode)
			} else {
				// console.log("should make part")
			}
		});
		if (!beam_exists) {
			var beam = new Beam([thisnode,othernode],0)
			globals.geom.beams.push(beam);
			globals.geom.parts.push(new Part([beam]));
		}
	})
}

function addGeometry(minx,maxx,minz,maxz) {
	var added_geom = false;


	var selected_nodes = [];
	for (var i = minx; i <= maxx; i+=100) {
		for (var j = minz; j >= maxz; j-=100) {
			var node_exists = false;
			_.each(globals.geom.parts, function(part) {
				_.each(part.nodes, function(node) {
					if (node.getPosition().x == i && node.getPosition().z == j) {
						selected_nodes.push(node);
						console.log("node exists")
						node_exists = true;
						if (getParts(selected_nodes).length > 0) {
							console.log("part present between nodes")
						} else {
							var part_nodes = _.uniq(selected_nodes);
							if (part_nodes.length == 2) {
								var new_beam = new Beam(part_nodes,0);
								globals.geom.beams.push(new_beam);
								globals.geom.parts.push(new Part([new_beam]));
							}
						}
					}
				})
			})
			if (!node_exists) {
				var node = new Node(new THREE.Vector3(i, 0, j),0);
				globals.geom.nodes.push(node);
				addBeams(node,findNeighborNodes(node));
				added_geom = true;
			}
		}
	}

	console.log(_.uniq(selected_nodes))
	console.log(getParts(_.uniq(selected_nodes)))

	if (added_geom) {
		reindex(globals.geom.nodes)
		reindex(globals.geom.beams)
		console.log(globals.geom)
	}
}

// function addGeometry(minx,maxx,minz,maxz) {
// 	var added_geom = false;

// 	for (var i = minx; i <= maxx; i+=100) {
// 		for (var j = minz; j >= maxz; j-=100) {
// 			var node_exists = false;
// 			_.each(globals.geom.nodes, function(node) {
// 				if (node.getPosition().x == i && node.getPosition().z == j) {
// 					node_exists = true;
// 				}
// 			})
// 			if (!node_exists) {
// 				var node = new Node(new THREE.Vector3(i, 0, j),0);
// 				globals.geom.nodes.push(node);
// 				addBeams(node,findNeighborNodes(node));
// 				added_geom = true;
// 			}
// 		}
// 	}
// 	if (added_geom) {
// 		reindex(globals.geom.nodes)
// 		reindex(globals.geom.beams)
// 		console.log(globals.geom)
// 	}
// }