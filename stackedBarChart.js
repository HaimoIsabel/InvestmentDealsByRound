  const size = {};
  var barHeight, barWidth;

  const svg = d3.select("#chart");
  const container = d3.select("#chartContainer");
  const win = d3.select(window);

  const yScale = d3.scaleLinear();
  const xScale = d3.scaleBand().padding(0.2);

  const yAxis = d3.axisLeft(yScale);
  const yAxisRight = d3.axisLeft(yScale);
  const xAxis = d3.axisBottom(xScale);

  const barColor = d3.scaleOrdinal()
                      .range(["#019ad6", "#90d7eb", "#b3ec44", "#32df8c",  "#f05b71", "#fab3af", "#ae4f39", "#ff781d", "#ffbe78", "#ce74b8", "#8552a1"])



  const info = d3.select("#info");

  var margin = {
      top: 50,
      left: 50,
      right: 30,
      bottom: 30
  };

  const g = svg.append("g")
                .attr("class", "axis")
                .attr('transform','translate('+ margin.left + ',' + margin.top + ')');

  g.append("g")
    .attr("class", "axis yaxis");

  g.append("g")
    .attr("class", "axis yaxis-right");
  g.append("g")
    .attr("class", "axis xaxis");

  var topic = svg.append("text")
              .attr("class", "sub_topicBar")
              .attr("text-anchor","middle")
              .attr('fill',"black");

  svg.append("g")
      .attr("class", "hovered")
      .attr('transform','translate('+ margin.left + ',' + margin.top + ')');

const colorControler = d3.select(".color-controler").append("ul");
const markerSize = parseFloat(colorControler.style("font-size").slice(0,-2));

function drawStackedBarChart () {
  data=visData;

  console.log(data)
  // processing data
  const types = data.columns.concat()
  // console.log(types)
  types.splice(0,2);

  for (let x of data){

    const values = [];

    for (let z of types){
      values.push({name: x.year, type: z, value: parseInt(x[z])});
    }
      x.sum = d3.sum(values.map(d => d.value));
      x.total=1
      // values.map(function(d){
      //   console.log(d)
      //   d.percentage = d.value/d.sum
      // })
    for (let z of values){
      z.sum = x.sum;
      z.percentage = z.value/z.sum;
      z.total = 1;
      // console.log(z)
    }
    x.values = values;
    // console.log(x)
    calcLeft(x);
    calcLeftPercentage(x)
  }

  // set attribute of barColor 
  barColor.domain(types);

  let yDomain = true;

  yScale.domain([d3.max(data, d => d.total),0]).nice();
  xScale.domain(data.map(d => d.year));

  const mean = d3.mean(data, d => d.total);
  const far = d3.max(data, d => Math.abs(d.total - mean));
  // sumColor.domain([mean-far, mean, mean+far]);

  let infoMargin;

  g.selectAll(".rows").remove();

  const rows = g.selectAll(".rows")
                  .data(data)
                  .enter()
                  .append("g")
                  .attr("class", "rows");

  rows.append("g")
        .attr("class", "base")
        .append("rect")
        .attr("class", "base-bar")
        .attr("y", 0)
        .attr("fill", "none");

  rows.selectAll(".base")
      .append("text")
      // .attr("fill", d => sumColor(d.sum))
      .attr("text-anchor", "middle")
      // .attr("dominant-baseline", "middle")
      .attr("dx", "0em")
      .attr("dy", 1)
      .text(d => d3.format(".0f")(d.sum));

  rows.append("g")
      .attr("class", "overlays")
        .append("g")
        .attr("class", "parts")
        .selectAll(".part-bars")
        .data(d => d.values)
        .enter()
        .append("g")
        .attr("class", "part-bars")
        .append("rect")
        .attr("y", 0)
        .attr("x", function(v) { return xScale(v.name)})
        .attr("height", 0 )
        .attr("width", 0)
        .attr("class", (v, i) => "parts-" + i)
        .attr("fill", v => barColor(v.type))

  rows.selectAll(".part-bars")
      .append("text")
      .attr("class", "part-values")
      .attr("fill", "white")
      .attr("dominant-baseline", "ideographic")
      .attr("dx", ".3em")
      .attr("dy", -2)
      .text(v => formatAsPercentage(v.percentage))
      .attr("font-size", "12px");

  rows.selectAll(".part-bars")
      .on("click", function(v){
        const primer = v.type === types[0];
        sortParts(v.type);
        info.style("display", "none");
        svg.select(".hovered").selectAll(".hover_rect")
            .transition().duration(primer ? 0 : 500)
            .attr("y", function(v) { return Math.max(barHeight-yScale(v.leftPercentage),0 )})
            .transition().delay(primer ? 0 : 250).duration(500)
            .attr("x", function(v) { return xScale(v.name)})
            .transition().delay(500).duration(1000)
            .remove();
      })
      .on("mouseover", function(v){
        info.style("display", "inline");
        const description = v.type + "，" + v.value;
        createInfo(info, v.year, description, d3.format(".1%")(v.percentage));

        svg.select(".hovered")
            .append("rect")
            .attr("class","hover_rect")
            .datum(v)
            .attr("fill", "none")
            .attr("stroke", "yellow")
            .attr("stroke-width", 3)
            .attr("y", function(v) { return Math.max(barHeight-yScale(v.leftPercentage),0 )})
            .attr("x", function(v) { return xScale(v.name)})
            .attr("height", function(v) { return Math.max(barHeight-yScale(v.percentage),0 )})
            .attr("width", xScale.bandwidth());
      })
      .on("mousemove", function(){
        var mouse = d3.mouse(document.getElementById("chart"));
        info.style("display", "inline")
            .style("left", (mouse[0] + 45 + infoMargin[1]) + "px")
            .style("top", (mouse[1] + 25 + infoMargin[0]) + "px");
      })
      .on("mouseout", function(v){
        info.style("display", "none");
        svg.select(".hovered").selectAll(".hover_rect")
            .remove();
      });

  svg.call(createLegend)
      .call(resize);

  win.on("resize", resize);

  function createLegend(){
    colorControler.selectAll(".legend").remove();
    colorControler.selectAll(".legend")
                  .data(barColor.domain())
                  .enter()
                  .append("li")
                  .append("svg")
                    .attr("width", markerSize)
                    .attr("height", markerSize)
                    .append("rect")
                      .attr("class", "color-switch active")
                      .style("cursor", "pointer")
                      .attr("width", markerSize*0.8)
                      .attr("height", markerSize*0.8)
                      .attr("y", markerSize / 3)
                      .attr("x", 0)
                      // .attr("r", markerSize / 2 - 1)
                      .attr("fill", d => barColor(d))
                      .on("click", function(d, i){
                        const channel = d3.select(this).classed("active");
                        d3.select(this)
                          .classed("active", !channel)
                          .attr("fill", channel ? "silver" : barColor(d));
                        rows.selectAll(".parts").selectAll(".parts-" + i)
                            .attr("fill", channel ? "none" : barColor(d));
                      });
    colorControler.selectAll("li")
                  .attr("class", "legend")
                  .append("text")
                  .attr('font-size','10px')
                  .text(d => d);
                  
  }

  function resize(){
    const colorHeight = parseFloat(d3.select(".color-controler").style("height").slice(0,-2));
    size.width = parseFloat(svg.style("width").slice(0,-2));
    size.height = parseFloat(svg.style("height").slice(0,-2));
    // console.log(size.width,size.height);
    // size.height = window.innerHeight - colorHeight;

    svg.attr("width", size.width)
        .attr("height", size.height);

    yScale.range([0, size.height - margin.top - margin.bottom]);
    xScale.range([0, size.width - margin.right - margin.left]);

    barHeight = size.height - margin.top - margin.bottom;
    barWidth = size.width - margin.right - margin.left;

    moveAxis(1000);
    moveBars(1500);

    infoMargin = calcMargin(container);

    d3.select(".sub_topicBar")
        .text("No. of Investment Deals by Round")
        .attr("font-weight", "bold")
        .attr("fill","#666")
        .attr('transform','translate('+ (margin.left + barWidth/2) + ',' + margin.top/2 + ')')
    }

    function moveAxis(duration = 0, delay = 0){
      yAxis.tickSize(-(barWidth));
      yAxisRight.tickSize(-(barWidth));
      xAxis.tickSize(0);

      d3.select(".yaxis")
        .transition().duration(duration).delay(delay)
        .call(yAxis.ticks(10, "%"));

      const xAxisLength = (svg.select(".yaxis").selectAll("text").size() * 4);
      yAxisRight.ticks(yAxisRight);

      d3.select(".yaxis-right")
        .transition().duration(duration).delay(delay)
        .call(yAxisRight);

      svg.select(".yaxis-right").selectAll("text").remove();

      d3.select(".xaxis")
        .attr('transform','translate('+ 0 + ',' + barHeight + ')')
        .transition().duration(duration).delay(delay)
        .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "middle");
    }

    function moveBars(duration = 0, delay = 0){

      console.log(data)

      rows.transition().duration(duration).delay(delay)
          .attr("transform", d => "translate(" + (xScale(d.year)) + "," + 0 + ")");


      rows.selectAll(".base").selectAll("rect")
          .transition().duration(duration).delay(delay)
          .attr("y", 0)
          .attr("x", 0)
          .attr("height", d => barHeight-yScale(d.total))
          .attr("width", xScale.bandwidth());

      rows.selectAll(".base").selectAll("text")
          .transition().duration(duration).delay(delay)
          .attr("y", -margin.top/10)
          .attr("x", xScale.bandwidth()/2)
          .attr("font-size",10);

      rows.selectAll(".parts").selectAll("rect")    
          .transition().duration(duration).delay(delay)
          .attr("y", function(v) {return Math.max(barHeight-yScale(v.leftPercentage),0 )})
          .attr("x", 0)
          .attr("height", function(v) { return Math.max(barHeight-yScale(v.percentage),0 )})
          .attr("width", xScale.bandwidth());

      rows.selectAll(".parts").selectAll("text")
          .transition().duration(duration).delay(delay)
          // .attr("transform", v => "translate(" + xScale(v.year) + "," +  0 + ")")
          .attr("y", function(v) {return Math.max( (barHeight*1.5 - yScale(v.leftPercentage) + (-yScale(v.percentage))/2 ) + 10,0 )})
          .attr("x", xScale.bandwidth()/2)
          .attr("text-anchor", 'middle')
          .attr("display", v => yScale(v.leftPercentage) < 22 ? "none" : "inline");
      }

    function sortParts(key){
      const prime = types[types.length-0];
      sortX(key, prime);
      // sortYPercentage(key, prime);
    }

    function sortX(key, prime){

      if(key !== prime){
        types.splice(types.indexOf(key), 1)
        types.splice(0, 0, key);
        console.log(types)

        for (let x of data){
          x.values.sort(function(a, b){return types.indexOf(b.type) - types.indexOf(a.type);});
          calcLeftPercentage(x);
        }

        rows.data(data);

        moveBars(500);
        moveAxis(1000);
      }
    }

    function calcLeft(datum){
      let sum = 0;
      for (let n of datum.values){
        // console.log(n)
        n.left = sum;
        sum += n.value;
        // console.log(n)
      }
    }

    function calcLeftPercentage(datum){
      let sum = 0;
      for (let n of datum.values){
        // console.log(n)
        n.leftPercentage = sum;
        sum += n.percentage;
        // console.log(n)
      }
    }

    function sortY(key, prime){
      const jake = key === prime;
      const delay = jake ? 0 : 750;
      const sortFunction = function(a, b){
        return jake && !yDomain ? b.total - a.total :
        b.values[0].value - a.values[0].value;
      };
      const domain = data.concat().map(d => d.year);
      xScale.domain(domain);

      yDomain = jake ? !yDomain : false;

      moveBars(1500, delay);
      moveAxis(1000, delay);

    }

    function sortYPercentage(key, prime){
      const jake = key === prime;
      const delay = jake ? 0 : 750;

      const sortFunction = function(a, b){
        return jake && !yDomain ? b.sum - a.sum :
        b.values[0].percentage - a.values[0].percentage;
      };
      const domain = data.concat().map(d => d.year);
      xScale.domain(domain);

      yDomain = jake ? !yDomain : false;

      moveBars(1500, delay);
      moveAxis(1000, delay);

    }

    function createInfo(element, title, ...args){
      element.select("span").text(title);
      const paraphs = element.select(".desc").selectAll("p").data(args);
      paraphs.exit().remove();
      paraphs.enter().append("p").merge(paraphs)
              .text(d => d);
    };

    function calcMargin(parent){
      // console.log(parent.style)
      const marginArr = parent.style("margin").split(" ");
      return marginArr.length === 1 ? [0, 0] : marginArr.map(d => parseFloat(d.slice(0,-2)));
    }
}

var formatAsPercentage = d3.format(".1%");


