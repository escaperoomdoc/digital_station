// init app
const screenWidth = 1280;
const screenHeight = 720;
var app = new PIXI.Application(screenWidth, screenHeight, {backgroundColor: 0xeeeeee}/*, { transparent: true }*/);
document.body.appendChild(app.view);

// stages model
var stages = [
	{name: "start", alias: "начало",nextStages: ["engine_ready"]},
	{name: "engine_ready", alias: "ТЧМ: приемка локомотива", nextStages: ["route_in"]},
	{name: "route_in", alias: "ДСП: маршрут на путь", nextStages: ["arrival"]},
	{name: "arrival", alias: "ТЧМ: заезд под состав", nextStages: ["documents", "magistral"]},
	{name: "documents", alias: "СТЦ: комм.документы", nextStages: ["depart_ready"]},
	{name: "magistral", alias: "ВЧДЭХ: проверка магистрали", nextStages: ["pressure_head", "pressure_tail"]},
	{name: "pressure_head", alias: "ТЧМ: давление в кабине", nextStages: ["brakes"]},
	{name: "pressure_tail", alias: "ВЧДЭХ: давление в хвосте", nextStages: ["brakes"]},
	{name: "brakes", alias: "ТЧМ: торможение", nextStages: ["brakes_head", "brakes_tail"]},
	{name: "brakes_head", alias: "ВЧДЭГ: опробование торм.", nextStages: ["brakes_release"]},
	{name: "brakes_tail", alias: "ВЧДЭХ: опробование торм.", nextStages: ["brakes_release"]},
	{name: "brakes_release", alias: "ТЧМ: отпуск", nextStages: ["release_head", "release_tail"]},
	{name: "release_head", alias: "ВЧДЭГ: проверка отпуска", nextStages: ["vu45"]},
	{name: "release_tail", alias: "ВЧДЭХ: проверка отпуска", nextStages: ["vu45"]},
	{name: "vu45", alias: "ТЧМ: получение справки ВУ45", nextStages: ["unshoe"]},
	{name: "unshoe", alias: "СИГ: снятие закрепления", nextStages: ["depart_ready"]},
	{name: "depart_ready", alias: "ТЧМ: готовность отправления", nextStages: ["route_out"]},
	{name: "route_out", alias: "ДСП: маршрут со станции", nextStages: ["departure", "accompaniment"]},
	{name: "departure", alias: "ТЧМ: отправление", nextStages: ["finish"]},
	{name: "accompaniment", alias: "ВЧДЭГ: сопровождение", nextStages: ["finish"]},
	{name: "finish", alias: "конец", nextStages: []}
];

// 1 minute = 10 pixels => 2 hours = 120 minutes = 1200 pixels
var offsetX = 0;
var offsetY = 0;
var headerHeight = 60;
var headerWidth = 220;
var stageHeight = 30;
var minuteWidth = 10;

var styleTitle = new PIXI.TextStyle({
	fontFamily: 'Arial',
	fontSize: 20,
	fontStyle: 'normal',
	fontWeight: 'bold',
  fill: ['#000000', '#000040'],
});

var styleMinutes = new PIXI.TextStyle({
	fontFamily: 'Arial',
	fontSize: 14,
	fontStyle: 'italic',
	fontWeight: 'bold',
  fill: ['#000000', '#000040'],
});

var styleAlias = new PIXI.TextStyle({
	fontFamily: 'Arial',
	fontSize: 14,
	fontStyle: 'normal',
	fontWeight: 'bold',
  fill: ['#000000', '#000000'],
  align: "left"
});

var styleOverflow = new PIXI.TextStyle({
	fontFamily: 'Arial',
	fontSize: 12,
	fontStyle: 'normal',
	fontWeight: 'normal',
	fill: ['#000000', '#000000'],
	align: "left"
});

// create a new Sprite from an image path.
var Bg = function() {
	this.graphics = new PIXI.Graphics();
	this.graphics.lineStyle(1, 0xa0a0a0);
	this.textAlias = [];
	this.textTimes = [];
	// horizontal blocks
	for (var y = 0; y < stages.length; y ++) {
		// blocks
		penColor = 0xc0c0c0;
		bgColor = 0xeeeeee;
		if (!(y%2)) bgColor = 0xffffff;
		var left = 0;
		var top = headerHeight + y * stageHeight;
		var width = headerWidth + minuteWidth * 12 * 10;
		var height = stageHeight;
		this.graphics.lineStyle(1, penColor, 1);
		this.graphics.beginFill(bgColor);
		this.graphics.drawRect(left, top, width, height);
		this.graphics.endFill();
		// legends
		var text = new PIXI.Text(' '+stages[y].alias, styleAlias);
		text.anchor.set(0.0, 0.5);
		text.x = 0;
		text.y = headerHeight + y * stageHeight + stageHeight / 2;
		this.textAlias.push(text);
	}
	// vertical (time) lines
	for (var x = 0; x <= 12; x ++) {
		var xStart = headerWidth + minuteWidth * x * 10;
		var yStart = headerHeight;
		var yEnd = headerHeight + stageHeight * stages.length;
		var dy = 5; 
		for (var dy = yStart; dy < yEnd; dy += 10 ) {
			this.graphics.moveTo(xStart, dy);
			this.graphics.lineTo(xStart, dy + 5);
		}
		var text = new PIXI.Text(x * 10 + ' мин', styleMinutes);
		text.anchor.set(0.0, 0.5);
		text.x = xStart;
		text.y = headerHeight - 15;
		this.textTimes.push(text);
	}
	// create title
	this.textTitle = new PIXI.Text('Станция "Цифровая" - График Исполненной Работы', styleTitle);
	this.textTitle.anchor.set(0.5);
	this.textTitle.x = (screenWidth + headerWidth)/2;
	this.textTitle.y = headerHeight / 3;
	// create timer
	this.textTimer = new PIXI.Text('00:00:00', styleTitle);
	this.textTimer.anchor.set(0.5);
	this.textTimer.x = headerWidth / 2;
	this.textTimer.y = headerHeight / 3;	
  	// put on stage
	app.stage.addChild(this.graphics);
	for (text of this.textTimes) {
		  app.stage.addChild(text);
	}
	for (text of this.textAlias) {
		app.stage.addChild(text);
	}
	app.stage.addChild(this.textTitle);
	app.stage.addChild(this.textTimer);
}
bg = new Bg();

function stageGet(name) {
	for(var stage of stages) {
		if (stage.name === name ) return stage;
	}
}

// init data
var count = 0;
for (stage of stages) {
	count ++;
	stage.state = "idle";
	stage.time = 0;
	stage.timeMax = 5;
	stage.timeStart = 0;
	stage.timeEnd = 0;
	stage.next = [];
	stage.prev = [];
	stage.y = headerHeight + count * stageHeight - stageHeight / 2;
	stage.h = stageHeight / 2;
	stage.graph = new PIXI.Graphics();
	stage.links = new PIXI.Graphics();
	stage.textOverflow = new PIXI.Text("", styleOverflow);
	stage.textOverflow.anchor.set(0.0, 0.0);
	app.stage.addChild(stage.graph);
	app.stage.addChild(stage.links);
	app.stage.addChild(stage.textOverflow);
};

// set dependencies
for (stage of stages) {
	for (nextname of stage.nextStages) {
		next = stageGet(nextname);
		if (next) {
			stage.next.push(next);
			next.prev.push(stage);
		}
	}
}

function updateStageUi(stage, timeStart) {
	stage.timeStart = timeStart;
	stage.x = headerWidth + stage.timeStart * minuteWidth;
	stage.w = (stage.time > stage.timeMax ? stage.time : stage.timeMax) * minuteWidth;
	stage.wMax = stage.timeMax * minuteWidth;
}

var activePenColor = 250;
var activePenColorDelta = -50;
function paintStage(stage) {
	// init block limit points
	stage.pointBegin = {};
	stage.pointEnd = {};
	stage.pointBegin.x = stage.x;
	stage.pointBegin.y = stage.y;
	stage.pointEnd.x = stage.x + stage.wMax;
	stage.pointEnd.y = stage.pointBegin.y;
	// draw block
	stage.graph.clear();
	penColor = 0x606060;
	bgColor = 0xc0c0c0;
	thickness = 1;
	if (stage.state === "wait" ) bgColor = 0xfffac8;
	if (stage.state === "completed" || stage.state === "active") {
		if (stage.time < stage.timeMax) bgColor = 0xc0c0c0;
	}
	stage.graph.lineStyle(1, penColor, 1);
	stage.graph.beginFill(bgColor);
	stage.graph.drawRect(stage.x, stage.y - stage.h / 2, stage.wMax, stage.h);
	stage.graph.endFill();
	var textOverflowX = stage.x + stage.wMax;
	stage.textOverflow.text = "";
	if (stage.state === "active") {
		if (stage.time < stage.timeMax) penColor = 0x008000 | activePenColor;
		else penColor = 0x800000 | activePenColor;
		thickness = 3;
	}
	if (stage.state === "completed" || stage.state === "active") {
		if (stage.time > stage.timeMax) {
			bgColor = 0xff4040;
			stage.graph.lineStyle(thickness, penColor, 1);
			stage.graph.beginFill(bgColor);
			stage.graph.drawRect(stage.x + stage.wMax, stage.y - stage.h / 2, stage.w - stage.wMax, stage.h);
			stage.graph.endFill();
			textOverflowX = stage.x + stage.w;
			stage.pointEnd.x = stage.x + stage.w;
			stage.textOverflow.text = stage.time + " из " + stage.timeMax + " мин";
		} else {
			bgColor = 0x7fff90;
			if (stage.state === "completed") bgColor = 0x308030;
			stage.graph.lineStyle(thickness, penColor, 1);
			stage.graph.beginFill(bgColor);
			stage.graph.drawRect(stage.x, stage.y - stage.h / 2, stage.time * minuteWidth, stage.h);
			stage.graph.endFill();
			stage.pointEnd.x = stage.x + stage.time * minuteWidth;
			stage.textOverflow.text = stage.time + " из " + stage.timeMax + " мин";
		}
	}
	// draw text
	stage.textOverflow.x = textOverflowX + 10;
	stage.textOverflow.y = stage.y - stage.h / 2;
	// draw links
	stage.links.clear();
	stage.links.lineStyle(3, 0x806080, 1);
	for (prev of stage.prev) {
		stage.links.drawEllipse(prev.pointEnd.x, prev.pointEnd.y, 2, 2);
		stage.links.moveTo(prev.pointEnd.x, prev.pointEnd.y);
		if (prev.pointEnd.x !== stage.pointBegin.x) {
			stage.links.lineTo(prev.pointEnd.x, stage.pointBegin.y);
		}
		stage.links.lineTo(stage.pointBegin.x, stage.pointBegin.y);
		stage.links.drawEllipse(stage.pointBegin.x, stage.pointBegin.y, 2, 2)
	}
}

function updateModelUi() {
	for (stage of stages) {
		timeEdge = 0;
		for (prev of stage.prev) {
			timeEnd = prev.timeStart + prev.timeMax;
			if (prev.state === "active" && prev.time > prev.timeMax || prev.state === "completed" ) {
				timeEnd = prev.timeStart + prev.time;
			}
			if (timeEnd > timeEdge) timeEdge = timeEnd;
		}
		updateStageUi(stage, timeEdge);
		paintStage(stage);
	}
}

// init model
updateModelUi();

// timer event
tmprev = performance.now();
app.ticker.add(function() {
	now = performance.now();
	if (now - tmprev >= 100) {
		tmprev = now;
		activePenColor += activePenColorDelta;
		if (activePenColorDelta < 0 && activePenColor <= 0 ||
			activePenColorDelta > 0 && activePenColor >= 250 ) activePenColorDelta = - activePenColorDelta; else
		for (stage of stages) {
			if (stage.state === "active") paintStage(stage)
		}
	}
});


function onUpdate(model) {
	for (flow of model.flow) {
		stage = stageGet(flow.name);
		stage.timeMax = flow.timeMax;
		stage.time = flow.timeMax - flow.time;
		stage.progress = flow.progress;
		stage.state = flow.state;
	}
	bg.textTimer.text = model.timestring;
	updateModelUi();
}



