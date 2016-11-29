function Part(beams,type='rigid') {
	this.beams = [];
	this.beams.push(beams);
	this.nodes = [];
	this.type = 'rigid';

	_.each(this.beams, function(beam) {
		beam.addPart(this);
		this.nodes.push(beam.nodes[0]);
		this.nodes.push(beam.nodes[1]);
	},this);
}