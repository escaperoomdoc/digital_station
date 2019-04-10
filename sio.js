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
					if (obj.getmodel && obj.getmodel === "true") {
						answer = JSON.stringify(socket.model.data, (key, value) => {
							return (key === 'next' || key === 'wait') ? null : value;
						})
					}
					socket.emit('server2client', answer);
				}
				if (obj.command) {
					if (obj.command === 'dummy') {
						response(obj);
					}
					if (obj.command === 'subscribe') {
						abon.name = obj.name;
						console.log(`socket ${abon.id} introduced as: ${abon.name}`);
						response(obj);
					}
					if (obj.command === 'reset') {
						console.log(`abonent ${abon.name}(${abon.id}) reset the flow`);
						socket.model.reset();
						response(obj);
					}					
					if (obj.command === 'play') {
						console.log(`abonent ${abon.name}(${abon.id}) started the flow`);
						socket.model.reset();
						socket.model.play();
						response(obj);
					}
					if (obj.command === 'pause') {
						console.log(`abonent ${abon.name}(${abon.id}) paused the flow`);
						socket.model.pause();
						response(obj);
					}					
					if (obj.command === 'complete') {
						console.log(`abonent  ${abon.name}(${abon.id}) completed current stage`);
						var stage = 'any';
						if (obj.stage) stage = obj.stage;
						socket.model.complete(stage);
						response(obj);
					}
					if (obj.command === 'timestep') {
						console.log(`abonent ${abon.name}(${abon.id}) stepped a time`);
						socket.model.tick();
						response(obj);
					}
				}
			}
			catch(error) {
				console.log(`socket ${socket.id} receive error: ${error}, data=${data}`);
				text=`{"error":"${error}"`;
			}
		});
	});
}


