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

// var $toolTip = document.getElementById("toolTip");
var $toolTip = $('#toolTip')
var raycaster = new THREE.Raycaster();
raycaster.linePrecision = 8;
var mouse = new THREE.Vector2();

window.addEventListener( 'mousemove', mouseMove, false );

function mouseMove(e){
    e.preventDefault();
    // mouse.x = ( e.clientX / renderer.domElement.width ) * 2 - 1;
    // mouse.y = - ( e.clientY / renderer.domElement.height ) * 2 + 1;
    mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // mouse_text = ("x: " + mouse.x + "  y: " + mouse.y);
    // console.log("x: " + mouse.x + "  y: " + mouse.y);

    var intersections = raycaster.intersectObjects(wrapper.children.concat(beamWrapper.children));
    var highlightedObj = null;

    if (intersections.length > 0) {
        _.each(intersections, function (thing) {
            if (thing.object && thing.object._myNode) {
            	thing.object._myNode.highlight();
            	highlightedObj = thing.object._myNode;
            } else if (thing.object && thing.object._myBeam) {
            	thing.object._myBeam.highlight();
            	highlightedObj = thing.object._myBeam;
            }
        });
        //         thing.object._myBeam.highlight();
        //         highlightedObj = thing.object._myBeam;
        //     } else if (thing.object && thing.object._myForce) {
        //         thing.object._myForce.highlight();
        //         highlightedObj = thing.object._myForce;
        //     }
        // });
    }

    if (highlightedObj) {
    	var text = null
    	if (highlightedObj.beams) {
    		text = "node " + highlightedObj.index
    	} else if (highlightedObj.nodes) {
    		text = "beam " + highlightedObj.index
    	}
    	$toolTip.html(text);
        $toolTip.css({top: e.clientY - 40, left: e.clientX});
		$toolTip.show();
    } else {
	    _.each(beamWrapper.children, function (beam) {
	        beam._myBeam.unhighlight();//todo wrong place?
	    });
	    _.each(wrapper.children, function (node) {
	    	if (node._myNode) {
	    		node._myNode.unhighlight();//todo wrong place?
	    	}
	    });
	    $toolTip.hide();
	}
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

