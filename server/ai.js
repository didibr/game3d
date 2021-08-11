//###############################################
//########      GAME INTELIGENCE
//################################################
const fs = require('fs');

var AI;
var _UN = 'undefined';

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
    if (KEY == 'ACTION') this._ONAction(message);

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

  _ONAction: function (message) {
    if (this.checkHeader(message) == false) return;
    if (this.checkPlayer(message) == false) return;
    if (AI.con[message.ID].userdata.login != message.DATA.login) return;
    if (typeof (message.DATA.action) == 'undefined') return;
    if (typeof (message.DATA.pos) == 'undefined') return;
    if (typeof (message.DATA.qua) == 'undefined') return;
    this.broadCastData(message.ID, {
      ACTION: {
        login: AI.con[message.ID].userdata.login,
        action: message.DATA.action
      }
    });
    this.playerAsAction(message);
  },

  _ONMOVETO: function (message) { //player request move ( updates position and rotation)
    if (this.checkHeader(message) == false) return;
    if (this.checkPlayer(message) == false) return;
    if (typeof (message.DATA.destin) == 'undefined') return;
    if (typeof (message.DATA.userdata) == 'undefined') return;

    //update npc positions for all map
    var map = message.DATA.userdata.map;
    if (message.DATA.npcs && AI._activeMaps[map]) {
      for (var i = 0; i < Object.keys(message.DATA.npcs).length; i++) {
        var npcname = Object.keys(message.DATA.npcs)[i];
        if (!AI._activeMaps[map].npcs) AI._activeMaps[map].npcs = {};
        AI._activeMaps[map].npcs[npcname] = message.DATA.npcs[npcname];
        if (AI._activeMaps[map].npcData && AI._activeMaps[map].npcData[npcname]) {
          if (message.DATA.npcs[npcname].pos) AI._activeMaps[map].npcData[npcname].pos = message.DATA.npcs[npcname].pos;
          if (message.DATA.npcs[npcname].qua) AI._activeMaps[map].npcData[npcname].qua = message.DATA.npcs[npcname].qua;
        }

      }
    } else message.DATA.npcs = {};

    //console.log(message.DATA);
    //####### TOTO ANTHACK FUNCTIONS DUE TO MOVIMENTATION #######
    //newpos = new AI.THREE.Vector3(newpos.x, newpos.y, newpos.z);

    this.broadCastData(message.ID, {
      MOVETO: {
        login: AI.con[message.ID].userdata.login,
        destin: message.DATA.destin,
        npcs: message.DATA.npcs
      }
    })
  },

  _ONUPDATEPLAYER: function (message) {
    if (this.checkHeader(message) == false) return;
    if (this.checkPlayer(message) == false) return;
    if (typeof (message.DATA.pos) == 'undefined' || typeof (message.DATA.qua) == 'undefined') return;

    //save position on buffer  
    AI.con[message.ID].userdata.pos = message.DATA.pos;
    AI.con[message.ID].userdata.qua = message.DATA.qua;

    var moves = typeof (message.DATA.moves) == 'undefined' ? null : message.DATA.moves;

    this.broadCastData(message.ID, {
      UPDATEPLAYER: {
        login: this.con[message.ID].userdata.login,
        pos: message.DATA.pos,
        qua: message.DATA.qua,
        moves: moves
      }
    });
  },

  _ONNEWLOGIN: function (message) {
    var minchars = 4;
    if (this.checkHeader(message) == false) return;
    if (typeof (message.DATA.login) == 'undefined' ||
      message.DATA.login == null ||
      message.DATA.login.replace(/[^a-z0-9]/gi, '') !== message.DATA.login ||
      message.DATA.login.length < minchars) {
      console.log(message.DATA.login);
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
          var map = AI.con[message.ID].userdata.map;
          AI.broadCastData(message.ID, { VALIDLOGIN: AI.con[message.ID].userdata }); //broadcast all for this user
          AI.sendOnlinePLayers(message.ID); //send online players to this new one          
          //AI._startAi(map);//have atleast one player to start AI (replaced by loadlive)
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
    var arraynpcs = {};//AI._activeMaps[map].npcData
    if (AI._activeMaps[map] && AI._activeMaps[map].npcData) arraynpcs = AI._activeMaps[map].npcData;

    AI.sendData(ID, { ONLINEPLAYERS: { players: arrayplayers, npcs: arraynpcs } });
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
    if (this.con[id].CONNECTION)
      this.con[id].CONNECTION.sendUTF(JSON.stringify(data));
  },


  broadCastData: function (channel, data) {
    var map = channel;
    if (map != 'ALL') {
      if (typeof (this.con[channel]) !== 'undefined' && this.con[channel].userdata) map = this.con[channel].userdata.map;
    }
    Object.keys(this.con).forEach((key) => {
      //console.log('loop',AI.con[key]);
      if (typeof (AI.con[key].userdata) !== 'undefined' &&
        (AI.con[key].userdata.map === map || map === 'ALL')) {
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


  playerAsAction: function (message) {
    /*if (typeof (message.DATA.action) == 'undefined') return;
    if (typeof (message.DATA.pos) == 'undefined') return;
    if (typeof (message.DATA.qua) == 'undefined') return;
    this.broadCastData(message.ID, {
      ACTION: {
        login: AI.con[message.ID].userdata.login,        
        action: message.DATA.action
      }
    });*/

    if (!AI.con[message.ID] ||
      !AI.con[message.ID].userdata ||
      !AI.con[message.ID].userdata.map ||
      AI.con[message.ID].userdata.map == null ||
      !AI.con[message.ID].userdata.login ||
      AI.con[message.ID].userdata.login == null) return;
    var map = AI.con[message.ID].userdata.map;
    var login = AI.con[message.ID].userdata.login;
    var pos = new AI.THREE.Vector3(message.DATA.pos.x, message.DATA.pos.y, message.DATA.pos.z);
    //### PLAYER USING ATTACK ###
    if (message.DATA.action.attack && message.DATA.action.attack == true) {      
      var nearActors = AI.getNearActors(map, pos, message.DATA.qua,message.DATA.near);
      if (Object.keys(nearActors).length > 0) { //hit at least one
        console.log('HIT', Object.keys(nearActors));
        var targets = {};
        for (var i = 0; i < Object.keys(nearActors).length; i++) {
          var targetname = Object.keys(nearActors)[i];
          var target = nearActors[targetname];
          //console.log('tt', target);
          if (!target.chase) target.chase = login;
          if (!target.agro) target.agro = [];
          target.agro.push(login);
          var newhp = AI.calculateDamage(map, login, targetname);
          if (newhp !== null) target.attr.hp = newhp;
          if (target.attr.hp > 0) {
            targets[targetname] = { hp: target.attr.hp }
          } else {
            //died
          }


        }
        //this.broadCastData(message.ID, { ATACK: { login: login, targets: targets } });
      }
    }
  },

  calculateDamage: function (map, attackerLogin, receiverLogin) {
    var atacker = AI.findlogin(map, attackerLogin);
    var receive = AI.findlogin(map, receiverLogin);
    //if(atacker==null || receive==null)return null;
    //var currentHp=atacker.attr.hp;
   // console.log('calc', receiverLogin, receive);
  },

  findlogin: function (map, login) {
    for (var i = 0; i < Object.keys(AI.con).length; i++) {
      var keyID = Object.keys(AI.con)[i];
      if (typeof (AI.con[keyID].userdata) !== 'undefined' &&
        typeof (AI.con[keyID].userdata.login) !== 'undefined' &&
        AI.con[keyID].userdata.login === login) {
        //console.log('found',login,AI.con[key].userdata);
        return AI.con[keyID].userdata;
      }
    }
    if (!AI._activeMaps[map].npcData) return null;
    for (var i = 0; i < Object.keys(AI._activeMaps[map].npcData).length; i++) {
      var npcname = Object.keys(AI._activeMaps[map].npcData)[i];
      if (npcname === login) return AI._activeMaps[map].npcData[npcname];
    }
    return null;
  },

  getNearActors: function (map, pos, qua,near) {
    var foundActors = {};
    if (!AI._activeMaps[map].npcData) return {};
    //console.log(near);
    for (var i = 0; i < Object.keys(near).length; i++) {
      var lookfor=Object.keys(near)[i];
      var activenpc=AI._activeMaps[map].npcData[lookfor];
      if(activenpc){
        foundActors[lookfor] = activenpc;
      }
    }
    /*for (var i = 0; i < Object.keys(AI._activeMaps[map].npcData).length; i++) {
      var npcname = Object.keys(AI._activeMaps[map].npcData)[i];
      var activenpc = AI._activeMaps[map].npcData[npcname];
      if(near.contains(npcname)) foundActors[npcname] = activenpc;
      //var atributes = activenpc.attr;      
      //var npcdist = new AI.THREE.Vector3(activenpc.pos.x, activenpc.pos.y, activenpc.pos.z).distanceTo(pos);
      // console.log('dist',npcname,npcdist);
      //if (npcdist < distance) foundActors[npcname] = activenpc;
    }*/
    return foundActors;
  },


  completeItemAttr(itens) {
    if (!itens || itens == null) return;
    for (var i = 0; i < itens.length; i++) {
      var name = itens[i].name;
      if (!AI._itemDatabase[name]) {
        fs.readFile(AI.itemsDir + name, function read(err, data) {
          if (err) { console.log('AI.completeItemAttr', err); return; }
          const content = data;
          var jdata = JSON.parse(content);
          if (jdata.item && jdata.item.actions) {
            AI._itemDatabase[name] = jdata.item.actions;
          }
        });
      }
    }
  },

  _LoadLiveMap: function (HTTP, res, map, ai) { //get live version of saved map    
    if (!AI) { AI = ai; }
    if (!AI._activeMaps[map]) {
      AI._activeMaps[map] = { tick: 1 };
    }
    fs.readFile(AI.mapsDir + map, function read(err, data) {
      if (err) { console.log('_LoadLiveMap error for map' + map, err); return; }
      data = JSON.parse(data);
      var tiles = data.tiles;
      var cells = tiles.length;
      var rows = tiles[0].length;
      if (!AI._activeMaps[map].npcData || AI._activeMaps[map].npcData == null) { //generate npc live data
        AI._activeMaps[map].npcData = {};
        //Tiled info
        for (var x = 0; x < cells; x++) {
          for (var y = 0; y < rows; y++) {
            var tiledata = tiles[x][y];
            if (typeof (tiledata) !== _UN)
              for (var v = 0; v < tiledata.length; v++) {
                var scenedata = tiledata[v];

                if (typeof (scenedata.entity) !== _UN) { //ADD NEW NPC 
                  //get data to next actions
                  var realpos = {
                    x: ((10 * x) - 0.5) + scenedata.entity.box.pos.x,
                    y: scenedata.entity.box.pos.y,
                    z: ((10 * y) - 0.5) + scenedata.entity.box.pos.z
                  }
                  if (!AI._activeMaps[map].npcData[scenedata.name]) {
                    AI._activeMaps[map].npcData[scenedata.name] = {
                      attr: scenedata.entity.attr, //npc atributes
                      itens: scenedata.entity.itens,  //npc whereable itens
                      drops: scenedata.entity.drops,  //npc drop chance
                      pos: realpos, //variant position
                      qua: scenedata.entity.box.qua,
                      startpos: realpos, //center of area chase
                      startsqua: scenedata.entity.box.qua,
                    }
                    AI.completeItemAttr(AI._activeMaps[map].npcData[scenedata.name].itens);
                  }

                }
              }
          }
        }
      } else {//get live data
        for (var x = 0; x < cells; x++) {
          for (var y = 0; y < rows; y++) {
            var tiledata = tiles[x][y];
            if (typeof (tiledata) !== _UN)
              for (var v = 0; v < tiledata.length; v++) {
                var scenedata = tiledata[v];
                if (typeof (scenedata.entity) !== _UN) { //ADD NEW NPC 
                  //get data to next actions
                  if (AI._activeMaps[map].npcData[scenedata.name]) {
                    var moved = AI._activeMaps[map].npcData[scenedata.name];
                    scenedata.entity.box.pos.x = moved.pos.x - (10 * x) - 0.5;
                    scenedata.entity.box.pos.z = moved.pos.z - (10 * y) - 0.5;
                    scenedata.entity.box.qua = moved.qua;
                  }
                }
              }
          }
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      HTTP.WaiToCLOSE(false);
    });
  },

  _npcWalkUpdate: function (atributes, walktick, npcname, activenpc, map) {
    function newWalk(position, center, notrepass) {
      //position=new THREE.Vector3(position.x,position.y,position.z);
      center = new AI.THREE.Vector3(center.x, center.y, center.z);
      //console.log('center at',center);
      var randompos = new AI.THREE.Vector3(
        center.x + (notrepass * (2 * Math.random() - 1)),
        center.y,
        center.z + (notrepass * (2 * Math.random() - 1)));
      var distance = randompos.distanceTo(center);
      if (distance == 0 || distance > notrepass || distance < notrepass * 0.2) {
        //console.log('recalculate');
        return newWalk(position, center, notrepass);
      } else {
        return randompos;
      }
    }
    function onCenter(poposition, center) {
      center = new AI.THREE.Vector3(center.x, center.y, center.z);
      position = new THREE.Vector3(position.x, position.y, position.z);
      var distance = position.distanceTo(center);
      if (distance > 0.5) {
        return center;
      } else {
        return null;
      }
    }
    //functions for walk    
    if (atributes.moviment == 0) { //0=standing
      if (activenpc.animation != 'idle') {
        activenpc.animation = 'idle';
        AI.broadCastData(map, { CHANGEANIMATION: { login: npcname, active: activenpc.animation } });
      }
    }
    if (atributes.moviment == 1) { //1=free walkin         
      if (!activenpc.walkTime || activenpc.walkTime <= 1) {
        activenpc.walkTime = Math.round((Math.random() * walktick));
        var walto = newWalk(activenpc.pos, activenpc.startpos, atributes.areaspaw);
        activenpc.pos = { x: walto.x, y: walto.y, z: walto.z };
        activenpc.animation = 'walk';
        AI.broadCastData(map, { NPCMOVE: { login: npcname, destin: activenpc.pos, speed: 1 } });
      } else {
        activenpc.walkTime = activenpc.walkTime - 1;
      }
    }
    if (atributes.moviment == 2) {//2=runing
      if (!activenpc.walkTime || activenpc.walkTime <= 1) {
        var speed = 1 + Math.random();
        activenpc.walkTime = Math.round((Math.random() * walktick));
        var walto = newWalk(activenpc.pos, activenpc.startpos, atributes.areaspaw);
        activenpc.pos = { x: walto.x, y: walto.y, z: walto.z };
        activenpc.animation = 'run';
        AI.broadCastData(map, { NPCMOVE: { login: npcname, destin: activenpc.pos, speed: speed } });
      } else {
        activenpc.walkTime = activenpc.walkTime - 1;
      }
    }
    if (atributes.moviment == 3) { //3=sleep
      var walto = onCenter(activenpc.pos, activenpc.startpos);
      if (walto != null) {
        activenpc.animation = 'walk';
        activenpc.pos = { x: walto.x, y: walto.y, z: walto.z };
        AI.broadCastData(map, { NPCMOVE: { login: npcname, destin: activenpc.pos, speed: 1 } });
      } else {
        if (activenpc.animation != 'sleep') {
          activenpc.animation = 'sleep';
          AI.broadCastData(map, { CHANGEANIMATION: { login: npcname, active: activenpc.animation } });
        }
      }
    }

  },


  updateMapUser: function (map, ontick) { //update data to users on this map      
    if (AI._activeMaps[map].tick > ontick) { AI._activeMaps[map].tick = 1; } //reset tick prevent remove
    if (!AI._activeMaps[map].npcData) return;
    for (var i = 0; i < Object.keys(AI._activeMaps[map].npcData).length; i++) {
      var npcname = Object.keys(AI._activeMaps[map].npcData)[i];
      var activenpc = AI._activeMaps[map].npcData[npcname];
      var walkTime = 5;
      var atributes = activenpc.attr;
      this._npcWalkUpdate(atributes, walkTime, npcname, activenpc, map);

    }
  },


  updateActorsByMap: function () { //UPDATE GET ALL MAPS on have onlie PLAYERS
    var maps = {};//players on this maps
    Object.keys(AI.con).forEach((key) => {
      if (AI.con[key] && AI.con[key].userdata && AI.con[key].userdata.map && AI.con[key].userdata.map != null) {
        var map = AI.con[key].userdata.map;
        if (!maps[map]) {
          maps[map] = 1;
          if (!AI._activeMaps[map]) {
            AI._activeMaps[map] = { tick: 1 };
          } else {
            //AI._activeMaps[map].tick += 1;
          }
        }
      }
    });
    //remove not used maps or players offline
    Object.keys(AI._activeMaps).forEach((key1) => { //searc on update list for maps not active
      var found = false;
      Object.keys(maps).forEach((key2) => { //Active Maps
        if (key1 == key2) {
          found = true;
        }
      });
      AI._activeMaps[key1].tick += 1;//increase tick for active or not
      if (found == true) {//map is active
        if (AI._activeMaps[key1].tick > 5) //Update Time for this map
          this.updateMapUser(key1, 5);
      } else {//map is inactive
        if (AI._activeMaps[key1].tick > 60) //remove no players online on this one
          delete AI._activeMaps[key1];
      }
    });
  },

  //####### GAME SERVER PART  
  _activeMaps: {}, //npcs=npcs need move update
  //npcData = anny npcs for ai
  _itemDatabase: {},//database of atribute in itens

  _timer: null,
  _ping: 0,
  update: function () {
    if (typeof (AI) == 'undefined') return;
    //repeatable functions
    //if(typeof(THREE)=='undefined' && typeof(AI)!=='undefined' &&){      
    //  THREE=require();
    // }
    AI.updateActorsByMap();
    AI._ping += 1;
    if (AI._ping > AI.pingTIME) {
      //console.log(Object.keys(AI._activeMaps));
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