

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
		if (item.$.id.includes("ms_")) {
			rdm.type = "section";
			rdm.param = "state";
		}
		if (item.$.id.includes("sw_")) {
			rdm.type = "switch";
			rdm.show = "on";
		}
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
			rdm.param = "state";
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
		flow.scenario = item.$.scenario;
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
	data.timestring = "СТОП";
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
		if (waitPreviousCompleted(next)) {
			next.state = "active";
			onStageActivate(next);
		}
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

function onStageActivate(stage) {
	if (stage.scenario) {
		playerStart(stage.scenario);
	}
}

var scenarios = [];
function playerReset() {
	for (scenario of scenarios) {
		scenario.state = "idle";
		scenario.starttime = 0;
	}
}

function playerInitItem(scenarioName) {
	scenario = {name: scenarioName, data: require(`./assets/scenarios/${scenarioName}.json`)};
	scenarios.push(scenario);
	for (item of scenario.data) {
		time = item.time.split(":");
		item.timeint = parseInt(time[0]) * 3600 + parseInt(time[1]) * 60 + parseInt(time[2]);
	}
}
function playerInit() {
	try {
		scenarioNames = [
			"arrival",
			"transit",
			"departure"
		];
		for(scenarioName of scenarioNames) {
			playerInitItem(scenarioName);
		}
		playerReset();
	}
	catch(error) {
		console.log(error);
	}
}

function playerGet(scenarioName) {
	for (item of scenarios) {
		if (item.name === scenarioName) return item;
	}
}

function playerStart(scenarioName, time) {
	scenario = playerGet(scenarioName);
	if (!scenario) return;
	scenario.starttime = data.time;
	scenario.state = "play";
	playerExecute(scenario);
	console.log(`start playing scenario : ${scenarioName}`)
}

function playerExecute(scenario) {
	for (scenarioitem of scenario.data) {
		if (scenario.starttime + scenarioitem.time === data.time) {
			for(obj of data.rdm) {
				if (obj.name === scenarioitem.name) {
					obj.state = scenarioitem.state;
				}
			}				
		}
	}
}

function playerControl() {
	for (scenario of scenarios) {
		playerExecute(scenario)
	}
}

playerInit();


// 1 second timer
module.exports.tick = () => {
	if (data.state === 'play' || data.state === 'pause') {
		if (data.state === 'play') data.time ++;
		var mytime = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0));
		mytime.setSeconds(data.time);
		data.timestring = mytime.toISOString().substr(11, 8);
		playerControl(data.timestring);
	}
}

exports.data = data;
