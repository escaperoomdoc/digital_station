var mobile = new Vue({
    el: '#app',
    data: {
        ways: [
            { "way": "", "stock": "", "status": "free", "status_alias": "Загрузка...", "active": false },
            // { "way": "2П", "stock": "8543", "status": "operation", "status_alias": "Опробование тормозов", "active": false },
            // { "way": "3П", "stock": "—", "status": "free", "status_alias": "Нет данных", "active": false },
            // { "way": "4П", "stock": "—", "status": "free", "status_alias": "Нет данных", "active": false },
            // { "way": "5П", "stock": "4564", "status": "operation", "status_alias": "Опробование тормозов", "active": true }
        ],
        message: {
            "state": "active",
            "time": "5",
            "text": "Текст сообщения",
            "progress": "50"
        },
        selectedWay: NaN,
        time: "СТОП",
        name: "Должность",
        fio: "ФИО"
    },
    methods: {
        confirm() {
            socket.emit('client2server', '{"command":"complete"}');
            this.selectedWay = NaN;
        },
        cancel() {

        },
        changeWay(i) {
            if (this.selectedWay == i) this.selectedWay = NaN;
            else this.selectedWay = i;
        },
        progressBar: function(way) {
                if (way.active && this.message.state=='active' && (this.message.time >= 0)) {
                    let progress1 = +this.message.progress;
                    if (progress1 < 0) progress1 = 0;
                    else if (progress1 > 100) progress1 = 100;
                    let progress2 = progress1 + 5;
                    let value = 'linear-gradient(to right, #7AFF90 ' + progress1 + '%, #E6FFEA ' + progress2 + '%)';
                    return { background: value};

                }
        },
    },
    computed: {
        // progressBar: {
        //     get: function (i) {
        //         if (i===4) return {background: 'linear-gradient(to right, #7AFF90 80%, #E6FFEA 90%)'}
        //     },
        //     set: function (i) {
        //         if (i===4) return {background: 'linear-gradient(to right, #7AFF90 80%, #E6FFEA 90%)'}
        //     }
        // }
        // progressBar(i) {
        //     return { background: 'linear-gradient(to right, #7AFF90 80%, #E6FFEA 90%)'};
        // },
    }
});

var audio = document.getElementsByTagName("audio")[0];

function updateList(obj, abonentType) {
    mobile.time = obj.timestring;
    mobile.ways.splice(0, mobile.ways.length);
    obj.stocks.forEach(function(item) {
        let way = item.way;
        let stock = "";
        let status = "";
        let status_alias = "";
        let active = item.active;

        if (item.status) {
            stock = item.stock;
            status_alias = item.status;
            status = "operation";
        }
        else {
            stock = "—";
            status_alias = "Нет данных";
            status = "free";
        }

        mobile.ways.push({"way": way, "stock": stock, "status": status, "status_alias": status_alias, "active": active});
    });

    obj.messages.forEach(function(item) {
        if (item.type === abonentType){
            if ( (mobile.message.state !== "ready") && (item.state === "ready") ||
                (mobile.message.state !== "active") && (item.state === "active"))
            {
                mobile.ways.forEach(function(item, i) {
                   if  (item.active === true) {
                       mobile.selectedWay = i;
                   }
                });
                audio.play();
                navigator.vibrate(1000);
            }
            mobile.message.state = item.state;
            mobile.message.time = item.time;
            mobile.message.text = item.text;
            mobile.message.progress = item.progress;
        }
    });

    for (message of obj.messages ) {
		if (message.type === abonentType ) {
			mobile.fio = message.fio;
			mobile.name = message.name;
			break;
		}
    }

}
