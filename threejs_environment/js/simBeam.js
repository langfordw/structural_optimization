function SimBeam(beam) {
	this.Mel = Array.matrix(6,6,0);
	this.Mel_inv = Array.matrix(6,6,0);
	this.Kel = Array.matrix(6,6,0);
	this.beam = beam;
	this.node1index = beam.nodes[0].index;
	this.node2index = beam.nodes[1].index;
	this.node1fixed = beam.nodes[0].fixed;
	this.node2fixed = beam.nodes[1].fixed;

	this.calcM();
	this.calcK();
	this.calcMinv();
}

SimBeam.prototype.calcM = function() {
	var l = this.beam.len;
	var rho = this.beam.rho;
	var A = this.beam.A;
	var a1 = this.beam.a1;
	var a2 = this.beam.a2;
	var ral = rho*A*l/420;

	var i = 0;
	var j = 0;
	this.Mel[i+0][j+0] = ral*140;
	this.Mel[i+1][j+1] = ral*156;
	this.Mel[i+2][j+1] = ral*22*l;
	this.Mel[i+1][j+2] = ral*22*l;
	this.Mel[i+2][j+2] = ral*4*Math.pow(l,2);

	i = 3;
	j = 3;
	this.Mel[i+0][j+0] = ral*140;
	this.Mel[i+1][j+1] = ral*156;
	this.Mel[i+2][j+1] = -ral*22*l;
	this.Mel[i+1][j+2] = -ral*22*l;
	this.Mel[i+2][j+2] = ral*4*Math.pow(l,2);

	i = 0;
	j = 3;
	this.Mel[i+0][j+0] = ral*70;
	this.Mel[i+1][j+1] = ral*54;
	this.Mel[i+2][j+1] = -ral*13*l;
	this.Mel[i+1][j+2] = ral*13*l;
	this.Mel[i+2][j+2] = -ral*3*Math.pow(l,2);

	i = 3;
	j = 0;
	this.Mel[i+0][j+0] = ral*70;
	this.Mel[i+1][j+1] = ral*54;
	this.Mel[i+2][j+1] = ral*13*l;
	this.Mel[i+1][j+2] = -ral*13*l;
	this.Mel[i+2][j+2] = -ral*3*Math.pow(l,2);
}

SimBeam.prototype.calcK = function() {
	var l = this.beam.len;
	var rho = this.beam.rho;
	var a1 = this.beam.a1;
	var a2 = this.beam.a2;
	var i = 0;
	var j = 0;

	// if (this.node1fixed && this.node2fixed) {
	// 	i = 0;
	// 	j = 0;
	// 	this.Kel[i+0][j+0] = 1;
	// 	this.Kel[i+1][j+1] = 1;
	// 	this.Kel[i+2][j+2] = 1;

	// 	i = 3;
	// 	j = 3;
	// 	this.Kel[i+0][j+0] = 1;
	// 	this.Kel[i+1][j+1] = 1;
	// 	this.Kel[i+2][j+2] = 1;
	// }
	// if (this.node1fixed && !this.node2fixed) {
	// 	i = 0;
	// 	j = 0;
	// 	this.Kel[i+0][j+0] = 1;
	// 	this.Kel[i+1][j+1] = 1;
	// 	this.Kel[i+2][j+2] = 1;

	// 	i = 3;
	// 	j = 3;
	// 	this.Kel[i+0][j+0] = a1;
	// 	this.Kel[i+1][j+1] = 12*a2;
	// 	this.Kel[i+2][j+1] = -6*l*a2;
	// 	this.Kel[i+1][j+2] = -6*l*a2;
	// 	this.Kel[i+2][j+2] = 4*Math.pow(l,2)*a2;
	// }
	// else if (!this.node1fixed && this.node2fixed) {
	// 	i = 3;
	// 	j = 3;
	// 	this.Kel[i+0][j+0] = 1;
	// 	this.Kel[i+1][j+1] = 1;
	// 	this.Kel[i+2][j+2] = 1;

	// 	i = 0;
	// 	j = 0;
	// 	this.Kel[i+0][j+0] = a1;
	// 	this.Kel[i+1][j+1] = 12*a2;
	// 	this.Kel[i+2][j+1] = 6*l*a2;
	// 	this.Kel[i+1][j+2] = 6*l*a2;
	// 	this.Kel[i+2][j+2] = 4*Math.pow(l,2)*a2;
	// } else {
		i = 0;
		j = 0;
		this.Kel[i+0][j+0] = a1;
		this.Kel[i+1][j+1] = 12*a2;
		this.Kel[i+2][j+1] = 6*l*a2;
		this.Kel[i+1][j+2] = 6*l*a2;
		this.Kel[i+2][j+2] = 4*Math.pow(l,2)*a2;

		i = 3;
		j = 3;
		this.Kel[i+0][j+0] = a1;
		this.Kel[i+1][j+1] = 12*a2;
		this.Kel[i+2][j+1] = -6*l*a2;
		this.Kel[i+1][j+2] = -6*l*a2;
		this.Kel[i+2][j+2] = 4*Math.pow(l,2)*a2;

		i = 0;
		j = 3;
		this.Kel[i+0][j+0] = -a1;
		this.Kel[i+1][j+1] = -12*a2;
		this.Kel[i+2][j+1] = -6*l*a2;
		this.Kel[i+1][j+2] = 6*l*a2;
		this.Kel[i+2][j+2] = 2*Math.pow(l,2)*a2;

		i = 3;
		j = 0;
		this.Kel[i+0][j+0] = -a1;
		this.Kel[i+1][j+1] = -12*a2;
		this.Kel[i+2][j+1] = 6*l*a2;
		this.Kel[i+1][j+2] = -6*l*a2;
		this.Kel[i+2][j+2] = 2*Math.pow(l,2)*a2;

		// i = 0;
		// j = 3;
		// this.Kel[i+0][j+0] = -a1;
		// this.Kel[i+1][j+1] = -12*a2;
		// this.Kel[i+2][j+1] = 6*l*a2;
		// this.Kel[i+1][j+2] = -6*l*a2;
		// this.Kel[i+2][j+2] = 2*Math.pow(l,2)*a2;

		// i = 3;
		// j = 0;
		// this.Kel[i+0][j+0] = -a1;
		// this.Kel[i+1][j+1] = -12*a2;
		// this.Kel[i+2][j+1] = -6*l*a2;
		// this.Kel[i+1][j+2] = 6*l*a2;
		// this.Kel[i+2][j+2] = 2*Math.pow(l,2)*a2;
	// }
}

SimBeam.prototype.calcMinv = function() {
	this.Mel_inv = numeric.inv(this.Mel);
}