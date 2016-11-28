function solve_linear_incremental(full_force,eps=1.0,maxiter=2000,debug=false) {
	// first, do a linear solve with the full force and check max displacement
	var magnitude = Math.sqrt(Math.pow(full_force[0],2) + Math.pow(full_force[1],2));
	var full_magnitude = magnitude;
	var unit_v = [full_force[0]/magnitude,full_force[1]/magnitude];

	var force_sum = 0;
	var iter_count = 0;

	var u_total = 0;

	updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);
	setup_solve('frame',globals.geom);
	var u_max = solve('frame',globals.geom);

	setTimeout(displayMessage("test"),1000);

	if (debug) {
		console.log("full force = " + full_magnitude);
		console.log("umax = " + u_max);

		console.log("starting loop...");
	}
	while (force_sum < full_magnitude && iter_count < maxiter) {

		if (u_max > eps) {
			while (u_max > eps && iter_count < maxiter) {
				if (debug) { console.log("refining step") }
				magnitude *= 0.5;

				updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);
				setup_solve('frame',globals.geom);
				u_max = solve('frame',globals.geom);
				iter_count++;
			}
		} else {
			bakeGeometry();
			setup_solve('frame',globals.geom);
			u_max = solve('frame',globals.geom);
			deformGeometryBending(globals.geom,1.0);
			iter_count++;

			force_sum += magnitude;	
			u_total += u_max;

			if (debug) { 
				console.log("found valid step");
				console.log("umax = " + u_max);
				console.log("force_sum = " + force_sum);
				console.log("u_total = " + u_total);
			}
			
		}
		

		// } else {
			
		// 	console.log("magnitude = " + magnitude);
		// 	console.log("force sum = " + force_sum);

		// 	updateExternalForce(unit_v[0]*magnitude,unit_v[1]*magnitude);
		// 	setup_solve('frame',globals.geom);
		// 	var u_max = solve('frame',globals.geom);

		// 	force_sum += magnitude;	
		// }
		// console.log("endloop")
		// console.log("force sum = " + force_sum);

	}

	if (iter_count == maxiter) {
		console.log("Max iterations reached.")
	}

	// total_max_norm += max_u_norm;
	// total_max_disp[0] += max_disp_node.u[0];
	// total_max_disp[1] += max_disp_node.u[1];
	console.log(iter_count);
	globals.control_parameters.n_iter = "" + iter_count;
	globals.control_parameters.displacement_norm = "" + u_total.toFixed(2) + "mm";
	gui.updateDisplay();
	// globals.control_parameters.displacement_norm = '' + total_max_norm.toFixed(2) + 'mm @ node ' + max_disp_node.index;
	// globals.control_parameters.displacement_xyz = "(" + total_max_disp[0].toFixed(2) + ", " + total_max_disp[1].toFixed(2) + ") mm";

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
	

	// if (u_max < eps) {
	// 	// we're all good and done
	// 	this.deformGeometry = true;
	// 	gui.updateDisplay();
	// 	return;
	// }

	// for (var i = 0; i < n_iter; i++) {
	// 	if (globals.geom != null) {
	// 		setup_solve('frame',globals.geom);
	// 		solve('frame',globals.geom);
	// 		this.deformGeometry = true;
	// 		gui.updateDisplay();
	// 	}
	// 	bakeGeometry();
	// }
	// if (globals.geom != null) {
	// 	setup_solve('frame',globals.geom);
	// 	solve('frame',globals.geom);
	// 	this.deformGeometry = true;
	// 	gui.updateDisplay();
	// }