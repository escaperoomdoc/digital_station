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
        }
    },
    methods: {

    },
    computed: {

    }
});


function updateScreen(obj) {
    /* TIME */
    screen.time = obj.timestring;

    /* FLOWCHART */
    obj.flow.forEach(function(item) {
        let name = item.name;
        let state = item.state;
        let time = item.time;
        if (time !== undefined && time !== "" && time < 0) state = "fail";

        screen.flow[name].state = state;
        screen.flow[name].time = time;
    });

    /* NAME */
    for (message of obj.messages ) {
        if (message.type === "tcm" ) {
            screen.fio = message.fio;
            screen.name = message.name;
            break;
        }
    }
}