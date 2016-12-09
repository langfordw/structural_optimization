function Tracer() {
	this.nodes = [];
	this.traces = [];
	this.traceWrapper = new THREE.Object3D();
	sceneAdd(this.traceWrapper);
	this.visible = false;
	this.drawn = false;
}

Tracer.prototype.traceNode = function(node) {
	console.log("tracer added to node " +node.index)
	this.nodes.push(node);
	node.highlight();
	this.traces.push([]);
}

Tracer.prototype.removeNode = function(node) {
	var index = this.nodes.indexOf(node);
	this.nodes.splice(index,1);
}

Tracer.prototype.update = function() {
	var offset = new THREE.Vector3(0,20,0);
	for (var i=0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		this.traces[i].push(node.getPosition().clone().add(offset));
	}
}

Tracer.prototype.drawTraces = function() {
	// if (!this.drawn) {
		var beamMat = new THREE.LineBasicMaterial({color: 'yellow', linewidth: 5});
		
		for (var i=0; i < this.nodes.length; i++) {
			var lineGeo = new THREE.Geometry();
			lineGeo.dynamic = true;
			lineGeo.vertices = this.traces[i];
			var object3D = new THREE.Line(lineGeo, beamMat);
			this.traceWrapper.add(object3D);
		}

		this.drawn = true;
		this.traceWrapper.visible = true;
	// } else {
	// 	this.traceWrapper.visible = true;
	// }
	this.visible = true;
}

Tracer.prototype.hideTraces = function() {
	if (this.visible) {
		this.traceWrapper.visible = false;
		this.visible = false;
	}
}

Tracer.prototype.clearTraces = function() {
	this.traceWrapper.children = [];
	for (var i = 0; i < this.nodes.length; i++) {
		this.traces[i] = [];
	}
	this.visible = false;
	this.drawn = false;
}

Tracer.prototype.reset = function() {
	this.nodes = [];
	this.traces = [];
	this.visible = false;
	this.drawn = false;
	this.traceWrapper = new THREE.Object3D();
	sceneAdd(this.traceWrapper);
}