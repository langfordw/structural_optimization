var globals = {
	nwide: 2,
	ntall: 2,
	lattice_pitch: 100,
	linear_scale: 1.0,
	angular_scale: 1.0,
	beam_forces: [],
	view_mode: { deformed: false },
	geom: null,
	solved: false,
	control_parameters: {
		deformGeometry: false,
		forceMode: "axial",
		deformationScale: 1.0,
		hideArrows: false,
		solve: function() {
			if (globals.geom != null) {
				setup_solve('frame',globals.geom);
				var umax = solve('frame',globals.geom);
				globals.control_parameters.displacement_norm = "" + umax.toFixed(2) + "mm";
				this.deformGeometry = true;
				gui.updateDisplay();
				deformGeometryBending(globals.geom,globals.linear_scale);
			}
		},
		reset: function() {
			tracer.clearTraces();
			_.each(globals.geom.nodes, function(node) {
				node.u_cumulative = [0,0,0];
			});
			if (globals.geom != null) {
				resetLattice();
				solver.reset();
			}
		},
		bake: function() {
			bakeGeometry();
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
		},
		reset_nonlin: function() {
			tracer.clearTraces();
			if (globals.geom != null) {
				resetNonlinearSolve();
			}

		},
		selectMode: "none",
		fv_x: 100,
		fv_y: 0,
		displacement_norm: '0',
		displacement_xyz: '(0, 0, 0)',
		radialStiffness: function() {
			measureRadialStiffness();
		},
		stressSelectionThreshold: 1000,
		subdivideSelection: function() {
			var selected = selectStressed(globals.stressSelectionThreshold);
			console.log('selected:')
			console.log(selected)
			subdivideSelection(selected);
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
			dynSolver.step();
		}
	}
};

var displacements = [];
var total_max_disp = [0,0];
var total_max_norm = 0;

var solver;
var dynSolver;

var gui = new dat.GUI();
gui.domElement.id = 'gui'

var fv = gui.addFolder('Force Vector');
fv.add(globals.control_parameters, 'fv_x',-5000,5000).onChange((function() {
	updateExternalForce(globals.control_parameters.fv_x,globals.control_parameters.fv_y);
}));
fv.add(globals.control_parameters, 'fv_y',-5000,5000).onChange((function() {
	updateExternalForce(globals.control_parameters.fv_x,globals.control_parameters.fv_y)
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
// nonlin_solve.add(globals.control_parameters,'eps',-5,1);
dynamic_solve.add(globals.control_parameters,'setupDynamicSolve').name("Setup");
dynamic_solve.add(globals.control_parameters,'runDynamicSolve').name("Solve (dynamic)");
dynamic_solve.open();

var disp = gui.addFolder('Display');

disp.add(globals.control_parameters,'deformGeometry').onChange((function(value) {
	if (value) {
		if (globals.solved) {
			deformGeometryBending(globals.geom,globals.linear_scale);
		}
	} else {
		undeformGeometryBending(globals.geom);
	}
}));

var deformation_scale_control = disp.add(globals.control_parameters, 'deformationScale', 0, 2).name("Scale");
var force_mode_control = disp.add(globals.control_parameters, 'forceMode', [ 'axial', 'shear', 'moment' ] ).name("Display");


deformation_scale_control.onChange(function(value) {
	globals.linear_scale = value;
	if (globals.control_parameters.deformGeometry) {
 		deformGeometryBending(globals.geom,globals.linear_scale);
	}
});

force_mode_control.onChange(function(value) {
	displayBeamForces(globals.geom.beams);
});

disp.add(globals.control_parameters,'n_iter').name("Iterations");
disp.add(globals.control_parameters,'displacement_norm').name("umax norm");
disp.add(globals.control_parameters,'displacement_xyz').name("umax xyz");

var filter = gui.addFolder('Selection Filter');
filter.add(globals.control_parameters,'stressSelectionThreshold',0,10000).name("stress threshold").onChange(function(value) {
	globals.control_parameters.stressSelectionThreshold = value;
	selectStressed(value);
}).onFinishChange(function(value) {
	var selected = selectStressed(value);
	console.log('selected:')
	console.log(selected)
	resetLattice();
	solver.reset();
	subdivideSelection(selected);
});
filter.add(globals.control_parameters,'subdivideSelection')

var load_save = gui.addFolder('Save/Load Geometry');
load_save.add(globals.control_parameters,'download').name("Download");
load_save.add(globals.control_parameters,'load').name("Load JSON");

function initLattice() {
	// ******** GENERATE BASE GEOMETRY ********
	globals.geom = generateGeometry();

	console.log("initial state:")
	console.log(globals.geom)

	undeformGeometryBending(globals.geom);

	setup_solve('frame',globals.geom);
}

function bakeGeometry() {
	// _.each(globals.geom.nodes, function(node) {
	// 	if (node.u_cumulative == null) {
	// 		node.u_cumulative = [0,0,0];
	// 	}
	// 	node.u_cumulative[0] += node.u[0];
	// 	node.u_cumulative[1] += node.u[1];
	// 	node.u_cumulative[2] += node.u[2];
	// })

	_.each(globals.geom.beams, function(beam) {
		beam.len = Math.sqrt(Math.pow(beam.vertices[1].x-beam.vertices[0].x,2) + Math.pow(beam.vertices[1].z-beam.vertices[0].z,2));
		// beam.assemble_k_prime();
		beam.assemble_kp();
		beam.assemble_full_T();
		beam.assemble_T();
		beam.calculate_4ks();
	});

	// undeformGeometryBending(globals.geom);

	// setup_solve('frame',globals.geom);
}

function resetLattice() {
	globals.solved = false;
	disp.close();
	selection.open();
	$plot.hide();
	globals.control_parameters.deformGeometry = false;
	gui.updateDisplay();
	undeformGeometryBending(globals.geom);
}

// function resetSolver() {
// 	var num_dofs = (globals.geom.nodes.length - globals.geom.constraints.length)*3;
// 	var num_beams = globals.geom.beams.length;

// 	solver.X = math.zeros(num_dofs);
// 	solver.assemble_X();

// 	solver.Ksys = math.zeros(num_dofs, num_dofs);
// 	solver.calculate_Ksys();

// 	solver.u = math.zeros(num_dofs);
// 	solver.f = math.zeros(num_beams);

// 	_.each(globals.geom.beams, function(beam) {
// 		beam.k_prime = math.zeros(6,6);
// 		beam.assemble_k_prime();

// 		beam.full_T = math.zeros(6,6);
// 		beam.assemble_full_T();

// 		beam.T = math.matrix([0]);
// 		beam.assemble_T();

// 		beam.k = {
// 			n00: null,
// 			n11: null,
// 			n01: null,
// 			n10: null,
// 			full: null
// 		};
// 		beam.k.n00 = math.zeros(3,3);
// 		beam.k.n11 = math.zeros(3,3);
// 		beam.k.n01 = math.zeros(3,3);
// 		beam.k.n10 = math.zeros(3,3);
// 		beam.k.full = math.zeros(3,3);
// 		beam.calculate_4ks();

// 		beam.u_local = math.zeros(6,1);
// 		beam.f_local = math.zeros(6,1);
// 	});
// }

function setup_solve(type='frame',geom,debug=true) {
	if (type == 'frame') {
		solver = new FrameSolver(geom.nodes,geom.beams,geom.constraints);
		if (debug) {
			console.log("solver setup:");
			console.log(solver);
		}
	} else if (type == 'axial') {
		// axial solve
		// solver = new DirectStiffnessSolver(geom.nodes,geom.beams,geom.constraints);
		// deformGeometry(solver.u._data);
		// var forces = _.flatten(solver.f._data);
		// updateForces(geom.beams,forces);
		// displayForces(geom.beams,forces);
	} else if (type == 'kinematic') {
		// kinematic solve:
		// solveNums = calculateSolveNums();
		// var x = new Array(solveNums.n);
		// var con = new Array(solveNums.m);
		// x = getX(x);
	}
}

function solve(type='frame',geom=globals.geom,debug=true) {
	if (type == 'frame') {
		// ****** SOLVE ******
		var start = new Date().getTime();
		solver.solve();
		globals.solved = true;
		disp.open();
		selection.close();
		if (debug) {
			console.log("solver results:")
			console.log(solver)
		}

		var dt = new Date().getTime() - start;
		if (debug) { console.log('Solved in ' + dt + 'ms'); }

		// ****** DEFORM / UPDATE GEOMETRY *****
		globals.beam_forces = [];
		_.each(globals.geom.beams, function(beam) {
			// var f = Math.sqrt(Math.pow(beam.f_local._data[0],2) + Math.pow(beam.f_local._data[1],2));
			var f = Math.abs(beam.f_local._data[0]);
			globals.beam_forces.push(f);
		})

		var max_disp_node = null;
		var max_u_norm = 0;
		_.each(globals.geom.nodes, function(node) {
			var u_norm = Math.sqrt(Math.pow(node.u[0],2) + Math.pow(node.u[1],2));
			if (u_norm > max_u_norm) {
				max_u_norm = u_norm;
				max_disp_node = node;
			}
		});

		if (max_disp_node == null) {
			max_disp_node = globals.geom.nodes[0];
		}

		// total_max_norm += max_u_norm;
		// total_max_disp[0] += max_disp_node.u[0];
		// total_max_disp[1] += max_disp_node.u[1];

		// globals.control_parameters.displacement_norm = '' + total_max_norm.toFixed(2) + 'mm @ node ' + max_disp_node.index;
		// globals.control_parameters.displacement_xyz = "(" + total_max_disp[0].toFixed(2) + ", " + total_max_disp[1].toFixed(2) + ") mm";

		// deformGeometryBending(geom,globals.linear_scale,globals.angular_scale);

		if (debug) {
			console.log("end state:")
			console.log(geom);
		}
		return max_u_norm;
	} else if (type == 'axial') {
		// axial solve
		// solver = new DirectStiffnessSolver(geom.nodes,geom.beams,geom.constraints);
		// deformGeometry(solver.u._data);
		// var forces = _.flatten(solver.f._data);
		// updateForces(geom.beams,forces);
		// displayForces(geom.beams,forces);
	} else if (type == 'kinematic') {
		// kinematic solve:
		// solveEquilibrium(solveNums);
	}
}

function measureRadialStiffness() {
	var deflections = [];
	for (var i = 0; i <= 360; i+=5) {
		var angle = i*Math.PI/180;
		var unit_vector = [100*Math.cos(angle),100*Math.sin(angle)];
		updateExternalForce(unit_vector[0],unit_vector[1]);
		resetLattice();
		solver.reset();
		setup_solve('frame',globals.geom);
		deflections.push([angle,1/Math.pow(solve('frame',globals.geom),0.25)]);
	}

	console.log(deflections)
	radialPlot(deflections);
	$plot.show();
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
		data.push({type:"node",index:node.index,x:node.x0,z:node.z0,fixed:node.fixed,force:node.externalForce});
	})
	_.each(globals.geom.beams, function(beam) {
		data.push({type:"beam",index:beam.index,node1:beam.nodes[0].index,node2:beam.nodes[1].index});
	})
	var jsonData = JSON.stringify(data);
	return jsonData;
}

function buildFromJSON(objects) {
	console.log("building objects...")
	// sceneClear();
	var _nodes = [];
	var _beams = [];
	var _constraints = [];
	_.each(objects, function(object) {
		if (object.type == 'node') {
			console.log("build node")
			var node = new Node(new THREE.Vector3(object.x, 0, object.z),object.index);
			if (object.fixed) { 
				node.setFixed(true,{x:1,z:1,c:1}) 
				_constraints.push(node);
			}
			if (object.force != null) {
				node.addExternalForce(new THREE.Vector3(object.force.x,0,object.force.z));
			}
			_nodes.push(node);
		} else if (object.type == 'beam') {
			console.log("build beam")
			var beam = new Beam([_nodes[object.node1],_nodes[object.node2]],object.index)
			_beams.push(beam)
		}
	})

	console.log(_nodes)
	console.log(_beams)
	console.log(_constraints)
	globals.geom = null;
	globals.geom = {nodes:_nodes,
					beams:_beams,
					constraints:_constraints}
	console.log(globals.geom)
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
