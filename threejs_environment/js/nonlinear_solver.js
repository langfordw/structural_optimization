function solve_linear_incremental(full_force,eps=1.0,maxiter=10000,debug=false) {
	// first, do a linear solve with the full force and check max displacement
	var magnitude = Math.sqrt(Math.pow(full_force[0],2) + Math.pow(full_force[1],2));
	var full_magnitude = magnitude;
	var unit_v = [full_force[0]/magnitude,full_force[1]/magnitude];

	var force_sum = 0;
	var iter_count = 0;

	var u_total = 0;

	console.log("determining step size...")
	var solve_timer = new Date().getTime();
	updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);
	solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
	var u_max = solver.solve(false,false);
	var solve_time = ((new Date().getTime()) - solve_timer);
	

	var num_steps = Math.ceil(u_max/eps);
	var expected_time = solve_time*num_steps;
	var fstep = full_magnitude/num_steps;
	console.log("force step: " + fstep + "N")
	console.log("# of steps required: " + num_steps)
	console.log("expected time per step = " + solve_time + "ms");
	console.log("expected total time = " + expected_time + "ms");
	if (expected_time > 60000) {
		console.warn("solve will take a long time")
		return;
	}

	var trace = [];

	updateExternalForce(unit_v[0]*fstep*10,unit_v[1]*fstep*10);
	solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
	
	while (1) {
		globals.isAnimating = true;
		stepSolve([unit_v[0]*fstep,unit_v[1]*fstep]);
		iter_count++;

		console.log(solver)
		console.log(globals.geom.nodes[3].u_cumulative)
		if (iter_count >= num_steps) break;
		if (iter_count >= maxiter) break;
	}
	console.log(globals.geom)
}


// 	// 		// for (var i=0; i < globals.geom.nodes.length; i++) {
// 	// 		// 	var node = globals.geom.nodes[i];
// 	// 		// 	node.u_cumulative = [0,0,0];
// 	// 		// }

// 	// 		// solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
	
		
// 	// 	if (force_sum >= full_magnitude) break;

// 	// }
// 	solver.solve(true);

// 	if (iter_count >= maxiter) {
// 		console.log("Max iterations reached.")
// 	}
// 	tracer.drawTraces();

// 	globals.control_parameters.n_iter = "" + iter_count;
// 	globals.control_parameters.displacement_norm = "" + u_total.toFixed(2) + "mm";
// 	gui.updateDisplay();

// 	deformGeometryBending(globals.geom,globals.linear_scale);

// 	console.log("end state:")
// 	console.log(globals.geom);

// 	hideMessage();
// }

function stepSolve(fstep) {
	tracer.update();
	if (fstep != undefined) updateExternalForce(fstep[0],fstep[1]);
	solver.setupIteration();
	u_max = solver.solve(true);
	// deformGeometryBending(globals.geom,1.0);
	deformGeometryFast(globals.geom);
}

function resetNonlinearSolve() {
	resetLattice();
	_.each(globals.geom.nodes, function(node) {
		node.u = [0,0,0];
		node.u_cumulative = [0,0,0];
	});
	console.log(globals.geom);
}