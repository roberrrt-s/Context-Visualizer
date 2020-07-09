import * as d3 from "d3";
import data from "data.json"

const APP = {
	NAME: 'Context Visualizer',
	VERSION: '1.0.0',
	AUTHOR: 'Robert Spier',
	CREATION_DATE: new Date().getFullYear()
};

class App {

	constructor() {

		//create somewhere to put the force directed graph

		let width = window.innerWidth;
		let	height = window.innerHeight;

		width < height ? height = width : width = height;


		const svg = d3.select("svg")
		const radius = 10;

      	window.addEventListener("resize", redraw);

		//set up the simulation and add forces
		var simulation = d3.forceSimulation()
			.nodes(data.nodes);

		var x = d3.scaleLinear()
		    .domain([0, 10])
		    .range([25, 250]);

		var link_force =  d3.forceLink(data.links)
			.id(function(d) {
				return d.id_str;
			})
			.distance(function(d) {
				console.log(d.source.sentiment)
				return x(d.source.amount_of_replies);
			});

		var charge_force = d3.forceManyBody()
			.strength(-5);

		var center_force = d3.forceCenter(width / 2, height / 2);

		simulation
			.force("charge_force", charge_force)
			.force("center_force", center_force)
			.force("links", link_force);

		//add tick instructions:
		simulation.on("tick", tickActions);

		//add encompassing group for the zoom
		var g = svg.append("g")
			.attr("class", "everything");

		//draw lines for the links
		var link = g.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(data.links)
			.enter().append("line")
			.attr("stroke-width", 2);
			//.style("stroke", "#F00");

		//draw circles for the nodes
		var node = g.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(data.nodes)
			.enter()
			.append("circle")
			.attr("r", radius)
			.attr("fill", "#000");

		node.append("text")
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text(function(d) {
			  return d.user.name;
			});

		node.on("click", d => {
			console.log(d)
			console.log(document.querySelector("#meta"));
			document.querySelector("#meta pre code").textContent = JSON.stringify(d, undefined, 2);
		})

		//add drag capabilities
		var drag_handler = d3.drag()
			.on("start", drag_start)
			.on("drag", drag_drag)
			.on("end", drag_end);

		drag_handler(node);


		//add zoom capabilities
		var zoom_handler = d3.zoom()
			.on("zoom", zoom_actions);

		zoom_handler(svg);

		/** Functions **/

		//Function to choose what color circle we have
		//Let's return blue for males and red for females
		function circleColour(d){
			if(d.sex =="M"){
				return "blue";
			} else {
				return "pink";
			}
		}

		//Function to choose the line colour and thickness
		//If the link type is "A" return green
		//If the link type is "E" return red
		function linkColour(d){
			if(d.type == "A"){
				return "green";
			} else {
				return "black";
			}
		}

		//Drag functions
		//d is the node
		function drag_start(d) {
		 if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		//make sure you can't drag the circle outside the box
		function drag_drag(d) {
		  d.fx = d3.event.x;
		  d.fy = d3.event.y;
		}

		function drag_end(d) {
		  if (!d3.event.active) simulation.alphaTarget(0);
		  d.fx = null;
		  d.fy = null;
		}

		//Zoom functions
		function zoom_actions(){
			g.attr("transform", d3.event.transform)
		}

		function tickActions() {
			//update circle positions each tick of the simulation
			node
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });

			//update link positions
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
		}

		function redraw(e) {
			width = window.innerWidth,
			height = window.innerHeight;

			width < height ? height = width : width = height;

			simulation.force("center", d3.forceCenter(width / 2, height / 2))

			simulation.alpha(0.3).restart();
		}
	}
}

const app = new App();
