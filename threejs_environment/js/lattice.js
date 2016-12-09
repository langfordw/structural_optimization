var globals = {
	// nwide: 2,
	// ntall: 2,
	lattice_pitch: 100,
	linear_scale: 1.0,
	angular_scale: 1.0,
	beam_forces: [],
	radial_deflections: [],
	kmax: 1,
	kmin: 1,
	view_mode: { deformed: false },
	geom: null,
	solved: false,
	isAnimating: false,
	control_parameters: {
		nwide: 2,
		ntall: 3,
		deformGeometry: false,
		forceMode: "axial",
		deformationScale: 1.0,
		hideArrows: false,
		showGrid: true,
		showPartGrid: false,
		background: 'light',
		solve: function() {
			if (globals.geom != null) {
				// solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
				// var umax = solver.solve();
				// setup_solve(globals.geom);
				solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
				var umax = solve(globals.geom);
				globals.control_parameters.displacement_norm = "" + umax.toFixed(2) + "mm";
				this.deformGeometry = true;
				gui.updateDisplay();
				deformGeometryBending(globals.geom,globals.linear_scale);
			}
			render();
		},
		reset: function() {
			tracer.clearTraces();
			if (globals.geom != null) {
				resetNonlinearSolve();
			}
			// tracer.clearTraces();
			// _.each(globals.geom.nodes, function(node) {
			// 	node.u_cumulative = [0,0,0];
			// });
			// if (globals.geom != null) {
			// 	resetLattice();
			// 	solver.reset();
			// }
			render();
		},
		n_iter: '50',
		solveIterations: function() {
			var fv = [globals.control_parameters.fv_x, globals.control_parameters.fv_y];
			displayMessage("solving");
			var start = new Date().getTime();
			solve_linear_incremental(fv,Math.pow(10,globals.control_parameters.eps));
			var dt = new Date().getTime() - start;
			console.log('Solved in ' + dt + 'ms');
			deformGeometryBending(globals.geom,1.0)
			globals.control_parameters.deformGeometry = true;
			gui.updateDisplay();
			disp.open();
			selection.close();
			render();
		},
		reset_nonlin: function() {
			tracer.clearTraces();
			if (globals.geom != null) {
				resetNonlinearSolve();
			}
			render();
		},
		selectMode: "none",
		fv_x: 100,
		fv_y: 0,
		displacement_norm: '0',
		displacement_xyz: '(0, 0, 0)',
		radialStiffness: function() {
			measureRadialStiffness();
			render();
		},
		stressSelectionThreshold: 1000,
		subdivideSelection: function() {
			var selected = selectStressed(globals.stressSelectionThreshold);
			console.log('selected:')
			console.log(selected)
			subdivideSelection(selected);
			render();
		},
		download: function() {
			var data = stringifyGeometry();
			download(data, 'geometry.json', 'text/plain');
		},
		load: function() {
			loadGeometry();
		},
		eps: 0,
		setupDynamicSolve: function() {
			dynSolver = new DynamicSolver();
			dynSolver.setup(globals.geom);
		},
		runDynamicSolve: function() {
			var start = new Date().getTime();
			for (var i=0; i < globals.control_parameters.ntimes; i++) {
				dynSolver.step();
				renderDynamic();
			}
			var dt = new Date().getTime() - start;
			console.log('Solved in ' + dt + 'ms');
			render();
		},
		ntimes: 1,
		loadExample: 'none'
	}
};

var displacements = [];
var total_max_disp = [0,0];
var total_max_norm = 0;

var solver;
var dynSolver;

var gui = new dat.GUI();
gui.domElement.id = 'gui'

var env = gui.addFolder('Environment');
env.add(globals.control_parameters, 'showGrid').onChange(function(value) {
	if (value) {
		gridHelper.visible = true;
	} else {
		gridHelper.visible = false;
	}
	render();
}).name('Show Grid');
env.add(globals.control_parameters, 'showPartGrid').onChange(function(value) {
	if (value) {
		_.each(globals.geom.parts, function(part) {
			part.object3D.visible = true;
		})
	} else {
		_.each(globals.geom.parts, function(part) {
			part.object3D.visible = false;
		})
	}
	render();
}).name('Part Grid');
env.add(globals.control_parameters, 'background',['light','dark','white']).onChange(function(value) {
	if (value == 'white') {
		scene.background = new THREE.Color(0xffffff);
		gridHelper.color1 = new THREE.Color(0x202020);
		$selectbox.css({'background-color': 'rgba(150, 150, 150, 0.25)'});
	} else if (value == 'light') {
		scene.background = new THREE.Color(0xdedede);
		gridHelper.color1 = new THREE.Color(0x202020);
		$selectbox.css({'background-color': 'rgba(150, 150, 150, 0.25)'});
	} else if (value == 'dark') {
		scene.background = new THREE.Color(0x404040);
		gridHelper.color1 = new THREE.Color(0xffffff);
		gridHelper.color2 = new THREE.Color(0x00ffff);
		$selectbox.css({'background-color': 'rgba(255, 255, 255, 0.1)'});
	}
	render();
}).name('Background');
env.add(globals.control_parameters, 'nwide', 2, 20).step(1).onFinishChange(function() {
	sceneClear();
	sceneAdd(beamWrapper);
	initLattice();
});
env.add(globals.control_parameters, 'ntall', 2, 20).step(1).onFinishChange(function() {
	sceneClear();
	sceneAdd(beamWrapper);
	initLattice();
});
var fv = gui.addFolder('Force Vector');
fv.add(globals.control_parameters, 'fv_x',-5000,5000).onChange((function() {
	updateExternalForce(globals.control_parameters.fv_x,globals.control_parameters.fv_y,false);
	render();
}));
fv.add(globals.control_parameters, 'fv_y',-5000,5000).onChange((function() {
	updateExternalForce(globals.control_parameters.fv_x,globals.control_parameters.fv_y,false);
	render();
}));
fv.add(globals.control_parameters,'hideArrows').onChange((function(value) {
	if (!value) {
		_.each(globals.geom.nodes, function(node) {
			if(node.arrow != null) {
				node.arrow.visible = true;
			}
		})
	} else {
		_.each(globals.geom.nodes, function(node) {
			if(node.arrow != null) {
				node.arrow.visible = false;
			}
		})
	}
	render();
}));

var selection = gui.addFolder('Selection');
selection.add(globals.control_parameters,'selectMode',
	[ 'none', 'add_geom', 'sub_geom', 'fix', 'un-fix', 'force', 'un-force', 
	'trace','un-trace',
	'make_rigid', 'make_1DoF', 'make_2DoF', 'make_none']).name("Function");
selection.open();


var solve_folder = gui.addFolder('Linear Solver');
solve_folder.add(globals.control_parameters,'reset').name("Reset");
solve_folder.add(globals.control_parameters,'solve').name("Solve");
solve_folder.add(globals.control_parameters,'radialStiffness').name("Radial Stiffness");
solve_folder.open();

var nonlin_solve = gui.addFolder('Nonlinear Solver');
nonlin_solve.add(globals.control_parameters,'eps',-5,1);
nonlin_solve.add(globals.control_parameters,'reset_nonlin').name("Reset");
nonlin_solve.add(globals.control_parameters,'solveIterations').name("Solve (incremental)");
nonlin_solve.open();

var dynamic_solve = gui.addFolder('Dynamic Solver');
dynamic_solve.add(globals.control_parameters,'ntimes',1,1000);
dynamic_solve.add(globals.control_parameters,'setupDynamicSolve').name("Setup");
dynamic_solve.add(globals.control_parameters,'runDynamicSolve').name("Solve (dynamic)");
dynamic_solve.close();

var disp = gui.addFolder('Display');

disp.add(globals.control_parameters,'deformGeometry').onChange((function(value) {
	if (value) {
		if (globals.solved) {
			deformGeometryBending(globals.geom,globals.linear_scale);
		}
	} else {
		undeformGeometryBending(globals.geom);
	}
	render();
}));

var deformation_scale_control = disp.add(globals.control_parameters, 'deformationScale', 0, 2).name("Scale");
var force_mode_control = disp.add(globals.control_parameters, 'forceMode', [ 'axial', 'shear', 'moment' ] ).name("Display");


deformation_scale_control.onChange(function(value) {
	globals.linear_scale = value;
	if (globals.control_parameters.deformGeometry) {
 		deformGeometryBending(globals.geom,globals.linear_scale);
	}
	render();
});

force_mode_control.onChange(function(value) {
	displayBeamForces(globals.geom.beams);
	render();
});

disp.add(globals.control_parameters,'n_iter').name("Iterations");
disp.add(globals.control_parameters,'displacement_norm').name("umax norm");
// disp.add(globals.control_parameters,'displacement_xyz').name("umax xyz");

var filter = gui.addFolder('Selection Filter');
filter.add(globals.control_parameters,'stressSelectionThreshold',0,10000).name("stress threshold").onChange(function(value) {
	globals.control_parameters.stressSelectionThreshold = value;
	selectStressed(value);
	render();
}).onFinishChange(function(value) {
	var selected = selectStressed(value);
	console.log('selected:')
	console.log(selected)
	resetLattice();
	solver.reset();
	subdivideSelection(selected);
	render();
});
filter.add(globals.control_parameters,'subdivideSelection')

var load_save = gui.addFolder('Save/Load Geometry');
load_save.add(globals.control_parameters,'download').name("Download");
load_save.add(globals.control_parameters,'load').name("Load JSON");
load_save.add(globals.control_parameters,'loadExample',['arm','auxetic','parallelogram','basic']).name("Load Example").onChange(function(value) {
	console.log(value)
	loadExample(value)
});

function initLattice() {
	// ******** GENERATE BASE GEOMETRY ********
	globals.geom = generateGeometry();

	console.log("initial state:")
	console.log(globals.geom)

	undeformGeometryBending(globals.geom);

	setup_solve(globals.geom);
}

// function bakeGeometry() {

// 	_.each(globals.geom.beams, function(beam) {
// 		beam.len = Math.sqrt(Math.pow(beam.vertices[1].x-beam.vertices[0].x,2) + Math.pow(beam.vertices[1].z-beam.vertices[0].z,2));
// 		// beam.assemble_k_prime();
// 		beam.assemble_kp();
// 		beam.assemble_full_T();
// 		beam.assemble_T();
// 		beam.calculate_4ks();
// 	});
// }

function resetLattice() {
	globals.solved = false;
	disp.close();
	selection.open();
	clearSVG();
	$plot.hide();
	globals.control_parameters.deformGeometry = false;
	gui.updateDisplay();
	undeformGeometryBending(globals.geom);
}

function setup_solve(geom,debug=true) {
	solver = new FrameSolver(geom.nodes,geom.beams,geom.constraints);
	if (debug) {
		console.log("solver setup:");
		console.log(solver);
	}
}

function solve(geom=globals.geom,debug=true) {

	// ****** SOLVE ******
	var start = new Date().getTime();
	var umax = solver.solve(true);
	globals.solved = true;
	disp.open();
	selection.close();
	if (debug) {
		console.log("solver results:")
		console.log(solver)
	}

	var dt = new Date().getTime() - start;
	if (debug) { console.log('Solved in ' + dt + 'ms'); }

	// var max_disp_node = null;
	// var max_u_norm = 0;
	// _.each(globals.geom.nodes, function(node) {
	// 	var u_norm = Math.sqrt(Math.pow(node.u[0],2) + Math.pow(node.u[1],2));
	// 	if (u_norm > max_u_norm) {
	// 		max_u_norm = u_norm;
	// 		max_disp_node = node;
	// 	}
	// });

	// if (max_disp_node == null) {
	// 	max_disp_node = globals.geom.nodes[0];
	// }

	if (debug) {
		console.log("end state:")
		console.log(geom);
	}
	return umax;
}

function measureRadialStiffness() {
	var deflections = [];
	globals.isAnimating = true;
	// for (var i = 0; i <= 360; i+=5) {
	var i = 0;
	var finished = false;
	var max = -1000;
	var min = 1000;
	loop( function() {
		var angle = i*Math.PI/180;
		var unit_vector = [100*Math.cos(angle),100*Math.sin(angle)];
		updateExternalForce(unit_vector[0],unit_vector[1]);
		resetLattice();
		solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
		// setup_solve('frame',globals.geom);
		// deflections.push([angle,1/Math.pow(solve('frame',globals.geom),0.25)]);
		var def = solver.solve(true);
		deflections.push([angle,1/Math.pow(def,0.25)]);
		// deflections.push([angle,1/solve(globals.geom)]);

		if (def > max) { max = def; }
		else if (def < min) { min = def; }

		if (i >= 360) {
			globals.isAnimating = false;
			finished = true;
		}
		i+=5;
		// render();
		renderer.render(scene, camera);
		if (finished) {
			globals.radial_deflections = deflections;
			// var kmax = _.max(_.map(globals.radial_deflections,function(data) {return data[1]}));
			// var kmin = _.min(_.map(globals.radial_deflections,function(data) {return data[1]}))
			globals.kmax = 1/min;
			globals.kmin = 1/max;
			console.log("kmax = " + globals.kmax);
			console.log("kmin = " + globals.kmin);
			console.log(deflections);
			redrawPlot();
			$plot.show();
		}
	});

}

function selectStressed(thresh) {
	var selected = [];
	if (globals.solved) {
		_.each(globals.geom.beams, function(beam) {
			if (beam.type == 'rigid') {
				var m = Math.abs(beam.f_local._data[2]);
				console.log(m)
				if (m > thresh) {
					selected.push(beam);
					beam.highlight();
				} else {
					beam.unhighlight();
				}
			}
		})
	}
	console.log(selected);
	return selected
}

function subdivideSelection(selected) {
	_.each(selected, function(beam) {
		subdivideBeam(beam);
	})
}

function stringifyGeometry() {
	var data = [];
	_.each(globals.geom.nodes, function(node) {
		data.push({type:"node",index:node.index,x:node.x0,z:node.z0,fixed:node.fixed,force:node.externalForce,internal:node.internal});
	})
	_.each(globals.geom.beams, function(beam) {
		data.push({type:"beam",index:beam.index,node1:beam.nodes[0].index,node2:beam.nodes[1].index});
	})
	_.each(globals.geom.parts, function(part) {
		data.push({type:"part",beams:part.getBeamIndices(),nodes:part.getNodeIndices('edge'),partType:part.type});
	})
	var jsonData = JSON.stringify(data);
	return jsonData;
}

function buildFromJSON(objects) {
	console.log("building objects...")
	sceneClear();
	sceneClearBeam();
	globals.geom.nodes = [];
	globals.geom.beams = [];
	globals.geom.constraints = [];
	globals.geom.parts = [];

	_.each(objects, function(object) {
		if (object.type == 'node') {
			if (!object.internal) {
				console.log("build node")
				var node = new Node(new THREE.Vector3(object.x, 0, object.z),object.index);
				node.internal = object.internal;
				if (object.fixed) { 
					node.setFixed(true,{x:1,z:1,c:1}) 
					globals.geom.constraints.push(node);
				}
				if (object.force != null) {
					globals.control_parameters.fv_x = object.force.x;
					globals.control_parameters.fv_y = object.force.z;
					gui.updateDisplay();
					node.addExternalForce(new THREE.Vector3(object.force.x,0,object.force.z));
				}
				globals.geom.nodes.push(node)
			}
		} 
	});
	_.each(objects, function(object) {
		if (object.type == 'part') {
			var part_nodes = _.map(object.nodes,function(node){return globals.geom.nodes[node]});
			globals.geom.beams.push(new Beam(part_nodes, 0));
		}
	});

	var index = 0;
	_.each(objects, function(object,i) {
		if (object.type == 'part') {
			var beam = globals.geom.beams[index];
			index++;
			var part = new Part([beam],[],"rigid");
			globals.geom.parts.push(part);
		}
	});

	var part_objects = _.filter(objects,function(object) { return object.type=='part' });

	_.each(globals.geom.parts, function(part,i) {
		part.changeType(part_objects[i].partType);
	})

	sceneAdd(beamWrapper)
	console.log(globals.geom)
	render();
}

function download(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

function loadGeometry() {
	var input = $('#load_json');
	input.click();
	var reader = new FileReader();
	var contents;
	var file = [];
    
	document.getElementById('load_json').addEventListener('change', function(evt) {
		file = evt.target.files[0];
		reader.addEventListener( 'load', function ( event ) {
	        contents = event.target.result;
	        buildFromJSON(JSON.parse(contents));
	    }, false );
		reader.readAsText( file );
	})
}

function loadExample(filename) {
	$.getJSON( "examples/"+filename+".json", function( json ) {
	  buildFromJSON(json);
	});
}

function renderDynamic() {
	var pos = dynSolver.position;
	var nodes = globals.geom.nodes;
	// console.log(nodes)
	for (var i=0; i < nodes.length; i++) {
		// console.log([pos[i*3],pos[i*3+1],pos[i*3+2]])
		nodes[i].u_cumulative[0] = pos[i*3];
		nodes[i].u_cumulative[1] = pos[i*3+1];
		nodes[i].u_cumulative[2] = pos[i*3+2];
	}
	deformGeometryBending(globals.geom,1.0);
}
