function setEl(matrix, index, value){
	// return matrix.subset(math.index(index[0],index[1]),value);
	return matrix.set(index,value);
}

function setEl1(matrix, index, value){
	// return matrix.subset(math.index(index[0],index[1]),value);
	return matrix.set([index],value);
}

function getEl(matrix, index){
	// return matrix.subset(math.index(index[0],index[1]));
	return matrix.get(index);
}

function getEl1(matrix, index){
	// return matrix.subset(math.index(index));
	return matrix.get(index);
}

function addEl(matrix, index, value){
	// return matrix.subset(math.index(index[0],index[1]),matrix.subset(math.index(index[0],index[1]))+value);
	return matrix.set(index,matrix.get(index)+value);
}

function add3x3El(matrix, index, values){
	for (var i=0; i < 3; i++) {
		for (var j=0; j < 3; j++) {
			var val = getEl(values,[i,j]);
			addEl(matrix, [index[0]+i, index[1]+j], val);
		}
	}

	return matrix;
}

function get3x3subset(matrix, index, output){
	for (var i=0; i < 3; i++) {
		for (var j=0; j < 3; j++) {
			setEl(output, [i, j], getEl(matrix,[index[0]+i,index[1]+j]));
		}
	}

	return output;
}

Array.matrix = function(numrows, numcols, initial=0){
   var arr = [];
   for (var i = 0; i < numrows; ++i){
      var columns = [];
      for (var j = 0; j < numcols; ++j){
         columns[j] = initial;
      }
      arr[i] = columns;
    }
    return arr;
}

Array.vector = function(numrows, initial=0){
   var arr = [];
   for (var i = 0; i < numrows; ++i){
      arr[i] = initial;
    }
    return arr;
}
