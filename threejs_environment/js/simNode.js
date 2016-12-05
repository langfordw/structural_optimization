function SimNode(node) {
	this.node = node;	
	this.index = node.index;
	this.fixed = node.fixed;
	this.externalForce = [node.externalForce.x, node.externalForce.z, 0];
}