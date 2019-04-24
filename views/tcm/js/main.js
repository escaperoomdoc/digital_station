var screen = new Vue({
    el: '.screen',
    data: {
        time: "СТОП",
        name: "Должность",
        fio: "ФИО",
        flow : {
            "engine_ready": {
                "state": "idle",
            },
            "arrival": {
                "state": "idle",
            },
            "pressure_head": {
                "state": "idle",
            },
            "brakes": {
                "state": "idle",
            },
            "brakes_release": {
                "state": "idle",
            },
            "vu45": {
                "state": "idle",
            },
            "depart_ready": {
                "state": "idle",
            },
            "departure": {
                "state": "idle",
            },
        },
        message: {
            "state": "idle",
            "time": "5",
            "text": "Текст сообщения",
            "progress": "50"
        },
        status: "Загрузка..."

    },
    methods: {
        confirm: function () {
            socket.emit('client2server', '{"command":"complete"}');
        },
        cancel: function () {
            
        },
        progressBar: function() {
            if (this.message.state=='active' && (this.message.time >= 0)) {
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

    }
});

var audio = document.getElementsByTagName("audio")[0];

function updateScreen(obj) {
    /* TIME */
    screen.time = obj.timestring;

    /* FLOWCHART */
    obj.flow.forEach(function(item) {
        let name = item.name;
        let state = item.state;
        let time = item.time;
        if (time !== undefined && time !== "" && time < 0) state = "fail";

        if (screen.flow[name] !== undefined) {
            screen.flow[name].state = state;
            screen.flow[name].time = time;
        }
    });

    /* NAME */
    for (message of obj.messages ) {
        if (message.type === "tcm" ) {
            screen.fio = message.fio;
            screen.name = message.name;
            break;
        }
    }

    /* MESSAGE */
    obj.messages.forEach(function(item) {
        if (item.type === "tcm"){
            if ( (screen.message.state !== "ready") && (item.state === "ready") ||
                (screen.message.state !== "active") && (item.state === "active"))
            {
                audio.play();
            }
            screen.message.state = item.state;
            screen.message.time = item.time;
            screen.message.text = item.text;
            screen.message.progress = item.progress;
        }
    });

    /* STATUS */
    obj.stocks.forEach(function(item) {
        if (item.active) {
            screen.status = item.status;
        }
    });
}