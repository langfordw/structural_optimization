function solve_linear_incremental(full_force,eps=1.0,maxiter=10000,debug=false) {
	// first, do a linear solve with the full force and check max displacement
	var magnitude = Math.sqrt(Math.pow(full_force[0],2) + Math.pow(full_force[1],2));
	var full_magnitude = magnitude;
	var unit_v = [full_force[0]/magnitude,full_force[1]/magnitude];

	var force_sum = 0;
	var iter_count = 0;

	var u_total = 0;

	updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);
	solver.reset(globals.geom.nodes,globals.geom.beams,globals.geom.constraints);
	var u_max = solver.solve();

	var trace = [];

	// setTimeout(displayMessage("test"),1000);

	if (debug) {
		console.log("full force = " + full_magnitude);
		console.log("umax = " + u_max);

		console.log("starting loop...");
	}
	
	var solve_count = 0;
	var solve_timer = new Date().getTime();
	while (force_sum < full_magnitude && iter_count < maxiter) {

		if (u_max > eps) {
			console.log("determining step size...")
			while (u_max > eps && iter_count < maxiter) {
				if (debug) { console.log("refining step") }
				magnitude *= 0.5;

				updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);

				solver.setupIteration();
				u_max = solver.solve();
				solve_count++;

				iter_count++;
			}
			for (var i=0; i < globals.geom.nodes.length; i++) {
				var node = globals.geom.nodes[i];
				node.u_cumulative = [0,0,0];
			}
			console.log("found valid step size: f_step = " + magnitude);
			if (solve_count != 0) {
				var solve_time = ((new Date().getTime()) - solve_timer)/solve_count;
				console.log("avg. evaluation time = " + solve_time + "ms");
				var num_iterations = full_magnitude/magnitude;
				console.log("num iterations = " + num_iterations);
				var expected_time = solve_time * num_iterations;
				console.log("expected solve time = " + expected_time + "ms");
				if (expected_time > 60000) {
					console.warn("solve will take a long time")
					break;
				}
			}
			
		} else {
			// bakeGeometry();

			tracer.update();

			updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);

			solver.setupIteration();
			u_max = solver.solve(false);
			// deformGeometryBending(globals.geom,1.0);
			deformGeometryFast(globals.geom);
			iter_count++;

			force_sum += magnitude;	
			u_total += u_max;

			console.log("force_sum = " + force_sum);

			if (debug) { 
				console.log("found valid step");
				console.log("umax = " + u_max);
				console.log("force_sum = " + force_sum);
				console.log("u_total = " + u_total);
			}
			
		}
		solver.solve(true);

	}

	if (iter_count == maxiter) {
		console.log("Max iterations reached.")
	}
	tracer.drawTraces();

	globals.control_parameters.n_iter = "" + iter_count;
	globals.control_parameters.displacement_norm = "" + u_total.toFixed(2) + "mm";
	gui.updateDisplay();

	deformGeometryBending(globals.geom,globals.linear_scale);

	console.log("end state:")
	console.log(globals.geom);

	hideMessage();
}

function resetNonlinearSolve() {
	resetLattice();
	_.each(globals.geom.nodes, function(node) {
		node.u = [0,0,0];
		node.u_cumulative = [0,0,0];
	});
	console.log(globals.geom);
}