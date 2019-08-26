<template>
  <div id="app">
    <header>
      <div>
        <div>Станция «Цифровая»</div>
        <div>{{ time }}</div>
      </div>
      <div>
        <div>{{ name }}</div>
        <div>{{ fio }}</div>
      </div>
    </header>
    <main>
      <ul>
        <li class="list list_header">
          <div>Путь</div>
          <div>Состав</div>
          <div>Статус</div>
        </li>
        <div v-for = "(way, i) in ways" :key="i">
          <li class="list" @click="changeWay(i)" :class="['list_'+ways[i].status,
                                                               {'list_active': ways[i].active},
                                                               {'list_ready_state': ways[i].active && message.state=='ready'},
                                                               {'list_active_state': ways[i].active && message.state=='active' && message.time >= 0},
                                                               {'list_fail_state': ways[i].active && message.state=='active' && message.time < 0}]"
              :style="progressBar(way)">
            <div>{{ ways[i].way }}</div>
            <div>{{ ways[i].stock }}</div>
            <div>{{ ways[i].status_alias }}</div>
            <div v-if="ways[i].active && message.state=='active'" class="timeActive">{{ message.time }} мин</div>
          </li>
          <transition name="submenu">
            <div class="submenu" v-if="i == selectedWay" style="overflow: hidden">
              <p v-if="ways[i].status=='operation' && !ways[i].active">Работают другие бригады</p>
              <p v-if="ways[i].status=='free'">Работы не ведутся</p>
              <p v-if="ways[i].active && message.state=='idle'">Ожидание команды...</p>
              <p v-if="ways[i].active && message.state!='idle'">{{ message.text }}</p>
              <div class="buttons" v-if="ways[i].active && message.state=='active'">
                <button class="confirm" @click="confirm">OK</button>
                <button class="cancel" @click="cancel">Cancel</button>
              </div>


            </div>
          </transition>
        </div>
      </ul>
    </main>

  </div>
</template>

<script>
export default {
  data: () => ({
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
  }),
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
    updateList(obj, abonentType) {
      this.time = obj.timestring;
      this.ways.splice(0, this.ways.length);
      for(let item of obj.stocks) {
        let way = item["way"];
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

        this.ways.push({"way": way, "stock": stock, "status": status, "status_alias": status_alias, "active": active});
      }

      for(let item of obj.messages) {
        if (item.type === abonentType){
          if ( (this.message.state !== "ready") && (item.state === "ready") ||
                  (this.message.state !== "active") && (item.state === "active"))
          {
            for (let i = 0; i < this.ways.length; i++) {
              let item = this.ways[i];
              if  (item.active === true) {
                this.selectedWay = i;
              }
            }
            console.log('Message!');
            try {
              audio.play();
              navigator.vibrate(1000);
            }
            catch(error) {
              console.log('ERROR (audio or vibrate): ' + error);
            }
          }
          this.message.state = item.state;
          this.message.time = item.time;
          this.message.text = item.text;
          this.message.progress = item.progress;
        }
      }

      for (let message of obj.messages ) {
        if (message.type === abonentType ) {
          this.fio = message.fio;
          this.name = message.name;
          break;
        }
      }

    },
  },
  mounted() {
    let vue = this;
    socket.on('server2client', function(data) {
      try {
        let obj = JSON.parse(data);
        //console.log(obj);
        vue.updateList(obj, user);
      }
      catch(error) {
        console.log('ERROR : ' + error + ' # ' + data);
      }
    });
  }
}
</script>

<style>


  body {
    font-family: 'Source Sans Pro', sans-serif;
    margin: 0;
    font-size: 0.84em;
  }

  main {
    padding: 0 5%;
    padding-top: 9vh;
  }

  header {
    z-index: 10;
    position: fixed;
    height: 9vh;
    background-color: deepskyblue;
    width: 100%;
    padding: 0;
    margin: 0;
    box-shadow: 0 0.1vh 1.4vh 0.3vh grey;
    color: white;
    font-size: 1.2em;
    font-weight: bold;
  }
  header div {
    height: 4.5vh;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2%;
  }

  ul {
    padding: 0;
    list-style-type: none;
    margin: 0;
    justify-content: center;
  }

  p {
    display: flex;
    padding: 0px 4%;
    margin: 1.5% 10%;
    min-height: 11vh;
    text-align: center;
    border-left: 1px solid black;
    border-right: 1px solid black;
    font-size: 1.2em;
    align-items: center;
    justify-content: center;
  }

  .list {
    padding: 0;
    margin: 5px 0;
    display: flex;
    height: 9.7vh;
    background-color: #e6e6e6;
    border-radius: 0.6em;
    justify-content: space-around;
    align-items: center;
    font-size: 1.4em;
    position: relative;
    box-shadow: 0px 0px 0.2em 0.01em rgba(0,0,0,.3) inset;
  }

  .list div {
    display: flex;
    justify-content: center;
  }

  .list div:nth-child(1) {
    width: 20%;
  }
  .list div:nth-child(2) {
    width: 20%;
  }
  .list div:nth-child(3) {
    width: 60%;
  }
  .list:not(.list_header) div:nth-child(3) {
    display: flow-root;
  }
  .list_header {
    background-color: lightgray;
    color: white;
    height: 7vh;
    box-shadow: inset 0vh 0vh 1.5vh 0.3vh grey;
    margin: 1em 0;
  }

  .buttons {
    display: flex;
    justify-content: center;

  }

  .buttons button {
    width: 40%;
    height: 2.5em;
    border: none;
    border-radius: 10px;
    margin: 0 5px;
    color: white;
    font-weight: bold;
    font-size: 1.1em;
    outline: none;
  }

  .confirm {
    background: yellowgreen;
  }

  .cancel {
    background: coral;
  }

  .fake {
    background: #e9e9e9;
    color: #a4a4a4 !important;
  }

  .submenu {
    height: 18vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .submenu p {

  }

  .submenu-enter-active {
    animation: submenu-in .5s;
  }
  .submenu-leave-active {
    animation: submenu-in .2s reverse;
  }
  @keyframes submenu-in {
    0% {height: 0}
    100% {height: 18vh;}
  }

  .list_operation {
    background: lavender;
  }

  .list_active {
    border: 0.15em solid deepskyblue;
  }

  .list_ready_state {
    animation: list_ready 2.5s infinite;
  }
  @keyframes list_ready {
    0% {}
    5% {}
    50% {background: #fff17a;}
    95% {}
    100% {}
  }

  .list_active_state { background: #E6FFEA; }
  .list_fail_state   { background: #ff2030; }

  .timeActive {
    position: absolute;
    right: 10px;
    top: 0;
    font-size: 0.8em;
  }
</style>
