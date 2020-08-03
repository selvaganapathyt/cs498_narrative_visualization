var usCovidData;
var usCovidDataByState;
var usCovidFatalityData;
var usCovidDailyChngData;
var usCovidDailyChngDataByState;
var usStateNames;
var currentScene = 1;
var selectedCountry;
var chartTitles = {
    1 : "Cumulative Cases Trend",
    2 : "Daily Cases trend",
    3 : "Cumulative Deaths Trend",
    4 : "Daily Deaths Trend",
    5 : "Cases Fatality Rate"
}


/*
* Load all data
*/
async function init() {

    usCovidData = await d3.csv("us-data/us-cumulative.csv");
    console.log("loaded us-cumulative.csv");

    usCovidDataByState = await d3.csv("us-data/us-states.csv");
    console.log("loaded us-cumulative.csv");

    usCovidDailyChngData = await d3.csv("us-data/us-running-daily.csv");
    console.log("loaded us-running-daily.csv");

    usCovidDailyChngDataByState = await d3.csv("us-data/us-states-running-daily.csv");
    console.log("loaded us-states-running-daily.csv");

    usCovidFatalityData = await d3.csv("us-data/us-fatality-rates.csv");
    console.log("loaded us-fatality-rates.csv");

    setSeverity();

    usStateNames = await d3.csv("us-data/states-names.csv");
    console.log("loaded states-names.csv");


    d3.select("#states").selectAll("option")
        .data(usStateNames)
        .enter()
        .append("option")
        .attr("value", function(d) {
            return d.State
        })
        .attr("label", function(d) {
            return d.State
        })

    d3.select("#states").on("change", function(d) {

        selectedCountry = d3.select(this).property("value")
        drawScene(currentScene);
    })

    drawScene(1);
}

function setSeverity() {
    
    usCovidFatalityData.forEach(function (d) {
        var fatality_rate = d.fatality_rate;
        var severity;
        if (fatality_rate <= 2) {
            severity = "Low";
        }
        else if (fatality_rate <= 4) {
            severity = "Medium";
        }
        else if (fatality_rate <= 8) {
            severity = "High";
        }
        else {
            severity = "Critical";
        }

        d.severity = severity;
    });
}


/**
 * check if states filter is selected with default value
 */
function isAllStateSelected() {
    return selectedCountry == undefined|| selectedCountry == 'All States';
}


function initializeLeftPanel() {

    d3.select("#progressDiv").selectAll("button").classed("currentScene", false)

    // add the style to the current pressed button.
    d3.select("#progressDiv").select("#btn"+(currentScene)).classed("currentScene", true);

    d3.select("#leftPanelDiv").selectAll(".leftPanelContent").style("display", "none");
    d3.select("#leftPanelDiv").select("#ContentForScene"+(currentScene)).style("display", "block");
}

    /**
     * draw previous scene
     */
    function drawPrevScene() {
        var prevScene = currentScene > 1  ? currentScene - 1 : 1; 
        drawScene(prevScene);
    }

    /**
     * draw next scene
     */
    function drawNextScene() {
        var nextScene = currentScene < 5  ? currentScene + 1 : 5; 
        drawScene(nextScene);
    }

/**
 * Renders the scene based on the progress bar.
 * 
 * @param {*} sceneNumber 
 */
function drawScene(sceneNumber) {

    // clear the chart panel
    d3.select("#chartPanelDiv").html("");
    currentScene = sceneNumber;

    d3.select("#chartTitle").text(chartTitles[currentScene]);

    initializeLeftPanel();

    d3.select("#statesTd").style("visibility", currentScene == 5 ? "hidden" : "visible");
    document.getElementById("btnPrev").disabled = currentScene == 1;
    document.getElementById("btnNext").disabled = currentScene == 5;

    switch(sceneNumber) {

        case 1: drawScene1();
                break;
        case 2: drawScene2();
                break;
        case 3: drawScene3();
                break;
        case 4: drawScene4();
                break;
        case 5: drawScene5();
                break;
        default: drawScene1(); // fall back to scene 1
    }
}

/**
 * Render Daily Change screen
 */
async function drawScene2() {

    var margin = {top: 10, right: 30, bottom: 80, left: 90},
    width = document.getElementById("chartPanelDiv").offsetWidth - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

    var dataFilter = usCovidDailyChngData;
    if (!isAllStateSelected()) {
        dataFilter = usCovidDailyChngDataByState.filter(function(d){return d.State==selectedCountry});
    }

    // add svg
        // add svg
        svg = d3.select("#chartPanelDiv")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");        

    // set x axis
    var x = d3.scaleTime()
    .domain(d3.extent(dataFilter, function(d) { 
        return d3.timeParse("%Y-%m-%d")(d.date) 
    }))
    .range([ 0, width ])
    .nice();     

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
    .ticks(d3.timeWeek.every(1))
    .tickFormat(d3.timeFormat("%Y-%b-%d")))
    .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")

        // set X axis lable
        svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + (height + margin.top + 60) + ")")
      .style("text-anchor", "middle")
      .attr("class", "axisLabel")
      .text("Date");

    // set y axis
    var y = d3.scaleLinear()
    .domain([0, d3.max(dataFilter, function(d) { 
        return parseInt(d.dailyCases) 
    })])
    .range([height, 0])
    .nice();

    svg.append("g").call(d3.axisLeft(y));

    // set Y axis label        
    svg.append('g')
    .attr("transform",
        "translate(" + (-65) + " ," + (height/2) + ")")
    .append("text")             
    .style("text-anchor", "middle")
    .attr("class", "axisLabel")
    .text("Daily Confirmed Cases")
    .attr("transform", "rotate(-90)");

   // Render the line
   var path = svg.append("path")
   .data([dataFilter]) // .datum(usCovidData)
   .attr("fill", "none")
   .attr("stroke", "rgb(249, 166, 85)")
   .attr("stroke-width", 1.5)
   .attr("d", d3.line()
     .x(function(d) { return x(d3.timeParse("%Y-%m-%d")(d.date)) })
     .y(function(d) { return y(parseInt(d.dailyCases)) })
     )

     // animate
     var totalLength = path.node().getTotalLength();

     await path
     .attr("stroke-dasharray", totalLength + " " + totalLength)
     .attr("stroke-dashoffset", totalLength)
   .transition() // Call Transition Method
     .duration(2000) // Set Duration timing (ms)
     .ease(d3.easeLinear) // Set Easing option
     .attr("stroke-dashoffset", 0)
     .end(); // Set final va  

     if (isAllStateSelected()){
        showAnnotationsForScene2(svg, x, y);
     }

     svg.append("rect")
     .attr("class", "overlay")
     .attr("width", width)
     .attr("height", height)
     .on("mouseover", function() {if (currentScene != 2) return; focus.style("display", null); tooltip.style("display", null);  })
     .on("mouseout", function() {if (currentScene != 2) return;  focus.style("display", "none"); tooltip.style("display", "none"); })
     .on("mousemove", mousemove);

  // set tooltips
  var tooltip = d3.select("#chartPanelDiv")
     .append("div")
     .attr("class", "tooltip")
     .style("display", "none");

     var focus = svg.append("g")
     .attr("class", "focus")
     .style("display", "none");

     focus.append("circle")
         .attr("r", 5).attr("fill", "rgb(249, 166, 85)");
 
        
    var tooltipCases = tooltip.append("div");
    tooltipCases.append("span")
        .attr("class", "tooltip-title")
        // .text("Total Cases: ");

    var tooltipCasesVal = tooltipCases.append("span")
        .attr("class", "tooltip-likes");

    function mousemove() {
        if (currentScene != 2) return;

        var x0 = x.invert(d3.mouse(this)[0]);
        var ind = bisectDateForScene1(dataFilter, x0);
        var d0 = dataFilter[ind - 1];
        var d1 = dataFilter[ind];

        if (!d0 || !d1) return;
        var d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        var xPos = x(d3.timeParse("%Y-%m-%d")(d.date)) +  100;
        var xPosForMark = x(d3.timeParse("%Y-%m-%d")(d.date));
        var yPos = y(parseInt(d.dailyCases)) 

        if ((height - yPos) <= 10) {
            ypos = height - 75;
        }

        focus.attr("transform", "translate(" + xPosForMark + "," + yPos + ")");
        tooltip.attr("style", "left:" + xPos + "px;top:" + yPos + "px;");
        tooltip.select(".tooltip-date").text(d.date);
        tooltip.select(".tooltip-likes").html("<table><tr><td>Date</td><td>:</td><td>" + d.date + "</td></tr><tr><td> New Cases </td><td>:</td><td>" + d.dailyCases + "</td></tr><table>");
    }
 


}

    /**
     * Render Scene 3
     */
    async function drawScene3() {

        var margin = {top: 10, right: 30, bottom: 80, left: 90},
        width = document.getElementById("chartPanelDiv").offsetWidth - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
    
        var dataFilter = usCovidData;
        if (!isAllStateSelected()) {
            dataFilter = usCovidDataByState.filter(function(d){return d.State==selectedCountry});
        }
    
        // add svg
        svg = d3.select("#chartPanelDiv")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");        

        // set x axis
        var x = d3.scaleTime()
        .domain(d3.extent(dataFilter, function(d) { return d3.timeParse("%Y-%m-%d")(d.date) }))
        .range([ 0, width ])
        .nice();     
                
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
        .ticks(d3.timeWeek.every(1))
        .tickFormat(d3.timeFormat("%Y-%b-%d")))
        .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
    
            // set X axis lable
            svg.append("text")             
          .attr("transform",
                "translate(" + (width/2) + " ," + (height + margin.top + 60) + ")")
          .style("text-anchor", "middle")
          .attr("class", "axisLabel")
          .text("Date");

        // set y axis

        var y = d3.scaleLinear()
            .domain([0, d3.max(dataFilter, function(d) { 
                return parseInt(d.deaths) 
            })])
            .range([height, 0])
            .nice();

        svg.append("g")
            .call(d3.axisLeft(y));

        // set Y axis label        
        svg.append('g')
        .attr("transform",
            "translate(" + (-65) + " ," + (height/2) + ")")
        .append("text")             
        .style("text-anchor", "middle")
        .attr("class", "axisLabel")
        .text("Cumulative Death Cases")
        .attr("transform", "rotate(-90)");

        // Render the line
        var path = svg.append("path")
        .data([dataFilter]) // .datum(usCovidData)
        .attr("fill", "none")
        .attr("stroke", "hsla(7, 100%, 41%, 1)")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return x(d3.timeParse("%Y-%m-%d")(d.date)) })
            .y(function(d) { return y(parseInt(d.deaths)) })
            )

        // animate
        var totalLength = path.node().getTotalLength();

        await path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition() // Call Transition Method
        .duration(2000) // Set Duration timing (ms)
        .ease(d3.easeLinear) // Set Easing option
        .attr("stroke-dashoffset", 0)
        .end(); // Set final va  
    
        if (isAllStateSelected()){
            showAnnotationsForScene3(svg, x, y);
         }
    
        svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { if (currentScene != 3) return; focus.style("display", null); tooltip.style("display", null);  })
        .on("mouseout", function() { if (currentScene != 3) return; focus.style("display", "none"); tooltip.style("display", "none"); })
        .on("mousemove", mousemove);

        // set tooltips
        var tooltip = d3.select("#chartPanelDiv")
            .append("div")
            .attr("class", "tooltip")
            .style("display", "none");

            var focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");
    
            focus.append("circle")
                .attr("r", 5).attr("fill", "hsla(7, 100%, 41%, 1)");
        
            
        var tooltipDeaths = tooltip.append("div");
        tooltipDeaths.append("span")
            .attr("class", "tooltip-title")
            // .text("Total Deaths: ");
    
        var tooltipDeathsVal = tooltipDeaths.append("span")
            .attr("class", "tooltip-likes");
    
        function mousemove() {
            if (currentScene != 3) return;

            var x0 = x.invert(d3.mouse(this)[0]);
            var ind = bisectDateForScene1(dataFilter, x0);
            var d0 = dataFilter[ind - 1];
            var d1 = dataFilter[ind];

            if (!d0 || !d1) return;
            var d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            var xPos = x(d3.timeParse("%Y-%m-%d")(d.date)) +  100;
            var xPosForMark = x(d3.timeParse("%Y-%m-%d")(d.date));
            var yPos = y(parseInt(d.deaths)) 

            if ((height - yPos) <= 10) {
                ypos = height - 75;
            }

            focus.attr("transform", "translate(" + xPosForMark + "," + yPos + ")");
            tooltip.attr("style", "left:" + xPos + "px;top:" + yPos + "px;");
            tooltip.select(".tooltip-date").text(d.date);
            tooltip.select(".tooltip-likes").html("<table><tr><td>Date</td><td>:</td><td>" + d.date + "</td></tr><tr><td>Deaths</td><td>:</td><td>" + d.deaths + "</td></tr><table>");
        }

    }

    /**
     * render scene 4
     */
    async function drawScene4() {

        var margin = {top: 10, right: 30, bottom: 80, left: 90},
        width = document.getElementById("chartPanelDiv").offsetWidth - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
    
        var dataFilter = usCovidDailyChngData;
        if (!isAllStateSelected()) {
            dataFilter = usCovidDailyChngDataByState.filter(function(d){return d.State==selectedCountry});
        }
        
        // add svg
        svg = d3.select("#chartPanelDiv")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");        
    
        // set x axis
        var x = d3.scaleTime()
        .domain(d3.extent(dataFilter, function(d) { 
            return d3.timeParse("%Y-%m-%d")(d.date) 
        }))
        .range([ 0, width ])
        .nice();     
    
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
        .ticks(d3.timeWeek.every(1))
        .tickFormat(d3.timeFormat("%Y-%b-%d")))
        .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
    
            // set X axis lable
            svg.append("text")             
          .attr("transform",
                "translate(" + (width/2) + " ," + (height + margin.top + 60) + ")")
          .style("text-anchor", "middle")
          .attr("class", "axisLabel")
          .text("Date");
    
        // set y axis
        var y = d3.scaleLinear()
        .domain([0, d3.max(dataFilter, function(d) { 
            return parseInt(d.dailyDeaths) 
        })])
        .range([height, 0])
        .nice();
    
        svg.append("g").call(d3.axisLeft(y));
    
        // set Y axis label        
        svg.append('g')
        .attr("transform",
            "translate(" + (-65) + " ," + (height/2) + ")")
        .append("text")             
        .style("text-anchor", "middle")
        .attr("class", "axisLabel")
        .text("Daily Death Cases")
        .attr("transform", "rotate(-90)");
    
       // Render the line
       var path = svg.append("path")
       .data([dataFilter]) // .datum(usCovidData)
       .attr("fill", "none")
       .attr("stroke", "hsla(7, 100%, 41%, 1)")
       .attr("stroke-width", 1.5)
       .attr("d", d3.line()
         .x(function(d) { return x(d3.timeParse("%Y-%m-%d")(d.date)) })
         .y(function(d) { return y(parseInt(d.dailyDeaths)) })
         )
    
         // animate
         var totalLength = path.node().getTotalLength();
    
         await path
         .attr("stroke-dasharray", totalLength + " " + totalLength)
         .attr("stroke-dashoffset", totalLength)
       .transition() // Call Transition Method
         .duration(2000) // Set Duration timing (ms)
         .ease(d3.easeLinear) // Set Easing option
         .attr("stroke-dashoffset", 0)
         .end(); // Set final va  
    
         if (isAllStateSelected()) {
            showAnnotationsForScene4(svg, x, y);
         }
    
    
         svg.append("rect")
         .attr("class", "overlay")
         .attr("width", width)
         .attr("height", height)
         .on("mouseover", function() {if (currentScene != 4) return; focus.style("display", null); tooltip.style("display", null);  })
         .on("mouseout", function() {if (currentScene != 4) return; focus.style("display", "none"); tooltip.style("display", "none"); })
         .on("mousemove", mousemove);
    
      // set tooltips
      var tooltip = d3.select("#chartPanelDiv")
         .append("div")
         .attr("class", "tooltip")
         .style("display", "none");
    
         var focus = svg.append("g")
         .attr("class", "focus")
         .style("display", "none");
    
         focus.append("circle")
             .attr("r", 5).attr("fill", "hsla(7, 100%, 41%, 1)");
     
            
        var tooltipDeaths = tooltip.append("div");
        tooltipDeaths.append("span")
            .attr("class", "tooltip-title")
            // .text("Total Cases: ");
    
        var tooltipDeathsVal = tooltipDeaths.append("span")
            .attr("class", "tooltip-likes");
    
        function mousemove() {
            if (currentScene != 4) return;

            var x0 = x.invert(d3.mouse(this)[0]);
            var ind = bisectDateForScene1(dataFilter, x0);
            var d0 = dataFilter[ind - 1];
            var d1 = dataFilter[ind];
    
            if (!d0 || !d1) return;
            var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    
            var xPos = x(d3.timeParse("%Y-%m-%d")(d.date)) +  100;
            var xPosForMark = x(d3.timeParse("%Y-%m-%d")(d.date));
            var yPos = y(parseInt(d.dailyDeaths)) 
    
            if ((height - yPos) <= 10) {
                ypos = height - 75;
            }
    
            focus.attr("transform", "translate(" + xPosForMark + "," + yPos + ")");
            tooltip.attr("style", "left:" + xPos + "px;top:" + yPos + "px;");
            // tooltip.select(".tooltip-date").text(d.date);
            tooltip.select(".tooltip-likes").html("<table><tr><td>Date</td><td>:</td><td>" + d.date + "</td></tr><tr><td>New Deaths</td><td>:</td><td>" + d.dailyDeaths + "</td></tr><table>");
        }
     
    
    }

    /**
     * Render Scene 5 (Fatality Trend)
     */
    async function drawScene5() {

        var margin = {top: 10, right: 30, bottom: 80, left: 90},
        width = document.getElementById("chartPanelDiv").offsetWidth - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

        svg = d3.select("#chartPanelDiv")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");        

    
        // set x axis
        var x = d3.scalePow()
        x.domain([0, d3.max(usCovidFatalityData, function(d) { 
            return parseInt(d.cases);
        })])
        .range([ 0, 0 ])
        .nice();
    
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "xAxisCls") 
        .call(d3.axisBottom(x).tickFormat(d3.format("")))
        .attr("opacity", "0")
            
        // set X axis lable
        svg.append("text")             
        .attr("transform",
            "translate(" + (width/2) + " ," + (height + margin.top + 60) + ")")
        .style("text-anchor", "middle")
        .attr("class", "axisLabel")
        .text("Cumulative Confirmed Cases");

        // set y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(usCovidFatalityData, function(d) { 
                return parseFloat(d.fatality_rate);
            })])
            .range([height, 0])
            .nice();

        svg.append("g")
            .call(d3.axisLeft(y).ticks(20).tickFormat(d3.format("")))

        // set Y axis label        
        svg.append('g')
        .attr("transform",
            "translate(" + (-65) + " ," + (height/2) + ")")
        .append("text")             
        .style("text-anchor", "middle")
        .attr("class", "axisLabel")
        .text("Fatality Rate")
        .attr("transform", "rotate(-90)");          
    
        var fillColor =  d3.scaleOrdinal()
        .domain(["Low", "Medium", "High", "Critical"])
        .range(["rgb(195, 167, 82)", "rgb(199, 136, 65)", "rgb(183, 78, 58)", "rgb(146, 23, 50)"]);

         // render the scatter plot
         svg.append("g")
         .selectAll("circle")
         .data(usCovidFatalityData)
         .enter()
         .append("circle")
         .attr("cx", function(d) { return x(d.cases)})
         .attr("cy", function(d) { return y(d.fatality_rate)})
         .attr("r", function(d) { return 2 * parseFloat(d.fatality_rate)})

        // animation 

        x.range([ 0, width])

        svg.select(".xAxisCls")
            // .transition()
            // .duration(2000)
            .attr("opacity", "1")
            .call(d3.axisBottom(x));



         svg.append("g")
         .selectAll("text")
         .data(usCovidFatalityData)
         .enter()
         .append("text")
         .text((d) => d.State)
         .attr("class", "caption")
         .attr("x", function(d) { 
             return x(d.cases)
            })
         .attr("y", function(d) {
              return y(d.fatality_rate)
            })
         .style("opacity", "0");

         var tooltip = d3.select("#chartPanelDiv")
         .append("div")
         .attr("class", "tooltip")
         .style("display", "none");
 
      await svg.selectAll("circle")
      .on("mouseover", function(d) {
        if (currentScene != 5) return;
         d3.select(this).transition()
             .duration('100')
             .attr("r", function(d) { return 4 * parseFloat(d.fatality_rate)});

          var left = x(d.cases) + 100;
          var top = y(d.fatality_rate) - 30;

          if (width - left <= 30) {
             left = width - 50;
             top = top - 30;
          } 

         tooltip.
         html("<table><tr><td>State</td><td>:</td><td>" + d.State + "</td></tr><tr><td>Total Cases</td><td>:</td><td>" + d.cases + "</td></tr><tr><td>Total Deaths</td><td>:</td><td>" + d.deaths + "</td></tr><tr><td>Fatality Ratio</td><td>:</td><td>" + d.fatality_rate + "</td></tr><tr><td>Severity</td><td>:</td><td>" + d.severity + "</td></tr><table>")
         .style("display", "block")
             .style("left", left + "px")
             .style("top", top + "px")
           .transition()
           .duration(200)
      })
      .on("mouseout", function() {
        if (currentScene != 5) return;
         d3.select(this).transition()
             .duration('200')
             .attr("r", function(d) { return 2 * parseFloat(d.fatality_rate)});

         tooltip.transition()
         .duration(300) // ms
         .style("display", "none");
      })         
      .transition()
      .duration(2000)
      .attr("cx", function (d) { return x(d.cases) } )
      .attr("cy", function (d) { return y(d.fatality_rate)}) 
      .attr("fill", function(d) { return fillColor(d.severity)})
      .end();

         showAnnotationsForScene5(svg, x, y);

        svg.append("rect")
        .attr("x", width - 130)
        .attr("y", height/2 - 45)
        .attr("width", 100)
        .attr("height", 100)
        .attr("opacity", "0.1")
        .attr("fill", "white");
  
        var size = 15;
        var clicked = ""

        svg.selectAll("mydots")
        .data(["Low", "Medium", "High", "Critical"].reverse())
        .enter()
        .append("rect")
          .attr("x", width - 120)
          .attr("y", function(d,i){ return height/2 - 30 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
          .attr("width", size)
          .attr("height", size)
          .attr("cursor", "pointer")
          .style("fill", function(d, i){ return fillColor(d)})
          .on("click", function(d) {
                d3.selectAll("circle").style("opacity", 1);
                d3.selectAll(".caption").data(usCovidFatalityData).filter(function(t) { return t.severity == d}).style("opacity", "1");

                if (clicked !== d){
                    d3.selectAll("circle")
                      .filter(function(e){
                      return e.severity !== d;
                    }).style("opacity", "0.1");

                    d3.selectAll(".caption").data(usCovidFatalityData).filter(function(t) { return t.severity != d}).style("opacity", "0");
                    clicked = d
                  }
                   else{
                    clicked = ""
                    d3.selectAll(".caption").data(usCovidFatalityData).style("opacity", "0");
                }
          })
      
      // Add one dot in the legend for each name.
      svg.selectAll("mylabels")
        .data(["Low", "Medium", "High", "Critical"].reverse())
        .enter()
        .append("text")
        .attr("class", "legend")
          .attr("x", width - 120 + size*1.25)
          .attr("y", function(d,i){ return height/2 - 30 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
          .style("fill", function(d){ return fillColor(d)})
          .text(function(d){ return d})
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle")
          .on("click", function(d) {
            d3.selectAll("circle").style("opacity", 1);
            d3.selectAll(".caption").data(usCovidFatalityData).filter(function(t) { return t.severity == d}).style("opacity", "1");

            if (clicked !== d){
                d3.selectAll("circle")
                  .filter(function(e){
                  return e.severity !== d;
                }).style("opacity", "0.1");
                clicked = d
              }
               else {
                clicked = ""
                d3.selectAll(".caption").data(usCovidFatalityData).style("opacity", "0");
            }
      });

    }

    // identify the position
var bisectDateForCases = d3.bisector(function(d) {
    return parseInt(d.cases) }
    ).left;

// identify the position
var bisectDateForScene1 = d3.bisector(function(d) {
     return d3.timeParse("%Y-%m-%d")(d.date); }
     ).left;


/**
 * Render Scene 1
 * @param {*} e 
 */     
async function drawScene1() {

    var margin = {top: 10, right: 30, bottom: 80, left: 90},
    width = document.getElementById("chartPanelDiv").offsetWidth - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

    var dataFilter = usCovidData;
    if (!isAllStateSelected()) {
        dataFilter = usCovidDataByState.filter(function(d){return d.State==selectedCountry});
    }

    // add svg
    svg = d3.select("#chartPanelDiv")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");        
    
    // set x axis
    var x = d3.scaleTime()
    .domain(d3.extent(dataFilter, function(d) { return d3.timeParse("%Y-%m-%d")(d.date) }))
    .range([ 0, width ])
    .nice();     

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
    .ticks(d3.timeWeek.every(1))
    // .ticks(d3.timeDay.filter(function(d) { return (d.getDate() - 1) % 15 === 0; }))
    .tickFormat(d3.timeFormat("%Y-%b-%d")))
    .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")

        // set X axis lable
        svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + (height + margin.top + 60) + ")")
      .style("text-anchor", "middle")
      .attr("class", "axisLabel")
      .text("Date");

    // set y axis

    var y = d3.scaleLinear()
        .domain([0, d3.max(dataFilter, function(d) { 
            return parseInt(d.cases) 
        })])
        .range([height, 0])
        .nice();

    svg.append("g")
        .call(d3.axisLeft(y));

    // set Y axis label        
    svg.append('g')
    .attr("transform",
          "translate(" + (-65) + " ," + (height/2) + ")")
    .append("text")             
    .style("text-anchor", "middle")
    .attr("class", "axisLabel")
    .text("Cumulative Confirmed Cases")
    .attr("transform", "rotate(-90)");

   // Render the line
   var path = svg.append("path")
   .data([dataFilter]) // .datum(usCovidData)
   .attr("fill", "none")
   .attr("stroke", "rgb(249, 166, 85)")
   .attr("stroke-width", 1.5)
   .attr("d", d3.line()
     .x(function(d) { return x(d3.timeParse("%Y-%m-%d")(d.date)) })
     .y(function(d) { return y(parseInt(d.cases)) })
     )

     // animate
     var totalLength = path.node().getTotalLength();

     await path
     .attr("stroke-dasharray", totalLength + " " + totalLength)
     .attr("stroke-dashoffset", totalLength)
   .transition() // Call Transition Method
     .duration(2000) // Set Duration timing (ms)
     .ease(d3.easeLinear) // Set Easing option
     .attr("stroke-dashoffset", 0)
     .end(); // Set final va  

     if (isAllStateSelected()) {
        showAnnotationsForScene1(svg, x, y);
     }

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { if (currentScene != 1) return;
            focus.style("display", null); tooltip.style("display", null);  })
        .on("mouseout", function() { if (currentScene != 1) return; focus.style("display", "none"); tooltip.style("display", "none"); })
        .on("mousemove", mousemove);

     // set tooltips
     var tooltip = d3.select("#chartPanelDiv")
        .append("div")
        .attr("class", "tooltip")
        .style("display", "none");

        var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");
   
        focus.append("circle")
            .attr("r", 5).attr("fill", "rgb(249, 166, 85)");
    
           
    var tooltipCases = tooltip.append("div");
    tooltipCases.append("span")
        .attr("class", "tooltip-title")
        // .text("Total Cases: ");
   
    var tooltipCasesVal = tooltipCases.append("span")
        .attr("class", "tooltip-likes");
   
    function mousemove() {
        if (currentScene != 1) return;

        var x0 = x.invert(d3.mouse(this)[0]);
        var ind = bisectDateForScene1(dataFilter, x0);
        var d0 = dataFilter[ind - 1];
        var d1 = dataFilter[ind];

        if (!d0 || !d1) return;
        var d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        var xPos = x(d3.timeParse("%Y-%m-%d")(d.date)) +  100;
        var xPosForMark = x(d3.timeParse("%Y-%m-%d")(d.date));
        var yPos = y(parseInt(d.cases)) 

        if ((height - yPos) <= 10) {
            ypos = height - 75;
        }

        focus.attr("transform", "translate(" + xPosForMark + "," + yPos + ")");
        tooltip.attr("style", "left:" + xPos + "px;top:" + yPos + "px;");
        tooltip.select(".tooltip-likes").html("<table><tr><td>Date</td><td>:</td><td>" + d.date + "</td></tr><tr><td> Cases </td><td>:</td><td>" + d.cases + "</td></tr><table>");
    }

}

function drawAnnotation(annotationConfig) {

        var annotation1 = d3.select("#chartPanelDiv")
        .append("div")
        .classed("annotation", true)
        .html(annotationConfig.caption)
        .attr("style", "left:" + annotationConfig.xPos + "px;top:" + annotationConfig.yPos + "px;");

        svg.append("g")
        .attr("transform", annotationConfig.translateValue == undefined|| annotationConfig.translateValue.length == 0  ? "translate(0,0)" : annotationConfig.translateValue)
        .append("line")
        .attr("x1", annotationConfig.lx1Pos)
        .attr("y1", annotationConfig.ly1Pos)
        .attr("x2", annotationConfig.lx2Pos)
        .attr("y2", annotationConfig.ly2Pos)
        .attr("class", "annoLine")
        .attr("stroke-width", 2)
}


function showAnnotationsForScene1(svg, x, y) {

    if (currentScene != 1) return;

        // set annotation
        var firstOccuredData = usCovidData[0];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(firstOccuredData.date));
        var yPosRaw = y(parseInt(firstOccuredData.cases));

        var xPos = xPosRaw + 100;
        var yPos = yPosRaw - 200;

        annotationConfig = {xPos:xPos, yPos:yPos, caption:"Cases started on Jan 21st 2020", lx1Pos:xPos, ly1Pos:yPos, lx2Pos:xPos, ly2Pos:yPosRaw};
        drawAnnotation(annotationConfig);


        // set annotation
        var _3MillionOccuredData = usCovidData[170];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(_3MillionOccuredData.date));
        var yPosRaw = y(parseInt(_3MillionOccuredData.cases));

        var xPos = xPosRaw - 100;
        var yPos = yPosRaw - 100;

        var annoText = "<span>Even after lockdown, Cases touched 3 Million around 1st week of July</span>";
        // drawAnnotation(xPos, yPos, annoText, -100, -100, 1, 1);

        annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-100, ly1Pos:-100, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
        drawAnnotation(annotationConfig);


}

function showAnnotationsForScene3(svg, x, y) {

    if (currentScene != 3) return;

        // set annotation
        var firstOccuredData = usCovidData[39];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(firstOccuredData.date));
        var yPosRaw = y(parseInt(firstOccuredData.deaths));

        var xPos = xPosRaw + 100;
        var yPos = yPosRaw - 200;

        var annoText = "<span>First death reported on Feb 29th 2020<span>";
        annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:xPos, ly1Pos:yPos, lx2Pos:xPos, ly2Pos:yPosRaw};
        drawAnnotation(annotationConfig);

        // set annotation
        var flatteningData = usCovidData[145];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(flatteningData.date));
        var yPosRaw = y(parseInt(flatteningData.deaths));

        var xPos = xPosRaw - 100;
        var yPos = yPosRaw - 100;

        var annoText = "<span>Death Cases starting to flatten due to measures(remote-work, wearing masks) enforced by Goverment<span>";
        annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-100, ly1Pos:-100, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
        drawAnnotation(annotationConfig);

}

/**
 * Render annotations for scene2
 * 
 * @param {*} svg 
 * @param {*} x 
 * @param {*} y 
 */
function showAnnotationsForScene2(svg, x, y) {

    if (currentScene != 2) return;

        // set annotation
        var firstOccuredData = usCovidDailyChngData[72];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(firstOccuredData.date));
        var yPosRaw = y(parseInt(firstOccuredData.dailyCases));

        var xPos = xPosRaw - 100;
        var yPos = yPosRaw - 100;

        var annoText = "First wave Cases surging around 1st week Of April";
        annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-100, ly1Pos:-100, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
        drawAnnotation(annotationConfig);

        // set annotation
        var spikeAfterReopening = usCovidDailyChngData[162];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(spikeAfterReopening.date));
        var yPosRaw = y(parseInt(spikeAfterReopening.dailyCases));

        var xPos = xPosRaw - 100;
        var yPos = yPosRaw - 100;

        var annoText = "Cases spiking again as different States Reopening since June 21st";
        annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-100, ly1Pos:-100, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
        drawAnnotation(annotationConfig);

        var spikeAfterReopening = usCovidDailyChngData[143];
        var xPosRaw = x(d3.timeParse("%Y-%m-%d")(spikeAfterReopening.date));
        var yPosRaw = y(parseInt(spikeAfterReopening.dailyCases));

        var xPos = xPosRaw - 90;
        var yPos = yPosRaw - 100;

        var annoText = "<span>Cases reducing after measures like Lockdown and Mandatory Masks were put in place.<span>";
        annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-100, ly1Pos:-100, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
        drawAnnotation(annotationConfig);
}

/**
 * 
 * @param {*} svg 
 * @param {*} x 
 * @param {*} y 
 */
function showAnnotationsForScene5(svg, x, y) {

    if (currentScene != 5) return;

    // set annotation
    var newYork = usCovidFatalityData[0];
    var xPosRaw = x(parseInt(newYork.cases));
    var yPosRaw = y(parseInt(newYork.fatality_rate));

    var xPos = xPosRaw;
    var yPos = yPosRaw - 150;

    var annoText = "New York  with most no of cases, has higher fatality rate";
    annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:0, ly1Pos:-100, lx2Pos:0, ly2Pos:-50, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
    drawAnnotation(annotationConfig);

    // set annotation
    var Connecticut = usCovidFatalityData[9];
    var xPosRaw = x(parseInt(Connecticut.cases));
    var yPosRaw = y(parseInt(Connecticut.fatality_rate));

    var xPos = xPosRaw;
    var yPos = yPosRaw - 100;

    var annoText = "Connecticut has the highest fatality rate of 9%";
    annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:0, ly1Pos:-100, lx2Pos:1, ly2Pos:-20, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
    drawAnnotation(annotationConfig);

}


/**
 * Render annotations for scene2
 * 
 * @param {*} svg 
 * @param {*} x 
 * @param {*} y 
 */
function showAnnotationsForScene4(svg, x, y) {

    if (currentScene != 4) return;

    // set annotation
    var preLockDown = usCovidDailyChngData[73];
    var xPosRaw = x(d3.timeParse("%Y-%m-%d")(preLockDown.date));
    var yPosRaw = y(parseInt(preLockDown.dailyDeaths));

    var xPos = xPosRaw - 100;
    var yPos = yPosRaw - 100;

    var annoText = "Deaths surging before lockdown and awareness.";
    annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-100, ly1Pos:-100, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
    drawAnnotation(annotationConfig);

    // set annotation
    var spikeAfterReopening = usCovidDailyChngData[142];
    var xPosRaw = x(d3.timeParse("%Y-%m-%d")(spikeAfterReopening.date));
    var yPosRaw = y(parseInt(spikeAfterReopening.dailyDeaths));

    var xPos = xPosRaw - 30;
    var yPos = yPosRaw - 200;

    var annoText = "<span>Curve bending down since lockdown and testing surge</span>";
    annotationConfig = {xPos:xPos, yPos:yPos, caption:annoText, lx1Pos:-30, ly1Pos:-200, lx2Pos:1, ly2Pos:1, translateValue:"translate("+xPosRaw+","+yPosRaw+")"};
    drawAnnotation(annotationConfig);

}

function highlightStateDropdown() {
    var x = document.getElementById("states").focus();
}

