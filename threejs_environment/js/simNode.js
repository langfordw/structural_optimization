function SimNode(node) {
	this.node = node;	
	this.index = node.index;
	this.fixed = node.fixed;
	if (node.externalForce != null) {
		this.externalForce = [node.externalForce.x, node.externalForce.z, 0];
	} else {
		this.externalForce = [0,0,0];
	}
}