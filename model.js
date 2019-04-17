

// read rdm.svg
var data = {
	"state": "none",
	"time": 0,
	"abonents": [],
	"flow": [],
	"rdm": [],
	"stocks": [],
	"messages": []
}

// init stocks
data.stocks.push({way: "1П", stock: "4192", status: "Коммерческий осмотр", active: false});
data.stocks.push({way: "2П", stock: "5384", status: "Закрепление", active: false});
data.stocks.push({way: "3П", stock: "", status: "", active: false});
data.stocks.push({way: "4П", stock: "", status: "", active: false});
data.stocks.push({way: "5П", stock: "9193", status: "Коммерческий осмотр", active: true});

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
			rdm.param = "show";
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
		flow.epoch = item.$.epoch;
		flow.owner = item.$.owner;
		flow.nextnames = item.$.next.split(',');
		flow.scenario = item.$.scenario;
		flow.ready = item.$.ready;
		flow.active = item.$.active;
		flow.time = item.$.time;
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

function messagesPrepare() {
	data.messages.push({});
	data.messages.push({});
	data.messages.push({});
	data.messages.push({});
	data.messages.push({});
	data.messages.push({});
}
messagesPrepare();

function messagesReset() {
	const types = ["dsp", "sig", "tcm", "stc", "vcdeh", "vcdeg"];
	var counter = 0;
	for(item of data.messages) {
		item.type = types[counter ++];
		item.state = "idle";
		item.time = "00:00:00";
		item.progress = 0;
		item.text = "-";
	}
}
messagesReset();

function messagesGet(typeName) {
	for(item of data.messages) {
		if (item.type === typeName) return item;
	}
	return null;
}

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
		if (value.type === 'switch') value.state = "off";
		if (value.type === 'light') value.state = "red";
	}	
	data.state = "reset";
	data.timestring = "СТОП";
	data.stocks[4].active = false;
	messagesReset();
	playerReset();
}

module.exports.play = () => {
	if (data.state === "play") {
		console.log("error : flow is already playing");
		return;
	}
	if (data.state === "pause") {
		data.state = "play";
		return;
	}	
	startStage = flowGet("start");
	startStage.state = 'active';
	data.state = "play";
	data.time = 0;
	data.stocks[4].active = true;
	onStageActivate(startStage);
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

function anyOfPreviousActive(stage) {
	for (prev of stage.wait) {
		if (prev.state === "active") return true;
	}
	return false;
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
	// set stock name
	data.stocks[4].status = stage.epoch;
	data.stocks[4].active = true;
	// init scenario
	if (stage.scenario) {
		playerStart(stage.scenario);
	}
	// generate messages
	for (var stage of data.flow) {
		if (stage.state === "active") {
			mesOwner = messagesGet(stage.owner);
			mesOwner.state = "active";
			mesOwner.text = stage.active;
			mesOwner.time = stage.time;
		}
		if (stage.state === "idle" || stage.state === "wait") {
			if ( anyOfPreviousActive(stage) ) {
				mesOwner.state = "ready";
				mesOwner.text = stage.ready;
			}
		}
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
			"init",
			"transit",
			"arrival",
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
	console.log(`start playing scenario : ${scenarioName}`)
}

function playerExecute(scenario) {
	for (scenarioitem of scenario.data) {
		if (scenario.starttime + scenarioitem.timeint === data.time) {
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
		if (scenario.state === "play") playerExecute(scenario)
	}
}

playerInit();


// 1 second timer
module.exports.tick = () => {
	if (data.state === 'play' || data.state === 'pause') {
		var mytime = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0));
		mytime.setSeconds(data.time);
		data.timestring = mytime.toISOString().substr(11, 8);
		playerControl(data.timestring);
		data.time ++;
	}
}

exports.data = data;
