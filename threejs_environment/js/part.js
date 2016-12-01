function Part(beam,type='rigid') {
	this.beams = [];
	this.beams.push(beam);
	this.nodes = [];
	this.type = type;
	this.internal_nodes = [];
	this.edge_nodes = [];

	_.each(this.beams, function(beam) {
		beam.addPart(this);
		this.pushNodes(beam.nodes)
	},this);

	var partMat = new THREE.LineDashedMaterial({color: 0xff0000, linewidth: 2, dashSize: 8, gapSize: 5});
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	var offset = new THREE.Vector3(0,10,0);
	lineGeo.vertices = [this.edge_nodes[0].getPosition().clone().sub(offset), 
						this.edge_nodes[1].getPosition().clone().sub(offset)];
	lineGeo.computeLineDistances();
	this.object3D = new THREE.Line(lineGeo, partMat);
	sceneAdd(this.object3D);
}

Part.prototype.addBeam = function(beam) {
	if (!_.contains(this.beams,beam)) {
		this.beams.push(beam);
		this.pushNodes(beam.nodes);
	}
}

Part.prototype.removeBeamRef = function(beam) {
	var index = this.beams.indexOf(beam);
	this.beams.splice(index,1);
}

Part.prototype.removeNodeRef = function(node) {
	var index = this.nodes.indexOf(node);
	this.nodes.splice(index,1);

	if (node.internal) {
		index = this.internal_nodes.indexOf(node);
		this.internal_nodes.splice(index,1);
		console.log("internal")
	} else {
		index = this.edge_nodes.indexOf(node);
		this.edge_nodes.splice(index,1);
		console.log("external")
	}

	if (this.beams.length == 0 && this.edge_nodes.length == 0) {
		this.destroy();
	}
}

Part.prototype.destroy = function() {
	var index = globals.geom.parts.indexOf(this);
	globals.geom.parts.splice(index,1);
	wrapper.remove(this.object3D);
}

Part.prototype.pushNodes = function(nodes) {
	var nodes = _.difference(nodes, this.nodes);
	_.each(nodes, function(node) {
		this.nodes.push(node);
		if (node.internal) { 
			this.internal_nodes.push(node);
		} else {
			this.edge_nodes.push(node);
		}
	},this);
}

Part.prototype.ripup = function() {
	// this.beams = [];
	// this.internal_nodes = [];
	// this.nodes = [];
	// this.edge_nodes = [];

	_.times(this.beams.length, function() {
		this.beams[0].destroy();
	},this);
	reindex(globals.geom.beams);
	
	// if (this.internal_nodes.length > 0) {
	// 	_.times(this.internal_nodes.length, function() {
	// 		// removeNode(node);
	// 		this.internal_nodes[0].destroy();
	// 	},this);
	// } else {
	// 	// should be a rigid part (should only be one beam) but just in case..
	// 	_.each(this.beams, function(beam) {
	// 		// removeBeam(beam);
	// 		beam.destroy();
	// 	});
	// }
	
}

// Part.prototype.detachBeam = function(beam) {
// 	var index = this.beams.indexOf(beam);
// 	this.beams.splice(index,1);
// }

Part.prototype.ripupBeams = function() {
	console.log('ripup beams')
	_.each(this.beams, function(beam) {
		beam.destroy();
	});
	this.beams = [];
	reindex(globals.geom.beams);
}

Part.prototype.dissociate = function() {
	this.beams = [];
	this.internal_nodes = [];
	this.nodes = [];
	this.edge_nodes = [];
}

// Part.prototype.create = function(type) {
// 	if (type == 'rigid') {
// 		var beam = new Beam([this.edge_nodes[0],this.edge_nodes[1]],0);
// 		globals.geom.beams.push(beam);
// 	}
// }

Part.prototype.make1DOF = function(nodes) {
	var beam = new Beam(nodes,0)
	beam.addPart(this);
	beam.create();

	var node1 = beam.nodes[0];
	var node4 = beam.nodes[1];
	var angle = beam.getAngle(node1.getPosition());

	var x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.375;
	var z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.375;
	var node2 = new Node(new THREE.Vector3(x, 0, z),0);
	node2.internal = true;
	globals.geom.nodes.push(node2)

	x = node1.getPosition().x - Math.cos(angle)*beam.len0*0.625;
	z = node1.getPosition().z - Math.sin(angle)*beam.len0*0.625;
	var node3 = new Node(new THREE.Vector3(x, 0, z),0);
	node2.internal = true;
	globals.geom.nodes.push(node3)

	beam.destroy();

	var beam = new Beam([node1,node2],0,undefined,'rigid');
	beam.part = this;
	globals.geom.beams.push(beam);
	this.beams.push(beam);

	var beam = new Beam([node2,node3],0,[10000000,50000],'flex');
	beam.part = this;
	globals.geom.beams.push(beam);
	this.beams.push(beam);

	var beam = new Beam([node3,node4],0,undefined,'rigid');
	beam.part = this;
	globals.geom.beams.push(beam);
	this.beams.push(beam);

	reindex(globals.geom.beams);
	reindex(globals.geom.nodes);
	console.log(globals.geom)
}

Part.prototype.changeType = function(toType) {
	if (this.type != toType) {
		this.ripupBeams();
		if (toType == 'rigid') {
			console.log("change to rigid")
			var beam = new Beam(this.edge_nodes,0)
			beam.addPart(this);
			beam.create();
			this.type = toType;
		} else if (toType == '1DoF') {
			console.log("change to 1DoF")
			this.make1DOF(this.edge_nodes);
			this.type = toType;
		} else if (toType == 'none') {
			console.log("change to none")
			this.type = toType;
		}
	} else {
		// do nothing
	}
}
