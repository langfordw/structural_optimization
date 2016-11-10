function Spring(node, beam1, beam2) {
	this.node = node;
	this.beams = [];
	this.beams.push(beam1);
	this.fixed = node.fixed;
	this.k = 1;

	if (!this.fixed) {
		this.beams.push(beam2);
	}

	if (this.fixed) {
		this.init_angle = this.beams[0].getAngle(this.node.getPosition());
	} else {
		this.init_angle = this.beams[0].getAngle(this.node.getPosition())-this.beams[1].getAngle(this.node.getPosition());
	}

	this.angle = this.init_angle;
	this.dAngle = this.angle-this.init_angle;
}

Spring.prototype.getdAngle = function() {
	if (this.fixed) {
		this.angle = this.beams[0].getAngle(this.node.getPosition());
	} else {
		this.angle = this.beams[0].getAngle(this.node.getPosition())-this.beams[1].getAngle(this.node.getPosition());
	}
	this.dAngle = this.angle-this.init_angle;
	return this.dAngle;
}

Spring.prototype.getPE = function() {
	return this.k*Math.pow(this.getdAngle(),2);
}