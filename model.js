var data = require('./dsm.json');

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

module.exports.reset = () => {
	var aa = 0;
	for(var value in data.flow) {
		data.flow[value].state = "idle";
	}
	data.state = "reset";
}

module.exports.play = () => {
	if (data.state === "reset") data.flow.start.state = 'active';
	if (data.state === "finished") {
		data.reset();
		data.state = "play";
	}
}

module.exports.pause = () => {
	data.flow.start.state = 'active';
	data.state = "pause";
}

module.exports.complete = (stage) => {
	var item = data.flow[stage];
	if (item && item.state === 'active') {
		item.state = "completed";
		for(var next of item.next) {
			flow[next].state = "active";
		}
	}
}

exports.data = data;
