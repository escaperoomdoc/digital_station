//var data = require('./dsm.json');

// read rdm.svg
var data = {
	"state": "none",
	"time": 0,
	"abonents" : [],
	"flow" : [],
	"rdm" : []
}

const fs = require('fs');
var parseString = require('xml2js').parseString;
var rdmxml = fs.readFileSync('./assets/rdm.svg');
var flowxml = fs.readFileSync('./assets/flowchart.svg');

parseString(rdmxml, (err, result) => {
	const ellispe = result.svg.g[0].ellipse;
	const path = result.svg.g[0].path;
	for (item of path) {
		var rdm = {};
		if (item.$.id.includes("ms_")) rdm.type = "section";
		if (item.$.id.includes("sw_")) rdm.type = "switch";
		if (rdm.type) {
			rdm.name = item.$.id;
			data.rdm.push(rdm);
		}
	}
	for (item of ellispe) {
		var rdm = {};
		if (item.$.id.includes("ls_")) {
			rdm.type = "light";
			rdm.name = item.$.id;
			data.rdm.push(rdm);
		}
	}
})

parseString(flowxml, (err, result) => {
	const rect = result.svg.g[0].rect;
	for (item of rect) {
		var flow = {};
		flow.name = item.$.id;
		flow.owner = item.$.owner;
		flow.nextnames = item.$.next.split(',');
		flow.wait = [];
		flow.next = [];
		data.flow.push(flow);
	}
	// setup references
	for (item of data.flow) {
		for (nextname of item.nextnames) {
			next = flowGet(nextname);
			if (next) {
				item.next.push(next);
				next.wait.push(item);
			}
		}
	}
})

// model API...
module.exports.abonGet = (id) => {
	for(var value of data.abonents) {
		if (value.id === id) return value;
	}
	return null;
}

module.exports.abonDelete = (id) => {
	var index = -1;
	for(var i in data.abonents) {
		if (data.abonents[i].id === id) {
			index = i;
			break;
		};
	}
	if (index >= 0) data.abonents.splice(index, 1);
	return null;
}

function flowGet(name) {
	for(var value of data.flow) {
		if (value.name === name ) return value;
	}
}
module.exports.flowGet = flowGet;

module.exports.reset = () => {
	for(var value of data.flow) {
		value.state = "idle";
	}
	for(var value of data.rdm) {
		if (value.type === 'section') value.state = "free";
		if (value.type === 'switch') value.state = "show";
		if (value.type === 'light') value.state = "red";
	}	
	data.state = "reset";
}

module.exports.play = () => {
	flowGet("start").state = 'active';
	data.state = "play";
}

module.exports.pause = () => {
	if ( data.state === "pause" ) data.state = "play"; else
	if ( data.state === "play" ) data.state = "pause";
}

function waitPreviousCompleted(stage) {
	for (prev of stage.wait) {
		if (prev.state !== "completed") return false;
	}
	return true;
}

function completeStage(stage) {
	stage.state = "completed";
	for (next of stage.next) {
		if (next.state === "idle") next.state = "wait";
		if (waitPreviousCompleted(next)) next.state = "active";
	}
}

module.exports.complete = (stagename) => {
	if (stagename=="any") {
		for(var stage of data.flow) {
			if(stage.state === "active") {
				completeStage(stage);
				break;
			}
		}
	}
	else {
		stage = flowGet(stagename);
		if (stage && stage.state === "active") completeStage(stage);
	}
}


exports.data = data;
