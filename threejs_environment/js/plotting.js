// var width = 250,
//     barHeight = 20,
//     height = 250,
//     rad = 100;

var svg;

function radialPlot(data) {
  var width = document.getElementById("plot").clientWidth;
  var height = document.getElementById("plot").clientHeight;
  if (width < 400) {
    width = 400;
  }
  if (height < 400) {
    height = 400;
  }
  var radius = _.min([width,height])/3.25;

  var r = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return d[1] })*1.5])
      .range([0, radius]);

  var line = d3.radialLine()
      .radius(function(d) { return r(d[1]); })
      .angle(function(d) { return -d[0] + Math.PI / 2; }) 
      (data);

  svg = d3.select(".radial")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var gr = svg.append("g")
      .attr("class", "r axis")
    .selectAll("g")
      .data(r.ticks(5).slice(1))
    .enter().append("g");

  gr.append("circle")
      .attr("r", r)
      // .attr("fill","white");

  gr.append("text")
      .attr("y", function(d) { return -r(d) - 4; })
      .attr("transform", "rotate(15)")
      .style("text-anchor", "middle")
      .text(function(d) { return d.toFixed(2); });

  var ga = svg.append("g")
      .attr("class", "a axis")
    .selectAll("g")
      .data(d3.range(0, 360, 30))
    .enter().append("g")
      .attr("transform", function(d) { return "rotate(" + -d + ")"; });

  ga.append("line")
      .attr("x2", radius)
      // .attr("fill","black");

  ga.append("text")
      .attr("x", radius + 6)
      .attr("dy", ".35em")
      .style("text-anchor", function(d) { return d < 270 && d > 90 ? "end" : null; })
      .attr("transform", function(d) { return d < 270 && d > 90 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
      .text(function(d) { return d + "°"; });

  svg.append("text")
      .attr("x", -width/2)
      .attr("y", height/2.7)
      .text("Kmax = " + globals.kmax.toFixed(2) + " N/mm");

  svg.append("text")
      .attr("x", -width/2)
      .attr("y", height/2.7+20)
      .text("Kmin = " + globals.kmin.toFixed(2) + " N/mm");

  svg.append("text")
      .attr("x", -width/2)
      .attr("y", height/2.7+40)
      .text("Kmax/Kmin = " + (globals.kmax/globals.kmin).toFixed(2));

  svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke","black");
}

function clearSVG() {
  if (svg != undefined) svg.selectAll("*").remove();
}

function redrawPlot() {
  clearSVG();
  radialPlot(globals.radial_deflections);
}

var resizeElement = document.getElementById('plot'),
      resizeCallback = function() {
          redrawPlot();
      };

addResizeListener(resizeElement, resizeCallback);

function plotForcesHisto(data) {
  var formatCount = d3.format(",.0f");

  var x = d3.scaleLinear()
    .rangeRound([0, width]);

  var chart = d3.select(".chart")
      .attr("width", width);

  // var bins = d3.histogram(data)
    // .domain(x.domain([0,500]))
    // .thresholds(x.ticks(10))
    // // .thresholds([25,50,75,100,125,150,300,400])
    // (data);
  // console.log(d3.max(data))
  var bins = d3.histogram()(data);
    // .thresholds(x.ticks(10))
    // .domain(x.domain([0,d3.max(data)]))
    

  // console.log(bins)

  var y = d3.scaleLinear()
    .domain([0, d3.max(bins, function(d) { return d.length; })])
    .range([height, 0]);
  
  x.domain([0, d3.max(bins).x1+(d3.max(bins).x1-d3.max(bins).x0)]);

  // console.log(d3.max(bins))

  // console.log(data)

  // chart.attr("height", barHeight * data.length);

  var bar = chart.selectAll("g")
      .data(bins)
    .enter().append("g")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + y(d.length) + ")"; });

  bar.append("rect")
      .attr("width", bins[0].x1 - bins[0].x0)
      // .attr("width", function(d,i) {
      //   console.log(x(bins[i].x1))
      //   x(bins[i].x1) - x(bins[i].x0) - 1 })
      // .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
      .attr("height", function(d) { return height - y(d.length); })
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
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", (bins[0].x1 - bins[0].x0) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatCount(d.length); });
}

function plotForces(data) {
  console.log('hi')
  var x = d3.scaleLinear()
    .range([0, width]);

  var chart = d3.select(".chart")
      .attr("width", width);
  
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
      .text(function(d) { return d.toFixed(2); })
}


function type(d) {
  d.value = +d.value; // coerce to number
  return d;
}