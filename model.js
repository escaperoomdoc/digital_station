

// read rdm.svg
var data = {
	"booster": 1,
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
module.exports.rdmxml = rdmxml;
var flowxml = fs.readFileSync('./assets/flowchart.svg');
module.exports.flowxml = flowxml;
var playxml = fs.readFileSync('./views/dsp/img/play.svg');
module.exports.playxml = playxml;
var pausexml = fs.readFileSync('./views/dsp/img/pause.svg');
module.exports.pausexml = pausexml;
var completexml = fs.readFileSync('./views/dsp/img/complete.svg');
module.exports.completexml = completexml;
var stopxml = fs.readFileSync('./views/dsp/img/stop.svg');
module.exports.stopxml = stopxml;

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
		flow.timeMax = parseInt(item.$.time, 10);
		flow.timeSec = flow.timeMax * 60;
		flow.time = flow.timeMax;
		flow.progress = 0;
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
	const names = ["ДСП", "СИГ", "ТЧМ", "СТЦ", "ВЧДЭ-Х", "ВЧДЭ-Г"];
	const fios = ["Долганюк С.И.", "Савицкий А.Г.", "Козадаев Р.С.", "Комарова Е.Е.", "Бодров Б.Л.", "Ильичев М.В."];
	var counter = 0;
	for(item of data.messages) {
		item.type = types[counter];
		item.name = names[counter];
		item.fio = fios[counter];
		item.state = "idle";
		item.time = 10;
		item.progress = 0;
		item.text = "-";
		counter ++
	}
}
messagesReset();

function messagesGet(typeName) {
	for(item of data.messages) {
		if (item.type === typeName) return item;
	}
	return null;
}

function messagesUpdate() {
	// generate messages
	for (var message of data.messages) {
		message.state = "idle";
	}
	for (var stage of data.flow) {
		message = messagesGet(stage.owner);
		if (!message) continue;
		if (message.state != "idle") continue;
		if (stage.state === "active") {
			message.state = "active";
			message.text = stage.active;
		}
		if (stage.state === "idle" || stage.state === "wait") {
			if ( anyOfPreviousActive(stage) ) {
				message = messagesGet(stage.owner);
				message.state = "ready";
				message.text = stage.ready;
			}
		}
	}
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
	for(var stage of data.flow) {
		stage.state = "idle";
		stage.timeSec = stage.timeMax * 60;
		stage.time = stage.timeMax;	
		stage.progress = 0;
	}
	for(var value of data.rdm) {
		if (value.type === 'section') value.state = "free";
		if (value.type === 'switch') value.state = "off";
		if (value.type === 'light') value.state = "red";
	}
	data.booster = 1;
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
	messagesUpdate();
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
		if (waitPreviousCompleted(next)) {
			next.state = "active";
			onStageActivate(next);
		}
	}
	messagesUpdate();
}

module.exports.complete = (abonName) => {
	for(var stage of data.flow) {
		if(stage.state === "active") {
			if (abonName === "dsp" || stage.owner === abonName) {
				completeStage(stage);
				break;
			}
		}
	}
}

function onStageActivate(stageNew) {
	// set stock name
	if (stageNew.epoch !== "?") data.stocks[4].status = stageNew.epoch;
	data.stocks[4].active = true;
	// init scenario
	if (stageNew.scenario) {
		playerStart(stageNew.scenario);
	}
	// mark next stages as waiting
	for (next of stageNew.next) {
		if(next.state === "idle") next.state = "wait";
	}
	// estimate time scaler
	data.booster = parseInt(stageNew.time, 10 );
	if (data.booster > 10) data.booster = 10;
	if (data.booster < 0) data.booster = 0;
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
	scenario.maxTime = 0;
	for (item of scenario.data) {
		time = item.time.split(":");
		item.timeint = parseInt(time[0]) * 3600 + parseInt(time[1]) * 60 + parseInt(time[2]);
		if (item.timeint > scenario.maxTime) scenario.maxTime = item.timeint;
	}
	var deb=0;
}
function playerInit() {
	try {
		scenarioNames = [
			"init",
			"engine_ready",
			"route_in",
			"transit",
			"arrival",
			"route_out",
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

function playerStart(scenarioName) {
	scenario = playerGet(scenarioName);
	if (!scenario) return;
	scenario.starttime = data.time;
	scenario.state = "play";
	console.log(`start playing scenario : ${scenarioName}`)
}
module.exports.playerStart = playerStart;

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
	if (data.time > scenario.starttime + scenario.maxTime) {
		scenario.state = "idle";
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
		for (stage of data.flow) {
			if (stage.state === "active") {
				stage.timeSec --;
				if (stage.timeSec > 0) {
					timeMax = stage.timeMax*60;
					stage.progress = Math.floor((timeMax-stage.timeSec)*100/timeMax);
				}
				else stage.progress = 100;
				stage.time = Math.floor(stage.timeSec/60);
				message = messagesGet(stage.owner);
				if (!message) continue;
				if (message.state === "active") {
					message.time = stage.time;
					message.progress = stage.progress;
				}				
			}
		}
	}
}

exports.data = data;
