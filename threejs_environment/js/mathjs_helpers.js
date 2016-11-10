function setEl(matrix, index, value){
	return matrix.subset(math.index(index[0],index[1]),value);
}

function getEl(matrix, index){
	return matrix.subset(math.index(index[0],index[1]));
}

function addEl(matrix, index, value){
	return matrix.subset(math.index(index[0],index[1]),matrix.subset(math.index(index[0],index[1]))+value);
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



