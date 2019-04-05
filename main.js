
// init express application and server components
const fs = require('fs');
const path = require('path');
const express = require("express");
const app = express();
const http = require('http').Server(app);
const sio = require('./sio');
var model = require('./model');

app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

app.get('/abonent/:id', function(req, res) {
	res.sendFile(`${__dirname}/frontend/${req.params.id}/index.html`);
});

model.reset();
sio(http, model);

http.listen(80, () => {
	console.log('HTTP server listening...');
});


