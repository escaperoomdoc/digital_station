abonsAliases = [];
abonsAliases["sig"] = "Сигналист";
abonsAliases["vcdeg"] = "ВЧДЭ головной";
abonsAliases["vcdeh"] = "ВЧДЭ хвостовой";
abonsAliases["tcm"] = "Машинист";
abonsAliases["dsp"] = "ДСП";
abonsAliases["stc"] = "Оператор СТЦ";
abonsAliases["gir"] = "Анализ ГИР";

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
			abon.alias = 'Регистрация...';
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
			try {
				obj = JSON.parse(data);
				function response(obj) {
					answer = JSON.stringify(socket.model.data, (key, value) => {
						return (key === 'next' || key === 'wait') ? null : value;
					})
					socket.emit('server2client', answer);
				}
				if (obj.name) {
					if (abon.name !== obj.name) {
						abon.name = obj.name;
						try {
							abon.alias = abonsAliases[abon.name];
						}
						catch(error) {
							abon.alias = "John Doe";
						}
						console.log(`socket ${abon.id} introduced as: ${abon.name} - "${abon.alias}"`);
					}					
					response(obj);
				}
				if (obj.command) {
					if (obj.command === 'reset') {
						console.log(`abonent ${abon.name}(${abon.id}) reset the flow`);
						socket.model.reset();
						response(obj);
					}					
					if (obj.command === 'play') {
						console.log(`abonent ${abon.name}(${abon.id}) started the flow`);
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
						socket.model.complete(abon.name);
						response(obj);
					}
					if (obj.command === 'timestep') {
						console.log(`abonent ${abon.name}(${abon.id}) stepped a time`);
						socket.model.tick();
						response(obj);
					}
				}
				if (obj.play) {
					console.log(`abonent ${abon.name} plays the ${obj.play}`);
					socket.model.playerStart(obj.play);
					response(obj);
				}				
			}
			catch(error) {
				console.log(`socket ${socket.id} receive error: ${error}, data=${data}`);
			}
		});
	});
}


