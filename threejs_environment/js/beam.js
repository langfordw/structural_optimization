function Beam(nodes, index) {
	this.index = index;
	nodes[0].addBeam(this);
	nodes[1].addBeam(this);
	this.vertices = [nodes[0].getPosition(), nodes[1].getPosition()];
	this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
	this.len0 = this.len;
	this.k = 10;
	this.force = 0;

	// BEAMS AS LINES
	var beamMat = new THREE.LineBasicMaterial({color: 0xCCC91E, linewidth: 10});
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = this.vertices;
	this.object3D = new THREE.Line(lineGeo, beamMat);

	// BEAMS AS CYLINDERS
	// this.object3D = drawCylinder(this.vertices[0],this.vertices[1])

	// BEAMS AS PLATES
	// this.object3D = drawPlate(this.vertices[0],this.vertices[1]);
	
	sceneAdd(this.object3D);
}

Beam.prototype.updatePosition = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.len = Math.sqrt(Math.pow(this.vertices[1].x-this.vertices[0].x,2) + Math.pow(this.vertices[1].z-this.vertices[0].z,2));
    // this.object3D.geometry.normalsNeedUpdate = true;
    // this.object3D.geometry.computeFaceNormals();
    // this.object3D.geometry.computeVertexNormals();
    // this.object3D.geometry.computeBoundingSphere(); // this is very expensive (roughly doubles the compute time for an update)
};

Beam.prototype.getAngle = function(fromNode) {
	var node2 = this.vertices[0];
    if (node2.equals(fromNode)) node2 = this.vertices[1];
	// return Math.atan2(node2.z-fromNode.z, node2.x-fromNode.x);
	return Math.atan2(fromNode.z-node2.z, fromNode.x-node2.x);
};

Beam.prototype.getPE = function() {
	return (this.k * Math.pow(this.len-this.len0,2));
};

Beam.prototype.getIndex = function() {
	return this.index;
};

Beam.prototype.setForce = function(forceMag) {
	this.force = forceMag;
}

Beam.prototype.setColor = function() {
	if (this.force > 0) {
		this.object3D.material.color.setHex(0x0000ff);
	}
	if (this.force < 0) {
		this.object3D.material.color.setHex(0xff0000);
	}
}

Beam.prototype.setHSLColor = function(val, max, min){
    if (val === null){
        this.object3D.material.color.setHex(0x000000);
        return;
    }
    var scaledVal = (val - min)/(max - min) * 0.7;
    var color = new THREE.Color();
    color.setHSL(scaledVal, 1, 0.5);
    this.object3D.material.color.set(color);
};

Beam.prototype.setTensionCompressionColor = function(val, max){
    var scaledVal = Math.pow(val/max, 1/2) + 0.25;
    if (val < 0){
        this.object3D.material.color.setRGB(scaledVal, 0, 0);
    } else {
        this.object3D.material.color.setRGB(0, 0, scaledVal);
    }
};