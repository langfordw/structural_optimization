$('#scale').on('input', function() { 
     // get the current value of the input field.
     globals.linear_scale = $(this).val();
     deformGeometryBending(displacements,globals.linear_scale,globals.angular_scale);
     // updatePoints();
     // console.log(globals.nwide);
});

$('#angular_scale').on('input', function() { 
     // get the current value of the input field.
     globals.angular_scale = $(this).val();
     deformGeometryBending(displacements,globals.linear_scale,globals.angular_scale);
     // updatePoints();
     // console.log(globals.nwide);
});

var isDragging = false;
var isDraggingArrow = false;

var $toolTip = $('#toolTip');
var $toolTip2 = $('#toolTip2');
var $toolTip3 = $('#toolTip3');

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = 8;
var mouse = new THREE.Vector2();

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
	    var highlightedObj = null;

	    if (intersections.length > 0) {							// to do: set priority to nodes first
	        _.each(intersections, function (thing) {
	            // if (thing.object && thing.object._myNode) {
	            // 	thing.object._myNode.highlight();
	            // 	highlightedObj = thing.object._myNode;
	            // }
	            if (thing.object && thing.object._myBeam) {
	            	thing.object._myBeam.highlight();
	            	highlightedObj = thing.object._myBeam;
	            }
	        });
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
	    		text = "node " + highlightedObj.index
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

	    		var forces = forces2text(highlightedObj.f);
	    		
	    		if (!highlightedObj.nodes[0].fixed && !highlightedObj.nodes[1].fixed) {
		    		text1 += forces[0] + "<br>"
		    		text1 += forces[1] + "<br>"
		    		text1 += forces[2] + "<br>"
		    		text2 += forces[3] + "<br>"
		    		text2 += forces[4] + "<br>"
		    		text2 += forces[5] + "<br>"
	    		} else if (!highlightedObj.nodes[0].fixed) {
	    			text1 += forces[0] + "<br>"
		    		text1 += forces[1] + "<br>"
		    		text1 += forces[2] + "<br>"
		    		text2 += " --- <br>"
		    		text2 += " --- <br>"
		    		text2 += " --- <br>"
	    		} else if (!highlightedObj.nodes[1].fixed) {
	    			text1 += " --- <br>"
		    		text1 += " --- <br>"
		    		text1 += " --- <br>"
		    		text2 += forces[0] + "<br>"
		    		text2 += forces[1] + "<br>"
		    		text2 += forces[2] + "<br>"
	    		}

	    		text1 += "</p>"
	    		text2 += "</p>"
	    	}

	    	$toolTip.html(text1);
	        $toolTip.css({top:pos0[1]+offset[1], left: pos0[0]+offset[0]});
			$toolTip.show();

			$toolTip2.html(text2);
	        $toolTip2.css({top:pos1[1]+offset[1], left: pos1[0]+offset[0]});
			$toolTip2.show();

			$toolTip3.html(text3);
	        $toolTip3.css({top:pos2[1]+offset2[1], left: pos2[0]+offset2[0]});
			$toolTip3.show();
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
    //     if (highlightedObj) {
    //         if (highlightedObj.getMagnitude) {
    //             //force
    //             var val = "Applied Force: " + highlightedObj.getMagnitude().toFixed(2) + " N";
    //             $moreInfo.html(val);
    //             $moreInfo.css({top: e.clientY - 40, left: e.clientX});
    //             $moreInfo.show();
    //             if (isDragging) {
    //                 isDraggingArrow = true;
    //                 dragArrow(e);
    //             }
    //         } else {
    //             if (_viewMode == "none") {

    //             } else {
    //                 var val = "";
    //                 if (_viewMode == "length") {
    //                     val = "Length: " + highlightedObj.getLength().toFixed(2) + " m";
    //                 } else if (_viewMode == "force") {
    //                     val = "Force: " + highlightedObj.getForceMagnitude().toFixed(2) + " N";
    //                 } else if (_viewMode == "tension-compression") {
    //                     var force = highlightedObj.getForceMagnitude();
    //                     if (highlightedObj.isInCompression()) val = "Compression: " + Math.abs(force).toFixed(2) + " N";
    //                     else val = "Tension: " + Math.abs(force).toFixed(2) + " N";
    //                 } else if (_viewMode == "FL"){
    //                     val = "F x L: " + (highlightedObj.getForceMagnitude()*highlightedObj.getLength()).toFixed(2) + " Nm";
    //                 }
    //                 $moreInfo.html(val);
    //                 $moreInfo.css({top: e.clientY - 40, left: e.clientX});
    //                 $moreInfo.show();
    //             }
    //         }
    //     } else {
    //         _.each(displayBeams, function (beam) {
    //             beam.unhighlight();//todo wrong place?
    //         });
    //         _.each(forces, function(force){
    //             force.unhighlight();
    //         });
    //         $moreInfo.hide();
    //     }
    // }
    // render();

