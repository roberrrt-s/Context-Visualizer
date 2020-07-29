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

		var radius = d3.scaleLinear()
			.domain([0, 50])
			.range([7, 20]);

		function getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

      	window.addEventListener("resize", redraw);

		//set up the simulation and add forces
		var simulation = d3.forceSimulation()
			.nodes(data.nodes);

		var x = d3.scaleLinear()
		    .domain([0, .5])
		    .range([50, 500]);

		var link_force =  d3.forceLink(data.links)
			.id(function(d) {
				return d.id_str;
			})
			.distance(function(d) {
				return getRandomInt(30, 50);
			});

		var charge_force = d3.forceManyBody()
			.strength(-35);

		var center_force = d3.forceCenter(width / 2, height / 2);

		simulation
			.force("charge_force", charge_force)
			.force("center_force", center_force)
			.force("links", link_force);

		//add tick instructions:
		simulation.on("tick", tickActions);

		var positiveColor = d3.scaleLinear().domain([0, 10])
			.interpolate(d3.interpolateHcl)
			.range([d3.rgb("#cccccc"), d3.rgb('#a9dc76')]);

		var negativeColor = d3.scaleLinear().domain([-10, 0])
			.interpolate(d3.interpolateHcl)
			.range([d3.rgb("#fc9867"), d3.rgb('#cccccc')]);

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
			.selectAll("g")
			.data(data.nodes)
			.enter()
			.append("g")
			.attr("class", function(d) {
				console.log(d);

				if(!d.in_reply_to_status_id_str) {
					return "core single-node"
				} else {
					return "single-node"
				}
			})

		var images = node.append("svg:image")
			.attr("xlink:href",  function(d) {
				return d.user.profile_image_url_https;
			})
			.attr("x", function(d) {
				return Number(`-${radius(d.amount_of_replies + d.favorite_count)}`)
			})
			.attr("y", function(d) {
				return Number(`-${radius(d.amount_of_replies + d.favorite_count)}`)
			})
			.attr("height", function(d) {
				return `${radius(d.amount_of_replies + d.favorite_count) * 2}px`
			})
			.attr("width", function(d) {
				return `${radius(d.amount_of_replies + d.favorite_count) * 2}px`
			})

		var text = node
			.append("text");

		text
			.append("tspan")
			.text(function(d) {
				if(d.topics.length) {
					if(d.topics[0].term) {
						return d.topics[0].term
					} else {
						return `${d.topics[0][0].term}`
					}
				} else {
					return "";
				}
			})
			.attr("x", 0)
			.attr("dy", -5)
			.attr("text-anchor", "middle")

		text
			.append("tspan")
			.text(function(d) {
				if(d.topics.length) {
					if(d.topics[0].term) {
						console.log('true')
						return d.topics[1].term
					} else {
						console.log('false')
						return `${d.topics[1][0].term}`
					}
				} else {
					return "no topics found";
				}
			})
			.attr("x", 0)
			.attr("dy", function(d) {
				if(d.topics.length) {
					return 10
				} else {
					return 0;
				}
			})
			.attr("text-anchor", "middle")

		node
			.append("circle")
			.attr("r", function(d) {
				return radius(d.amount_of_replies + d.favorite_count)
			})
			.attr("fill", function(d) {
				if(d.sentiment.score > 0) {
					return positiveColor(d.sentiment.score);
				} else {
					return negativeColor(d.sentiment.score);
				}
			})

		function generateTweet(container, tweet, type) {
			let div = document.createElement('div');
			div.classList.add("tweet", type)

			let name = document.createElement('span')
			name.append(`@${tweet.user.screen_name} (${tweet.user.name})`)

			let content = document.createElement('p');
			content.append(tweet.full_text)

			div.append(name);
			div.append(content)
			container.append(div);
		}

		node.on("click", d => {
			let element = document.querySelector("#meta")
			element.innerHTML = "";

			// parent nodes
			data.nodes.map((el, i) => {
				if(el.id_str === d.in_reply_to_status_id_str) {
					generateTweet(element, el, "parent")
				}
			});

			generateTweet(element, d, "element")

			// child nodes
			data.nodes.map((el, i) => {
				if(d.id_str === el.in_reply_to_status_id_str) {
					generateTweet(element, el, "child")
				}
			});

		})

		var body = document.querySelector("body");

		document.querySelector("#circles").addEventListener("click", function(e) {
			body.classList.remove("text")
			body.classList.remove("images")
			body.classList.add("circles")
		})

		document.querySelector("#text").addEventListener("click", function(e) {
			body.classList.remove("circles")
			body.classList.remove("images")
			body.classList.add("text")
		})

		document.querySelector("#images").addEventListener("click", function(e) {
			body.classList.remove("circles")
			body.classList.remove("text")
			body.classList.add("images")
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

		//Drag functions
		//d is the node
		function drag_start(d) {
			if (!d3.event.active) {
				simulation.alphaTarget(0.3).restart();
				d.fx = d.x;
				d.fy = d.y;
			}
		}

		//make sure you can't drag the circle outside the box
		function drag_drag(d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		function drag_end(d) {
			if (!d3.event.active) {
				simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			}
		}

		//Zoom functions
		function zoom_actions(){
			g.attr("transform", d3.event.transform)
		}

		function tickActions() {
			//update circle positions each tick of the simulation
			node
				.attr("transform", function(d) {
					return `translate(${d.x},${d.y})`;
				});
			//	.attr("x", function(d) { return d.x; })
			//	.attr("y", function(d) { return d.y; });

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
