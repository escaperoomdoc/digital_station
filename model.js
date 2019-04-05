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

module.exports.flowReset = () => {
	for(var value of data.flow) {
		value.state = "idle";
	}
}

module.exports.flowComplete = (stage) => {
	var item = data.flow[stage];
	if (item && item.state === 'active') {
		item.state = "completed";
		for(var next of item.next) {
			flow[next].state = "active";
		}
	}
}

exports.data = data;
