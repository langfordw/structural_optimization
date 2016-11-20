var width = 420,
    barHeight = 20;

var x = d3.scaleLinear()
    .range([0, width]);

var chart = d3.select(".chart")
    .attr("width", width);

// data = [{name:"locke",value:4},
//         {name:"pop",value:4},
//         {name:"drop",value:6},
//         {name:"it",value:7},
//         {name:"locke",value:10}]

data = [1,2,5,10,9,20];

// x.domain([0, d3.max(data, function(d) { return d.value; })]);
x.domain([0, d3.max(data)]);

console.log(data)

chart.attr("height", barHeight * data.length);

var bar = chart.selectAll("g")
    .data(data)
  .enter().append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });

bar.append("rect")
    .attr("width", function(d) {
      console.log(x(d));
      return x(d); 
    })
    .attr("height", barHeight - 1)
    .attr("fill","steelblue")
    .attr("id", function(d,i) {
      return i;
    })
    .on("mouseover", function() {
      d3.select(this)
        .attr("fill","brown");
    })
    .on("mouseout", function(d,i) {
      d3.select(this).attr("fill","steelblue");
    });

bar.append("text")
    .attr("x", function(d) { return x(d) - 3; })
    .attr("y", barHeight / 2)
    .attr("dy", ".35em")
    .text(function(d) { return d; })

// d3.tsv("../data.tsv", type, function(error, data) {
//   x.domain([0, d3.max(data, function(d) { return d.value; })]);

//   console.log(data)

//   chart.attr("height", barHeight * data.length);

//   var bar = chart.selectAll("g")
//       .data(data)
//     .enter().append("g")
//       .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });

//   bar.append("rect")
//       .attr("width", function(d) { 
//         console.log(x(d.value))
//         return x(d.value); 
//       })
//       .attr("height", barHeight - 1);

//   bar.append("text")
//       .attr("x", function(d) { return x(d.value) - 3; })
//       .attr("y", barHeight / 2)
//       .attr("dy", ".35em")
//       .text(function(d) { return d.value; });
// });

function type(d) {
  d.value = +d.value; // coerce to number
  return d;
}