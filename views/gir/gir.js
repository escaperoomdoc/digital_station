// init app
var app = new PIXI.Application(1280, 720, {backgroundColor: 0xeeeeee}/*, { transparent: true }*/);
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
var headerHeight = 50;
var headerWidth = 220;
var stageHeight = 30;
var minuteWidth = 10;

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

// create a new Sprite from an image path.
var Grids = function() {
  this.graphics = new PIXI.Graphics();
  this.graphics.lineStyle(1, 0xa0a0a0);
  this.textAlias = [];
  this.textTimes = [];
  for (var x = 0; x <= 12; x ++) {
	  this.graphics.moveTo(headerWidth + minuteWidth * x * 10, headerHeight);
	  this.graphics.lineTo(headerWidth + minuteWidth * x * 10, headerHeight + stageHeight * stages.length);
	  var text = new PIXI.Text(x * 10 + ' мин', styleMinutes);
	  text.anchor.set(0.0, 0.5);
	  text.x = headerWidth + minuteWidth * x * 10;
	  text.y = headerHeight - 15;
	  this.textTimes.push(text);
  }
  for (var y = 0; y <= stages.length; y ++) {
	  this.graphics.moveTo(headerWidth, headerHeight + y * stageHeight);
	  this.graphics.lineTo(headerWidth + minuteWidth * 12 * 10, headerHeight + y * stageHeight);
	  if (y >= stages.length) break;
	  var text = new PIXI.Text(stages[y].alias, styleAlias);
	  text.anchor.set(0.0, 0.5);
	  text.x = 0;
	  text.y = headerHeight + y * stageHeight + stageHeight / 2;
	  this.textAlias.push(text);
  }
  // stageIn and stage Out
  this.stageCreate = function() {
	  this.activeSprites = true;
	  this.graphics.itemProperty = "Grids";
	  app.stage.addChild(this.graphics);
	  for (text of this.textTimes) {
		  text.itemProperty = "Grids";
		  app.stage.addChild(text);
	  }
	  for (text of this.textAlias) {
		  text.itemProperty = "Grids";
		  app.stage.addChild(text);
	  }		
  }
  this.stageClear = function() {
	  this.activeSprites = false;
	  for (var i = app.stage.children.length - 1; i >= 0; i--) {
		  if (app.stage.children[i].itemProperty === "Grids") app.stage.removeChild(app.stage.children[i]);
	  };	
  }	
  // animate mask
  this.animate = function() {
	  if (this.activeSprites) {
	  }
  }
};
grids = new Grids();
grids.stageCreate();


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
	app.stage.addChild(stage.graph);
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

function updateStageBlock(stage, timeStart) {
	stage.timeStart = timeStart;
	stage.timeWidth = stage.time > stage.timeMax ? stage.time : stage.timeMax;
	stage.timeEnd = stage.timeStart + stage.timeWidth;
	stage.x = headerWidth + stage.timeStart * minuteWidth;
	stage.w = stage.timeWidth * minuteWidth;
}

function updateStageUi(stage) {
	stage.graph.clear();
	penColor = 0xc0c0c0;
	bgColor = 0xe0e0e0;
	if (stage.state === "completed") {
		if (stage.time > stage.timeMax) bgColor = 0xff4040;
		else bgColor = 0x7fff90;
	}
	if (stage.state === "wait") {
		bgColor = 0xfffac8;
	}
	if (stage.state === "active") {
		penColor = 0x0000ff;
		if (stage.time > stage.timeMax) bgColor = 0xff4040;
		else bgColor = 0x7fff90;
	}		
	stage.graph.lineStyle(1, penColor, 1);
	stage.graph.beginFill(bgColor);
	stage.graph.drawRect(stage.x, stage.y, stage.w, stage.h, 5);
	stage.graph.endFill();

}

function updateModelUi() {
	timeScanner = 0;
	for (stage of stages) {
		for (prev of stage.prev) {
			if (prev.timeEnd > timeScanner) timeScanner = prev.timeEnd;
		}
		updateStageBlock(stage, timeScanner);
		updateStageUi(stage);
	}
}

// init model
updateModelUi();

// timer event
app.ticker.add(function() {
	grids.animate();
	for (stage of stages) {
		stage.graph.graphicsData[0].lineColor += 10;
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
	updateModelUi();
}



