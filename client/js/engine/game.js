window._UN = 'undefined';
ENGINE.GAME = {
  _me: {}, //my data
  _players: new Array(),//array same as mydata 
  _playerstemp: new Array(),//array same as mydata ( waiting to load on next fulloaded)
  _entitys: new Array(),
  _actors: new Array(), //buff actors preload to revive  
  _sounds: new Array(), //buff sounds ambient
  _tiles: null,
  _currentmap: null,
  _speed: {   player: 2.3, cam: 1, camRotate: 1, 
            /*system*/camExtra: 0, mbLeft: 0, mbRight: 0, updTime: 5, clickspeed: 1 },
  _spawnposition: new THREE.Vector3(),
  _fullloaded: false,
  _completeloaded: false,


  _updateItemTimer: null, //timer check itens loaded
  _itenslist: [],         //in use itens visible in world

  _updateDropTimer: null, //timer check drops loaded
  _droplist: [],         //itens in inventory for players - itensdrop for NPCS

  _updateAudioTimer: null, //timer check audios loaded (entity)
  _audioslist: [], //audio on Entitys

  _updatePlayersTimer: 0,            //broadcast time (players state)
  _updateColidersTimer: 0,            //broadcast time (players state)

  _moveRow:null,

  update: function (delta) {
    if (this._completeloaded == false) return;
    this.lastMovTime += delta;
    CONTROLS.update(delta); //update camera position
    this.checkstate();
    this.cameraFocusPlayer(delta); //update camera target position (folow player smooth)    
    this.updatePlayerState(delta);
    this.updateColiders(delta);
    if (this._speed.mbLeft == 1) this.onCanvasClick(null);
  },


  renderupdate:function(){
    if(this._moveRow!=null){
      WSsend('MOVETO', this._moveRow);
      this._moveRow=null;
    }    
    requestAnimationFrame(ENGINE.GAME.renderupdate);
  },

  checkstate: function () {
    
  },

  cameraFocusPlayer: function (delta) {
    if (typeof (CONTROLS.screenSpacePanning) == _UN ||
      Object.keys(ENGINE.GAME._players).length < 1 ||
      ENGINE.GAME._fullloaded == false) return;
    if (typeof (ANIMATED._data[ENGINE.login]) == _UN) return;
    this._me.pos = ANIMATED._data[ENGINE.login].shape.position;
    //CONTROLS.target.set(this._me.pos.x,this._me.pos.y,this._me.pos.z); return;//easy folow    
    var distance = CONTROLS.target.distanceTo(this._me.pos);
    var direction = new THREE.Vector3().subVectors(this._me.pos, CONTROLS.target).normalize();

    var speedBase = this._speed.cam + this._speed.camExtra;
    var aplyspeed = 0;
    if (distance > 1) {
      aplyspeed = (speedBase * distance) * delta;
    } else {
      aplyspeed = speedBase * delta;
    }
    if (distance > 0.05) {
      CONTROLS.target.addScaledVector(direction, aplyspeed);
    }
    //change camera position   
    return;
    if (ENGINE.GAME._players.mbRight == 1) return;
    if (!ENGINE.GAME._players[ENGINE.login] ||
      !ENGINE.GAME._players[ENGINE.login].angle ||
      !ENGINE.GAME._players[ENGINE.login].angle.isVector3) return;
    var playerA3D = ENGINE.GAME._players[ENGINE.login].angle;
    var playerAngle = THREE.Math.radToDeg(Math.atan2(playerA3D.x, playerA3D.z));
    var camA3d = new THREE.Vector3(); ENGINE.camera.getWorldDirection(camA3d);
    var camAngle = THREE.Math.radToDeg(Math.atan2(camA3d.x, camA3d.z));
    var diference = 0;
    if (playerAngle > camAngle) { //camera at left
      diference = playerAngle - camAngle;
      if (diference > 45)
        CONTROLS.move.rotateLeft(-(ENGINE.GAME._speed.camRotate * (diference / 180)) * delta);
    } else { //camera at right
      diference = camAngle - playerAngle;
      if (diference > 45)
        CONTROLS.move.rotateLeft((ENGINE.GAME._speed.camRotate * (diference / 180)) * delta);
    }
  },


  updatePlayerState: function (delta) {
    this._updatePlayersTimer += delta; //time to update player state
    if (this._updatePlayersTimer > this._speed.updTime && typeof (ANIMATED._data[ENGINE.login]) !== _UN) {
      console.log('update')
      var annime = ANIMATED._data[ENGINE.login];
      var object = annime.shape;
      var moves = object.userData.physicsBody.move;
      var player = ENGINE.GAME._players[ENGINE.login];
      if (typeof (player.extraspeed) == _UN) player.extraspeed = 0;
      if (typeof (moves) == _UN || moves.ACTIVE != true) moves = null;
      var pos = { x: object.position.x, y: object.position.y, z: object.position.z };
      var qua = { x: object.quaternion.x, y: object.quaternion.y, z: object.quaternion.z, w: object.quaternion.w };
      WSsend('UPDATEPLAYER', { pos: pos, qua: qua, moves: moves });
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
    return;
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
        this.playerActivateActor(player, object);
      }

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



  mouseEvent: function (event, down) { //detect Right click fast focus player        
    
    if (this._completeloaded == false || typeof (event.button) == _UN) return;
    //down 1= down 0 up
    //event.button = 0=left 1=midle 2right

    if (event.button == 2)
      if (down == 1) {
        ENGINE.GAME._speed.camExtra = 3;
        ENGINE.GAME._players.mbRight = 1;
      } else {
        ENGINE.GAME._speed.camExtra = 0;
        ENGINE.GAME._players.mbRight = 0;
      }

    if (event.button == 0)
      if (down == 1) {
        ENGINE.GAME._speed.mbLeft = 1;
      } else {
        ENGINE.GAME._speed.mbLeft = 0;
      }

  },

  playerAction: function (action) { //Change Player State
    if (this._completeloaded == false && typeof (ENGINE.GAME._players[ENGINE.login]) == _UN) return;

    if (action == 'run') {
      //console.log('fastrun');
      ENGINE.GAME._players[ENGINE.login].speedExtra = 2;
    }
    if (action == '') {
      //console.log('normal');
      ENGINE.GAME._players[ENGINE.login].speedExtra = 0;
    }
  },

  play: function () {
    $('#playdiv').hide();
    ENGINE.login = $('#DIALOGLOGIN').val();
    ENGINE.pass = $('#DIALOGPASS').val();
    var socklocal = ENGINE.url.replace('http://', '').replace('https://', '').replace('//', '');
    if(socklocal.endsWith('/')==true)socklocal=socklocal.substr(0,socklocal.length-1);
    var socketws= ENGINE.url.replace('http://', '')==ENGINE.url ? 'wss//' : 'ws://';
    console.log(socketws+socklocal);
    webSocketWorker.port.addEventListener('message', ( receive ) => {
      requestAnimationFrame(() => {    
        ENGINE.GAME.messagew(receive);
        //console.log(receive);
      });
    });
    WSconnect(socketws+socklocal);   
    requestAnimationFrame(ENGINE.GAME.renderupdate);     
    //this._getPlayerConfig();
   /* SOCKET.wsConnect(socklocal, (error) => {
      if (typeof (error) !== _UN) {
        SOCKET.secure = !SOCKET.secure; //try inverse secure
        error = undefined;
        SOCKET.wsConnect(socklocal, (error) => {
          if (typeof (error) !== _UN) {
            ENGINE.DIALOG.popup('<br><br>Impossible to Connect to:<br>' + socklocal, 'Socket Error')
          } else {
            this._getPlayerConfig();
          }
        });
      } else {
        this._getPlayerConfig();
      }
    });
    */
  },


  _getPlayerConfig: function () {    
      WSsend('GETPLAYERCONFIG', { login: ENGINE.login, pass: ENGINE.pass });
  },

  _newLogin: function (action) {
    if (action == false) {
      this.message({ INVALIDLOGIN: 'XX' })
    } else {
      //SOCKET.recon(function () {
        ENGINE.login = $('#xlogin').val();
        WSsend('NEWLOGIN', {
          login: $('#xlogin').val(),
          pass1: $('#xpass1').val(),
          pass2: $('#xpass2').val(),
          mail: $('#axmail').val(),
          bdate: $('#xdate').val()
        });
     // });
    }
  },

  createLogin: function () {
    ENGINE.DIALOG.reset();
    ENGINE.DIALOG.load('createlogin.html', function (dialog) {
      ENGINE.DIALOG.popup(dialog, 'New Login', true);
    });
  },

  loadMap: async function () {
    //console.log('Loading Map:', name);  
    this._fullloaded = false;
    ENGINE.clear();
    ENGINE.renderer.setClearColor('black');
    ENGINE.DIALOG.reset();
    ENGINE.Physic.skinMaterial.visible = false;
    ENGINE.debugRay = false;
    ENGINE.Physic.debugPhysics = true;
    ENGINE.Physic.skinMaterial.visible = true;
    HELPER.hideTransform();
    ENGINE.scene.visible = false;
    ENGINE.showLoading(true);
    ANIMATED.clear();
    ANIMATED._data = new Array();
    /*
    ENGINE.Light.addAmbient("#ffffff", 0.5);
    var l1 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
      new THREE.Vector3(100, 100, 100));
    l1.helper.visible = false;
    */
    this._currentmap = this._me.map;
    var url = ENGINE.url + 'LOADMAPS' + this._currentmap;
    if (this._updateItemTimer != null) clearTimeout(this._updateItemTimer);
    this._itenslist = [];
    this._entityCount = 0;
    this.actors = new Array();
    this._players = new Array();

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
        if (l1.helper.parent) {
          //if(l1.helper.parent.target.parent){
          //  l1.helper.parent.target.parent.remove(l1.helper.parent.target);
          // }
          l1.helper.parent.remove(l1.helper);
        }
      }


    //script
    var script = data.script;
    if (typeof (script) !== _UN) {
      HELPER.script(script);
      //$('#mscript').val(script);
    }

    //console.log(this._entityCount)
    if (this._entityCount == 0) {
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
    if (this._fullloaded == false) { //buffer players to load no time to load 
      this._playerstemp[player.login] = player;
      return;
    }
    if (player.login && player.save && player.map && player.entity) { //load buffered players
      if (typeof (this._players[player.login]) == _UN) {//add new        
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
        HELPER.updateArray(this._players[player.login], player); //update base with player data

        this._loadEntityObj(startile, player.login, data)
      } else {//update existing or Load complete
        if (player.login == ENGINE.login && typeof (CONTROLS.screenSpacePanning) == _UN) {
          var campos = ANIMATED._data[player.login].shape.position.clone().
            add(new THREE.Vector3(0, 10, 0)).
            sub(new THREE.Vector3(0, 0, 5));
          ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT, campos, ANIMATED._data[player.login].shape);
          CONTROLS.minDistance = 3;
          CONTROLS.maxDistance = 14;
          CONTROLS.maxPolarAngle = CONTROLS.minPolarAngle = 0.5728786603604932;
          CONTROLS.screenSpacePanning = false;
          CONTROLS.enablePan = false;
          CONTROLS.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,//THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE//THREE.MOUSE.PAN
          }
          this.clearCache();
        }
      }
    }
  },

  clearCache: function () {
    this._playerstemp = [];
    ENGINE.showLoading(false);
    ENGINE.scene.visible = true;
    this._completeloaded = true;
  },

  playerLeave: function (login) {
    if (ENGINE.GAME._itenslist[login].itens)//remove owned itens
      for (var i = 0; i < ENGINE.GAME._itenslist[login].itens.length; i++) {
        if (ENGINE.GAME._itenslist[login].itens[i].scene)
          for (var b = 0; b < ENGINE.GAME._itenslist[login].itens[i].scene.length; b++) {
            var obj3d = ENGINE.GAME._itenslist[login].itens[i].scene[b]._OBJ3d;
            if (obj3d.isObject3D) {
              if (obj3d.parent) obj3d.parent.remove(obj3d);
              obj3d.selfremove = true;
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
              obj3d.selfremove = true;
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
    //console.log('loadentity', name, data);
    ANIMATED.load(
      data.model.url,
      name,
      data.model.sca,
      function (mobj) {
        //console.log('loadentity complete', name);

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

        ENGINE.Physic.bodyTeleport(
          ANIMATED._data[name].shape,
          new THREE.Vector3(
            startposition.x + data.box.pos.x,
            startposition.y + ANIMATED._data[name].shape.position.y + data.box.pos.y,
            startposition.z + data.box.pos.z
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
        if (typeof (callback) == 'function') callback(mobj);
      }, data);
  },

  //_audioslist
  //################ AUDIOS LOADER #################
  _cacheEntitySounds: async function (entityName, audios, tile) {
    if (typeof (this._audioslist[entityName]) == _UN) {
      if (typeof (audios) == _UN) audios = new Array();
      console.log('cache', entityName, audios)
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
        if (audioarray.live) { //have sound loaded
          ANIMATED._data[entityName].audio.add(audioarray.live);
        } else { //no sound loaded
          HELPER.audioAtatch(audioarray.audio, null, (sound) => { //only buff
            audioarray.live = sound.audio;
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
        this._actors[i].physic = ENGINE.Physic.addPhisicBox(actPos, new THREE.Quaternion(), { x: 1.5, y: 0.01, z: 1.5 });
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
        var tileName = sndarr.tile;
        var pos = sndarr.audio.pos;
        tileName = tileName.split('x');
        var tile = ENGINE.TILE.getTileByXY(tileName[0], tileName[1]);
        var actPos = tile.position.clone().add(new THREE.Vector3(pos.x, pos.y, pos.z));
        this.addasphereSound(sndarr.audio.name);
        sndarr.audio.obj.position.copy(actPos);
        sndarr.audio.obj.visible = true;
      }
    }
    //ENGINE.EDITORM._updateSoundList();
  },

  /*addasphereSound: function (name) {
    for (var i = 0; i < this._sounds.length; i++) {
      var selsound = this._sounds[i];
      if (selsound.audio.name == name) {
        var actPos = selsound.audio.pos;
        actPos = new THREE.Vector3(actPos.x, actPos.y + 0.5, actPos.z);
        var spphere = HELPER.areaSphere(actPos, 1, 'gold', false, 5);
        selsound.audio.obj = spphere;
        HELPER.audioAtatch(selsound.audio.audio, spphere, (getaudio) => {
          getaudio.audio.setVolume(selsound.audio.volume);
          selsound.audio.live = getaudio.audio;
        })
        break;
      }
    }
  },*/

  addasphereSound: function (name) {
    for (var i = 0; i < this._sounds.length; i++) {
      var selsound = this._sounds[i];
      if (selsound.audio.name == name) {
        var actPos = selsound.audio.pos;
        actPos = new THREE.Vector3(actPos.x, actPos.y + 0.5, actPos.z);
        var spphere = null;
        if (selsound.audio.type == 0) {
          spphere = HELPER.areaSphere(actPos, 1, 'gold', false, 5);
          spphere.visible = false;
        }
        selsound.audio.obj = spphere;
        HELPER.audioAtatch(selsound.audio.audio, spphere, (getaudio) => {
          getaudio.audio.setVolume(selsound.audio.volume);
          selsound.audio.live = getaudio.audio;
          if (selsound.audio.type == 1) { //ambient
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



  _loadComplete: function () {
    setTimeout(() => {

      ENGINE.GAME._fullloaded = true;
      //ENGINE.GAME._freezeActors();
      for (var i = 0; i < Object.keys(ENGINE.GAME._playerstemp).length; i++) {
        var kname = Object.keys(ENGINE.GAME._playerstemp)[i];
        var data = ENGINE.GAME._playerstemp[kname];
        //var model = { entity: undefined, login: undefined, map: undefined, pos: undefined, qua: undefined, 
        //  speed: undefined, save: {} };
        // HELPER.updateArray(model, data);
        ENGINE.GAME.playerJoin(data);
      }
      $(window).off("keyup").on("keyup", this.onDocumentKeyUp);
      $(window).off("keydown").on("keydown", this.onDocumentKeyDown);
      $(ENGINE.canvObj).off("click").on("click", this.onCanvasClick);
      CONTROLS.mouseEvent = ENGINE.GAME.mouseEvent;

    }, 500);
  },

  onDocumentKeyUp: function (event) {
    if (ENGINE.GAME.disableTileClick == true || typeof (ENGINE.intersects) == _UN) return;
    if (event.code == 'KeyD' && (!event.ctrlKey)) { //key D - Run
      ENGINE.GAME.playerAction('');
    }
  },

  onDocumentKeyDown: function (event) {
    if (event.code == 'KeyZ' && (event.ctrlKey || event.metaKey)) {
      ENGINE.adminPopup();
    }
    if (ENGINE.GAME.disableTileClick == true || typeof (ENGINE.intersects) == _UN) return;
    if (event.keyCode == 112 && (!event.ctrlKey)) { //key F1
      ENGINE.GAME.cameraFocusPlayer();
      return false;
    }
    if (event.code == 'KeyD' && (!event.ctrlKey)) { //key D - Run
      ENGINE.GAME.playerAction('run');
    }
  },

  lastMovTime: 0,
  onCanvasClick: function (event) {
    if (ENGINE.GAME.disableTileClick == true || typeof (ENGINE.intersects) == _UN) return;
    if (ENGINE.intersects.length <= 0 || typeof (ENGINE.intersects[0].object) == _UN) return;
    if (ENGINE.GAME.lastMovTime < ENGINE.GAME._speed.clickspeed) return;
    if (typeof (ENGINE.GAME._players[ENGINE.login]) == _UN) return;
    var contact = ENGINE.intersects[0];
    var object = contact.object; //first encounter
    if (typeof (object.group) == _UN) return;

    if (object.group.name == 'Tile') {//      
      var playerdata = ENGINE.GAME._players[ENGINE.login];
      var pos = { x: contact.point.x, y: contact.point.y, z: contact.point.z };
      var speed = typeof (playerdata.speed) == _UN ? ENGINE.GAME._speed.player : playerdata.speed;
      var speedExtra = typeof (playerdata.speedExtra) == _UN ? 0 : playerdata.speedExtra;
      var destin = {
        square: object.group.square,
        pos: pos,
        speed: speed,
        speedExtra: speedExtra
      }
      ENGINE.Physic.bodyMove(
        ANIMATED._data[ENGINE.login].shape,
        new THREE.Vector3(pos.x, pos.y, pos.z), speed + speedExtra, ENGINE.login);
      _moveRow={ userdata: playerdata, destin: destin };
      //WSsend('MOVETOX', { userdata: playerdata, destin: destin });
      ENGINE.GAME.lastMovTime = 0;

      //console.log('sendmov', data);
      return;
    }
  },

  messagew:function(received){    
    //window.RC=received;
    //console.log('rcv',received);        
    if(!received.data)return;
    try{
      var JSONDATA = JSON.parse(JSON.stringify(received.data));      
      if(JSONDATA.CONNECTED){
        console.log('connected');
        ENGINE.GAME._getPlayerConfig();
      }else{
        ENGINE.GAME.message(JSONDATA);
      }
    }catch(e){
      console.warn('messagew Error',e);
    }        
  },

  message: function (data) {
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
    if (typeof (data.NEWLOGINVALID) !== _UN) {
      ENGINE.DIALOG.reset();
      ENGINE.login = data.NEWLOGINVALID.login;
      ENGINE.pass = '';
      this.message({ INVALIDLOGIN: 'XX' });
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
        this.playerJoin(data.VALIDLOGIN);
        //var startile = ENGINE.TILE.getTileByXY(0, 0);
        //var url = ENGINE.url + 'LAOADENT' + data.VALIDLOGIN.entity;
        //var edata = await HELPER.simpleDownloadSync(url);
        //this._loadEntityObj(startile, data.VALIDLOGIN.login, edata)
      }
      return;
    }
    //PING RESPONSE   
    if (typeof (data.PING) !== _UN) {
      WSsend('PONG', { login: ENGINE.login });
      return;
    }
    //update online players
    if (typeof (data.ONLINEPLAYERS) !== _UN) {
      var data = data.ONLINEPLAYERS;
      for (var i = 0; i < Object.keys(data).length; i++) {
        var kname = Object.keys(data)[i];
        // console.log('send', data[kname].login);
        this.playerJoin(data[kname]);
      }
      return;
    }
    //############################ AFTER THIS ONLY WORKS IF ONLINE ######################
    if (this._completeloaded == false) return;
    //########### MOVETO #############
    //click to move
    if (typeof (data.MOVETO) !== _UN) {
      if (typeof (data.MOVETO.login) == _UN || typeof (data.MOVETO.destin) == _UN) return;
      if (data.MOVETO.login == ENGINE.login) return; //disable auto listen self moves
      var object = ANIMATED._data[data.MOVETO.login].shape;
      var movto = new THREE.Vector3().copy(data.MOVETO.destin.pos);
      var speed = data.MOVETO.destin.speed;
      var speedExtra = data.MOVETO.destin.speedExtra;
      //if (typeof (speedExtra) == _UN) speedExtra = 0;
      //ENGINE.GAME._players[data.MOVETO.login].speedExtra = data.MOVETO.speedExtra;
      //if (ANIMATED._data[data.MOVETO.login].active == 'idle')ANIMATED.change(data.MOVETO.login, 'walk', 10);
      ENGINE.Physic.bodyMove(object, movto, speed + speedExtra, data.MOVETO.login);
      /*, () => {
        ANIMATED.change(data.MOVETO.login, 'idle', 10);
        var pos = { x: object.position.x, y: object.position.y, z: object.position.z };
        var rot = { x: object.quaternion.x, y: object.quaternion.y, z: object.quaternion.z, w: object.quaternion.w };
        if (data.MOVETO.login == ENGINE.login) {
          SOCKET.send('UPDATEPLAYER', { login: ENGINE.login, pos: pos, qua: rot });
          ENGINE.GAME._updateMe = 0;
        }
      });*/
      return;
    }
    //########### UPDATEPLAYER #############
    //update player real position 
    if (typeof (data.UPDATEPLAYER) !== _UN) {

      if (typeof (data.UPDATEPLAYER.login) == _UN ||
        typeof (data.UPDATEPLAYER.pos) == _UN ||
        typeof (data.UPDATEPLAYER.qua) == _UN ||
        typeof (ANIMATED._data[data.UPDATEPLAYER.login]) == _UN) return;
      var pos = data.UPDATEPLAYER.pos;
      var position = new THREE.Vector3(pos.x, pos.y, pos.z);
      var qua = data.UPDATEPLAYER.qua;
      var rotation = new THREE.Quaternion(qua.x, qua.y, qua.z, qua.w);
      var object = ANIMATED._data[data.UPDATEPLAYER.login].shape;
      var phyobject = object.userData.physicsBody;
      ENGINE.Physic.bodyUpdate(object, position, rotation);
      //only updatemoves if not me
      if (typeof (data.UPDATEPLAYER.moves) !== _UN && data.UPDATEPLAYER.moves != null &&
        data.UPDATEPLAYER.login !== ENGINE.login) {
        //if(typeof(phyobject.move)==_UN || phyobject.move==null)phyobject.move={};
        //console.log(phyobject.move);
        //HELPER.updateArray(phyobject.move, data.UPDATEPLAYER.moves);  
        //phyobject.move= data.UPDATEPLAYER.moves;   
        //console.log(data.UPDATEPLAYER.moves);  
        //phyobject.move.playerName = data.UPDATEPLAYER.login;
        // if (data.UPDATEPLAYER.player.speedExtra)
        // phyobject.move.speed += data.UPDATEPLAYER.player.speedExtra;
        //console.log(data.UPDATEPLAYER.moves);  
        pos = data.UPDATEPLAYER.moves.destin;
        var destin = new THREE.Vector3(pos.x, pos.y, pos.z);
        ENGINE.Physic.bodyMove(phyobject, destin, data.UPDATEPLAYER.moves.speed, data.UPDATEPLAYER.login);
      }
      return;
    }
    //default
    if (typeof (data.VALUE) !== _UN) {
      return;
    }
  },

}