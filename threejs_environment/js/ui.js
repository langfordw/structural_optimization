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