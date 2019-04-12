var sig = new Vue({
    el: 'main',
    data: {
        ways: [
            // { "way": "1П", "stock": "Технический осмотр", "status": "operation", "active": false },
            // { "way": "2П", "stock": "Опробование тормозов", "status": "operation", "active": false },
            // { "way": "3П", "stock": "Нет данных", "status": "free", "active": false },
            // { "way": "4П", "stock": "Нет данных", "status": "free", "active": false },
            // { "way": "5П", "stock": "4564 — Опробование тормозов", "status": "operation", "active": true }
        ],
        selectedWay: 100
    },
    methods: {
        confirm() {
            socket.emit('client2server', '{"command":"complete","getmodel":"true"}');
            this.selectedWay = 100;
        },
        cancel() {

        },
        changeWay(i) {
            if (this.selectedWay == i) this.selectedWay = 100;
            else this.selectedWay = i;
        }
    }
});

function updateSigList(obj) {
    sig.ways.splice(0, sig.ways.length);
    obj.stocks.forEach(function(item) {
        let way = item.way;
        let stock = "";
        let status = "";

        if (!item.status) {
            stock = item.stock + " — " + item.status;
            status = "operation";
        }
        else {
            stock = item.stock;
            status = "free";
        }
        let active = item.active;

        sig.ways.push({"way": way, "stock": stock, "status": status, "active": active});
    });

}