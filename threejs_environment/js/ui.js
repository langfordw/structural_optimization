var isDragging = false;
var isDraggingArrow = false;

var start_pos = {x:0, z:0};
var box_vertices = [null,null];
var selected_nodes = [];
var bounds;

var $toolTip = $('#toolTip');
var $toolTip2 = $('#toolTip2');
var $toolTip3 = $('#toolTip3');
var $selectbox = $('#selectbox');
var $plot = $('.plot');

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = 8;
var mouse = new THREE.Vector2();

var highlightedObj = null;
var mouseInEnv = true;

$('#gui').on('mouseenter', function() {
	mouseInEnv = false;
})

$('#gui').on('mouseleave', function() {
	mouseInEnv = true;
})

window.addEventListener('dblclick',function() {
	if (mouseInEnv) {
		if (highlightedObj != null && highlightedObj.beams) {
			var node = highlightedObj
			if (!node.fixed) {
				node.setFixed(true,{x:1,z:1,c:1});
				globals.geom.constraints.push(node);
			} else {
				node.setFixed(false);
				var index = globals.geom.constraints.indexOf(node);
				globals.geom.constraints.splice(index,1);
			}
			// console.log(geom)
			// console.log('fix node ' + highlightedObj.index);
		} else if (highlightedObj != null && highlightedObj.nodes) {
			//double clicked on beam --> subdivide
			console.log('subdivide')
			subdivideBeam(highlightedObj);
		}
	}
}, false);

window.addEventListener('mousedown', function(e){
	if (mouseInEnv) {
	    isDragging = true;
	    start_pos.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	    start_pos.z = - ( e.clientY / window.innerHeight ) * 2 + 1;
	    box_vertices[0] = new THREE.Vector3(start_pos.x,start_pos.z,0).unproject(camera);
		$selectbox.show();
		$selectbox.css({height:0, width:0});
		selected_nodes = [];

    // window.removeEventListener( 'mousemove', mouseMove );
	}
}, false);
window.addEventListener('mouseup', function(){
	if (mouseInEnv) {
        isDragging = false;
        $selectbox.hide();

        if (bounds != null) {
	        _.each(globals.geom.nodes, function(node) {
	    		if (node.x0 < bounds.max.x && node.x0 > bounds.min.x) {
	    			if (node.z0 > bounds.max.z && node.z0 < bounds.min.z) {
	    				node.highlight();
	    				selected_nodes.push(node);
	    			}
	    		}
			});
    	}

		selectAction(selected_nodes, bounds);

        // window.addEventListener( 'mousemove', mouseMove, false );
    }
}, false);

window.addEventListener( 'mousemove', mouseMove, false );

var lattice = {};
lattice.round = function(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

lattice.roundUp = function(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = (number+Math.pow(10,-precision)/2.) * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

lattice.roundDown = function(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = (number-Math.pow(10,-precision)/2.) * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

function findNeighborNodes(thisnode) {
	var neighbors = [];
	var pos = thisnode.getPosition();
	_.each(globals.geom.nodes, function(node) {
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

	return neighbors
}

function addBeams(thisnode,othernodes) {
	// don't make redundant beams
	_.each(othernodes, function(othernode) {
		var beam_exists = false;
		_.each(globals.geom.beams, function(beam) {
			if (_.contains(beam.nodes,thisnode) && _.contains(beam.nodes,thisnode)) {
				beam_exists = true;
			}
		});
		var beam = new Beam([thisnode,othernode],0)
		globals.geom.beams.push(beam);
	})
	
}

function selectAction(nodes, bnds=null) {
	if (globals.control_parameters.selectMode == "add_geom") {
		var minx = lattice.roundUp(bnds.min.x,-2)
		var maxx = lattice.roundDown(bnds.max.x,-2)
		var minz = lattice.roundDown(bnds.min.z,-2)
		var maxz = lattice.roundUp(bnds.max.z,-2)

		// console.log("min: " + minx + " " + minz)
		// console.log("max: " + maxx + " " + maxz)
		var added_geom = false;

		for (var i = minx; i <= maxx; i+=100) {
			for (var j = minz; j >= maxz; j-=100) {
				var node_exists = false;
				_.each(globals.geom.nodes, function(node) {
					if (node.getPosition().x == i && node.getPosition().z == j) {
						node_exists = true;
					}
				})
				if (!node_exists) {
					var node = new Node(new THREE.Vector3(i, 0, j),0);
					globals.geom.nodes.push(node);
					// console.log('placing node');
					addBeams(node,findNeighborNodes(node));
					added_geom = true;
				}
			}
		}
		if (added_geom) {
			reindex(globals.geom.nodes)
			reindex(globals.geom.beams)
			console.log(globals.geom)
		}
		return;
	}


	var sub_nodes = [];
	var sub_beams = [];
	_.each(nodes, function(node) {

		if (globals.control_parameters.selectMode == "fix") {
			if (!node.fixed) {
				node.setFixed(true,{x:1,z:1,c:1});
				globals.geom.constraints.push(node);
			}
			return;
		}
		if (globals.control_parameters.selectMode == "un-fix") {
			if (node.fixed) {
				node.setFixed(false);
				var index = globals.geom.constraints.indexOf(node);
				globals.geom.constraints.splice(index,1);
			}
			return;
		}
		if (globals.control_parameters.selectMode == "force") {
			if (!node.fixed && node.externalForce == null) {
				node.addExternalForce(new THREE.Vector3(globals.control_parameters.fv_x,0,-globals.control_parameters.fv_y));
			}
			return;
		}
		if (globals.control_parameters.selectMode == "un-force") {
			if (node.externalForce != null) {
				node.removeExternalForce();
			}
			return;
		}
		if (globals.control_parameters.selectMode == "sub_geom") {
			// var index = globals.geom.nodes.indexOf(node);
			// globals.geom.nodes.splice(index,1);
			// wrapper.remove(node);	
			// console.log("node " + node.index);
			if (node.fixed) {
				node.setFixed(false);
				var index = globals.geom.constraints.indexOf(node);
				globals.geom.constraints.splice(index,1);
			}
			if (node.externalForce != null) {
				node.removeExternalForce();
			}
			removeNode(node);
			// if (!_.contains(sub_nodes,node)) { sub_nodes.push(node) }
			// _.each(node.beams, function(beam) {
			// 	// get all the beams that are completely contained in the nodes
			// 	if (_.contains(nodes,beam.nodes[0]) && _.contains(nodes,beam.nodes[1])) {
			// 		if (!_.contains(sub_beams,beam)) { sub_beams.push(beam) }
					
					// beamWrapper.remove(beam);
					// var index = globals.geom.beams.indexOf(beam);
					// globals.geom.beams.splice(index,1);
					// console.log("beam " + beam.index);
				// }
			// })

			return;
		}

	});
	if (globals.control_parameters.selectMode == "sub_geom") {
		reindex(globals.geom.nodes);
	}
	// 	console.log(globals.geom)
	// 	console.log("1...")
	// 	console.log(sub_nodes)
	// 	console.log(sub_beams)

	// 	var sub_nodes2 = []
	// 	_.each(sub_nodes, function(node) {
	// 		var remove = true;
	// 		_.each(node.beams, function(beam) {
	// 			if (!_.contains(sub_beams,beam)) {
	// 				remove = false;
	// 			}
	// 		})
	// 		if (remove) {
	// 			sub_nodes2.push(node)
	// 		}
	// 	})

	// 	var sub_beams2 = []
	// 	_.each(sub_nodes2, function(node) {
	// 		removeNode(node);
	// 		// wrapper.remove(node.object3D);
	// 		// var index = globals.geom.nodes.indexOf(node);
	// 		// globals.geom.nodes.splice(index,1);
	// 		// _.each(node.beams, function(beam) {
	// 		// 	sub_beams2.push(beam);
	// 		// 	removeBeam(beam);
	// 		// })
	// 	})
	// 	console.log("2...")
	// 	console.log(sub_nodes2)
	// 	console.log(sub_beams2)
	// 	reindex(globals.geom.beams);
	// 	console.log(globals.geom)
	// }
	
}

function reindex(list) {
	_.each(list, function(item,i) {
		item.index = i;
	});
}

function getSelectBounds(vertices) {
	var _min = {x:0, z:0};
	var _max = {x:0, z:0};

	if (vertices[1].x < vertices[0].x) {
		_min.x = vertices[1].x;
	} else {
		_min.x = vertices[0].x;
	}

	if (vertices[1].z < vertices[0].z) {
		_max.z = vertices[1].z;
	} else {
		_max.z = vertices[0].z;
	}

	if (vertices[1].x > vertices[0].x) {
		_max.x = vertices[1].x;
	} else {
		_max.x = vertices[0].x;
	}

	if (vertices[1].z > vertices[0].z) {
		_min.z = vertices[1].z;
	} else {
		_min.z = vertices[0].z;
	}

	return {
		min: _min,
		max: _max
	}
}

function mouseMove(e){
	if (mouseInEnv) {
	    e.preventDefault();
	    // mouse.x = ( e.clientX / renderer.domElement.width ) * 2 - 1;
	    // mouse.y = - ( e.clientY / renderer.domElement.height ) * 2 + 1;
	    mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	    mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
	    raycaster.setFromCamera(mouse, camera);
	    // mouse_text = ("x: " + mouse.x + "  y: " + mouse.y);
	    // console.log("x: " + e.clientX + "  y: " + e.clientY);
	    // console.log("x: " + mouse.x + "  y: " + mouse.y);

	    if (isDragging) {
	    	box_vertices[1] = new THREE.Vector3(mouse.x,mouse.y,0).unproject(camera);
	    	// console.log("pos = " + boxGeo.vertices[1].x + " " + boxGeo.vertices[1].z)
	    	bounds = getSelectBounds(box_vertices);
	    	
	    	_.each(globals.geom.nodes, function(node) {
	    		if (node.x0 < bounds.max.x && node.x0 > bounds.min.x) {
	    			if (node.z0 > bounds.max.z && node.z0 < bounds.min.z) {
	    				node.highlight();
	    			} else {
	    				node.unhighlight();
	    			}
	    		} else {
	    			node.unhighlight();
	    		}
			});

			var tmp1 = new THREE.Vector3(bounds.min.x, 0, bounds.min.z).project( camera );
			var tmp2 = new THREE.Vector3(bounds.max.x, 0, bounds.max.z).project( camera );
			var selectbounds = [(tmp1.x+1)/2*window.innerWidth, 
				   				(-tmp1.y+1)/2*window.innerHeight,
				   				(tmp2.x+1)/2*window.innerWidth, 
				   				(-tmp2.y+1)/2*window.innerHeight];
			$selectbox.css({left:selectbounds[0], top:selectbounds[3]});
			$selectbox.css({height:selectbounds[1]-selectbounds[3], width:selectbounds[2]-selectbounds[0]});
	    	
	    } else {
	    	var intersections = raycaster.intersectObjects(wrapper.children.concat(beamWrapper.children));
		    highlightedObj = null;

		    if (intersections.length > 0) {							// to do: set priority to nodes first
		        var node_selected = false;
		        _.each(intersections, function (thing) {
		        	if (thing.object && thing.object._myNode) {
		        		node_selected = true;
		        		thing.object._myNode.highlight();
		        		highlightedObj = thing.object._myNode;
		        	}
		        });
		        if (!node_selected) {
		        	_.each(intersections, function (thing) {
			        	if (thing.object && thing.object._myBeam) {
			            	thing.object._myBeam.highlight();
			            	highlightedObj = thing.object._myBeam;
			            }
			        });
		        }
		    }

		    if (highlightedObj) {
		    	var text = null;
		    	var text2 = null;
		    	var text3 = null;
		    	var pos0 = [0, 0];
		    	var pos1 = [0, 0];
		    	var pos2 = [0, 0];
		    	var offset = [0, 0];
		    	var offset2 = [0, 0];

		    	if (highlightedObj.beams) {
		    		// text = "node " + highlightedObj.index
		    		var tmp = highlightedObj.getPosition().clone().project( camera )
		    		pos0 = [(tmp.x+1)/2*window.innerWidth, 
		    			   (-tmp.y+1)/2*window.innerHeight];
		    		text1 = "<p><b>node " + highlightedObj.index + "</b><br>";
		    		$toolTip.html(text1);
			        $toolTip.css({top:pos0[1]-40, left: pos0[0]});
					$toolTip.show();
		    	} else if (highlightedObj.nodes) {
		    		// it's a beam
		    		highlightedObj.nodes[0].highlight();
		    		highlightedObj.nodes[1].highlight();
		    		var angle = highlightedObj.getAngle(highlightedObj.vertices[0]);

		    		var tmp = highlightedObj.nodes[0].getPosition().clone().project( camera )
		    		pos0 = [(tmp.x+1)/2*window.innerWidth, 
		    			   (-tmp.y+1)/2*window.innerHeight];
		    		var tmp = highlightedObj.nodes[1].getPosition().clone().project( camera )
		    		pos1 = [(tmp.x+1)/2*window.innerWidth, 
		    			   (-tmp.y+1)/2*window.innerHeight];

		    	    pos2 = [(pos0[0]+pos1[0])/2, (pos0[1]+pos1[1])/2.]

		    		offset = [-60*Math.sin(angle),60*Math.cos(angle)];
		    		offset2 = [40*Math.sin(angle),-40*Math.cos(angle)];

		    		text1 = "<p><b>node " + highlightedObj.nodes[0].index + "</b><br>";
		    		text2 = "<p><b>node " + highlightedObj.nodes[1].index + "</b><br>";
		    		text3 = "<p><b>beam " + highlightedObj.index + "</b><br>";

		    		if (highlightedObj.f_local != null) {
		    			var forces = forces2text(highlightedObj.f_local);

		    			text1 += "fx: " + forces[0] + "<br>"
			    		text1 += "fy: " + forces[1] + "<br>"
			    		text1 += "m: " + forces[2] + "<br>"
			    		text2 += "fx: " + forces[3] + "<br>"
			    		text2 += "fy: " + forces[4] + "<br>"
			    		text2 += "m: " + forces[5] + "<br>"

		    		}
		    		

		    		text1 += "</p>"
		    		text2 += "</p>"

		    		$toolTip.html(text1);
			        $toolTip.css({top:pos0[1]+offset[1], left: pos0[0]+offset[0]});
					$toolTip.show();

					$toolTip2.html(text2);
			        $toolTip2.css({top:pos1[1]+offset[1], left: pos1[0]+offset[0]});
					$toolTip2.show();

					$toolTip3.html(text3);
			        $toolTip3.css({top:pos2[1]+offset2[1], left: pos2[0]+offset2[0]});
					$toolTip3.show();
		    	}

		    	
		    } else {
			    _.each(beamWrapper.children, function (beam) {
			        beam._myBeam.unhighlight();
			    });
			    _.each(wrapper.children, function (node) {
			    	if (node._myNode) {
			    		node._myNode.unhighlight();
			    	}
			    });
			    $toolTip.hide();
			    $toolTip2.hide();
			    $toolTip3.hide();

			    highlightedObj = null;
			}
	    }
	}
    
}

function forces2text(fmatrix) {
	output = []
	fmatrix.forEach(function (value, index, matrix) {
  		output.push(value.toFixed(2));
	});

	return output;
}
