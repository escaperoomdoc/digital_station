var sig = new Vue({
    el: 'main',
    data: {
        ways: [
            { "way": "1П", "stock": "Технический осмотр", "status": "shunt", "active": false },
            { "way": "2П", "stock": "Опробование тормозов", "status": "shunt", "active": false },
            { "way": "3П", "stock": "Нет данных", "status": "free", "active": false },
            { "way": "4П", "stock": "Нет данных", "status": "free", "active": false },
            { "way": "5П", "stock": "4564 — Опробование тормозов", "status": "shunt", "active": true }
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