
// init express application and server components
const path = require('path');
const express = require("express");
const app = express();
const http = require('http').Server(app);
const sio = require('./sio');
var model = require('./model');
app.use(express.json());

/*
// old static html...
app.get('/abonents/:id', (req, res) => {
	res.sendFile(`${__dirname}/abonents/${req.params.id}.html`);
})
app.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, req.url));
	console.log('transfered file ' + req.url);
})
*/


// new template system...
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.get('/:id', function(req, res) {
	try {
		if (req.params.id == "dsp") res.render("dsp"); else
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

setInterval(() => {
	if (model.data.state === 'play' ) model.tick();
}, 1000);


