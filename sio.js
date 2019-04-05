
module.exports = (http, model) =>
{
	const io = require('socket.io')(http);
	io.on('connect', (socket) => {
		socket.model = model;
		console.log('io.on(connect) : ', socket.id);
		// get abonent structure
		var abon = socket.model.abonGet(socket.id);
		// or create a new one
		if (!abon) {
			socket.model.data.abonents.push({});
			abon = socket.model.data.abonents[socket.model.data.abonents.length-1];
			abon.id = socket.id;
			abon.name = 'unnamed';
		}
		// handle disconnect
		socket.on('disconnect', (reason) => {
			console.log(`abonent ${abon.name}(${abon.id}) disconnected on reason: ${reason}`);
			socket.model.abonDelete(socket.id);
		});
		// handle an error
		socket.on('error', (error) => {
			console.log(`abonent ${abon.name}(${abon.id}) has an error: ${error}`);
			socket.model.abonDelete(socket.id);
		});
		// handle incoming
		socket.on('client2server', (data) => {
			var text = {};
			try {
				obj = JSON.parse(data);
				function response(obj) {
					answer = {};
					if (obj.response && obj.response === "true") {
						answer = JSON.stringify(socket.model.data);						
					}
					socket.emit('server2client', answer);
				}
				if (obj.command) {
					if (obj.command === 'subscribe') {
						abon.name = obj.name;
						console.log(`socket ${abon.id} introduced as: ${abon.name}`);
						response(obj);
					}
					if (obj.command === 'reset') {
						socket.model.reset();
						console.log(`abonent ${abon.name}(${abon.id}) reset the flow`);
						response(obj);
					}					
					if (obj.command === 'play') {
						socket.model.reset();
						socket.model.play();
						console.log(`abonent ${abon.name}(${abon.id}) started the flow`);
						response(obj);
					}
					if (obj.command === 'pause') {
						socket.model.pause();
						console.log(`abonent ${abon.name}(${abon.id}) paused the flow`);
						response(obj);
					}					
					if (obj.command === 'complete') {
						var stage = 'any';
						if (obj.stage) stage = obj.stage;
						socket.model.complete(stage);
						console.log(`abonent  ${abon.name}(${abon.id}) completed current stage`);
						response(obj);
					}
				}
			}
			catch(error) {
				console.log(`socket ${socket.id} receive error: ${error}, data=${data}`);
				text=`{"error":"${error}"`;
			}
			socket.emit('server2client', text);
		});
	});
}


