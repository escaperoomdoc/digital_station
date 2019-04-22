// init app
var app = new PIXI.Application(1280, 720, {backgroundColor: 0xeeeeee}/*, { transparent: true }*/);
document.body.appendChild(app.view);


// 1 minute = 10 pixels => 2 hours = 120 minutes = 1200 pixels
var stages = [
	{name: "start", alias: "начало", next: ["engine_ready"]},
	{name: "engine_ready", alias: "ТЧМ: приемка локомотива", next: ["route_in"]},
	{name: "route_in", alias: "ДСП: маршрут на путь", next: ["arrival"]},
	{name: "arrival", alias: "ТЧМ: заезд под состав", next: ["documents", "magistral"]},
	{name: "documents", alias: "СТЦ: комм.документы", next: ["documents", "magistral"]},
	{name: "magistral", alias: "ВЧДЭХ: проверка магистрали", next: ["pressure_head", "pressure_tail"]},
	{name: "pressure_head", alias: "ТЧМ: давление в кабине", next: ["brakes"]},
	{name: "pressure_tail", alias: "ВЧДЭХ: давление в хвосте", next: ["brakes"]},
	{name: "brakes", alias: "ТЧМ: торможение", next: ["brakes_head", "brakes_tail"]},
	{name: "brakes_head", alias: "ВЧДЭГ: опробование торм.", next: ["brakes_release"]},
	{name: "brakes_tail", alias: "ВЧДЭХ: опробование торм.", next: ["brakes_release"]},
	{name: "brakes_release", alias: "ТЧМ: отпуск", next: ["release_head", "release_tail"]},
	{name: "release_head", alias: "ВЧДЭГ: проверка отпуска", next: ["vu45"]},
	{name: "release_tail", alias: "ВЧДЭХ: проверка отпуска", next: ["vu45"]},
	{name: "vu45", alias: "ТЧМ: получение справки ВУ45", next: ["unshoe"]},
	{name: "unshoe", alias: "СИГ: снятие закрепления", next: ["depart_ready"]},
	{name: "depart_ready", alias: "ТЧМ: готовность отправления", next: ["route_out"]},
	{name: "route_out", alias: "ДСП: маршрут со станции", next: ["departure", "accompaniment"]},
	{name: "departure", alias: "ТЧМ: отправление", next: ["finish"]},
	{name: "accompaniment", alias: "ВЧДЭГ: сопровождение", next: ["finish"]},
	{name: "finish", alias: "конец", next: null},
];

var offsetX = 0;
var offsetY = 0;
var headerHeight = 50;
var headerWidth = 220;
var itemHeight = 30;
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
	this.graphics.lineStyle(1, 0x808080);
	this.textAlias = [];
	this.textTimes = [];
	for (var x = 0; x <= 12; x ++) {
		this.graphics.moveTo(headerWidth + minuteWidth * x * 10, headerHeight);
		this.graphics.lineTo(headerWidth + minuteWidth * x * 10, headerHeight + itemHeight * stages.length);
		var text = new PIXI.Text(x * 10 + ' мин', styleMinutes);
		text.anchor.set(0.0, 0.5);
		text.x = headerWidth + minuteWidth * x * 10;
		text.y = headerHeight - 15;
		this.textTimes.push(text);
	}
	for (var y = 0; y <= stages.length; y ++) {
		this.graphics.moveTo(headerWidth, headerHeight + y * itemHeight);
		this.graphics.lineTo(headerWidth + minuteWidth * 12 * 10, headerHeight + y * itemHeight);
		if (y >= stages.length) break;
		var text = new PIXI.Text(stages[y].alias, styleAlias);
		text.anchor.set(0.0, 0.5);
		text.x = 0;
		text.y = headerHeight + y * itemHeight + itemHeight / 2;
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

/*
	// screen size is constant
	const screenWidth = 1280;
	const screenHeight = 720;
	const contentRect = {x: 240, y:180, w: 850, h: 320};

	// text style is constant
	var textStyle = new PIXI.TextStyle({
		fontFamily: 'Lucidia Console',
		fontSize: 40,
		fontStyle: 'normal',
		fontWeight: 'bold',
		fill: ['#28af9f', '#30dfae'],
		stroke: '#4a1850',
		strokeThickness: 5,
		dropShadow: true,
		dropShadowColor: '#000000',
		dropShadowBlur: 4,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 6,
		wordWrap: true,
		wordWrapWidth: 900
	});

	// create a new Sprite from an image path.
	var Frame = function() {
		// init members
		this.bg = PIXI.Sprite.fromImage('assets/bg.jpg');
		this.bg.anchor.set(0.5);
		this.bg.x = screenWidth / 2;
		this.bg.y = screenHeight / 2;
		this.bg_alter = PIXI.Sprite.fromImage('assets/bg_alter.jpg');
		this.bg_alter.anchor.set(0.5);
		this.bg_alter.x = screenWidth / 2;
		this.bg_alter.y = screenHeight / 2;
		this.maskcoords = [
			{x: 80, y: 60, dx: 0, dy: 2},
			{x: 80, y: 640, dx: 2, dy: 0},
			{x: 1200, y: 640, dx: 0, dy: -2},
			{x: 1200, y: 60, dx: -2, dy: 0}
		];
		this.maskcoord_step = 0;
		this.mask = PIXI.Sprite.fromImage('assets/mask.png');	
		this.mask.anchor.set(0.5);
		this.mask.x = this.maskcoords[this.maskcoord_step].x;
		this.mask.y = this.maskcoords[this.maskcoord_step].y;
		this.activeSprites = false;
		this.bg_alter.mask = this.mask;
		// stageIn and stage Out
		this.stageCreate = function() {
			this.activeSprites = true;
			this.bg.hackerProperty = "frame";
			this.bg_alter.hackerProperty = "frame";
			this.mask.hackerProperty = "frame";
			app.stage.addChild(this.bg);
			app.stage.addChild(this.mask, this.bg_alter);
		}
		this.stageClear = function() {
			this.activeSprites = false;
			for (var i = app.stage.children.length - 1; i >= 0; i--) {
				if (app.stage.children[i].hackerProperty === "frame") app.stage.removeChild(app.stage.children[i]);
			};	
		}	
		// animate mask
		this.animate = function() {
			if (this.activeSprites) {
				this.mask.x = this.mask.x + this.maskcoords[this.maskcoord_step].dx;
				this.mask.y = this.mask.y + this.maskcoords[this.maskcoord_step].dy;
				if (this.mask.x == this.maskcoords[(this.maskcoord_step + 1) % 4].x) {
					if (this.mask.y == this.maskcoords[(this.maskcoord_step + 1) % 4].y) {
						this.maskcoord_step = (this.maskcoord_step + 1) % 4;
					}
				}
			}
		}
	};

	var Subtitle = function(initialText) {
		// init members
		this.text = initialText;
		this.textSize = this.text.length;
		this.currentChar = 0;
		this.animationCycle = 0;
		this.textSprite = new PIXI.Text(this.text, textStyle);
		this.textSprite.x = 220;
		this.textSprite.y = 500;
		this.textDelay = 200;
		this.retype = false;
		// set new text
		this.setText = function(initialText, textDelay, retype) {
			this.retype = retype;
			this.text = initialText
			this.textSize = this.text.length;
			this.currentChar = 0;
			this.animationCycle = 0;
			this.textSprite.text = "";
			this.textDelay = textDelay;
		}
		this.activeSprites = false;
		// stageIn and stage Out
		this.stageCreate = function() {
			this.activeSprites = true;
			this.textSprite.hackerProperty = "subtitle";
			app.stage.addChild(this.textSprite);
			this.tmprev = performance.now();
		}
		this.stageClear = function() {
			this.activeSprites = false;
			for (var i = app.stage.children.length - 1; i >= 0; i--) {
				if (app.stage.children[i].hackerProperty === "subtitle") app.stage.removeChild(app.stage.children[i]);
			};	
		}
		this.animate = function() {
			if (this.activeSprites) {
				if (!this.retype && this.currentChar >= this.textSize - 1) return;
				if (performance.now() - this.tmprev >= this.textDelay) {
					this.tmprev = performance.now();
					this.currentChar ++;
					this.textSprite.text = this.text.substring(0, this.currentChar) + "_";
					if (this.retype && this.currentChar >= this.textSize - 1) this.currentChar = 0;
				}
			}
		}
	};

	var Codes = function(codesArray, fixTimes) {
		// init members
		this.codesArray = codesArray;
		this.fixTimes = fixTimes;
		this.textSprite = [];
		this.animationCycle = 0;
		this.currentCode = 0;
		this.counter = 0;
		this.scanFinished = false;
		for (var i = 0; i < codesArray.length; i ++) {
			var code = new PIXI.Text("", textStyle);
			code.x = 220 + 100 * i;
			code.y = 550;
			this.textSprite.push( code );
		}
		// set new text
		this.activeSprites = false;
		// stageIn and stage Out
		this.stageCreate = function() {
			this.activeSprites = true;
			for (item of this.textSprite) {
				item.hackerProperty = "code";
				app.stage.addChild(item);
			}
			this.currentCode = 0;
			this.tmprev = performance.now();
			this.tmstart = performance.now();
		}
		this.stageClear = function() {
			this.animationCycle = 0;
			this.currentCode = 0;
			this.counter = 0;
			this.scanFinished = false;
			this.activeSprites = false;
			for (item of this.textSprite) {
				item.text = "";
			}		
			for (var i = app.stage.children.length - 1; i >= 0; i--) {
				if (app.stage.children[i].hackerProperty === "code") app.stage.removeChild(app.stage.children[i]);
			};	
		}
		this.maxCounter = 0;
		this.animate = function() {
			var now = performance.now();
			if (this.activeSprites && this.currentCode < codesArray.length) {
				if (now - this.tmprev >= 200) {
					this.tmprev = now;
					this.textSprite[this.currentCode].text = Math.floor( Math.random() * 32 );
					if (now - this.tmstart >= this.fixTimes[this.currentCode]) {
						this.textSprite[this.currentCode].text = this.codesArray[this.currentCode];
						this.currentCode ++;
						if (this.currentCode >= codesArray.length) hackerStage.gotoFirewall();
					}
				}
			}
		}
	};

	var Stick = function() {
		// init members
		this.textureStick = PIXI.Texture.fromImage('assets/stick.png');
		this.stick = new PIXI.Sprite(this.textureStick);
		this.stick.anchor.set(0.5);
		this.stick.x = contentRect.x + contentRect.w / 2;
		this.stick.y = contentRect.y + contentRect.h / 2;
		this.activeSprites = false;
		// stageIn and stage Out
		this.stageCreate = function() {
			this.activeSprites = true;
			this.stick.hackerProperty = "stick";
			app.stage.addChild(this.stick);
		}
		this.stageClear = function() {
			this.activeSprites = false;
			for (var i = app.stage.children.length - 1; i >= 0; i--) {
				if (app.stage.children[i].hackerProperty === "stick") app.stage.removeChild(app.stage.children[i]);
			};	
		}
		// animate bricks and text
		this.animate = function() {
			if (this.activeSprites) {
				this.stick.rotation += 0.01;
			}
		}
	};

	var Firewall = function() {
		// init members
		this.textureBrick = PIXI.Texture.fromImage('assets/brick.png');
		this.textureBrickHacked = PIXI.Texture.fromImage('assets/brick_hacked.png');
		this.brickWidth = 160;
		this.brickHeight = 64;
		this.bricksCount = 5;
		this.bricks = [];
		this.texts = [];
		for (var y = 0; y < this.bricksCount; y ++ ) {
			for (var x = 0; x < this.bricksCount; x ++ ) {
				// generate brick
				const brick = new PIXI.Sprite(this.textureBrick);
				brick.anchor.set(0.5);
				brick.x = x * this.brickWidth + contentRect.x;
				brick.y = y * this.brickHeight + contentRect.y;
				if (y % 2) brick.x += this.brickWidth / 2;
				brick.interactive = true;
				brick.buttonMode = true;
				brick.animateRotation = false;
				brick.hacked = false;
				brick.on('pointerdown', onButtonDown);
				this.bricks.push(brick);
			}
			// generate text
			const text = new PIXI.Text('0', textStyle);
			text.x = this.brickWidth * this.bricksCount + contentRect.x + this.brickWidth / 2;
			text.y = y * this.brickHeight + contentRect.y;
			text.anchor.set(0.5);
			text.hackResult = 0;
			this.texts.push(text);
		}
		// tap/click handler
		function onButtonDown() {
			this.animateRotation = true;
		}	
		this.activeSprites = false;
		// stageIn and stage Out
		this.stageCreate = function() {
			this.activeSprites = true;
			for(brick of this.bricks) {
				brick.hackerProperty = "firewall";
				app.stage.addChild(brick);
			}
			for(text of this.texts) {
				text.hackerProperty = "firewall";
				app.stage.addChild(text);
			}
		}
		this.stageClear = function() {
			this.activeSprites = false;
			for(brick of this.bricks) {
				brick.hacked = false;
				brick.texture = this.textureBrick
			}		
			for(text of this.texts) {
				text.hackResult = 0;
				text.text = "0";
			}		
			for (var i = app.stage.children.length - 1; i >= 0; i--) {
				if (app.stage.children[i].hackerProperty === "firewall") app.stage.removeChild(app.stage.children[i]);
			};	
		}
		// animate bricks and text
		this.animate = function() {
			if (this.activeSprites) {
				// animate bricks
				var updateText = false;
				for (index in this.bricks) {
					brick = this.bricks[index];
					textIndex = ~~(index/this.bricksCount);
					if (brick.animateRotation) {
						brick.rotation += 0.1;
						this.texts[textIndex].rotation += 0.1;
						if (brick.rotation >= 3.1) {
							brick.rotation = 0;
							this.texts[textIndex].rotation = 0;
							brick.animateRotation = false;
							brick.hacked = !brick.hacked;
							if (brick.hacked) brick.texture = this.textureBrickHacked;
							else brick.texture = this.textureBrick;
							updateText = true;
						}
					}
				}
				// render text
				var offset = 4;
				var result = 0;
				var textCount = 0;
				if (updateText) {
					for (brick of this.bricks) {
						if (brick.hacked) {
							result |= (1<<offset);
						}
						offset --;
						if (offset < 0) {
							this.texts[textCount].hackResult = result;
							this.texts[textCount].text = result.toString();
							offset = 4;
							result = 0;
							textCount ++;
						}
					}
				}
				if (this.checkSolution()) {
					hackerStage.gotoAccess();
				}
			}
		}
		// animate bricks and text
		this.checkSolution = function() {
			try {
				for (var i = 0; i < this.bricksCount; i ++) {
					if (this.texts[i].hackResult !== codes.codesArray[i]) return false;
				}
				return true;
			}
			catch(error) {
				return false;
			}
		}	
	};

	var Video = function(videoFileName) {
		// init members
		this.videoFileName = videoFileName;
		this.texture = PIXI.Texture.fromVideo(this.videoFileName);
		this.texture.baseTexture.source.loop = true;
		this.texture.baseTexture.source.autoplay = false;
		this.videoSprite = new PIXI.Sprite(this.texture);
		this.videoSprite.x = 130;
		this.videoSprite.y = 113;
		this.videoSprite.width = 1027;
		this.videoSprite.height = 488;
		this.videoSprite.alfa = 0.5;
		this.activeSprites = false;
		this.texture.baseTexture.source.pause();
		// stageIn and stage Out
		this.stageCreate = function() {
			this.activeSprites = true;
			this.videoSprite.hackerProperty = this.videoFileName;
			app.stage.addChild(this.videoSprite);
			this.texture.baseTexture.source.currentTime = 0;
			this.texture.baseTexture.source.play();
		}
		this.stageClear = function() {
			this.texture.baseTexture.source.pause();
			this.activeSprites = false;
			for (var i = app.stage.children.length - 1; i >= 0; i--) {
				if (app.stage.children[i].hackerProperty === this.videoFileName) app.stage.removeChild(app.stage.children[i]);
			}
		}
		this.texture.baseTexture.source.onplay = () => {
			if(!this.activeSprites) this.texture.baseTexture.source.pause();
		}
		this.animate = function() {
			var aaa = 0;
		}
	};

	// construction
	frame = new Frame();
	subtitle = new Subtitle('');
	stick = new Stick();
	securityVideo = new Video('assets/security.mp4');
	firewall = new Firewall();
	codes = new Codes([13, 10, 25, 14, 31], [5600, 10400, 15500, 20500, 25500]);
	attackVideo = new Video('assets/attack.mp4');

	// frame is always on
	frame.stageCreate();

	// timer event
	app.ticker.add(function() {
		frame.animate();
		subtitle.animate();
		stick.animate();
		firewall.animate();
		codes.animate();
		securityVideo.animate();
		attackVideo.animate();	
	});

	// stages selector
	var HackerStage = function() {
		function clearAll() {
			subtitle.stageClear();
			stick.stageClear();
			securityVideo.stageClear();
			attackVideo.stageClear();
			firewall.stageClear();
		}
		this.gotoDisabled = function() {
			clearAll();
			codes.stageClear();
			subtitle.setText('MOBILE ASSISTANT IS NOT ACTIVE....', 300, true);
			subtitle.stageCreate();
			if (socket) socket.emit('client2server', '{"name":"hacker","command":"set ain.hacker.state 0"}');
		}
		this.gotoStick = function() {
			clearAll();
			codes.stageClear();
			stick.stageCreate();
			subtitle.stageCreate();
			subtitle.setText('USE THE HACKER MODULE TO SCAN CODE SEQUENCE........', 100, true);
			if (socket) socket.emit('client2server', '{"name":"hacker","command":"set ain.hacker.state 1"}');
		}
		this.gotoScan = function() {
			clearAll();
			codes.stageClear();
			securityVideo.stageCreate();
			subtitle.stageCreate();
			codes.stageCreate();
			subtitle.setText('SCANNING.......', 100, true);
			if (socket) socket.emit('client2server', '{"name":"hacker","command":"set ain.hacker.state 2"}');
		}
		this.gotoFirewall = function() {
			clearAll();
			firewall.stageCreate();
			subtitle.stageCreate();
			subtitle.setText('ACCESS DENIED! HACK THE FIREWALL....', 100, false);
			if (socket) socket.emit('client2server', '{"name":"hacker","command":"set ain.hacker.state 3"}');
		}
		this.gotoAccess = function() {
			clearAll();
			codes.stageClear();
			subtitle.stageCreate();
			subtitle.setText('ACCESS GRANTED! DOOR IS UNLOCKED....', 200, false);
			if (socket) socket.emit('client2server', '{"name":"hacker","command":"set ain.hacker.state 4"}');
		}
		this.gotoAttack = function() {
			clearAll();
			codes.stageClear();
			attackVideo.stageCreate();
			if (socket) socket.emit('client2server', '{"name":"hacker","command":"set ain.hacker.state 5"}');
		}		
	};
	hackerStage = new HackerStage();
	hackerStage.gotoDisabled();
*/


function onUpdate(model) {
}

