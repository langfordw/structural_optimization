
$('#scale').on('input', function() { 
     // get the current value of the input field.
     globals.linear_scale = $(this).val();
     if (globals.view_mode.deformed) {
     	deformGeometryBending(globals.geom,displacements,globals.linear_scale,globals.angular_scale);
     }
});

$('#angular_scale').on('input', function() { 
     // get the current value of the input field.
     globals.angular_scale = $(this).val();
     if (globals.view_mode.deformed) {
     	deformGeometryBending(globals.geom,displacements,globals.linear_scale,globals.angular_scale);
     }
});

$('#deform_cbox').change('input', function() { 
     // get the current value of the input field.
     if(this.checked) {
     	globals.view_mode.deformed = true;
     	deformGeometryBending(globals.geom,displacements,globals.linear_scale,globals.angular_scale);
     } else {
     	globals.view_mode.deformed = false;
     	undeformGeometryBending(globals.geom);
     }
});

$('#solve_btn').click(function() { 
     solve('frame',globals.geom);
});

var isDragging = false;
var isDraggingArrow = false;

var $toolTip = $('#toolTip');
var $toolTip2 = $('#toolTip2');
var $toolTip3 = $('#toolTip3');

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = 8;
var mouse = new THREE.Vector2();

var highlightedObj = null;

window.addEventListener('dblclick',function() {
	if (highlightedObj != null && highlightedObj.beams) {
		var node = highlightedObj
		if (!node.fixed) {
			node.setFixed(true,{x:1,z:1,c:1});
			globals.geom.constraints.push(node);
		} else {
			node.setFixed(false);
			var index = globals.geom.constraints.indexOf(node);
			globals.geom.constraints.splice(index,1);
		}
		// console.log(geom)
		// console.log('fix node ' + highlightedObj.index);
	}
}, false);

window.addEventListener('mousedown', function(){
        isDragging = true;
        window.removeEventListener( 'mousemove', mouseMove );
    }, false);
window.addEventListener('mouseup', function(){
        isDragging = false;
        window.addEventListener( 'mousemove', mouseMove, false );
}, false);

window.addEventListener( 'mousemove', mouseMove, false );

function mouseMove(e){
    e.preventDefault();
    // mouse.x = ( e.clientX / renderer.domElement.width ) * 2 - 1;
    // mouse.y = - ( e.clientY / renderer.domElement.height ) * 2 + 1;
    mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // mouse_text = ("x: " + mouse.x + "  y: " + mouse.y);
    // console.log("x: " + e.clientX + "  y: " + e.clientY);
    // console.log("x: " + mouse.x + "  y: " + mouse.y);

    if (isDragging) {

    } else {
    	var intersections = raycaster.intersectObjects(wrapper.children.concat(beamWrapper.children));
	    highlightedObj = null;

	    if (intersections.length > 0) {							// to do: set priority to nodes first
	        var node_selected = false;
	        _.each(intersections, function (thing) {
	        	if (thing.object && thing.object._myNode) {
	        		node_selected = true;
	        		thing.object._myNode.highlight();
	        		highlightedObj = thing.object._myNode;
	        	}
	        });
	        if (!node_selected) {
	        	_.each(intersections, function (thing) {
		        	if (thing.object && thing.object._myBeam) {
		            	thing.object._myBeam.highlight();
		            	highlightedObj = thing.object._myBeam;
		            }
		        });
	        }
	    }

	    if (highlightedObj) {
	    	var text = null;
	    	var text2 = null;
	    	var text3 = null;
	    	var pos0 = [0, 0];
	    	var pos1 = [0, 0];
	    	var pos2 = [0, 0];
	    	var offset = [0, 0];
	    	var offset2 = [0, 0];

	    	if (highlightedObj.beams) {
	    		// text = "node " + highlightedObj.index
	    		var tmp = highlightedObj.getPosition().clone().project( camera )
	    		pos0 = [(tmp.x+1)/2*window.innerWidth, 
	    			   (-tmp.y+1)/2*window.innerHeight];
	    		text1 = "<p><b>node " + highlightedObj.index + "</b><br>";
	    		$toolTip.html(text1);
		        $toolTip.css({top:pos0[1]-40, left: pos0[0]});
				$toolTip.show();
	    	} else if (highlightedObj.nodes) {
	    		// it's a beam
	    		highlightedObj.nodes[0].highlight();
	    		highlightedObj.nodes[1].highlight();
	    		var angle = highlightedObj.getAngle(highlightedObj.vertices[0]);

	    		var tmp = highlightedObj.nodes[0].getPosition().clone().project( camera )
	    		pos0 = [(tmp.x+1)/2*window.innerWidth, 
	    			   (-tmp.y+1)/2*window.innerHeight];
	    		var tmp = highlightedObj.nodes[1].getPosition().clone().project( camera )
	    		pos1 = [(tmp.x+1)/2*window.innerWidth, 
	    			   (-tmp.y+1)/2*window.innerHeight];

	    	    pos2 = [(pos0[0]+pos1[0])/2, (pos0[1]+pos1[1])/2.]

	    		offset = [-60*Math.sin(angle),60*Math.cos(angle)];
	    		offset2 = [40*Math.sin(angle),-40*Math.cos(angle)];

	    		text1 = "<p><b>node " + highlightedObj.nodes[0].index + "</b><br>";
	    		text2 = "<p><b>node " + highlightedObj.nodes[1].index + "</b><br>";
	    		text3 = "<p><b>beam " + highlightedObj.index + "</b><br>";

	    		if (highlightedObj.f_local != null) {
	    			var forces = forces2text(highlightedObj.f_local);

	    			text1 += forces[0] + "<br>"
		    		text1 += forces[1] + "<br>"
		    		text1 += forces[2] + "<br>"
		    		text2 += forces[3] + "<br>"
		    		text2 += forces[4] + "<br>"
		    		text2 += forces[5] + "<br>"
	    		
		    		// if (!highlightedObj.nodes[0].fixed && !highlightedObj.nodes[1].fixed) {
			    	// 	text1 += forces[0] + "<br>"
			    	// 	text1 += forces[1] + "<br>"
			    	// 	text1 += forces[2] + "<br>"
			    	// 	text2 += forces[3] + "<br>"
			    	// 	text2 += forces[4] + "<br>"
			    	// 	text2 += forces[5] + "<br>"
		    		// } else if (!highlightedObj.nodes[0].fixed) {
		    		// 	text1 += forces[0] + "<br>"
			    	// 	text1 += forces[1] + "<br>"
			    	// 	text1 += forces[2] + "<br>"
			    	// 	text2 += " --- <br>"
			    	// 	text2 += " --- <br>"
			    	// 	text2 += " --- <br>"
		    		// } else if (!highlightedObj.nodes[1].fixed) {
		    		// 	text1 += " --- <br>"
			    	// 	text1 += " --- <br>"
			    	// 	text1 += " --- <br>"
			    	// 	text2 += forces[0] + "<br>"
			    	// 	text2 += forces[1] + "<br>"
			    	// 	text2 += forces[2] + "<br>"
		    		// }

	    		}
	    		

	    		text1 += "</p>"
	    		text2 += "</p>"

	    		$toolTip.html(text1);
		        $toolTip.css({top:pos0[1]+offset[1], left: pos0[0]+offset[0]});
				$toolTip.show();

				$toolTip2.html(text2);
		        $toolTip2.css({top:pos1[1]+offset[1], left: pos1[0]+offset[0]});
				$toolTip2.show();

				$toolTip3.html(text3);
		        $toolTip3.css({top:pos2[1]+offset2[1], left: pos2[0]+offset2[0]});
				$toolTip3.show();
	    	}

	    	
	    } else {
		    _.each(beamWrapper.children, function (beam) {
		        beam._myBeam.unhighlight();
		    });
		    _.each(wrapper.children, function (node) {
		    	if (node._myNode) {
		    		node._myNode.unhighlight();
		    	}
		    });
		    $toolTip.hide();
		    $toolTip2.hide();
		    $toolTip3.hide();

		    highlightedObj = null;
		}
    }
    
}

function forces2text(fmatrix) {
	output = []
	fmatrix.forEach(function (value, index, matrix) {
  		output.push(value.toFixed(2));
	});

	return output;
}