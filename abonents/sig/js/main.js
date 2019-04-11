var sig = new Vue({
    el: 'main',
    data: {
        test: "test"
    },
    methods: {
        confirm() {
            alert("ok");
            socket.emit('client2server', '{"command":"complete","getmodel":"true"}');
        },
        cancel() {

        }
    }
});