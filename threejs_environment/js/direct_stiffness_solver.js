function DirectStiffnessSolver(nodes, beams, constraints) {
	this.A = new Float32Array((nodes.length - constraints.length)*beams.length);
	this.X = [];
	this.k = [];
	this.K = [];
	this.u = [];
	this.f = [];
