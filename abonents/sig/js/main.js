var sig = new Vue({
    el: '#app',
    data: {
        ways: [
            // { "way": "1П", "stock": "6368", "status": "operation", "status_alias": "Технический осмотр", "active": false },
            // { "way": "2П", "stock": "8543", "status": "operation", "status_alias": "Опробование тормозов", "active": false },
            // { "way": "3П", "stock": "—", "status": "free", "status_alias": "Нет данных", "active": false },
            // { "way": "4П", "stock": "—", "status": "free", "status_alias": "Нет данных", "active": false },
            // { "way": "5П", "stock": "4564", "status": "operation", "status_alias": "Опробование тормозов", "active": true }
        ],
        message: {
            // "state": "active",
            // "time": "5",
            // "text": "Текст сообщения"
        },
        selectedWay: NaN,
        time: "СТОП",
        name: "Должность",
        fio: "ФИО"
    },
    methods: {
        confirm() {
            socket.emit('client2server', '{"command":"complete","getmodel":"true"}');
            this.selectedWay = NaN;
        },
        cancel() {

        },
        changeWay(i) {
            if (this.selectedWay == i) this.selectedWay = NaN;
            else this.selectedWay = i;
        }
    }
});

var audio = document.getElementsByTagName("audio")[0];

function updateSigList(obj) {
    sig.time = obj.timestring;
    sig.ways.splice(0, sig.ways.length);
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

        sig.ways.push({"way": way, "stock": stock, "status": status, "status_alias": status_alias, "active": active});
    });

    obj.messages.forEach(function(item) {
        if (item.type === "sig"){
            if ( (sig.message.state !== "ready") && (item.state === "ready") ||
                (sig.message.state !== "active") && (item.state === "active"))
            {
                sig.ways.forEach(function(item, i) {
                   if  (item.active === true) {
                       sig.selectedWay = i;
                   }
                });
                audio.play();
                navigator.vibrate(1000);
            }
            sig.message.state = item.state;
            sig.message.time = item.time;
            sig.message.text = item.text;
        }
    });

    sig.fio = obj.messages[1].fio;
    sig.name = obj.messages[1].name;
}
