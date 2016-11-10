$('#scale').on('input', function() { 
     // get the current value of the input field.
     var scale = $(this).val();
     deformGeometryBending(displacements,scale);
     // updatePoints();
     // console.log(globals.nwide);
});

$('#ntall').on('input', function() { 
     // get the current value of the input field.
     globals.ntall = $(this).val();
     refreshPoints();
     // updatePoints();
     // console.log(globals.nwide);
});