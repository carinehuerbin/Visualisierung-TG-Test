	
    var dataset;
	
	var width = 960,
		height = 500;

	var svg = d3.select("#map").append("g").append("svg")
		.attr("width", width)
		.attr("height", height);
    
    var div = d3.select("body").append("div")
        .attr("class","tooltip")
        .style("opacity",0);

    //map colour scale
    var mapColour = d3.scaleThreshold()
        .domain([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.51, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85])
        .range(['#4c0000', '#99000d', '#cb181d', '#ef3b2c', '#fb6a4a', '#fc9272', '#fcbba1', '#fee5d9', '#edf8e9','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32', '#002600']);

    //load data files
	d3.queue()
		.defer(d3.json, "map-TG.json")
		.defer(d3.csv, "Abstimmung.csv")
        .defer(d3.csv, "Parteien_2016.csv")
		.await(ready)
		
function ready (error, data, csvAbstimmung, csvParteien){

	if(error){console.log("Error: "+ error)};
			
    dataset = data;
    
    //legend
    function drawLegend(scale){
        d3.select('#legend').selectAll('ul').remove();
    
    var legend = d3.select('#legend')
        .append('ul')
        .attr('class', 'list-inline');
    
    var keys = legend.selectAll('li.key')
        .data(scale.range());
    
    keys.enter().append('li')
        .attr('class', 'key')
        .style('border-top-color', String)
        .text(function(d) {
            var r = scale.invertExtent(d);
            return Math.round(r[0]*1000)/10+'%';
    });
}
	
	var Gemeinden = topojson.feature(data, data.objects.municipalities).features;
	
	//match id (topojson) & BFS_NR_GEMEINDE (csvAbstimmung)
	Gemeinden.forEach(function(gemeinde){
	csvAbstimmung.some(function(csvrow){
		if (gemeinde.id == csvrow.BFS_NR_GEMEINDE) {
            gemeinde.properties.data=csvrow;
			return true;
            }
		});
	});
    
    //match id (topojson) & BFS_NR_GEMEINDE (csvParteien)
    Gemeinden.forEach(function(gemeinde){
	csvParteien.some(function(csvrow){
		if (gemeinde.id == csvrow.BFS_NR_GEMEINDE) {
            gemeinde.properties.data2=csvrow;
			return true;
            }
		});
	});
    
    
    var path = d3.geoPath()
		.projection(null);
	
    drawLegend(mapColour);
	svg.append("g")
		.attr("class", "municipalities")
		.selectAll("path")
		.data(Gemeinden)
		.enter().append("path")
		.attr("id",function(d){return d.id})
		//.property("data",function(d){return d.properties.data})
        .style("fill", function (d) {
            if(d.properties.data){
                var percentage =parseInt(d.properties.data.JA_STIMMEN)/ parseInt(d.properties.data.GUELTIGE_STIMMEN);
                /*console.log(percentage)*/; return mapColour((percentage)); //Ja-Stimmen in Prozent
            }else if (d.id == "9329"){return "#2299ee"} //if lake fill blue
        })
        
        .on("mouseover", function(d) {
             d3.select(this)
                .style('stroke', function (d) {
                    return '#a0a0a0';
                })
                .style('stroke-width', function (d) {
                    return '1';
                });  
            
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div
                .html("<strong>" + d.properties.data.GEMEINDE_NAME + "</strong>"+ "<br/>" + "Ja-Stimmen: " + Math.round (parseInt(d.properties.data.JA_STIMMEN)/ parseInt(d.properties.data.GUELTIGE_STIMMEN) * 100) *100 / 100  + "%" + "<br/>" + "Stimmbeteiligung: " + d.properties.data.STIMMBETEILIGUNG + "%" + "<br/>" + "Anteil SVP: " + parseInt(d.properties.data2.SVP) + "%")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
    
        .on("mouseout", function(d) {
            d3.select(this)
                .style('stroke', '#000')
                .style('stroke-width', '0.5');
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
    
		.attr("d", path);
};