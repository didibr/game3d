//###############################################
//########      GAME INTELIGENCE
//################################################
const fs = require('fs');

var AI;

module.exports = {
  INITIAL: { MAP: 'teste1', ENTITY: 'player', SAVE: {} }, //INITIAL CONF FOR NEW USERS
  itemsDir: './',
  audiosDir: './',
  tilesDir: './',
  mapsDir: './',
  entitysDir: './',
  playerCFG: './',
  THREE: null,
  SOCKET: null,
  HELPER: null,
  con: [],
  conBuff: [],

  pingTIME: 20,
  kickOnNoPing: true,
  kickTimeout: 20,

  //Receive socket message  
  receiveMsg: function (message) {
    if (this.SOCKET == null || typeof (message.KEY) == 'undefined') return;
    var KEY = message.KEY;
    if (KEY != 'PONG' && KEY != 'UPDATEPLAYER')
      console.log('Ai receiveMsg', KEY);
    AI = this;
    if (KEY == 'CONNECTED') this._ONconnect(message);
    if (KEY == 'DISCONECTED') this._ONdisconnect(message);
    if (KEY == 'GETPLAYERCONFIG') this._ONGETPLAYERCONFIG(message);
    if (KEY == 'NEWLOGIN') this._ONNEWLOGIN(message);
    if (KEY == 'MOVETO') this._ONMOVETO(message);
    if (KEY == 'UPDATEPLAYER') this._ONUPDATEPLAYER(message);
    if (KEY == 'PONG') this._ONPongPlayer(message);
  },

  _ONconnect: function (message) {
    this.con[message.ID] = [];
    this.con[message.ID].CONNECTION = message.CONNECTION;
    this.sendData(message.ID, { CONNECTED: true });
  },

  _ONdisconnect: function (message) {
    if (this.checkPlayer(message) == true) {
      var login = this.con[message.ID].userdata.login;
      var map = this.con[message.ID].userdata.map;
      if (!this.conBuff[login]) this.conBuff[login] = {};
      this.conBuff[login].userdata = this.con[message.ID].userdata;
      //this.con.splice(message.ID, 1);
      delete this.con[message.ID];
      this.broadCastData(map, { DISCONNECT: { login: login } });
    } else {
      delete this.con[message.ID];
      //this.con.splice(message.ID, 1);
    }
  },

  _ONMOVETO: function (message) { //player request move ( updates position and rotation)
    if (this.checkHeader(message) == false) return;
    if (this.checkPlayer(message) == false) return;
    if (typeof (message.DATA.destin) == 'undefined') return;
    if (typeof (message.DATA.userdata) == 'undefined') return;

    //console.log(message.DATA);
    //####### TOTO ANTHACK FUNCTIONS DUE TO MOVIMENTATION #######
    //newpos = new AI.THREE.Vector3(newpos.x, newpos.y, newpos.z);
    
    this.broadCastData(message.ID, {
      MOVETO: {
        login: AI.con[message.ID].userdata.login,
        destin: message.DATA.destin
      }
    })
  },

  _ONUPDATEPLAYER: function (message) {
    if (this.checkHeader(message) == false) return;
    if (this.checkPlayer(message) == false) return;
    if (typeof (message.DATA.pos) == 'undefined' || typeof (message.DATA.qua)=='undefined') return;

    //save position on buffer  
    AI.con[message.ID].userdata.pos = message.DATA.pos;
    AI.con[message.ID].userdata.qua = message.DATA.qua;

    var moves = typeof (message.DATA.moves) == 'undefined' ? null :  message.DATA.moves;

    this.broadCastData(message.ID, { UPDATEPLAYER: { 
      login: this.con[message.ID].userdata.login,
      pos:message.DATA.pos, 
      qua:message.DATA.qua, 
      moves: moves }});
  },

  _ONNEWLOGIN: function (message) {
    var minchars = 4;
    if (this.checkHeader(message) == false) return;
    if (typeof (message.DATA.login) == 'undefined' ||
      message.DATA.login == null ||
      message.DATA.login.replace(/[^a-z0-9]/gi, '') !== message.DATA.login ||
      message.DATA.login.length < minchars) {
      this.sendData(message.ID, {
        NEWLOGININVALID: {
          id: 'xlogin', msg: 'Invalid Login\nleast ' +
            minchars + ' alphanumeric chars'
        }
      });
      return;
    } if (typeof (message.DATA.pass1) == 'undefined' ||
      message.DATA.pass1 == null ||
      message.DATA.pass1.length < minchars) {
      this.sendData(message.ID, {
        NEWLOGININVALID: {
          id: 'xpass1', msg: 'Invalid Password\nleast ' +
            minchars + ' alphanumeric chars'
        }
      });
      return;
    } if (typeof (message.DATA.pass2) == 'undefined' ||
      message.DATA.pass2 == null ||
      message.DATA.pass2.length < minchars ||
      message.DATA.pass2 !== message.DATA.pass1) {
      this.sendData(message.ID, {
        NEWLOGININVALID: {
          id: 'xpass2', msg: 'Passowrd Not Same\nleast ' +
            minchars + ' alphanumeric chars'
        }
      });
      return;
    } if (typeof (message.DATA.mail) == 'undefined' ||
      message.DATA.mail == null ||
      message.DATA.mail.length < minchars) {
      this.sendData(message.ID, { NEWLOGININVALID: { id: 'axmail', msg: 'Invalid or too short Mail' } });
      return;
    } if (typeof (message.DATA.bdate) == 'undefined' ||
      message.DATA.bdate == null ||
      message.DATA.bdate.length < minchars) {
      this.sendData(message.ID, { NEWLOGININVALID: { id: 'xdate', msg: 'Invalid Date' } });
      return;
    }
    var playerconfig = this.playerCFG + message.DATA.login;
    playerconfig = playerconfig.trim().toString();
    if (fs.existsSync(playerconfig)) {
      this.sendData(message.ID, { NEWLOGININVALID: { id: 'xlogin', msg: 'This login already exist' } });
      return;
    }
    fs.writeFile(playerconfig,
      JSON.stringify({
        pass: message.DATA.pass1,
        map: AI.INITIAL.MAP, entity: AI.INITIAL.ENTITY, save: AI.INITIAL.SAVE
      }), function (err) {
        if (err) { console.log('AI._ONNEWLOGIN', err); return; }
      });
    this.sendData(message.ID, { NEWLOGINVALID: { login: message.DATA.login, pass: message.DATA.pass1 } });
  },

  _ONGETPLAYERCONFIG: function (message) { //PLAYER CONNECTED AND LOGUED
    if (this.checkHeader(message) == false) return;
    if (
      typeof (message.DATA.login) == 'undefined' || typeof (message.DATA.pass) == 'undefined' ||
      message.DATA.login == null || message.DATA.pass == null ||
      message.DATA.login.length < 4 || message.DATA.pass.length < 4) {
      this.sendData(message.ID, { INVALIDLOGIN: 'Invalid Login' });
    } else {
      var playerconfig = this.playerCFG + message.DATA.login;
      if (!fs.existsSync(playerconfig)) {
        this.sendData(message.ID, { INVALIDLOGIN: 'Invalid Login' });
        return;
      }
      fs.readFile(playerconfig, function read(err, data) {
        if (err) { console.log('AI._ONGETPLAYERCONFIG', err); return; }
        const content = data;
        var jdata = JSON.parse(content);
        if (message.DATA.pass !== jdata.pass) {
          AI.sendData(message.ID, { INVALIDLOGIN: 'Invalid Login' });
        } else { //OK
          delete jdata.pass;
          if (AI.conBuff[message.DATA.login]) { //get from buffer
            AI.con[message.ID].userdata = AI.conBuff[message.DATA.login].userdata;
            delete AI.conBuff[message.DATA.login];
          } else { //get from file
            AI.con[message.ID].userdata = jdata;
            AI.con[message.ID].userdata.login = message.DATA.login;
          }
          AI.broadCastData(message.ID, { VALIDLOGIN: AI.con[message.ID].userdata }); //broadcast all for this user
          AI.sendOnlinePLayers(message.ID); //send online players to this new one
        }
      });

    }
  },

  _ONPongPlayer: function (message) {
    if (this.checkHeader(message) == false) return;
    if (this.checkPlayer(message) == false) return;
    AI.con[message.ID].LASTPING = Date.now();
  },

  pingPLayers: function () {
    AI.broadCastData('ALL', { 'PING': true });
    Object.keys(this.con).forEach((key) => {
      if (typeof (AI.con[key].LASTPING) !== 'undefined' && AI.kickOnNoPing == true) {
        var timelapsed = AI.con[key].LASTPING - Date.now();
        timelapsed = Math.abs(timelapsed / 1000);
        //console.log(timelapsed)        
        if (timelapsed > AI.kickTimeout) { //kicked timeout
          AI.close(key, 'Ping Timeout');
          return;
        }
      } else {
        AI.con[key].LASTPING = Date.now();
      }
    });
  },

  sendOnlinePLayers: function (ID) {
    var map = this.con[ID].userdata.map;
    var arrayplayers = {};
    Object.keys(this.con).forEach((key) => {
      if (typeof (AI.con[key].userdata) !== 'undefined' && AI.con[key].userdata.map == map) {
        arrayplayers[AI.con[key].userdata.login] = AI.con[key].userdata;
        //val.CONNECTION.sendUTF(JSON.stringify(data));
      }
    });
    AI.sendData(ID, { ONLINEPLAYERS: arrayplayers });
  },

  checkHeader: function (message) {
    if (typeof (message.DATA) == 'undefined') {
      this.sendData(message.ID, { ERROR: 'Invalid Header' });
      this.close(message.ID, 'Invalid Header');
      return false;
    }
    return true;
  },

  checkPlayer: function (message) {
    if (
      typeof (message) == 'undefined' ||
      typeof (message.ID) == 'undefined' ||
      typeof (AI.con[message.ID]) == 'undefined' ||
      typeof (AI.con[message.ID].userdata) == 'undefined' ||
      typeof (AI.con[message.ID].userdata.map) == 'undefined' ||
      typeof (AI.con[message.ID].userdata.entity) == 'undefined' ||
      typeof (AI.con[message.ID].userdata.save) == 'undefined' ||
      typeof (AI.con[message.ID].userdata.login) == 'undefined'
    ) {
      return false;
    } else {
      return true;
    }
  },

  sendData: function (id, data) {
    if(this.con[id].CONNECTION)
    this.con[id].CONNECTION.sendUTF(JSON.stringify(data));
  },

  /*broadCastData: function (channel, data) {
    var map=channel;
    if(typeof(this.con[channel])!=='undefined' && this.con[channel].userdata)map=this.con[channel].userdata.map;
    this.con.forEach((val) => {
      if (typeof (val.userdata) !== 'undefined' && val.userdata.map == map) {
        val.CONNECTION.sendUTF(JSON.stringify(data));
      }
    });
  },*/
  broadCastData: function (channel, data) {
    var map = channel;
    if (map != 'ALL') {
      if (typeof (this.con[channel]) !== 'undefined' && this.con[channel].userdata) map = this.con[channel].userdata.map;
    }
    Object.keys(this.con).forEach((key) => {
      //console.log('loop',AI.con[key]);
      if (typeof (AI.con[key].userdata) !== 'undefined' &&
        (AI.con[key].userdata.map == map || map == 'ALL')) {
        AI.con[key].CONNECTION.sendUTF(JSON.stringify(data));
      }
    });
  },

  close: function (id, reason) {
    console.log('Force Close', this.con[id].CONNECTION.remoteAddresses, reason);
    var connection = this.con[id].CONNECTION;
    this._ONdisconnect({ ID: id });
    connection.close();
  },

  //####### GAME SERVER FUNCTION PART
  createNewItem: function (itemname, itemarray) {
    var jstring = JSON.stringify(itemarray);
    this.HELPER.writeFile(this.itemsDir + itemname, jstring);
  },

  createNewAudio: function (tilename, tilearray) {
    var jstring = JSON.stringify(tilearray);
    this.HELPER.writeFile(this.audiosDir + tilename, jstring);
  },

  createNewTile: function (tilename, tilearray) {
    var jstring = JSON.stringify(tilearray);
    this.HELPER.writeFile(this.tilesDir + tilename, jstring);
  },

  createNewMap: function (mapname, maparray) {
    var jstring = JSON.stringify(maparray);
    this.HELPER.writeFile(this.mapsDir + mapname, jstring);
  },

  createNewEntity: function (entityname, config) {
    var jstring = JSON.stringify(config);
    this.HELPER.writeFile(this.entitysDir + entityname, jstring);
  },


  //####### GAME SERVER PART
  _timer: null,
  _ping: 0,
  update: function () {
    if (typeof (AI) == 'undefined') return;
    //repeatable functions
    //if(typeof(THREE)=='undefined' && typeof(AI)!=='undefined' &&){      
    //  THREE=require();
    // }
    AI._ping += 1;
    if (AI._ping > AI.pingTIME) {
      AI._ping = 0;
      AI.pingPLayers();
    }
  },

  control: function (comand, value) {
    if (comand == 'ACTIVATE') {
      if (value == true) {
        if (this._timer == null) this._timer = setInterval(this.update, 500);
      } else {
        if (this._timer !== null) {
          clearInterval(this._timer);
          this._timer = null;
        }
      }
    }
  }

}