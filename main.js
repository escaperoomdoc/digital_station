
// init express application and server components
const path = require('path');
const express = require("express");
const app = express();
const http = require('http').Server(app);
const sio = require('./sio');
var model = require('./model');
app.use(express.json());

// new template system...
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.get('/:id', function(req, res) {
	try {
		if (req.params.id == "dsp") res.render("dsp"); else
		if (req.params.id == "debug") res.render("debug"); else
		res.render("mobile", { user: req.params.id });
	}
	catch(error) {
		console.log(error);
	}
});

app.get('/*', (req, res) => {
	res.sendFile(__dirname + "/views" + req.url);
	console.log('transfered file ' + req.url);
})


model.reset();
sio(http, model);

http.listen(80, () => {
	console.log('HTTP server listening...');
});

var tmtick = 0;
setInterval(() => {
	tmtick += 100 * model.data.booster;
	if (tmtick >= 1000) {
		if (model.data.state === 'play' ) model.tick();
		tmtick = 0;
	}
}, 100);

