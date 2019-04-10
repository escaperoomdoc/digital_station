
// init express application and server components
const path = require('path');
const express = require("express");
const app = express();
const http = require('http').Server(app);
const sio = require('./sio');
var model = require('./model');
app.use(express.json());

//app.use('/abonents', express.static(__dirname));
app.get('/abonents/:id', (req, res) => {
	res.sendFile(`${__dirname}/abonents/${req.params.id}.html`);
})
app.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, req.url));
	console.log('transfered file ' + req.url);
})

model.reset();
sio(http, model);

http.listen(80, () => {
	console.log('HTTP server listening...');
});

setInterval(() => {
	model.tick();
}, 1000);


