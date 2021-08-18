window._UN = 'undefined';
ENGINE.GAME = {
  _font: null,
  _cssrender: null,
  _delta: 0,
  _me: {}, //my data
  _players: new Array(),//array same as mydata    
  _npcData: new Array(), //npc atributes and actions
  _playerstemp: new Array(),//array same as mydata ( waiting to load on next fulloaded)
  _entitys: new Array(),
  _actors: new Array(), //buff actors preload to revive  
  _sounds: new Array(), //buff sounds ambient
  _tiles: null,
  _currentmap: null,
  _speed: {
    player: 2, cam: 1, camRotate: 1, clickspeed: 1, updTime: 2, zoomSp: 40,
            /*system*/ mbLeft: 0, mbRight: 0, wheel: 0
  },
  _spawnposition: new THREE.Vector3(),
  _stagesloaded: false,
  _completeloaded: false,


  _updateItemTimer: null, //timer check itens loaded
  _itenslist: [],         //in use itens visible in world

  _updateDropTimer: null, //timer check drops loaded
  _droplist: [],         //itens in inventory for players - itensdrop for NPCS

  _updateAudioTimer: null, //timer check audios loaded (entity)
  _audioslist: [], //audio on Entitys

  _updatePlayersTimer: 0,            //broadcast time (players state)
  _updateColidersTimer: 0,            //broadcast time (players state)

  _NPCarray: {},
  _npcs: new Array(),//array only when update occurs

  _moveRow: null,
  _connected: false,

  //_cursor: { up: 'arrow1.png', down: 'arrow3.png', clicked: 0, lock: 0 },

  update: function (delta) {
    if (this._completeloaded == false) return;
    this.lastMovTime += delta;
    CONTROLS.update(delta); //update camera position
    this.cameraFocusPlayer(delta); //update camera target position (folow player smooth)    
    this.updatePlayerState(delta);
    this.updateColiders(delta);
    this.renderCSS(delta);
    //this.cursorUpdate(delta);
    if (this._speed.mbLeft == 1) this.onCanvasClick(null);
  },


  renderupdate: function () {//time to update have moves to send 
    if (this._moveRow != null) {
      this._moveRow.npcs = ENGINE.GAME._NPCarray;
      WSsend('MOVETO', this._moveRow);
      ENGINE.GAME._NPCarray = {};
      this._moveRow = null;
    }
    requestAnimationFrame(ENGINE.GAME.renderupdate);
  },

  getPlayerOrNpc: function (login) {
    for (var i = 0; i < Object.keys(ENGINE.GAME._players).length; i++) {
      var pname = Object.keys(ENGINE.GAME._players)[i];
      var player = ENGINE.GAME._players[pname];
      if (pname == login) return player;
    }
    for (var i = 0; i < Object.keys(ENGINE.GAME._npcData).length; i++) {
      var pname = Object.keys(ENGINE.GAME._npcData)[i];
      var player = ENGINE.GAME._npcData[pname];
      if (pname == login) return player;
    }
    return null;
  },

  renderCSS: function (delta) {
    //ENGINE.GAME._players[login];
    for (var i = 0; i < Object.keys(ENGINE.GAME._players).length; i++) {
      var pname = Object.keys(ENGINE.GAME._players)[i];
      var player = ENGINE.GAME._players[pname];
      if (player.bars && player.bars.div && player.bars.div.position) {
        var pos = ANIMATED._data[pname].shape.position;
        player.bars.div.position.set(pos.x, pos.y + 1.8, pos.z);
        //player.bars.name.position.set(pos.x, pos.y + 2, pos.z);
        //player.bars.div.lookAt(ENGINE.camera.position);
        player.bars.div.quaternion.copy(ENGINE.camera.quaternion);
      }
    }
    for (var i = 0; i < Object.keys(ENGINE.GAME._npcData).length; i++) {
      var pname = Object.keys(ENGINE.GAME._npcData)[i];
      var player = ENGINE.GAME._npcData[pname];
      if (player.bars && player.bars.div && player.bars.div.position) {
        var pos = ANIMATED._data[pname].shape.position;
        player.bars.div.position.set(pos.x, pos.y + 1.8, pos.z);
        //player.bars.name.position.set(pos.x, pos.y + 2, pos.z);
        //player.bars.div.lookAt(ENGINE.camera.position);
        player.bars.div.quaternion.copy(ENGINE.camera.quaternion);
      }
    }
    //ENGINE.GAME._npcData[login];    

    this._cssrender.render(ENGINE.scene, ENGINE.camera);
  },

  _xa: 1,
  _lastPolar: 0,
  _realzoom: 0,
  cameraFocusPlayer: function (delta) {
    if (typeof (CONTROLS.screenSpacePanning) == _UN ||
      Object.keys(ENGINE.GAME._players).length < 1 ||
      ENGINE.GAME._stagesloaded == false) return;
    if (!ENGINE.GAME._me.animatedPlayer) ENGINE.GAME._me.animatedPlayer = ENGINE.GAME.getAnimated(ENGINE.login);
    if (typeof (ENGINE.GAME._me.animatedPlayer) == _UN) return;
    if (!ENGINE.GAME._me.player) ENGINE.GAME._me.player = ENGINE.GAME.getPlayerOrNpc(ENGINE.login);
    if (typeof (ENGINE.GAME._me.player) == _UN) return;
    this._me.pos = this._me.animatedPlayer.shape.position;
    if (this._me.animatedPlayer.onAction && this._me.animatedPlayer.onAction.inventory == true) return;
    //CONTROLS.target.set(this._me.pos.x,this._me.pos.y,this._me.pos.z); return;//easy folow    
    var distance = CONTROLS.target.distanceTo(this._me.pos);
    var direction = new THREE.Vector3().subVectors(this._me.pos, CONTROLS.target).normalize();
    var maxpol = 2.4329528684033384; //minimun inferior angle under ground line
    var minpol = { up: 0.1728786603604932, dow: 1.3712127935080203 } //maximum superior angle 0up 3.14dow   
    var groundline = Math.PI / 2; //angle when camera colide ground
    var actualangle = CONTROLS.getPolarAngle(); //actual angle of camera
    var madistance = CONTROLS.maxDistance; //active camera distance zomm
    //################ Folow Player Smooth
    var speedBase = this._speed.cam;//+ this._speed.camExtra;
    if (this._speed.mbRight == 1) this._speed.cam + 5;
    var aplyspeed = 0;
    if (distance > 1) {
      aplyspeed = ((0.12 / madistance) * 100) * (speedBase * distance) * delta;
    } else {
      aplyspeed = ((0.12 / madistance) * 100) * (speedBase) * delta;
    }
    if (distance > 0.05) {
      CONTROLS.target.addScaledVector(direction, aplyspeed);
      //set minimun angle to chase can over ground
      if (actualangle > groundline) CONTROLS.minPolarAngle = groundline;
      //smoooth back camera to permited angle
      if (this._lastPolar != 0) {
        if (actualangle > this._lastPolar) {
          actualangle -= 0.1 * delta;
        } else {
          actualangle += 0.1 * delta;
        }
        CONTROLS.maxPolarAngle = actualangle;
        CONTROLS.minPolarAngle = actualangle;
        if (Math.abs(actualangle - this._lastPolar) < 0.02) {
          this._lastPolar = 0;
        }
      }
    }
    //################ angle controller
    if (ENGINE.GAME._speed.mbRight == 1) { //permit agle change on mbleft pressed
      if (this._lastPolar == 0) {
        this._lastPolar = actualangle;
      } else { //permission bttwen min/max
        if (this._lastPolar != actualangle && actualangle > minpol.up && actualangle < minpol.dow) {
          this._lastPolar = actualangle;
        }
      }
      CONTROLS.maxPolarAngle = maxpol;//2.7;
      CONTROLS.minPolarAngle = minpol.up;
    } else {
    }
    //################ upside camera //zoom camera when too close          
    if (actualangle > groundline) {
      if (this._realzoom == 0) this._realzoom = madistance;
      var difang = actualangle - groundline;
      var zoomin = 1 / (2 * (difang * 0.5));
      if (zoomin < this._realzoom && zoomin > maxpol) {
        CONTROLS.minDistance = zoomin;
        CONTROLS.maxDistance = zoomin;
        return;
      }
    } else {
      if (this._realzoom != 0) {
        CONTROLS.minDistance = this._realzoom;
        CONTROLS.maxDistance = this._realzoom;
        this._realzoom = 0;
      }
    }
    //################ Zoom Controler Setter //pemit zoom change on mouse wheel
    var whellcontrol = 0;
    var whellval = ENGINE.GAME._speed.wheel;
    if (whellval && whellval != 0) {
      if (whellval < 0) whellcontrol = (whellval * ENGINE.GAME._speed.zoomSp) * delta
      if (whellval > 0) whellcontrol = (whellval * ENGINE.GAME._speed.zoomSp) * delta
      ENGINE.GAME._speed.wheel = 0;
      var calculado = CONTROLS.minDistance + whellcontrol;
      //console.log(calculado)
      if (calculado > 4 && calculado < 14) {
        CONTROLS.minDistance = calculado;
        CONTROLS.maxDistance = calculado;
      }
    }
    //change camera position 
    return;
    if (ENGINE.GAME._speed.mbRight == 1) return;
    if (!ENGINE.GAME._me.player ||
      !ENGINE.GAME._me.player.angle ||
      !ENGINE.GAME._me.player.angle.isVector3) return;
    var playerA3D = this._me.player.angle;
    var playerAngle = THREE.Math.radToDeg(Math.atan2(playerA3D.x, playerA3D.z));
    var camA3d = new THREE.Vector3(); ENGINE.camera.getWorldDirection(camA3d);
    var camAngle = THREE.Math.radToDeg(Math.atan2(camA3d.x, camA3d.z));
    var diference = 0;
    var rotation = 0;
    var damping = 120;
    if (playerAngle > camAngle) { //camera at left
      diference = playerAngle - camAngle;
      if (diference > 45) {
        rotation = - (ENGINE.GAME._speed.camRotate * (diference / damping)) * delta;
        if (diference > 130) this._fastrotate = - delta * 2;
      } else this._fastrotate = 0;
      //CONTROLS.move.rotateLeft(-(ENGINE.GAME._speed.camRotate * (diference / 20)) * delta);
    } else { //camera at right
      diference = camAngle - playerAngle;
      if (diference > 45) {
        rotation = (ENGINE.GAME._speed.camRotate * (diference / damping)) * delta;
        if (diference > 130) this._fastrotate = delta * 2;
      } else this._fastrotate = 0;
      //CONTROLS.move.rotateLeft((ENGINE.GAME._speed.camRotate * (diference / 20)) * delta);
    }
    if (this._fastrotate != 0) { CONTROLS.move.rotateLeft(this._fastrotate); return; }
    if (rotation != 0) CONTROLS.move.rotateLeft(rotation);
  },


  updatePlayerState: function (delta) {
    this._updatePlayersTimer += delta; //time to update player state
    if (this._updatePlayersTimer > this._speed.updTime && typeof (ENGINE.GAME._me.animatedPlayer) !== _UN) {
      //console.log('update')
      var annime = ENGINE.GAME._me.animatedPlayer;
      var object = annime.shape;
      var moves = object.userData.physicsBody.move;
      var player = ENGINE.GAME._me.player;
      if (typeof (player.extraspeed) == _UN) player.extraspeed = 0;
      if (typeof (moves) == _UN || moves.ACTIVE != true) moves = null;
      var pos = { x: object.position.x, y: object.position.y, z: object.position.z };
      var qua = { x: object.quaternion.x, y: object.quaternion.y, z: object.quaternion.z, w: object.quaternion.w };
      WSsend('UPDATEPLAYER', { active: annime.active, pos: pos, qua: qua, moves: moves });//, npc: this._NPCarray });
      //this._NPCarray = {};
      ENGINE.GAME._updatePlayersTimer = 0;
    }
  },

  updateColiders: function (delta) {
    this._updateColidersTimer += delta;
    if (this._updateColidersTimer > 1) {
      var collisions = ENGINE.Physic.collide.dispatcher.getNumManifolds();
      for (let i = 0; i < collisions; i++) {
        var colide = ENGINE.Physic.collide.dispatcher.getManifoldByIndexInternal(i);
        var bodya = colide.getBody0();
        var bodyb = colide.getBody1();
        ENGINE.Physic.getObjectByID(bodya.a, (obja) => {
          if (obja.group && obja.group.name && obja.group.name !== 'Tile') {
            ENGINE.Physic.getObjectByID(bodyb.a, (objb) => {
              if (objb.group && objb.group.name && objb.group.name !== 'Tile') {
                //console.log('a', obja);
                //console.log('b', objb);
                ENGINE.GAME.colideTreat(obja, objb);
              }
            });
          }
        });
      }
      this._updateColidersTimer = 0;
    }
  },

  colideTreat: function (obja, objb) {
    var player = null;
    var object = null;
    var mode = '';
    if (obja.group.type == 'Human' && objb.group.type == 'Human') {
      player = obja; object = objb; mode = 'P2P';
    }
    if (obja.group.type == 'Actor' && objb.group.type == 'Human') {
      player = objb; object = obja; mode = 'P2A';
    }
    if (obja.group.type == 'Human' && objb.group.type == 'Actor') {
      player = obja; object = objb; mode = 'P2A';
    }
    if (obja.group.type == 'Human' && objb.group.type == 'NPC') {
      player = obja; object = objb; mode = 'P2N';
    }
    if (obja.group.type == 'NPC' && objb.group.type == 'Human') {
      player = objb; object = obja; mode = 'P2N';
    }
    if (obja.group.type == 'Actor' && objb.group.type == 'NPC') {
      player = objb; object = obja; mode = 'N2A';
    }
    if (obja.group.type == 'NPC' && objb.group.type == 'Actor') {
      player = obja; object = objb; mode = 'N2A';
    }
    if (obja.group.type == 'NPC' && objb.group.type == 'NPC') {
      player = obja; object = objb; mode = 'N2N';
    }
    if (mode !== '') {
      // console.log(mode);
      if (mode == 'P2A') {
        this.playerActivateActor(player, object); //player use teleport
      }
      if (mode == 'P2N') {
        this.updateNPC(player, object); //player contact NPC
      }

    }
  },

  updateNPC: function (player, npc) {
    var npclogin = npc.group.login;
    var pos = ANIMATED._data[npclogin].shape.position;
    var qua = ANIMATED._data[npclogin].shape.quaternion;
    this._NPCarray[npclogin] = {
      pos: { x: pos.x, y: pos.y, z: pos.z },
      qua: { x: qua.x, y: qua.y, z: qua.z, w: qua.w }
    }
  },

  playerActivateActor: function (player, actor) {
    var action = actor.group.act;
    var login = player.group.login;
    var player = ENGINE.GAME._players[login];
    var actordestin = null;
    switch (action.type) { //{ type: 1, name: actid, key: needkey, lvl:
      case 0: //spawn location do nothing
        break;
      case 1: //player teleport to somewhere       
        if (action.lvl > player.attr.lvl) return;
        actordestin = this.getActorLocation(action.name, 0);
        if (actordestin == null) return;
        if (this.playerAsKey(action.key, login, false) == false) return;
        var qua = player.qua;
        if (typeof (qua) == _UN) qua = new THREE.Quaternion();
        var rotation = new THREE.Quaternion(qua.x, qua.y, qua.z, qua.w);
        var object = ANIMATED._data[login].shape;
        _teleporting = true;
        ENGINE.Physic.bodyUpdate(object, actordestin, rotation);
        //this.updatePlayerState(4);
        break;
    }
  },

  getActorLocation: function (name, type) {
    for (let index = 0; ENGINE.GAME._actors.length; index++) {
      var actor = ENGINE.GAME._actors[index];
      if (actor.act.name == name && actor.act.type == type) {
        //console.log(name,type,actor.physic.position)
        return actor.physic.position.clone();
      }
    }
    return null;
  },

  playerAsKey: function (key, playerName, remove) {
    if (typeof (key) == _UN || key == null) return true;
    //check on using itens       
    for (let i = 0; i < ENGINE.GAME._itenslist[playerName].itens.length; i++) {
      if (ENGINE.GAME._itenslist[playerName].itens[i].item.actions.givekey == key) {
        if (remove == true) {
          ENGINE.GAME._itenslist[playerName].itens[i].scene.forEach((val) => {
            if (val._OBJ3d.isObject3D) val._OBJ3d.selfremove = true;
          });
          ENGINE.GAME._itenslist[playerName].itens.splice(i, 1);
        }
        return true;
      }
    }
    //check in inventory    
    for (let i = 0; i < ENGINE.GAME._droplist[playerName].drops.length; i++) {
      if (ENGINE.GAME._droplist[playerName].drops[i].item.actions.givekey == key) {
        if (remove == true) {
          ENGINE.GAME._droplist[playerName].drops[i].scene.forEach((val) => {
            if (val._OBJ3d.isObject3D) val._OBJ3d.selfremove = true;
          });
          ENGINE.GAME._droplist[playerName].drops.splice(i, 1);
        }
        return true;
      }
    }
    return false;
  },


  mouseWheel: function (event) {
    if (this._completeloaded == false) return;
    if (!event.deltaY) return;
    //event.deltaY < 0 rotate up / > 0 rotate down / 0 no rotation  
    if (event.deltaY < 0) {
      ENGINE.GAME._speed.wheel -= 0.5;
    } else if (event.deltaY > 0) {
      ENGINE.GAME._speed.wheel += 0.5;
    }

  },

  mouseEvent: function (event, down) { //detect Right click fast focus player        
    if (this._completeloaded == false || typeof (event.button) == _UN) return;
    //down 1= down 0 up
    //event.button = 0=left 1=midle 2right
    if (event.button == 2)
      if (down == 1) {
        ENGINE.GAME._speed.mbRight = 1;
      } else {
        ENGINE.GAME._speed.mbRight = 0;
      }
    if (event.button == 0)
      if (down == 1) { //_cursor:{up:'arrow1.png',down:'arrow3.png'}        
        //ENGINE.GAME.changeCursor(ENGINE.GAME._cursor.down, true, true);
        ENGINE.GAME._speed.mbLeft = 1;
      } else {
        //ENGINE.GAME.changeCursor(ENGINE.GAME._cursor.up, true, false);
        ENGINE.GAME._speed.mbLeft = 0;
      }
  },

  play: async function () {
    $('#playdiv').hide();
    ENGINE.login = $('#DIALOGLOGIN').val();
    ENGINE.pass = $('#DIALOGPASS').val();
    await ENGINE.GAME._connect();
    requestAnimationFrame(ENGINE.GAME.renderupdate);
  },

  _connectMessage: function (receive) {
    //console.log(receive);
    requestAnimationFrame(() => {
      ENGINE.GAME.messagew(receive);
    });
  },

  _connect: async function () {
    var socklocal = ENGINE.url.replace('http://', '').replace('https://', '').replace('//', '');
    if (socklocal.endsWith('/') == true) socklocal = socklocal.substr(0, socklocal.length - 1);
    var socketws = ENGINE.url.replace('http://', '') == ENGINE.url ? 'wss://' : 'ws://';
    var metod = startCONFIG.worker_socket == true ? 1 : 0;
    if (metod == 1) { //############### using webworkers
      //console.log('Using WebWorkers');
      webSocketWorker.port.removeEventListener('message', ENGINE.GAME._connectMessage);
      webSocketWorker.port.addEventListener('message', ENGINE.GAME._connectMessage);
      await WSconnect(socketws + socklocal);
    }
    if (metod == 0) {//############### using pure socket
      //console.log('Using Vanila');
      webSocketWorker.port.removeEventListener('message', ENGINE.GAME._connectMessage);
      WSOmessage = ENGINE.GAME._connectMessage;
      WSsend = WSOsend;
      await WSOconnect(socketws + socklocal);
    }
  },

  _swapLogin() {
    ENGINE.DIALOG.reset();
    this.message({ INVALIDLOGIN: 'XX' });
  },

  _getPlayerConfig: function () {
    WSsend('GETPLAYERCONFIG', { login: ENGINE.login, pass: ENGINE.pass });
  },

  _newLogin: function (action) { //form create login
    console.log(action);
    if (action == false) {
      this.message({ INVALIDLOGIN: 'XX' })
    } else {
      ENGINE.GAME._connected = false;
      ENGINE.GAME._connect();
      ENGINE.login = $('#xlogin').val();
      if ($('#xlogin').val() != _UN)
        var nlogin = {
          login: $('#xlogin').val(),
          pass1: $('#xpass1').val(),
          pass2: $('#xpass2').val(),
          mail: $('#axmail').val(),
          bdate: $('#xdate').val()
        };
      setTimeout(() => {
        if (ENGINE.GAME._connected == true) {
          ENGINE.DIALOG.reset();
          ENGINE.DIALOG.load('createlogin.html', function (dialog) {
            ENGINE.DIALOG.popup(dialog, 'New Login', true);
            $('#xlogin').val(nlogin.login);
            $('#xpass1').val(nlogin.pass1);
            $('#xpass2').val(nlogin.pass2);
            $('#axmail').val(nlogin.mail);
            $('#xdate').val(nlogin.bdate);
          });
          WSsend('NEWLOGIN', nlogin);
        } else {
          ENGINE.GAME._newLogin(true);
        }
      }, 500);
    }
  },

  createLogin: function () {
    ENGINE.DIALOG.reset();
    ENGINE.DIALOG.load('createlogin.html', function (dialog) {
      ENGINE.DIALOG.popup(dialog, 'New Login', true);
    });
  },

  createFont: function () {
    LOADER.fontloader.load('./css/font.json', function (font) {
      ENGINE.GAME._font = font;
    }); //end load function
  },

  createText: function (message, width, color) {
    //const color = 0x006699;
    const matLite = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const shapes = ENGINE.GAME._font.generateShapes(message, width);
    const geometry = new THREE.ShapeGeometry(shapes);
    geometry.computeBoundingBox();
    const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 0, 0);
    // make shape ( N.B. edge view not visible )
    const text = new THREE.Mesh(geometry, matLite);
    return text;
    //text.position.z = - 150;
    //scene.add(text);
  },

  loadMap: async function () {
    //console.log('Loading Map:', name);  
    this._stagesloaded = false;
    ENGINE.clear();
    ENGINE.renderer.setClearColor('black');
    ENGINE.DIALOG.reset();
    ENGINE.Physic.skinMaterial.visible = false;
    ENGINE.Physic.physicMaterial.opacity = 0;
    ENGINE.debugRay = false;
    ENGINE.Physic.debugPhysics = false;
    HELPER.hideTransform();
    ENGINE.scene.visible = false;
    ENGINE.showLoading(true);
    ANIMATED.clear();
    ANIMATED._data = new Array();
    this._currentmap = this._me.map;
    var url = ENGINE.url + 'LIVELOADMAPS' + this._currentmap;
    //############ UPDATE VARIABLES
    if (this._updateItemTimer != null) clearTimeout(this._updateItemTimer);
    this._itenslist = [];
    this._entityCount = 0;
    this._players = new Array();//array same as mydata     
    this._entitys = new Array();
    this._actors = new Array(); //buff actors preload to revive  
    this._sounds = new Array(); //buff sounds ambient
    this._completeloaded = false;
    this._itenslist = [];         //in use itens visible in world    
    this._droplist = [];         //itens in inventory for players - itensdrop for NPCS
    if (this._updateAudioTimer && this._updateAudioTimer != null)
      clearTimeout(this._updateAudioTimer); //timer check audios loaded (entity)
    if (this._updateDropTimer && this._updateDropTimer != null)
      clearTimeout(this._updateDropTimer);
    if (this._updateItemTimer && this._updateItemTimer != null)
      clearTimeout(this._updateItemTimer)
    if (this._playerstemp && this._playerstemp != null)
      clearTimeout(this._playerstemp)
    this._audioslist = []; //audio on Entitys
    this._updatePlayersTimer = 0;            //broadcast time (players state)
    this._updateColidersTimer = 0;            //broadcast time (players state)
    this._moveRow = null;
    this._NPCarray = {};
    this._loadedStages = {};
    ENGINE.mouseShow('arrow1.png');
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', event => event.preventDefault());

    this.createFont();

    this._cssrender = new RENDERER.renderer();
    this._cssrender.setSize(ENGINE.canvObj.width, ENGINE.canvObj.height);
    this._cssrender.domElement.style.position = 'absolute';
    this._cssrender.domElement.style.top = ENGINE.canvObj.offsetTop + 'px';
    this._cssrender.domElement.style.left = ENGINE.canvObj.offsetLeft + 'px';
    this._cssrender.domElement.id = 'cssrender';
    document.body.appendChild(this._cssrender.domElement);



    var data = await HELPER.simpleDownloadSync(url);
    var tiles = data.tiles;
    var cells = tiles.length;
    var rows = tiles[0].length;

    this._tiles = ENGINE.TILE.createTiles(10, 10, cells, rows);

    //Actors
    var actors = data.actor;
    if (typeof (actors) !== _UN) {
      this._actors = actors;
      this._reviveActors();
    }



    //Tiled info
    for (var x = 0; x < cells; x++) {
      for (var y = 0; y < rows; y++) {
        var tile = ENGINE.TILE.getTileByXY(x, y);
        //tile.userData.physicsBody.setCollisionFlags(4);//no contact response
        var tiledata = tiles[x][y];
        if (typeof (tiledata) !== _UN)
          for (var v = 0; v < tiledata.length; v++) {
            var scenedata = tiledata[v];
            var extx = (-10 * x) - 0.5;
            var extz = (-10 * y) - 0.5;
            //3D Objects and Physic
            if (typeof (scenedata.scenes) !== _UN && scenedata.scenes.length > 0) {
              this.addObject(tile, scenedata, extx, extz);
            }
            //ENTITY AREA
            if (typeof (scenedata.entity) !== _UN) {
              this.addEntiTy(tile, scenedata);
            }
            //ITEM AREA
            if (typeof (scenedata.items) !== _UN) {
              this.addItem(tile, scenedata);
            }
          }
      }
    }

    //Sounds
    var sounds = data.audio;
    if (typeof (sounds) !== 'undefined') {
      this._sounds = sounds;
      this._reviveSounds();
    }

    //Lights
    var lights = data.light;
    if (typeof (lights) !== _UN)
      for (var i = 0; i < lights.length; i++) {
        var lc = lights[i];
        var l1 = null;
        if (lc.model == 2) {
          l1 = ENGINE.Light.addAmbient('#' + lc.color, lc.itensity);
        }
        if (lc.model == 3) {
          l1 = ENGINE.Light.addDirectionalLightShadow('#' + lc.color,
            lc.itensity, 100, new THREE.Vector3(lc.pos.x, lc.pos.y, lc.pos.z));
        }
        if (lc.model == 4) {
          l1 = ENGINE.Light.addPointLightShadow('#' + lc.color, lc.itensity, lc.distance,
            new THREE.Vector3(lc.pos.x, lc.pos.y, lc.pos.z));
        }
        if (i == 0) { //add Directional default for shadowtest
          var l2 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
            new THREE.Vector3(100, 100, 100)); l2.helper.visible = false;
        }
        l1.castShadow = lc.shadow;
        l1.visible = l1.group.active = lc.visible;
        if (lc.distance !== null && l1.distance) l1.distance = lc.distance;
        if (lc.decay !== null && l1.decay) l1.decay = lc.decay;
        if (lc.angle !== null && l1.angle) l1.angle = lc.angle;
        if (lc.penumbra !== null) l1.penumbra = lc.penumbra;
        if (lc.tpos !== null && l1.target) {
          l1.target.position.set(lc.tpos.x, lc.tpos.y, lc.tpos.z);
        }
        if (lc.issun == true) l1.isSun = true;
        if (l1.helper && l1.helper.parent) {
          l1.helper.parent.remove(l1.helper);
        }
      }


    //script
    var script = data.script;
    if (typeof (script) !== _UN) {
      HELPER.script(script);
    }

    //sky
    window.DTA = data;
    var sky = data.sky;
    if (typeof (sky) != _UN) {
      ENGINE.SKY.create(this._tiles, ENGINE.url + 'images/' + sky.bg);//'./images/pano0.jpg'
    }


    if (this._entityCount == 0) {
      ENGINE.GAME._loadedStages['item'] = true;
      ENGINE.GAME._loadedStages['drop'] = true;
      ENGINE.GAME._loadedStages['sound'] = true;
      this._loadComplete();
    }

  },

  addObject: function (tile, scenedata, extx, extz) {
    ENGINE.TILE.jsonToTileEditor(tile, scenedata.scenes, extx, 0, extz);
    if (typeof (tile.group) == _UN ||
      typeof (tile.group.loaded) == _UN) { tile.group.loaded = []; }
    tile.group.loaded.push(
      {
        name: scenedata.name,
        scene: tile.scenevar
      });
  },

  addEntiTy: function (tile, scenedata) {
    if (typeof (tile.group) == _UN || typeof (tile.group.loaded) == _UN) {
      tile.group.loaded = [];
    }
    tile.group.loaded.push(
      {
        name: scenedata.name,
        ename: scenedata.ename,
        entity: scenedata.entity
      });

    this._entitys[scenedata.name] = scenedata.entity;
    this._entityCount += 1;
    ENGINE.GAME._npcData[scenedata.name] = scenedata.entity;
    this._loadEntityObj(tile, scenedata.name, scenedata.entity, function (obj) {
      ANIMATED._data[scenedata.name].shape.group.type = "NPC";
    });
  },

  addItem: function (tile, scenedata) {
    var HOLDER = {};
    HOLDER.scenevar = null;
    HOLDER.position = tile.position;
    ENGINE.TILE.jsonToTileEditor(HOLDER, scenedata.items.obj);
    if (typeof (tile.group) == _UN || typeof (tile.group.loaded) == _UN) {
      tile.group.loaded = [];
    }
    tile.group.loaded.push(
      {
        name: scenedata.name,
        obj: scenedata.items.obj,
        item: scenedata.items.item,
        obj3d: HOLDER.scenevar
      });
  },

  playerJoin: async function (player) {
    if (this._stagesloaded == false) { //buffer players to load no time to load 
      this._playerstemp[player.login] = player;
      return;
    }
    if (player.login && player.entity) { //load buffered players
      if (!this._players[player.login] || typeof (this._players[player.login]) == _UN) {//add new        
        this._players[player.login] = {};
        //console.log('Add new player', player.login, ENGINE.GAME._stagesloaded);
        if (typeof (player.pos) == _UN) player.pos = this._spawnposition.clone(); //is not have        
        var startile = ENGINE.TILE.getTileByXY(0, 0); //default tile to load players
        var url = ENGINE.url + 'LAOADENT' + player.entity;
        var data = await HELPER.simpleDownloadSync(url); //load base entity data
        this._players[player.login] = data;
        this._players[player.login].entity = player.entity;
        this._players[player.login].login = player.login;
        this._players[player.login].map = player.map;
        this._players[player.login].pos = player.pos;
        this._players[player.login].qua = player.qua;
        this._players[player.login].speed = player.speed;
        this._players[player.login].attr = player.attr;
        HELPER.updateArray(this._players[player.login], player); //update base with player data      
        this._loadEntityObj(startile, player.login, data)
      } else {//update existing or Load complete
        if (player.login == ENGINE.login && typeof (CONTROLS.screenSpacePanning) == _UN &&
          ANIMATED._data[player.login]) {
          // console.log('playerJoin complete', player.login, this._completeloaded);
          // try {
          //console.log(ANIMATED._data[player.login].object);
          CONTROLS = OrbitControl.create(ENGINE.camera, ENGINE.GAME._cssrender.domElement);
          var campos = ANIMATED._data[player.login].object.position.clone().
            add(new THREE.Vector3(0, 10, 0)).
            sub(new THREE.Vector3(0, 0, 5));
          ENGINE.CAM.change(1, campos, ANIMATED._data[player.login].shape, ENGINE.GAME._cssrender.domElement);
          CONTROLS.minDistance = 14;
          CONTROLS.maxDistance = 14;
          CONTROLS.rotateSpeed = 0.4;
          CONTROLS.maxPolarAngle = CONTROLS.minPolarAngle = 0.5728786603604932;

          CONTROLS.screenSpacePanning = false;
          CONTROLS.enablePan = false;
          CONTROLS.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,//THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE//THREE.MOUSE.PAN
          }
          this.clearCache();
          //} catch (error) {
          //  console.warn('Error playerJoin trying aggain', error);
          //setTimeout(function(){ENGINE.GAME.playerJoin(player);},1000);
          //}
        }
      }
    }
  },

  _firstcomplete: false,
  clearCache: async function () {
    //this._npcatualizeposition();
    this._playerstemp = [];
    ENGINE.showLoading(false);
    ENGINE.scene.visible = true;
    this._completeloaded = true;
    this.revivePlayerAudio();
    if (this._firstcomplete != false) return;
    _firstcomplete = true;
    var listener = await LISTENER();
    if (listener.setMasterVolume)
      var smooth = setInterval(function () {
        var volu = listener.getMasterVolume();
        if (volu < 1) {
          listener.setMasterVolume(volu + 0.02);
        } else {
          listener.setMasterVolume(1);
          clearInterval(volu);
        }
      }, 10);
  },


  revivePlayerAudio() {
    for (var i = 0; i < Object.keys(this._audioslist).length; i++) {
      var login = Object.keys(this._audioslist)[i];
      var arrayaudio = this._audioslist[login];
      if (ANIMATED._data[login] && ANIMATED._data[login].audio) { //only if model exist
        var audiholder = ANIMATED._data[login].audio;
        for (var e = 0; e < Object.keys(arrayaudio).length; e++) {
          var sndname = Object.keys(arrayaudio)[e];
          if (!arrayaudio[sndname].positioned && arrayaudio[sndname].live) {
            arrayaudio[sndname].positioned = true;
            audiholder.add(arrayaudio[sndname].live);
          }
        }
      }
    }
  },


  playerLeave: function (login) {
    //FAZER REMOVER AUDIOS QUANDO PLAYER QUITAR
    ENGINE.scene.remove(ENGINE.GAME._players[login].bars.div);
    if (ANIMATED._data[login]) {
      for (var i = 0; i < ANIMATED._data[login].audio.length; i++) {
        if (ANIMATED._data[login].audio[i].isPlaying == true)
          ANIMATED._data[login].audio[i].stop();
      }
      ANIMATED._data[login].object.remove(ANIMATED._data[login].audio);
    }
    if (ENGINE.GAME._itenslist[login].itens)//remove owned itens
      for (var i = 0; i < ENGINE.GAME._itenslist[login].itens.length; i++) {
        if (ENGINE.GAME._itenslist[login].itens[i].scene)
          for (var b = 0; b < ENGINE.GAME._itenslist[login].itens[i].scene.length; b++) {
            var obj3d = ENGINE.GAME._itenslist[login].itens[i].scene[b]._OBJ3d;
            if (obj3d.isObject3D) {
              if (obj3d.parent) obj3d.parent.remove(obj3d);
              //obj3d.selfremove = true;
            }
          }
      }
    if (ENGINE.GAME._droplist[login].drops)//remove owned drops
      for (var i = 0; i < ENGINE.GAME._droplist[login].drops.length; i++) {
        if (ENGINE.GAME._droplist[login].drops[i].scene)
          for (var b = 0; b < ENGINE.GAME._droplist[login].drops[i].scene.length; b++) {
            var obj3d = ENGINE.GAME._droplist[login].drops[i].scene[b]._OBJ3d;
            if (obj3d.isObject3D) {
              if (obj3d.parent) obj3d.parent.remove(obj3d);
              //obj3d.selfremove = true;
            }
          }
      }
    ENGINE.Physic.removeObj(ANIMATED._data[login].shape);
    ANIMATED._data[login].object.selfremove = true;
    delete ANIMATED._data[login];
    delete this._players[login];
  },


  systemEvent: function (data) {
  },


  //Load Models and itens owned in data.itens as inuse
  _loadEntityObj: function (tile, name, data, callback) {
    ANIMATED.load(
      data.model.url,
      name,
      data.model.sca,
      function (mobj) {
        mobj.position.set(
          data.model.pos.x,
          data.model.pos.y,
          data.model.pos.z);
        mobj.quaternion.set(
          data.model.qua.x,
          data.model.qua.y,
          data.model.qua.z,
          data.model.qua.w);
        var startposition = tile.position.clone();
        if (typeof (ENGINE.GAME._players[name]) !== _UN) {
          if (data.pos) {
            data.pos = new THREE.Vector3(
              data.pos.x,
              data.pos.y + 1.5,
              data.pos.z
            );
            startposition = data.pos.clone();
          } else {
            startposition = ENGINE.GAME._spawnposition.clone();
            // console.log('new', startposition)
          }
        } else { //entity
          data.pos = new THREE.Vector3(
            startposition.x + data.box.pos.x,
            startposition.y + data.box.pos.y,
            startposition.z + data.box.pos.z
          );
          data.qua = new THREE.Quaternion(data.box.qua.x, data.box.qua.y, data.box.qua.z, data.box.qua.w);
        }


        var npcdata = ENGINE.GAME._npcData[name];
        if (!npcdata) npcdata = ENGINE.GAME._npcs[name];
        //console.log('datan', npcdata)
        if (npcdata) { //new default npc position         
          if (npcdata.pos) {
            startposition = new THREE.Vector3(
              npcdata.pos.x,
              npcdata.pos.y,
              npcdata.pos.z
            );
            startposition.y = 1.5;
          }
          if (npcdata.qua) {
            data.qua = new THREE.Quaternion(
              npcdata.qua.x,
              npcdata.qua.y,
              npcdata.qua.z,
              npcdata.qua.w
            )
          }
          //console.log('loadNPC', name, data);
        } else {
          //console.log('loadPlayer', name, data);
        }
        ENGINE.Physic.bodyTeleport(
          ANIMATED._data[name].shape,
          new THREE.Vector3(
            startposition.x, //+ data.box.pos.x,
            startposition.y + ANIMATED._data[name].shape.position.y + data.box.pos.y,
            startposition.z, //+ data.box.pos.z
          )
        );


        //Remove Box Utilized only to positionate according Tile
        if (data.box) delete data.box;
        //remove model Utilized only to download and positionate fbx model
        if (data.model) delete data.model;

        ENGINE.GAME._cacheEntityItens(name, data.itens, tile);//load itens inuse
        ENGINE.GAME._cacheEntityDrops(name, data.drops, tile);//load itens inventory / drop
        //console.log('precache', name, data.audios, mobj.uuid)
        //ENGINE.GAME._cacheEntityAudios(name, data.audios, mobj);//load itens inventory / drop        
        ENGINE.GAME._cacheEntitySounds(name, data.audios, tile);//load itens inventory / drop        
        delete data.itens;
        delete data.drops;
        delete data.audios;
        ENGINE.GAME.createBar(name);
        if (typeof (callback) == 'function') callback(mobj);
      }, data);
  },

  //_audioslist
  //################ AUDIOS LOADER #################
  _cacheEntitySounds: async function (entityName, audios, tile) {
    if (typeof (this._audioslist[entityName]) == _UN) {
      if (typeof (audios) == _UN) audios = new Array();
      //console.log('cache', entityName, audios)
      for (var i = 0; i < audios.length; i++) {
        if (typeof (this._audioslist[entityName]) == _UN) this._audioslist[entityName] = {};
        this._audioslist[entityName][audios[i].id] = { audio: audios[i].audio };
      }
    }
    if (this._updateAudioTimer != null) clearTimeout(this._updateAudioTimer);
    this._updateAudioTimer = setTimeout(() => {
      this._createCacheSounds();
    }, 1000);
  },
  _createCacheSounds: async function () {
    var repeat = false;
    for (var i = 0; i < Object.keys(this._audioslist).length; i++) {
      var entityName = Object.keys(this._audioslist)[i];
      var audioelement = this._audioslist[entityName];
      for (var e = 0; e < Object.keys(audioelement).length; e++) {
        var id = Object.keys(audioelement)[e];
        var audioarray = audioelement[id];
        if (audioarray.live) { //already previus loaded thes sound in this model
          //console.log(ANIMATED._data[entityName].audio,audioarray.live);
          ANIMATED._data[entityName].audio.add(audioarray.live);
        } else { //this sound not loaded in this model
          HELPER.audioAtatch(audioarray.audio, null, (sound) => { //only buff
            audioarray.live = sound.audio;
            ANIMATED._data[entityName].audio.add(audioarray.live);
          });
          repeat = true;
        }
      }
    }
    if (repeat == true) {
      if (this._updateAudioTimer != null) clearTimeout(this._updateAudioTimer);
      this._updateItemTimer = setTimeout(() => {
        this._createCacheSounds();
      }, 1000);
    } else {
      this._loadComplete('sound');
    }
  },




  //_droplist
  //################ DROPS LOADER #################
  _cacheEntityDrops: async function (entityName, drops, tile) {
    if (typeof (this._droplist[entityName]) == _UN) {
      this._droplist[entityName] = { drops: drops, tile: tile };
    }
    if (this._updateDropTimer != null) clearTimeout(this._updateDropTimer);
    this._updateDropTimer = setTimeout(() => {
      this._createCacheDrops();
    }, 1000);
  },
  _createCacheDrops: async function () {
    var repeat = false;
    for (var i = 0; i < Object.keys(this._droplist).length; i++) {
      var entityName = Object.keys(this._droplist)[i];
      var tile = this._droplist[entityName].tile;
      for (var b = 0; b < this._droplist[entityName].drops.length; b++) {
        var drops = this._droplist[entityName].drops[b];
        var name = drops.name;
        if (typeof (drops.scene) == _UN) { //no loaded 3dobj   
          var url = ENGINE.url + 'LOADITEM' + name;
          var data = await HELPER.simpleDownloadSync(url);
          ENGINE.TILE.jsonToTileEditor(tile, data.obj);
          drops.obj = data.obj;
          drops.scene = tile.scenevar;
          drops.item = data.item;
          repeat = true;
        } else {//as 3d created
          for (var c = 0; c < drops.scene.length; c++) {
            var val = drops.scene[c];
            if (val._OBJ3d != null) {
              ENGINE.scene.remove(val._OBJ3d);
              ENGINE.itemCache.push(val._OBJ3d);
            }
          }
        }

      }
    }
    //console.log('Timer loadObject');
    if (repeat == true) {
      if (this._updateDropTimer != null) clearTimeout(this._updateDropTimer);
      this._updateDropTimer = setTimeout(() => {
        this._createCacheDrops();
      }, 1000);
    } else {
      this._loadComplete('drop'); //loaded all Itens for all entitys
    }
  },

  //################ ITEMS LOADER #################
  _cacheEntityItens: async function (entityName, itens, tile) {
    if (typeof (this._itenslist[entityName]) == _UN) {
      this._itenslist[entityName] = { itens: itens, tile: tile };
    }
    if (this._updateItemTimer != null) clearTimeout(this._updateItemTimer);
    this._updateItemTimer = setTimeout(() => {
      this._createCacheItens();
    }, 1000);
  },
  _createCacheItens: async function () {
    var repeat = false;
    for (var i = 0; i < Object.keys(this._itenslist).length; i++) {
      var entityName = Object.keys(this._itenslist)[i];
      var tile = this._itenslist[entityName].tile;
      for (var b = 0; b < this._itenslist[entityName].itens.length; b++) {
        var itens = this._itenslist[entityName].itens[b];
        var name = itens.name;
        if (typeof (itens.scene) == _UN) { //no loaded 3dobj   
          var url = ENGINE.url + 'LOADITEM' + name;
          var data = await HELPER.simpleDownloadSync(url);
          ENGINE.TILE.jsonToTileEditor(tile, data.obj);
          itens.obj = data.obj;
          itens.scene = tile.scenevar;
          itens.item = data.item;
          repeat = true;
        } else {//as 3d created
          for (var c = 0; c < itens.scene.length; c++) {
            var val = itens.scene[c];
            if (val._OBJ3d != null) {
              HELPER.objaddToBone(val, entityName, itens.type);
              ENGINE.itemCache.push(val._OBJ3d);
            }
          }
        }

      }
    }
    if (repeat == true) {
      if (this._updateItemTimer != null) clearTimeout(this._updateItemTimer);
      this._updateItemTimer = setTimeout(() => {
        this._createCacheItens();
      }, 1000);
    } else {
      this._loadComplete('item'); //loaded all Itens for all entitys
    }
  },



  _reviveActors: function () { //put actors on locals
    for (var i = 0; i < this._actors.length; i++) {
      if (typeof (this._actors[i].act) !== _UN) {
        var tileName = this._actors[i].tile;
        var pos = this._actors[i].pos;
        tileName = tileName.split('x');
        var tile = ENGINE.TILE.getTileByXY(tileName[0], tileName[1]);
        var actPos = tile.position.clone().add(new THREE.Vector3(pos.x, pos.y, pos.z));
        var spphere = HELPER.areaSphere(actPos, 1, 'blue', false, 0);
        this._actors[i].tile = tile;
        this._actors[i].pos = actPos;
        this._actors[i].obj = spphere;
        this._actors[i].obj.visible = false;//ENGINE.Physic.debugPhysics;
        this._actors[i].physic =
          ENGINE.Physic.addPhisicBox(actPos, new THREE.Quaternion(), { x: 1.5, y: 0.01, z: 1.5 });
        this._actors[i].physic.userData.physicsBody.setMassProps(1, 1)
        this._actors[i].physic.group.type = 'Actor';
        this._actors[i].physic.group.act = this._actors[i].act;
        if (this._actors[i].act.name == 'START') {
          this._spawnposition = actPos.clone();
        }
      }
    }
  },




  _reviveSounds: function () {
    for (var i = 0; i < this._sounds.length; i++) {
      var sndarr = this._sounds[i];
      if (typeof (sndarr.audio) !== _UN && typeof (sndarr.tile) !== _UN) {
        //this.addasphereSound(sndarr.audio.name);        
        var tileName = sndarr.tile;
        var pos = sndarr.audio.pos;
        tileName = tileName.split('x');
        var tile = ENGINE.TILE.getTileByXY(tileName[0], tileName[1]);
        var actPos = tile.position.clone().add(new THREE.Vector3(pos.x, pos.y, pos.z));
        this.addasphereSound(sndarr.audio.name);
        if (sndarr.audio.obj != null) {
          sndarr.audio.obj.position.copy(actPos);
          sndarr.audio.obj.visible = true;
        }
      }
    }
    //ENGINE.EDITORM._updateSoundList();
  },


  addasphereSound: function (name) {
    for (var i = 0; i < this._sounds.length; i++) {
      var selsound = this._sounds[i];
      if (selsound.audio.name == name) {
        var actPos = selsound.audio.pos;
        actPos = new THREE.Vector3(actPos.x, actPos.y + 0.5, actPos.z);
        var spphere = null;
        if (selsound.audio.type == 0) {
          spphere = HELPER.areaSphere(actPos, 1, 'gold', false, 5);
        }
        selsound.audio.obj = spphere;
        HELPER.audioAtatch(selsound.audio.audio, spphere, (getaudio) => {
          getaudio.audio.setVolume(selsound.audio.volume);
          selsound.audio.live = getaudio.audio;
          if (selsound.audio.type == 1) {
            ENGINE.camera.add(selsound.audio.live);
          }
          selsound.audio.live.play();
        })
        break;
      }
    }
  },

  _freezeActors: function () {
    for (var i = 0; i < this._actors.length; i++) {
      if (typeof (this._actors[i].act) !== _UN) {
        this._actors[i].physic.userData.physicsBody.setMassProps(0, 0);
      }
    }
  },


  _loadedStages: {},//loaded itens from buffer
  _loadComplete: async function (completed) {
    if (ENGINE.GAME._loadedStages['item'] &&
      ENGINE.GAME._loadedStages['drop'] &&
      ENGINE.GAME._loadedStages['sound']) { //all complete
      ENGINE.GAME._stagesloaded = true;
      for (var i = 0; i < Object.keys(ENGINE.GAME._playerstemp).length; i++) {
        var kname = Object.keys(ENGINE.GAME._playerstemp)[i];
        var data = ENGINE.GAME._playerstemp[kname];
        await ENGINE.GAME.playerJoin(data);
      }
      var livearea = $(this._cssrender.domElement);
      //livearea.hide();
      //$(window)
      $(window).off("keyup").on("keyup", this.onDocumentKeyUp);
      $(window).off("keydown").on("keydown", this.onDocumentKeyDown);
      $(ENGINE.canvObj).off("click").on("click", this.onCanvasClick);
      $(window).off("mousemove").on("mousemove", ENGINE._onMouseMove);
      $(window).off("resize").on("resize", ENGINE._onWindowResize);
      CONTROLS.mouseEvent = ENGINE.GAME.mouseEvent;
      CONTROLS.mouseWheel = ENGINE.GAME.mouseWheel;

    } else { //waiting all load
      if (completed) {
        console.log('Loaded', completed);
        ENGINE.GAME._loadedStages[completed] = true;
        setTimeout(() => { ENGINE.GAME._loadComplete() }, 500);//check if all loaders finished
      }
    }
  },

  onDocumentKeyUp: function (event) {
    console.log('keyup');
    event.preventDefault();
    var actions = {};
    if (ENGINE.GAME.disableTileClick == true) return false;
    if (event.code == 'KeyD' && (!event.ctrlKey) && typeof (ENGINE.intersects) != _UN) { //key D - Run      
      actions.run = undefined;
    }
    ENGINE.GAME.playerAction(ENGINE.login, actions)
    return false;
  },

  onDocumentKeyDown: function (event) {
    event.preventDefault();
    var actions = {};
    if (event.code == 'KeyZ' && (event.ctrlKey || event.metaKey)) {
      ENGINE.adminPopup();//Editor
    }
    if (ENGINE.GAME.disableTileClick == true) return;
    if (event.keyCode == 112 && (!event.ctrlKey)) { //key F1
      ENGINE.GAME.cameraFocusPlayer();//focus player
      return false;
    }
    if (event.code == 'KeyI' && (!event.ctrlKey)) { //Inventory      
      actions.inventory = true;
    }
    if (event.code == 'KeyD' && (!event.ctrlKey) && typeof (ENGINE.intersects) != _UN) { //key D - Run      
      actions.run = true;
    }
    if (event.code == 'KeyQ' && (!event.ctrlKey)) {
      actions.attack = true;
    }
    if (event.keyCode == 32) { //space
      actions.jump = true;
    }
    ENGINE.GAME.playerAction(ENGINE.login, actions)
    return false;
  },


  playerAction: function (login, action) { //Change Player State
    if (this._completeloaded == false) return;
    var player = ENGINE.GAME.getPlayerOrNpc(login);
    /*
    ENGINE.GAME._players[login];
    if (typeof (player) == 'undefined' || player == null)
      player = ENGINE.GAME._npcData[login];
    if (typeof (player) == 'undefined' || player == null) return;
    */
    if (player == null) return;
    var sendAction = false;
    var animatedPlayer = ENGINE.GAME.getAnimated(login);
    //player run
    if (action.inventory) {
      if (!animatedPlayer.onAction.inventory) animatedPlayer.onAction.inventory = false;
      animatedPlayer.onAction.inventory = !animatedPlayer.onAction.inventory;
      sendAction = false;
      if (animatedPlayer.onAction.inventory == true) {
        ENGINE.GAME.showInventory(true);
        CONTROLS.enabled = false;
      } else {
        ENGINE.GAME.showInventory(false);
        CONTROLS.enabled = true;
      }
    }
    if (animatedPlayer.onAction.inventory && animatedPlayer.onAction.inventory == true) return;

    //player run
    if (animatedPlayer.onAction.run != action.run) {
      animatedPlayer.onAction.run = action.run;
      sendAction = true;
      if (action.run == true) {
        player.speedExtra = 2;
      } else {
        player.speedExtra = 0;
      }
    }

    //atack pressed
    if (animatedPlayer.onAction.attack != action.attack) {
      if (action.attack == true) {
        sendAction = true;
        var attackType = 'swatack';
        animatedPlayer.onAction.attack = true;
        ANIMATED.change(login, attackType, 10);
        setTimeout(() => {
          ANIMATED.deanimateType(login, attackType, true);
          animatedPlayer.onAction.attack = false;
        }, 500);
      }
    }

    //jump
    if (action.jump == true) {
      if (animatedPlayer.onAction.jump != true) {
        animatedPlayer.onAction.jump = true;
        ANIMATED.change(login, 'jump', 10);
        setTimeout(() => {
          ENGINE.Physic.bodyJump(animatedPlayer.shape, 6);
          setTimeout(() => {
            ANIMATED.deanimateType(login, 'jump', true);
            animatedPlayer.onAction.jump = false;
          }, 1300);
        }, 600);
      }
    }


    if (login == ENGINE.login && Object.keys(action).length > 0 && sendAction == true) {
      var pos = { x: player.pos.x, y: player.pos.y, z: player.pos.z };
      var qua = null;
      var near = ENGINE.GAME.getNearActors(2, login);
      try {
        qua = { x: player.qua.x, y: player.qua.y, z: player.qua.z, w: player.qua.w };
      } catch (e) { qua = { x: 0, y: 0, z: 0, w: 1 } }
      WSsend('ACTION', { login: login, action: action, near: near, pos: pos, qua: qua });
    }

  },

  getAnimated: function (login) {
    var animatedPlayer = ANIMATED._data[login];
    if (typeof (animatedPlayer.onAction) == _UN) animatedPlayer.onAction = {};
    return animatedPlayer;
  },

  ivallowDrop: function (ev) {
    ev.preventDefault();
  },

  ivdrag: function (ev) {
    ev.dataTransfer.setData("item", ev.target.id);
  },

  ivdrop: async function (ev) {
    ev.preventDefault();
    var player = ENGINE.GAME._me.player;
    var playerAnim = ENGINE.GAME._me.animatedPlayer;
    function putItemOnBag(index, boneName) {
      var itens = ENGINE.GAME._itenslist[player.login].itens[index];
      //var boneName = HELPER.getBonneByNumber(type);
      for (var c = 0; c < itens.scene.length; c++) {
        var val = itens.scene[c];
        if (val._OBJ3d != null) {
          playerAnim.bones[boneName].remove(val._OBJ3d);
        }
      }
      ENGINE.GAME._droplist[player.login].drops.push(itens);
      ENGINE.GAME._itenslist[player.login].itens.splice(index, 1);
    }
    var data = ev.dataTransfer.getData("item");
    var receiveItem = document.getElementById(data);
    if (!receiveItem.attributes) return;
    var rtype = receiveItem.attributes.getNamedItem('data-from').value;
    if (!rtype) return;

    var slotItem = ev.target;
    if (!slotItem.attributes) return
    var stype = slotItem.attributes.getNamedItem('data-to').value;
    if (!stype) return;

    if (stype === "d" && rtype === "d") {//bag to bag
      //ev.target.appendChild(receiveItem);
      ENGINE.GAME.repaintInventory();
      return;
    }
    if (stype === "d" && rtype === "i") { //hand to bag     
      var itype = parseInt(receiveItem.attributes.getNamedItem('data-type').value);
      var index = parseInt(receiveItem.attributes.getNamedItem('data-index').value);
      var bonename = receiveItem.parentElement.id.substr(2, receiveItem.parentElement.id.length).trim();
      putItemOnBag(index, bonename);
      //ev.target.appendChild(receiveItem);
      ENGINE.GAME.repaintInventory();
      return;
    }
    if (stype === "i" && rtype === "d") { //bag to hand
      var itype = parseInt(receiveItem.attributes.getNamedItem('data-type').value);
      var index = parseInt(receiveItem.attributes.getNamedItem('data-index').value);
      var bonename = ev.target.id.substr(2, ev.target.id.length).trim();
      //accept only drop equivalent item on bones
      //console.log(itype,bonename,HELPER.getBonneByNumber(1))
      if (itype == 1) //weapon
        if (bonename !== HELPER.getBonneByNumber(1) && bonename !== HELPER.getBonneByNumber(2)) return;
      if (itype == 2) //Armor
        if (bonename !== HELPER.getBonneByNumber(9)) return;
      if (itype == 4) //Shield
        if (bonename !== HELPER.getBonneByNumber(1)) return;
      if (itype == 5) //Legs
        if (bonename !== HELPER.getBonneByNumber(3) && bonename !== HELPER.getBonneByNumber(4)) return;
      if (itype == 6) //Helmet
        if (bonename !== HELPER.getBonneByNumber(7)) return;
      console.log('pass', bonename);
      //if have item on bone, put on bag
      for (var i = 0; i < ENGINE.GAME._itenslist[player.login].itens.length; i++) {
        var data = ENGINE.GAME._itenslist[player.login].itens[i];
        if (data.scene[0]._OBJ3d.parent == playerAnim.bones[bonename]) {
          putItemOnBag(i, bonename);
          break;
        }
      }
      //get number of bonename
      var type = 0;
      for (var i = 0; i < 10; i++) {
        if (bonename == HELPER.getBonneByNumber(i)) {
          type = i;
          break;
        }
      }
      var test = HELPER.getBonneByNumber(type);
      console.log('boneto', test, type);
      //put or create 3dobj and atach to bonne number
      var tile = ENGINE.GAME._itenslist[player.login].tile;
      var itens = ENGINE.GAME._droplist[player.login].drops[index]
      ENGINE.GAME._itenslist[player.login].itens.push(itens);
      var name = itens.name;
      if (typeof (itens.scene) == _UN) { //no loaded 3dobj   
        var url = ENGINE.url + 'LOADITEM' + name;
        var data = await HELPER.simpleDownloadSync(url);
        ENGINE.TILE.jsonToTileEditor(tile, data.obj, 0, 0, 0, function (obj, val) {
          if (val._OBJ3d != null) {
            HELPER.objaddToBone(val, player.login, type);
            ENGINE.itemCache.push(val._OBJ3d);
          }
        });
        itens.obj = data.obj;
        itens.scene = tile.scenevar;
        itens.item = data.item;
        repeat = true;
      } else {//as 3d created
        for (var c = 0; c < itens.scene.length; c++) {
          var val = itens.scene[c];
          if (val._OBJ3d != null) {
            HELPER.objaddToBone(val, player.login, type);
            ENGINE.itemCache.push(val._OBJ3d);
          }
        }
      }
      ENGINE.GAME._droplist[player.login].drops.splice(index, 1);
      ENGINE.GAME.repaintInventory();
      //ev.target.appendChild(receiveItem);
    }

  },

  repaintInventory: function () {
    var ivpos = ENGINE.GAME._players[ENGINE.GAME._me.player.login].bars.inventory.position.clone();
    //var lastpos={x:ivpos.x,y:ivpos.y,z:ivpos.z};
    ENGINE.scene.remove(ENGINE.GAME._players[ENGINE.GAME._me.player.login].bars.inventory);
    $('.inventory').remove();
    ENGINE.GAME.showInventory(true, function () {
      ENGINE.GAME._players[ENGINE.GAME._me.player.login].bars.inventory.position.copy(ivpos);
    });
  },

  showInventory: function (state, callback) {
    var player = ENGINE.GAME._me.player;
    function rndID() {
      var cid = 'ivid' + Math.floor(Math.random() * 26) + Date.now();
      if (document.getElementById(cid)) cid = rndID();
      return cid;
    }
    function addimgItem(div, item, type, from, index) {
      var dd = document.getElementById(div);
      dd.innerHTML =
        '<img id="' + rndID() + '" src="' + item.extra.icon + '" name="' + item.name + '" data-type="' + type + '" class="itemBody"' +
        ' data-from="' + from + '" data-index="' + index + '" draggable="true" ondragstart="ENGINE.GAME.ivdrag(event)"/>';
    }
    if (state == true) {
      ENGINE.DIALOG.load('inventory.html', function (dialog) {
        var inventory = document.createElement('div');
        inventory.className = 'inventory';
        inventory.innerHTML = dialog;
        $('#cssdata').html(inventory);
        player.bars.inventory = RENDERER.css(inventory);
        player.bars.inventory.position.copy(player.bars.div.position);
        ENGINE.scene.add(player.bars.inventory);

        if (ENGINE.GAME._itenslist[player.login])
          for (var i = 0; i < ENGINE.GAME._itenslist[player.login].itens.length; i++) {
            var data = ENGINE.GAME._itenslist[player.login].itens[i];
            var bonename = data.scene[0]._OBJ3d.parent.name;
            if (bonename.startsWith('mixamorig') == true)
            bonename = bonename.substr('mixamorig'.length, bonename.length);
            while (isNaN(bonename[0]) == false) {
              bonename = bonename.substr(1, bonename.length)
            }
            addimgItem('iv' + bonename, data.item, data.type, 'i', i);
          }
        if (ENGINE.GAME._droplist[player.login])
          for (var i = 0; i < ENGINE.GAME._droplist[player.login].drops.length; i++) {
            var data = ENGINE.GAME._droplist[player.login].drops[i];
            if (data && data != null) {
              addimgItem('iv' + (i + 1), data.item, data.type, 'd', i);
            }
          }
        if (typeof (callback) != 'undefined') callback();
      });
    } else {
      ENGINE.scene.remove(player.bars.inventory);
      if (typeof (callback) != 'undefined') callback();
    }
  },


  getNearActors: function (distance, login) {

    var ret = {};
    for (var i = 0; i < Object.keys(ENGINE.GAME._npcData).length; i++) {
      var npcName = Object.keys(ENGINE.GAME._npcData)[i];
      var npc = ENGINE.GAME._npcData[npcName];
      var animatedPlayer = ENGINE.GAME.getAnimated(npcName);
      if (!animatedPlayer.onAction.died || animatedPlayer.onAction.died == 0)
        if (npc.pos.distanceTo(ENGINE.GAME._players[login].pos) <= distance) {
          //NEED CALCULATE ANGLE BTWEEN PLAYER AND TARGET
          /*var angle=ENGINE.GAME._players[login].pos.angleTo(npc.pos);
          var angle=ENGINE.GAME._players[login].angle;
          var fakeobj=new THREE.Object3D();
              fakeobj.position.copy(ENGINE.GAME._players[login].pos);
              fakeobj.lookAt(npc.pos);
          var playerAngle =new THREE.Vector3();
          fakeobj.getWorldDirection(playerAngle);
          playerAngle = THREE.Math.radToDeg(Math.atan2(playerAngle.x, playerAngle.z));
          angle= THREE.Math.radToDeg(Math.atan2(angle.x, angle.z));
          console.log(angle,playerAngle);*/
          ret[npcName] = 1;
        }
    }

    for (var i = 0; i < Object.keys(ENGINE.GAME._players).length; i++) {
      var playerNane = Object.keys(ENGINE.GAME._players)[i];
      var player = ENGINE.GAME._players[playerNane];
      var animatedPlayer = ENGINE.GAME.getAnimated(playerNane);
      if (playerNane !== login) if (!animatedPlayer.onAction.died || animatedPlayer.onAction.died == 0)
        if (player.pos.distanceTo(ENGINE.GAME._players[login].pos) <= distance) {
          ret[playerNane] = 2;
        }
    }

    return ret;
  },


  lastMovTime: 0, //update mov position broadcast
  contactClick: null,
  onCanvasClick: function (event) {
    if (ENGINE.GAME.disableTileClick == true || typeof (ENGINE.intersects) == _UN) return;
    if (ENGINE.intersects.length <= 0) return;
    var player = ENGINE.GAME._me.player;
    var animatedPlayer = ENGINE.GAME._me.animatedPlayer;
    if (typeof (player) == _UN) return;
    if (animatedPlayer.onAction && animatedPlayer.onAction.inventory == true) return;
    for (var i = 0; i < ENGINE.intersects.length; i++) {
      var value = ENGINE.intersects[i];
      if (value && value.object && value.object.group && value.object.group.name) {
        if (value.object.group.name == 'Player') {
          ENGINE.GAME.contactClick = value;
          break;
        }
        if (value.object.group.name == 'Tile') {
          ENGINE.GAME.contactClick = value;
          break;
        }
      }
    }
    var object = ENGINE.GAME.contactClick.object;
    if (object == null || typeof (object) == _UN || typeof (object.group) == _UN) return;
    var pos = {
      x: ENGINE.GAME.contactClick.point.x,
      y: ENGINE.GAME.contactClick.point.y,
      z: ENGINE.GAME.contactClick.point.z
    };
    var speed = typeof (player.speed) == _UN ? ENGINE.GAME._speed.player : player.speed;
    var speedExtra = typeof (player.speedExtra) == _UN ? 0 : player.speedExtra;

    if (object.group.name == 'Tile') { //Ground Click
      var destin = {
        square: object.group.square,
        pos: pos,
        speed: speed,
        speedExtra: speedExtra,
      }
      //allow move up to 0.5 distance
      if (animatedPlayer.shape.position.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z)) > 0.7) {
        ENGINE.Physic.bodyMove(
          animatedPlayer.shape,
          new THREE.Vector3(pos.x, pos.y, pos.z), (speed + speedExtra), ENGINE.login);
        if (ENGINE.GAME.lastMovTime > ENGINE.GAME._speed.clickspeed) {
          _moveRow = { userdata: player, destin: destin };
          ENGINE.GAME.lastMovTime = 0;
        }
      }
    }
    if (object.group.name == 'Player') {
    }
  },


  messagew: function (received) {
    //console.log(received);
    if (!received.data) return;
    try {
      var JSONDATA = JSON.parse(JSON.stringify(received.data));
      if (JSONDATA.CONNECTED) {
        console.log('connected');
        ENGINE.GAME._connected = true;
        ENGINE.GAME._getPlayerConfig();
      } else {
        ENGINE.GAME.message(JSONDATA);
      }
    } catch (e) {
      console.warn('messagew Error', e);
    }
  },


  createBar: function (login) {
    var player = this.getPlayerOrNpc(login);
    var animatedPlayer = ENGINE.GAME.getAnimated(login);
    /*ENGINE.GAME._players[login];
    if (typeof (player) == 'undefined') player = ENGINE.GAME._npcData[login];
    */
    if (!player || player == null || !player.attr) return;
    if (!player.bars) player.bars = {};
    /*
    const cssuser = document.createElement('div');
    cssuser.className = 'cssuser';
    cssuser.id = 'cssuser' + login;//cssuser.innerHTML = login + '<br>';
    $('#cssdata').append(cssuser);//temp hiden div
    //lvl
    const lvl = document.createElement('div');
    lvl.className = 'dotlvl';
    lvl.innerHTML = player.attr.lvl;
    player.bars.lvl = lvl;
    cssuser.appendChild(lvl);
    //name
    const name = document.createElement('div');
    name.className = 'barname';
    name.innerHTML = login;
    player.bars.name = name;
    cssuser.appendChild(name);
    //health
    const health = document.createElement('progress');
    health.className = 'healthbar';
    health.value = parseInt(player.attr.hp);
    health.max = 100;
    player.bars.health = health;
    cssuser.appendChild(health);
    //transform in 2D relative
    player.bars.div = RENDERER.css(cssuser);
    */
    LOADER.textureLoader.load('/images/barbase.png', function (map) {
      var group = new THREE.Object3D();
      var material = new THREE.MeshBasicMaterial({ color: 'black', transparent: true });
      var geometry = new THREE.PlaneGeometry(3.2, 0.8);
      var plane = new THREE.Mesh(geometry, material);
      group.add(plane);
      plane.position.set(0, 0.4, -0.1);
      plane.material.opacity = 0.4;
      player.bars.box = plane;

      material = new THREE.SpriteMaterial({ map: map });
      var sprite = new THREE.Sprite(material);
      var imageWidth = map.image.width;
      var imageHeight = map.image.height;
      sprite.scale.set(1 * imageWidth, 1 * imageHeight, 1.0);
      sprite.scale.multiplyScalar(0.02);
      material.opacity = 0.5;
      player.bars.div = group;
      group.add(sprite);

      var mapl = LOADER.textureLoader.load('/images/barlife.png');
      material = new THREE.SpriteMaterial({ map: mapl });
      var sprite2 = new THREE.Sprite(material);
      material.opacity = 0.6;
      player.bars.hp = sprite2;
      sprite.add(sprite2);
      player.bars.hp.scale.x = parseInt(player.attr.hp) / 100;

      var dname = 0.5;
      var name = ENGINE.GAME.createText(login, dname, 'lime');
      var wname = (name.geometry.boundingBox.max.x - name.geometry.boundingBox.min.x);
      while (wname > 3.2) {
        dname = dname - 0.05;
        name = ENGINE.GAME.createText(login, dname, 'lime');
        wname = (name.geometry.boundingBox.max.x - name.geometry.boundingBox.min.x);
      }

      group.add(name);
      player.bars.name = name;
      player.bars.name.position.y = player.bars.name.position.y + 0.15;

      if (player.attr.hp <= 0) {
        animatedPlayer.onAction.died = 1;
        player.bars.div.visible = false;
        ANIMATED._data[login].shape.visible = false;
        ANIMATED._data[login].shape.userData.physicsBody.setCollisionFlags(1);
      }

      if (login != ENGINE.login)
        ENGINE.scene.add(group);
    });

  },

  message: async function (data) {
    //player disconnect
    if (typeof (data.DISCONNECT) !== _UN) {
      if (data.DISCONNECT.login == ENGINE.login) {
        location.reload();
      } else {
        this.playerLeave(data.DISCONNECT.login);
      }
      return;
    }
    //critical error on server data
    if (typeof (data.ERROR) !== _UN) {
      this.update = function () { };
      ENGINE.scene.visible = false;
      alert(data.ERROR);
      location.reload();
      return;
    }
    //invalid login no found server player config            
    if (typeof (data.INVALIDLOGIN) !== _UN) {
      //ENGINE.pass='';
      ENGINE.DIALOG.login('Login', 'Please Login', function (login, pass) {
        ENGINE.login = login;
        ENGINE.pass = pass;
        ENGINE.GAME._getPlayerConfig();
      });
      return;
    }
    //Try creating new login fails
    if (typeof (data.NEWLOGININVALID) !== _UN) {
      alert(data.NEWLOGININVALID.msg);
      $('#' + data.NEWLOGININVALID.id).focus();
      return;
    }
    //Try creating new login works
    /*if (typeof (data.NEWLOGINVALID) !== _UN) {      
      this.message({ INVALIDLOGIN: 'XX' });
      setTimeout(function(){
      ENGINE.DIALOG.reset();
      ENGINE.login = data.NEWLOGINVALID.login;
      ENGINE.pass = '';
      });
      return;
    }*/
    if (typeof (data.NEWLOGVALID) !== _UN) {
      var tmp1 = setInterval(() => {
        ENGINE.DIALOG.reset();
      }, 100);
      setTimeout(function () {
        clearInterval(tmp1);
        ENGINE.login = data.NEWLOGVALID.login;
        ENGINE.pass = data.NEWLOGVALID.pass1;
        ENGINE.GAME.message({ INVALIDLOGIN: 'XX' });
      }, 2000);
      return;
    }
    //valid login
    if (typeof (data.VALIDLOGIN) !== _UN) {
      if (data.VALIDLOGIN.login == ENGINE.login) {
        this._me = {};
        this._me = data.VALIDLOGIN;
        this._me.login = ENGINE.login;
        this.loadMap(); //if first time is Owner load map
      } else {
        await this.playerJoin(data.VALIDLOGIN);
      }
      return;
    }
    //PING RESPONSE   
    if (typeof (data.PING) !== _UN) {
      WSsend('PONG', { login: ENGINE.login });
      return;
    }
    //########### ONLINEPLAYERS #############
    //online players //get all playes on this map
    if (typeof (data.ONLINEPLAYERS) !== _UN && data.ONLINEPLAYERS.players) {
      var playerdata = data.ONLINEPLAYERS.players;
      for (var i = 0; i < Object.keys(playerdata).length; i++) {
        var player = Object.keys(playerdata)[i];
        // console.log('send', data[kname].login);
        //console.log(playerdata[player]);
        await this.playerJoin(playerdata[player]);
      }
      var npcdata = data.ONLINEPLAYERS.npcs;
      //console.log('movenpc', npcdata);
      if (npcdata && npcdata.length > 0)
        for (var i = 0; i < Object.keys(npcdata).length; i++) {
          var npcname = Object.keys(npcdata)[i];
          //console.log('npc update', npcname);
          ENGINE.GAME._npcs[npcname] = npcdata[npcname];
          if (npcdata[npcname].pos) ENGINE.GAME._npcData[npcname].pos = npcdata[npcname].pos;
          if (npcdata[npcname].qua) ENGINE.GAME._npcData[npcname].qua = npcdata[npcname].qua;
        }
      return;
    }
    //############################ AFTER THIS ONLY WORKS IF ONLINE ######################    
    if (this._completeloaded == false) return;

    //########### KILL  #####################
    if (typeof (data.KILL) !== _UN && data.KILL.killed && data.KILL.attr && data.KILL.login) {
      var playerdied = ENGINE.GAME.getPlayerOrNpc(data.KILL.killed);
      var animatedPlayer = ENGINE.GAME.getAnimated(data.KILL.killed);
      if (playerdied && playerdied.bars && playerdied.bars.hp) {
        playerdied.bars.div.visible = false;
        playerdied.bars.hp.scale.x = 0;
        animatedPlayer.onAction.died = 1;
        animatedPlayer.shape.visible = false;
        animatedPlayer.shape.userData.physicsBody.setCollisionFlags(1);
      }
      var player = ENGINE.GAME.getPlayerOrNpc(data.KILL.login);
      if (player && player.bars && player.bars.hp) {
        player.attr.exp = data.KILL.attr.exp;
        if (data.KILL.attr.lvl != player.attr.lvl) {
          player.attr.lvl = data.KILL.attr.lvl;
          //player.bars.lvl.innerText = player.attr.lvl;
        }
      }
    }
    //########### NPCREVIVE #################
    if (typeof (data.NPCREVIVE) !== _UN && data.NPCREVIVE.active && data.NPCREVIVE.login) {
      var player = ENGINE.GAME.getPlayerOrNpc(data.NPCREVIVE.login);
      var animatedPlayer = ENGINE.GAME.getAnimated(data.NPCREVIVE.login);
      if (player && player.bars && player.bars.hp) {
        player.bars.div.visible = true;
        player.bars.hp.scale.x = 1;
        animatedPlayer.onAction.died = 0;
        animatedPlayer.shape.visible = true;
        animatedPlayer.shape.userData.physicsBody.setCollisionFlags(0);
      }
    }
    //########### ATACK #####################
    if (typeof (data.ATACK) !== _UN && data.ATACK.targets) {
      for (var i = 0; i < Object.keys(data.ATACK.targets).length; i++) {
        var name = Object.keys(data.ATACK.targets)[i];
        var value = data.ATACK.targets[name];
        var player = ENGINE.GAME.getPlayerOrNpc(name);
        if (player && player.bars && player.bars.hp) {
          player.bars.hp.scale.x = parseInt(value.hp) / 100;
        }
      }
    }
    //########### MOVETO #############
    //click to move
    if (typeof (data.MOVETO) !== _UN) {
      if (typeof (data.MOVETO.login) == _UN || typeof (data.MOVETO.destin) == _UN) return;
      if (data.MOVETO.login == ENGINE.login) return; //disable auto listen self moves
      var object = ANIMATED._data[data.MOVETO.login].shape;
      var movto = new THREE.Vector3().copy(data.MOVETO.destin.pos);
      var speed = data.MOVETO.destin.speed;
      var speedExtra = data.MOVETO.destin.speedExtra;
      speed = (speed + (isNaN(speedExtra) == true ? 0 : speedExtra));
      ENGINE.Physic.bodyMove(object, movto, speed, data.MOVETO.login);
      //moving if have npc values      
      var npcdata = data.MOVETO.npcs;
      //console.log(npcdata,data.MOVETO);      
      if (npcdata)
        for (var i = 0; i < Object.keys(npcdata).length; i++) {
          var npcname = Object.keys(npcdata)[i];
          var npcdata = npcdata[npcname];
          if (npcdata.pos && ANIMATED._data[npcname] && ANIMATED._data[npcname].shape) {
            var newpos = new THREE.Vector3(npcdata.pos.x, npcdata.pos.y, npcdata.pos.z);
            var newrotation = new THREE.Quaternion(npcdata.qua.x, npcdata.qua.y, npcdata.qua.z, npcdata.qua.w);
            var shape = ANIMATED._data[npcname].shape;
            if (shape.position.distanceTo(newpos) > 0.5) {
              var objphysic = shape.userData.physicsBody;
              //console.log(objphysic);
              ENGINE.GAME._npcData[npcname].pos = newpos;
              ENGINE.GAME._npcData[npcname].qua = newrotation;
              var world = objphysic.getWorldTransform();
              var positionA = world.getOrigin();
              var rotationA = world.getRotation();
              positionA.setValue(newpos.x, newpos.y, newpos.z);
              world.setOrigin(positionA);
              rotationA.setValue(newrotation.x, newrotation.y, newrotation.z, newrotation.w);
              world.setRotation(rotationA);
            }
          }

        }
      return;
    }
    //########### NPCTELEPORT  #####################
    if (typeof (data.NPCTELEPORT) !== _UN) {
      if (typeof (data.NPCTELEPORT.login) == _UN || typeof (data.NPCTELEPORT.destin) == _UN) return;
      if (data.NPCTELEPORT.login == ENGINE.login) return; //disable auto listen self moves
      var object = ANIMATED._data[data.NPCTELEPORT.login].shape;
      var movto =
        new THREE.Vector3(data.NPCTELEPORT.destin.x, data.NPCTELEPORT.destin.y, data.NPCTELEPORT.destin.z);
      ENGINE.Physic.bodyTeleport(ANIMATED._data[data.NPCTELEPORT.login].shape, movto);
    }
    //################ NPCMOVE AI ############
    if (typeof (data.NPCMOVE) !== _UN) {
      if (typeof (data.NPCMOVE.login) == _UN || typeof (data.NPCMOVE.destin) == _UN) return;
      if (data.NPCMOVE.login == ENGINE.login) return; //disable auto listen self moves
      var object = ANIMATED._data[data.NPCMOVE.login].shape;
      var movto = new THREE.Vector3(data.NPCMOVE.destin.x, data.NPCMOVE.destin.y, data.NPCMOVE.destin.z);
      var speed = ENGINE.GAME._speed.player * data.NPCMOVE.speed;
      if (!object.position.y || object.position.y < -10) {//teleport buggued npc        
        ENGINE.Physic.bodyTeleport(ANIMATED._data[data.NPCMOVE.login].shape, movto);
      } else {
        if (object.position.distanceTo(movto) > 1)
          ENGINE.Physic.bodyMove(object, movto, speed, data.NPCMOVE.login);
      }
    }
    //########### ACTION  ##################
    if (typeof (data.ACTION) !== _UN) {
      //console.log(data.ACTION);
      if (typeof (data.ACTION.login) == _UN ||
        typeof (data.ACTION.action) == _UN ||
        typeof (ANIMATED._data[data.ACTION.login]) == _UN ||
        data.ACTION.login == ENGINE.login) return;
      ENGINE.GAME.playerAction(data.ACTION.login, data.ACTION.action);
    }
    //########### UPDATEPLAYER #############
    //update player real position 
    if (typeof (data.UPDATEPLAYER) !== _UN) {
      if (typeof (data.UPDATEPLAYER.login) == _UN ||
        typeof (data.UPDATEPLAYER.pos) == _UN ||
        typeof (data.UPDATEPLAYER.qua) == _UN ||
        typeof (ANIMATED._data[data.UPDATEPLAYER.login]) == _UN) return;
      var login = data.UPDATEPLAYER.login;
      var pos = data.UPDATEPLAYER.pos;
      var position = new THREE.Vector3(pos.x, pos.y, pos.z);
      var qua = data.UPDATEPLAYER.qua;
      var rotation = new THREE.Quaternion(qua.x, qua.y, qua.z, qua.w);
      var object = ANIMATED._data[login].shape;
      var phyobject = object.userData.physicsBody;
      var active = ANIMATED._data[login].active;
      ENGINE.Physic.bodyUpdate(object, position, rotation);
      if (data.UPDATEPLAYER.active && active != data.UPDATEPLAYER.active)
        ANIMATED.change(login, active, 10); //force animation as same of received by update
      //only updatemoves if not me
      if (typeof (data.UPDATEPLAYER.moves) !== _UN && data.UPDATEPLAYER.moves != null &&
        data.UPDATEPLAYER.login !== ENGINE.login) {
        pos = data.UPDATEPLAYER.moves.destin;
        var destin = new THREE.Vector3(pos.x, pos.y, pos.z);
        ENGINE.Physic.bodyMove(phyobject, destin, data.UPDATEPLAYER.moves.speed, data.UPDATEPLAYER.login);
      }
      //update NPCS changes      
      var npcs = data.UPDATEPLAYER.npcs;
      if (npcs && npcs != null && Object.keys(npcs).length > 0) {
        for (var i = 0; i < Object.keys(npcs).length; i++) {
          var npcname = Object.keys(npcs)[i];
          console.log('change npc', npcname);
        }
      }
      return;
    }
    //default
    if (typeof (data.VALUE) !== _UN) {
      return;
    }
  },

}