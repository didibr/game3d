
ENGINE.EDITORM = {
  _tiles: null,
  _tileselected: null,
  _size: { x: 0, y: 0 },
  _entityCount: 0,

  disableTileClick: false,

  _actors: new Array(),
  _sounds: new Array(),
  //used do itens in Entity
  _updateItemTimer: null,
  _itenslist: [],


  _configureBaseView: function (cells, rows) {
    if (typeof (TransformControl.control.object) !== 'undefined') {
      TransformControl.control.detach(TransformControl.control.object);
    }
    ENGINE.clear();
    ENGINE.EDITORM._itenslist = [];
    if (ENGINE.EDITORM._updateItemTimer != null) clearTimeout(ENGINE.EDITORM._updateItemTimer);
    if (typeof (cells) == "undefined" || typeof (rows) == "undefined") return;
    ENGINE.debugRay = true;
    ENGINE.Physic.debugPhysics = true;
    ENGINE.Light.addAmbient("#ffffff", 0.5);
    var l1 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
      new THREE.Vector3(100, 100, 100));
    l1.helper.visible = false;
    //add single Tile
    ENGINE.EDITORM._tiles =
      ENGINE.TILE.createTiles(10, 10, cells, rows);
    ENGINE.EDITORM._size.x = cells;
    ENGINE.EDITORM._size.y = rows;
    //change camera to ORBIT
    var camstepbackZ = (10 * rows) / 2;
    var camstepbackX = (10 * cells) / 2;
    ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT,
      new THREE.Vector3(camstepbackX - 5, 10, camstepbackZ - 10),
      new THREE.Vector3(camstepbackX - 5, 0, camstepbackZ - 5));
    ENGINE.DIALOG.reset();
    ENGINE.EDITORM._tileselected = null;
    //ENGINE.EDITORM._tiles = null;
    ENGINE.renderer.setClearColor('black');
    ENGINE.EDITORM._entityCount = 0;
    ENGINE.Physic.skinMaterial.visible = false;
    ANIMATED.clear();
    ANIMATED._data = new Array();
  },


  show: function (cells, rows, noReset, map) {
    if (typeof (cells) == 'undefined') cells = 0;
    if (typeof (rows) == 'undefined') rows = 0;
    if (ENGINE.login == null) {
      ENGINE.DIALOG.login('Login', 'Admin Login', function (login, pass) {
        ENGINE.login = login;
        ENGINE.pass = pass;
        ENGINE.EDITORM.show();
      });
      return;
    }


    if (noReset !== true)
      ENGINE.EDITORM._configureBaseView(cells, rows);//initial configuration  
    ENGINE.DIALOG.load('editorm.html', function (dialog) {
      ENGINE.DIALOG.popup(dialog, 'Map Editor', true);
      if (typeof (cells) != "undefined" && typeof (rows) != "undefined") {
        $('#cells').val(cells == 0 ? 5 : cells);
        $('#rows').val(rows == 0 ? 5 : rows);
        $('#saveas').attr('disabled', null);
        $('#saveasbt').attr('disabled', null);
      }
      $("#tabs").tabs();
      $("#Ttabs").tabs();
      $('#loadtl').load(ENGINE.url + 'GETTILENAMES');
      $(ENGINE.canvObj).off("click").on("click", ENGINE.EDITORM._cvClick);
      ENGINE.EDITORM._tabSelect(1);
      $('div[aria-describedby="dialog"]').css({ 'left': '0px', 'top': '0px' });
      $('#actitem').load(ENGINE.url + 'GETITEMNAMES');
    });
    ENGINE.EDITORM._preparesounds();
  },


  _preparesounds: async function () {
    var audiolst = await HELPER.simpleDownloadSync(ENGINE.url + 'AUDIONAMES');
    audiolst = audiolst.replace('disabled', '');
    $('.snd').each((num, obj) => {
      $(obj).html(audiolst);
    })
  },


  _folowActor: function (button) {
    var actorindex = $('#eactors option:selected').val();
    if (typeof (actorindex) == 'undefined') return;
    actorindex = parseInt(actorindex);
    CONTROLS.target.copy(ENGINE.EDITORM._actors[actorindex].obj.position);
    CONTROLS.update();
    HELPER.blinkActor(ENGINE.EDITORM._actors[actorindex].obj);
  },

  _actorBlink: function (button) {
    var actorindex = $('#eactors option:selected').val();
    if (typeof (actorindex) == 'undefined') return;
    actorindex = parseInt(actorindex);
    HELPER.blinkActor(ENGINE.EDITORM._actors[actorindex].obj);
    HELPER.showTransform(ENGINE.EDITORM._actors[actorindex].obj);
    HELPER._transformHelper({ value: 'translate' });
  },

  _reviveActors: function () {
    for (var i = 0; i < ENGINE.EDITORM._actors.length; i++) {
      if (typeof (ENGINE.EDITORM._actors[i].act) !== 'undefined') {
        var tileName = ENGINE.EDITORM._actors[i].tile;
        var pos = ENGINE.EDITORM._actors[i].pos;
        tileName = tileName.split('x');
        var tile = ENGINE.TILE.getTileByXY(tileName[0], tileName[1]);
        var actPos = tile.position.clone().add(new THREE.Vector3(pos.x, pos.y, pos.z));
        var spphere = HELPER.areaSphere(actPos, 1, 'blue', false, 10);
        ENGINE.EDITORM._actors[i].tile = tile;
        ENGINE.EDITORM._actors[i].pos = actPos;
        ENGINE.EDITORM._actors[i].obj = spphere;
        if (ENGINE.EDITORM._actors[i].act.name == 'START') $('#actname').prop('placeholder', '');
      }
    }
    ENGINE.EDITORM._updateActorList();
  },


  
  _reviveSounds: function () {    
    for (var i = 0; i < ENGINE.EDITORM._sounds.length; i++) {
      var sndarr=ENGINE.EDITORM._sounds[i];
      if (typeof (sndarr.audio) !== _UN && typeof(sndarr.tile)!==_UN) {
        var tileName = sndarr.tile;
        var pos = sndarr.audio.pos;
        tileName = tileName.split('x');
        var tile = ENGINE.TILE.getTileByXY(tileName[0], tileName[1]);
        var actPos = tile.position.clone().add(new THREE.Vector3(pos.x, pos.y, pos.z));
        ENGINE.EDITORM.addasphereSound(sndarr.audio.name);               
        if(sndarr.audio.obj!=null)
        sndarr.audio.obj.position.copy(actPos);
      }
    }
    ENGINE.EDITORM._updateSoundList();
  },

  _removeActor: function (button) {
    var actorindex = $('#eactors option:selected').val();
    if (typeof (actorindex) == 'undefined') return;
    actorindex = parseInt(actorindex);
    ENGINE.EDITORM._actors[actorindex].obj.selfremove = true;
    if (ENGINE.EDITORM._actors[actorindex].act.name == 'START')
      $('#actname').prop('placeholder', "'START' as player spawn");
    ENGINE.EDITORM._actors.splice(actorindex, 1);
    ENGINE.EDITORM._updateActorList();
  },

  _actorChange: function (button) {
    var actorname = $('#actactorsel option:selected').val();
    if (typeof (actorname) == 'undefined') return;
    actorname = parseInt(actorname);
    for (var i = 0; i < 8; i++)$('.optact' + i).hide();
    var showopt = [];
    switch (actorname) {
      case 0: //player spawn
        showopt[7] = true;
        break;
      case 1: //player telep
        showopt[0] = true; showopt[1] = true; showopt[2] = true;
        break;
      case 2: //give item
        showopt[1] = true; showopt[2] = true; showopt[3] = true; showopt[6] = true;
        break;
      case 3: //givekey
        showopt[1] = true; showopt[4] = true;
        break;
      case 4: //givebuff
        showopt[1] = true; showopt[5] = true; showopt[6] = true;
        break;
    }
    for (var i = 0; i < showopt.length; i++) {
      var showitem = showopt[i];
      if (showitem == true) {
        $('.optact' + i).show();
      }
    }
  },


  _insertActor: function (button) {
    function checkId() {
      var ccid = $('#actname').val().trim();
      if (ccid == '' || ccid.length < 4) {
        alert('Invalid Name'); return null;
      }
      for (var i = 0; i < ENGINE.EDITORM._actors.length; i++) {
        if (typeof (ENGINE.EDITORM._actors[i].act.name) !== 'undefined' &&
          ENGINE.EDITORM._actors[i].act.name == ccid) {
          alert('Name already Exists: ' + ccid); return null;
        }
      }
      $('#actname').val('');
      if (ccid == 'START') $('#actname').prop('placeholder', '');
      return ccid;
    }
    function addasphere(actor) {
      var actPos = ENGINE.EDITORM._tileselected.position.clone().add(new THREE.Vector3(0, 2, 0));
      var spphere = HELPER.areaSphere(actPos, 1, 'blue', false, 10);
      ENGINE.EDITORM._actors.push({
        tile: ENGINE.EDITORM._tileselected, pos: actPos, obj: spphere,
        act: actor
      });
    }
    function checkKey(name) {
      if ($(name).val().length > 0 && $(name).val().length < 5) {
        alert('Key need mininum 4 characters');
        $(name).focus();
        return null;
      }
      return $(name).val();
    }
    var actorname = $('#actactorsel option:selected').val();
    if (typeof (actorname) == 'undefined') return;
    actorname = parseInt(actorname);
    if (ENGINE.EDITORM._tileselected == null) {
      alert('Select a Tile first');
      return;
    }
    var actid;
    var needkey;
    var givekey;
    switch (actorname) {
      case 0: //player spawn
        actid = checkId();
        if (actid == null) return;
        addasphere({ type: 0, name: actid });
        break;
      case 1: //player telep 
        actid = $('#actdest option:selected').val();
        if (typeof (actid) == 'undefined') {
          alert('No Destination Selected'); return;
        }
        needkey = checkKey('#actkey'); if (needkey == null) return;
        addasphere({ type: 1, name: actid, key: needkey, lvl: parseInt($('#actlvl').val()) });
        break;
      case 2: //give item
        actid = $('#actitem option:selected').val();
        if (typeof (actid) == 'undefined' || actid == '---') {
          alert('No Item Selected'); return;
        }
        needkey = checkKey('#actkey'); if (needkey == null) return;
        addasphere({
          type: 2, name: actid, key: needkey,
          lvl: parseInt($('#actlvl').val()), qtd: parseInt($('#actqtd').val())
        })
        break;
      case 3: //givekey      
        needkey = checkKey('#actkey'); if (needkey == null) return;
        givekey = checkKey('#actkeyset'); if (givekey == null) return;
        if (givekey == '') return;
        addasphere({ type: 3, name: givekey, key: needkey, lvl: parseInt($('#actlvl').val()) });
        break;
      case 4: //givebuff
        actid = $('#actbuff option:selected').val();
        needkey = checkKey('#actkey'); if (needkey == null) return;
        addasphere({ type: 4, name: actid, key: needkey, qtd: parseInt($('#actqtd').val()) });
        break;
    }
    ENGINE.EDITORM._updateActorList();
  },

  _updateActorList: function () {
    var actorlist = '';
    var destins = '<select>';
    for (var i = 0; i < ENGINE.EDITORM._actors.length; i++) {
      var actorsel = ENGINE.EDITORM._actors[i].act;
      var type = $('#actactorsel option[value="' + actorsel.type + '"]').text();
      if (typeof (actorsel.name) !== 'undefined') {
        destins += '<option value="' + actorsel.name + '">' + actorsel.name + '</option>';
      }

      switch (actorsel.type) {
        case 0:
          actorlist += '<option value="' + i + '">' + type + '  - ' + actorsel.name + '</option>';
          break;
        case 1:
          actorlist += '<option value="' + i + '">' + type + ' to ' + actorsel.name + ' - lvl:' + actorsel.lvl + '</option>';
          break;
        case 2: case 3:
          actorlist += '<option value="' + i + '">' + type + ' : ' + actorsel.name + ' - lvl:' + actorsel.lvl + '</option>';
          break;
        case 4:
          actorlist += '<option value="' + i + '">' + type + ' : ' + actorsel.name + ' ' + actorsel.qtd + '</option>';
          break;
      }
    }
    $('#eactorscont').html(
      '<select id="eactors" style="width:300px" size="10" onchange="ENGINE.EDITORM._actorBlink();">' +
      actorlist +
      '</select>');
    $('#actdest').html(destins + '</select>');
  },

  getActors: function () {
    var actorsarray = [];
    for (var i = 0; i < ENGINE.EDITORM._actors.length; i++) {
      if (typeof (ENGINE.EDITORM._actors[i]) !== 'undefined') {
        var pos = ENGINE.EDITORM._actors[i].obj.position.clone().sub(ENGINE.EDITORM._actors[i].tile.position);
        var actor = ENGINE.EDITORM._actors[i].act;
        actorsarray.push(
          {
            tile: ENGINE.EDITORM._actors[i].tile.group.square,
            pos: { x: pos.x, y: pos.y, z: pos.z },
            act: actor
          }
        );
      }
    }
    return actorsarray;
  },


  getAudios: function () {
    var sndsarray = [];
    for (var i = 0; i < ENGINE.EDITORM._sounds.length; i++) {
      if (typeof (ENGINE.EDITORM._sounds[i]) !== 'undefined') {
        var activeobj=ENGINE.EDITORM._sounds[i].audio;
        var tilepos= activeobj.pos;        
            tilepos=new THREE.Vector3(tilepos.x,tilepos.y,tilepos.z);
        var realpos = activeobj.obj.position.clone().sub(tilepos);
        var audio= {             
            name: activeobj.name, 
            audio: activeobj.audio, 
            volume: activeobj.volume, 
            key: activeobj.key, 
            type: activeobj.sntype, 
            pos: {x:realpos.x,y:realpos.y,z:realpos.z} }
        sndsarray.push({tile:ENGINE.EDITORM._sounds[i].tile,audio:audio});
      }
    }
    return sndsarray;
  },
  


  _create: function () {
    ENGINE.EDITORM.show(parseInt($('#cells').val()), parseInt($('#rows').val()));
  },

  _saveMap: function (button) {
    var nome = $('#saveas').val();
    if (nome.length < 4) {
      alert('Invalid Name');
      return;
    }
    var cells = ENGINE.EDITORM._size.x;
    var rows = ENGINE.EDITORM._size.y;
    var jsonv = "";
    var jsona = Array.from(Array(cells), () => new Array(rows));

    //For each Tile
    for (var x = 0; x < cells; x++) {
      for (var y = 0; y < rows; y++) {
        jsona[x][y] = [];
        var groupn = 0;
        var tile = ENGINE.TILE.getTileByXY(x, y);
        if (typeof (tile.group.loaded) !== 'undefined') {
          //for each loaded on group          
          for (var e = 0; e < tile.group.loaded.length; e++) {
            if (typeof (tile.group.loaded[e]) == 'object') {
              var loaded = tile.group.loaded[e];
              jsona[x][y][groupn] = { name: loaded.name };
              //for each obj on loaded
              if (loaded.scene) for (var v = 0; v < loaded.scene.length; v++) {
                if (typeof (loaded.scene[v]) == 'object') {

                  var val = loaded.scene[v];
                  var xscale = val._Scale;
                  var xpos = null;
                  if (val._shape !== null) {
                    xscale = {
                      x: val._shape.geometry.parameters.width,
                      y: val._shape.geometry.parameters.height,
                      z: val._shape.geometry.parameters.depth
                    }
                    xpos = {
                      x: val._shape.position.x, y: val._shape.position.y,
                      z: val._shape.position.z
                    }
                  } else {
                    xpos = {
                      x: val._OBJ3d.position.x, y: val._OBJ3d.position.y,
                      z: val._OBJ3d.position.z
                    }
                  }

                  var obval = new ENGINE.EDITORT.variables();
                  for (var k = 0; k < Object.keys(obval).length; k++) {
                    var kname = Object.keys(obval)[k];
                    if (typeof (val[kname]) !== 'undefined') {
                      obval[kname] = val[kname];
                    }
                  }
                  obval._Pos = xpos;
                  obval._Scale = xscale;
                  obval._OBJ3d = val._shape == null ? true : false;
                  obval._shape = null;
                  if (typeof (jsona[x][y][groupn].scenes) == 'undefined')
                    jsona[x][y][groupn].scenes = [];
                  jsona[x][y][groupn].scenes.push(obval);
                }
              }

              //IS ENTITY
              if (loaded.entity) {
                if (typeof (jsona[x][y][groupn].entity) == 'undefined')

                  for (var i = 0; i < loaded.entity.itens.length; i++) { //clear loaded 3d
                    delete loaded.entity.itens[i].obj;
                    delete loaded.entity.itens[i].scene;
                  }

                jsona[x][y][groupn].entity = loaded.entity;
                jsona[x][y][groupn].ename = loaded.ename;
                jsona[x][y][groupn].entity.box.pos.x =
                  ANIMATED._data[loaded.name].shape.position.x - tile.position.x;
                jsona[x][y][groupn].entity.box.pos.y =
                  ANIMATED._data[loaded.name].shape.position.y - tile.position.y;
                jsona[x][y][groupn].entity.box.pos.z =
                  ANIMATED._data[loaded.name].shape.position.z - tile.position.z;

                if (typeof (jsona[x][y][groupn].entity.box.qua) == 'undefined')
                  jsona[x][y][groupn].entity.box.qua = {};
                jsona[x][y][groupn].entity.box.qua.x =
                  ANIMATED._data[loaded.name].shape.quaternion.x;
                jsona[x][y][groupn].entity.box.qua.y =
                  ANIMATED._data[loaded.name].shape.quaternion.y;
                jsona[x][y][groupn].entity.box.qua.z =
                  ANIMATED._data[loaded.name].shape.quaternion.z;
                jsona[x][y][groupn].entity.box.qua.w =
                  ANIMATED._data[loaded.name].shape.quaternion.w;
              }

              //IS ITEM
              if (loaded.item) {
                if (typeof (jsona[x][y][groupn].items) == 'undefined')
                  jsona[x][y][groupn].items = {};
                jsona[x][y][groupn].items.item = loaded.item;
                jsona[x][y][groupn].items.obj = loaded.obj;
              }

              groupn += 1;
            }
          }
        }
      }
    }


    var jsonligth = ENGINE.EDITORM.getLights();
    var jsonactor = ENGINE.EDITORM.getActors();
    var jsonaudio = ENGINE.EDITORM.getAudios();
    jsonv = JSON.stringify(
      {
        name: nome,
        elements: {
          tiles: jsona,
          light: jsonligth,
          actor: jsonactor,
          audio: jsonaudio,
          script: $('#mscript').val()
        }
      });
    //console.log(jsonv);
    //return;
    var url = ENGINE.url + ENGINE.conf.dir.upload +
      '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
    HELPER.uploadData(url, button, 'SAVEMAP', jsonv, function () {
      ENGINE.EDITORM._tabSelect(0);
    });
  },


  _createSpawn: function () {
    //HELPER.areaSphere(new THREE.Vector3(10,3,10),3,'white',true)
  },


  _cacheEntityItens: async function (entityName, itens, tile) {
    if (typeof (ENGINE.EDITORM._itenslist[entityName]) == 'undefined') {
      ENGINE.EDITORM._itenslist[entityName] = { itens: itens, tile: tile };
    }
    if (ENGINE.EDITORM._updateItemTimer != null) clearTimeout(ENGINE.EDITORM._updateItemTimer);
    ENGINE.EDITORM._updateItemTimer = setTimeout(() => {
      ENGINE.EDITORM._createCacheItens();
    }, 1000);
  },

  _createCacheItens: async function () {
    var repeat = false;
    for (var i = 0; i < Object.keys(ENGINE.EDITORM._itenslist).length; i++) {
      var entityName = Object.keys(ENGINE.EDITORM._itenslist)[i];
      var arrayitens = ENGINE.EDITORM._itenslist[entityName];
      var tile = arrayitens.tile;
      for (var b = 0; b < arrayitens.itens.length; b++) {
        var itens = arrayitens.itens[b];
        var name = itens.name;
        if (typeof (itens.scene) == 'undefined') { //no loaded 3dobj   
          var url = ENGINE.url + 'LOADITEM' + name;
          var data = await HELPER.simpleDownloadSync(url);
          ENGINE.TILE.jsonToTileEditor(tile, data.obj);
          itens.obj = data.obj;
          itens.scene = tile.scenevar;
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
    //console.log('Timer loadObject');
    if (repeat == true) {
      if (ENGINE.EDITORM._updateItemTimer != null) clearTimeout(ENGINE.EDITORM._updateItemTimer);
      ENGINE.EDITORM._updateItemTimer = setTimeout(() => {
        ENGINE.EDITORM._createCacheItens();
      }, 1000);
    } else {
      //console.log('loadObject complete');
      ENGINE.EDITORM._loadComplete();
    }
  },


  _loadComplete: function () {
    ENGINE.showLoading(false);
    ENGINE.scene.visible = true;
  },


  _loadMap: function (button) {
    //downloadData(url,button,name,callback   
    var name = $('#loadmpsel option:selected').val();
    if (name == '---') return;
    var url = ENGINE.url + 'LOADMAPS' + name;
    ENGINE.clear();
    ENGINE.scene.visible = false;
    ENGINE.showLoading(true);
    ENGINE.debugRay = true;
    ENGINE.Physic.debugPhysics = true;
    ENGINE.EDITORM._entityCount = 0;
    ANIMATED._data = new Array();
    /*
    ENGINE.Light.addAmbient("#ffffff", 0.5);
    var l1 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
      new THREE.Vector3(100, 100, 100));
    l1.helper.visible = false;
  */
    HELPER.downloadData(url, button, function (data) {
      var tiles = data.tiles;
      var cells = tiles.length;
      var rows = tiles[0].length;
      $('#cells').val(cells);
      $('#rows').val(rows);
      $('#saveas').attr('disabled', null).val(name);
      $('#saveasbt').attr('disabled', null);
      ENGINE.EDITORM._tiles =
        ENGINE.TILE.createTiles(10, 10, cells, rows);
      ENGINE.EDITORM._size.x = cells;
      ENGINE.EDITORM._size.y = rows;
      var camstepbackZ = (10 * rows) / 2;
      var camstepbackX = (10 * cells) / 2;
      ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT,
        new THREE.Vector3(camstepbackX - 5, 10, camstepbackZ - 10),
        new THREE.Vector3(camstepbackX - 5, 0, camstepbackZ - 5));
      for (var x = 0; x < cells; x++) {
        for (var y = 0; y < rows; y++) {
          var tile = ENGINE.TILE.getTileByXY(x, y);
          var tiledata = tiles[x][y];


          if (typeof (tiledata) !== 'undefined')
            for (var v = 0; v < tiledata.length; v++) {
              var scenedata = tiledata[v];
              var extx = (-10 * x) - 0.5;
              var extz = (-10 * y) - 0.5;


              //3D Objects and Physic
              if (typeof (scenedata.scenes) !== 'undefined' &&
                scenedata.scenes.length > 0) {
                ENGINE.TILE.jsonToTileEditor(tile, scenedata.scenes, extx, 0, extz);
                if (typeof (tile.group) == "undefined" || typeof (tile.group.loaded) == "undefined") { tile.group.loaded = []; }
                tile.group.loaded.push(
                  {
                    name: scenedata.name,
                    scene: tile.scenevar
                  });
              }

              //ENTITY AREA
              if (typeof (scenedata.entity) !== 'undefined') {
                if (typeof (tile.group) == "undefined" || typeof (tile.group.loaded) == "undefined") { tile.group.loaded = []; }
                tile.group.loaded.push(
                  {
                    name: scenedata.name,
                    ename: scenedata.ename,
                    entity: scenedata.entity
                  });
                ENGINE.EDITORM._entityCount += 1;
                ENGINE.EDITORM._loadEntityObj(tile, scenedata.name, scenedata.entity);
              }

              //ITEM AREA
              if (typeof (scenedata.items) !== 'undefined') {
                ENGINE.ITEM.scenevar = null;
                ENGINE.ITEM.position = tile.position;
                ENGINE.TILE.jsonToTileEditor(ENGINE.ITEM, scenedata.items.obj);
                if (typeof (tile.group) == "undefined" || typeof (tile.group.loaded) == "undefined") { tile.group.loaded = []; }
                tile.group.loaded.push(
                  {
                    name: scenedata.name,
                    obj: scenedata.items.obj,
                    item: scenedata.items.item,
                    obj3d: ENGINE.ITEM.scenevar
                  });

              }


            }

        }
      }

      //Lights
      var lights = data.light;
      if (typeof (lights) !== 'undefined')
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
        }


      //Actors
      var actors = data.actor;
      if (typeof (actors) !== 'undefined') {
        ENGINE.EDITORM._actors = actors;
        ENGINE.EDITORM._reviveActors();
      }

      //Sounds
      var sounds = data.audio;
      if (typeof (sounds) !== 'undefined') {
        ENGINE.EDITORM._sounds = sounds;
        ENGINE.EDITORM._reviveSounds();
      }
      


      //script
      var script = data.script;
      if (typeof (script) !== 'undefined') {
        HELPER.script(script);
        $('#mscript').val(script);
      }


      if (ENGINE.EDITORM._entityCount == 0) {
        ENGINE.EDITORM._loadComplete();
      }

      setTimeout(function () { HELPER.hideTransform(); }, 1000);
    });
  },


  getLights: function () {
    var addl = new Array();
    for (var i = 0; i < ENGINE.Light.lights.length; i++) {
      if (typeof (ENGINE.Light.lights[i]) !== 'undefined' && i !== 1) {
        var l1 = ENGINE.Light.lights[i];
        addl.push({
          model: ENGINE.Light.lights[i].group.model,
          issun: typeof (l1.isSun) == 'undefined' ? null : true,
          shadow: l1.castShadow,
          visible: l1.visible,
          color: l1.color.getHexString(),
          itensity: l1.intensity,
          distance: typeof (l1.distance) == 'undefined' ? null : l1.distance,
          decay: typeof (l1.decay) == 'undefined' ? null : l1.decay,
          angle: typeof (l1.angle) == 'undefined' ? null : l1.angle,
          penumbra: typeof (l1.penumbra) == 'undefined' ? null : l1.penumbra,
          pos: { x: l1.position.x, y: l1.position.y, z: l1.position.z },
          tpos: typeof (l1.target) == 'undefined' ? null :
            { x: l1.target.position.x, y: l1.target.position.y, z: l1.target.position.z }
        });
      }
    }
    return addl;
  },


  activetab: 1,
  _tabSelect: function (num) {
    HELPER.hideTransform();
    if (num !== 0) ENGINE.EDITORM.activetab = num;
    if (num == 1) {//get map list
      $('#loadmaps').load(ENGINE.url + 'GETMAPS', function () {
      });
    }
    if (num == 2 || num == 10 || num == 11 || num == 12 || num == 13) {
      if (ENGINE.EDITORM._tileselected !== null) {
        ENGINE.EDITORM._filltiletab();
      }
    }
    if (num == 3) { //lights          
      $('#lmode').val(0);
      ENGINE.EDITORM._changelgview();
      ENGINE.EDITORM._updatelightcfg();
      TransformControl.control.setMode('translate');
      HELPER.hideTransform();
    }
    if (num == 11) {//entity selector
      $('#loadtas').load(ENGINE.url + 'GETITEMNAMES');
    }
    if (num == 12) {//entity selector
      $('#loadentarea').load(ENGINE.url + 'GETENTITYS');
    }
  },

  _filltiletab: function () {
    $('.tilename').each((idx, elm) => {
      elm.innerHTML = "Tile:" + ENGINE.EDITORM._tileselected.group.square;
    });

    $('#sceneobjs').html('');
    //$('#tilearea').hide();
    //var showtilearea = false;
    if (typeof (ENGINE.EDITORM._tileselected.group.loaded) == "undefined") return;
    var html = '<select id="tileobjsel" style="width:160px">';
    html += '<option value="---">---</option>';
    for (var i = 0; i < ENGINE.EDITORM._tileselected.group.loaded.length; i++) {
      //showtilearea = true;
      var name = ENGINE.EDITORM._tileselected.group.loaded[i].name;
      html += '<option value="' + i + '">' + i + '-' + name + '</option>';
    }
    html += '</select>';
    $('#sceneobjs').html(html);
    //if (showtilearea == true) $('#tilearea').show();
    $('#tileobjsel').on('change', function () {
      ENGINE.EDITORM._objSel($(this).find('option:selected'));
    });
  },

  _objSel: function (opt) {
    if (opt.val() == '---') return;
    var scenegroup = ENGINE.EDITORM._tileselected.group.loaded[opt.val()];
    if (typeof (scenegroup.scene) !== 'undefined') {
      for (var i = 0; i < scenegroup.scene.length; i++) {
        var value = scenegroup.scene[i];
        HELPER.blinkObj(value);
      }
    }
    if (typeof (scenegroup.entity) !== 'undefined') {
      HELPER.blinkEntity(scenegroup.name);
    }
  },

  _loadTile: function (button) {
    //downloadData(url,button,name,callback
    var name = $('#loadasel option:selected').val();
    if (name == '---') return;
    var url = ENGINE.url + 'LOADTILE' + name;
    //var seltile=ENGINE.EDITORM._tileselected;
    if (ENGINE.EDITORM._tileselected == null) {
      alert('Select a Tile first');
      return;
    }
    HELPER.downloadData(url, button, function (data) {
      ENGINE.TILE.jsonToTileEditor(ENGINE.EDITORM._tileselected, data);
      if (typeof (ENGINE.EDITORM._tileselected.group.loaded) == "undefined")
        ENGINE.EDITORM._tileselected.group.loaded = [];
      ENGINE.EDITORM._tileselected.group.loaded.push(
        {
          name: name,
          scene: ENGINE.EDITORM._tileselected.scenevar
        });
      ENGINE.EDITORM._filltiletab();
    });
  },




  _cvClick: function (event) {
    if (ENGINE.EDITORM.disableTileClick == true ||
      typeof (ENGINE.intersects) == 'undefined' ||
      ENGINE.EDITORM._tiles == null) return;

    var tile = null;
    for (var e = 0; e < ENGINE.intersects.length; e++) {
      var intercept = ENGINE.intersects[e].object;
      if (typeof (intercept.group) !== 'undefined' && intercept.group.name == 'Tile') {
        tile = intercept;
        break;
      }
    }
    if (tile !== null) {
      //console.log(tile,activetab);
      ENGINE.EDITORM._tileselected = tile;
      if (ENGINE.EDITORM.activetab == 2 || ENGINE.EDITORM.activetab == 10 || ENGINE.EDITORM.activetab == 11 || ENGINE.EDITORM.activetab == 12 ||
        ENGINE.EDITORM.activetab == 13) {
        ENGINE.EDITORM._tabSelect(ENGINE.EDITORM.activetab);
      }
    }
  },

  _rotateTile: function () {
    var objindex = $('#tileobjsel option:selected').val();
    if (objindex == '---') return;
    var txtangle = $('#matRot').val();
    if (ENGINE.EDITORM._tileselected == null ||
      typeof (ENGINE.EDITORM._tileselected.group) == 'undefined') return;
    var tilepos = ENGINE.EDITORM._tileselected.position;
    var angle = THREE.Math.degToRad(parseFloat(txtangle));
    var scenevar = ENGINE.EDITORM._tileselected.group.loaded[objindex];
    var quaternion;
    var quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    /* Old Metod Rotate around tile
    if (typeof (scenevar) !== 'undefined' && scenevar.entity) { //Entity Object
      if (ANIMATED._data[scenevar.name]) {
        ANIMATED._data[scenevar.name].shape.remove(
          ANIMATED._data[scenevar.name].object
        );
        var boxen = HELPER.physicToGeometry(ANIMATED._data[scenevar.name].shape);
        ANIMATED._data[scenevar.name].shape.selfremove = true;
        ANIMATED._data[scenevar.name].shape = boxen;
        boxen.material = ENGINE.Physic.skinMaterial;

        HELPER.rotateAboutPoint(boxen, tilepos, new THREE.Vector3(0, 1, 0), angle);
        boxen.attach(ANIMATED._data[scenevar.name].object);
        boxen.material.visible = false;
        ANIMATED._data[scenevar.name].object.position.set(
          scenevar.entity.model.pos.x,
          scenevar.entity.model.pos.y,
          scenevar.entity.model.pos.z
        );
        ANIMATED._data[scenevar.name].object.quaternion.set(
          scenevar.entity.model.qua.x,
          scenevar.entity.model.qua.y,
          scenevar.entity.model.qua.z,
          scenevar.entity.model.qua.w
        );


      }
    }


    if (typeof (scenevar) !== 'undefined' && scenevar.scene) {//3d Object
      for (var e = 0; e < scenevar.scene.length; e++) {
        if (typeof (scenevar.scene[e]) == 'object') {
          var value = scenevar.scene[e];

          if (value._shape != null) {//Is Physic Object          
            value._OBJ3d = HELPER.physicToGeometry(value._shape);
            value._Scale.x = 1; value._Scale.y = 1; value._Scale.z = 1;
          }
          HELPER.rotateAboutPoint(value._OBJ3d, tilepos, new THREE.Vector3(0, 1, 0), angle);
          ENGINE.TILE.updateScenevarPositions(value, tilepos);
          if (value._shape != null) {//Is Physic Object
            value._Pos = {
              x: value._OBJ3d.position.x,
              y: value._OBJ3d.position.y,
              z: value._OBJ3d.position.z
            }
            var remove3d = value._OBJ3d;
            ENGINE.TILE.updPhisicObj(value);
            remove3d.selfremove = true;
          }
        }
      }
    }*/
    if (typeof (scenevar) !== 'undefined' && scenevar.entity) { //Entity Object
      if (ANIMATED._data[scenevar.name]) {
        ANIMATED._data[scenevar.name].shape.remove(
          ANIMATED._data[scenevar.name].object
        );
        var boxen = HELPER.physicToGeometry(ANIMATED._data[scenevar.name].shape);
        ANIMATED._data[scenevar.name].shape.selfremove = true;
        ANIMATED._data[scenevar.name].shape = boxen;
        boxen.material = ENGINE.Physic.skinMaterial;
        //HELPER.rotateAboutPoint(boxen, tilepos, new THREE.Vector3(0, 1, 0), angle);
        boxen.position.sub(tilepos); // remove the offset
        boxen.quaternion.multiply(quaternion2);
        boxen.position.add(tilepos);
        boxen.attach(ANIMATED._data[scenevar.name].object);
        boxen.material.visible = true;
        ANIMATED._data[scenevar.name].object.position.set( //update skelleton
          scenevar.entity.model.pos.x,
          scenevar.entity.model.pos.y,
          scenevar.entity.model.pos.z
        );
        ANIMATED._data[scenevar.name].object.quaternion.set(
          scenevar.entity.model.qua.x,
          scenevar.entity.model.qua.y,
          scenevar.entity.model.qua.z,
          scenevar.entity.model.qua.w
        );


      }
    }


    if (typeof (scenevar) !== 'undefined' && scenevar.scene) {//3d Object
      for (var e = 0; e < scenevar.scene.length; e++) {
        if (typeof (scenevar.scene[e]) == 'object') {
          var value = scenevar.scene[e];

          if (value._shape != null) {//Is Physic Object          
            value._OBJ3d = HELPER.physicToGeometry(value._shape);
            value._Scale.x = 1; value._Scale.y = 1; value._Scale.z = 1;
          }
          //HELPER.rotateAboutPoint(value._OBJ3d, tilepos, new THREE.Vector3(0, 1, 0), angle);
          value._OBJ3d.position.sub(tilepos); // remove the offset
          value._OBJ3d.quaternion.multiply(quaternion2);
          value._OBJ3d.position.add(tilepos);
          ENGINE.TILE.updateScenevarPositions(value, tilepos);
          if (value._shape != null) {//Is Physic Object
            value._Pos = {
              x: value._OBJ3d.position.x,
              y: value._OBJ3d.position.y,
              z: value._OBJ3d.position.z
            }
            var remove3d = value._OBJ3d;
            ENGINE.TILE.updPhisicObj(value);
            remove3d.selfremove = true;
          }
        }
      }
    }

    if (typeof (scenevar) !== 'undefined' && scenevar.item) {//Item Object            
      for (var e = 0; e < scenevar.obj3d.length; e++) {
        if (typeof (scenevar.obj3d[e]) == 'object') {
          var object = scenevar.obj3d[e];
          if (typeof (object._OBJ3d) !== 'undefined' && object._OBJ3d !== null)
            quaternion = object._OBJ3d.quaternion;
          quaternion.multiply(quaternion2);
          object._Quat.x = quaternion.x;
          object._Quat.y = quaternion.y;
          object._Quat.z = quaternion.z;
          object._Quat.w = quaternion.w;
        }
      }
      quaternion = new THREE.Quaternion();
      quaternion.set(
        scenevar.item.box.qua.x,
        scenevar.item.box.qua.y,
        scenevar.item.box.qua.z,
        scenevar.item.box.qua.w);
      //quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      quaternion.multiply(quaternion2);
      scenevar.item.box.qua.x = quaternion.x;
      scenevar.item.box.qua.y = quaternion.y;
      scenevar.item.box.qua.z = quaternion.z;
      scenevar.item.box.qua.w = quaternion.w;

    }


  },

  _tempBox: null,
  _translateTile: function () {
    //ENGINE.TILE.updPhisicObj(val);
    if (ENGINE.EDITORM._tileselected == null) return;
    var objindex = $('#tileobjsel option:selected').val();
    if (objindex == '---') return;
    if (ENGINE.EDITORM.disableTileClick == false) {
      ENGINE.EDITORM.disableTileClick = true;
      $('#tileobjsel').prop('disabled', true);
      var scenevar = ENGINE.EDITORM._tileselected.group.loaded[objindex];
      var tilepos = ENGINE.EDITORM._tileselected.position;
      const geometry = new THREE.BoxGeometry(10, 15, 10, 3, 3, 3);
      const material = new THREE.MeshStandardMaterial({ color: 'lime' });
      //material.transparent = true;
      //material.opacity = 0.5;
      material.wireframe = true;
      material.emissive.setColorName('lime');
      ENGINE.EDITORM._tempBox = new THREE.Mesh(geometry, material);
      ENGINE.scene.add(ENGINE.EDITORM._tempBox);
      ENGINE.EDITORM._tempBox.position.set(tilepos.x, tilepos.y, tilepos.z);
      ENGINE.EDITORM._tempBox.val = scenevar;
      ENGINE.EDITORM._tempBox.tpos = tilepos;
      ENGINE.EDITORM._tempBox.lpos = new THREE.Vector3(
        ENGINE.EDITORM._tempBox.position.x,
        ENGINE.EDITORM._tempBox.position.y,
        ENGINE.EDITORM._tempBox.position.z);
      /*ENGINE.EDITORM._tempBox.qua= {x:ENGINE.EDITORM._tempBox.quaternion.x,
                                    y:ENGINE.EDITORM._tempBox.quaternion.y,
                                    z:ENGINE.EDITORM._tempBox.quaternion.z,
                                    w:ENGINE.EDITORM._tempBox.quaternion.w}*/
      ENGINE.EDITORM._tempBox.group = { name: 'Model', type: 'Fake' };
      HELPER.showTransform(ENGINE.EDITORM._tempBox);
      TransformControl.control.setMode('translate');
      ENGINE.debugRay = false;
    } else {
      ENGINE.EDITORM.disableTileClick = false;
      $('#tileobjsel').prop('disabled', null);
      HELPER.hideTransform();
      ENGINE.EDITORM._tempBox.selfremove = true;
      ENGINE.debugRay = true;
    }
  },

  _changebox: function () {
    var tilepos = ENGINE.EDITORM._tempBox.tpos;
    var lastpos = ENGINE.EDITORM._tempBox.lpos;
    if (ENGINE.EDITORM._tempBox.position.equals(lastpos) == true) return;

    var npos = new THREE.Vector3(
      ENGINE.EDITORM._tempBox.position.x,
      ENGINE.EDITORM._tempBox.position.y,
      ENGINE.EDITORM._tempBox.position.z);
    npos.sub(lastpos);
    ENGINE.EDITORM._tempBox.lpos = new THREE.Vector3(
      ENGINE.EDITORM._tempBox.position.x,
      ENGINE.EDITORM._tempBox.position.y,
      ENGINE.EDITORM._tempBox.position.z);

    var scenevar = ENGINE.EDITORM._tempBox.val;

    if (typeof (scenevar.item) !== 'undefined') { //item Object   
      for (var e = 0; e < scenevar.obj3d.length; e++) {
        if (typeof (scenevar.obj3d[e]) == 'object') {
          var object = scenevar.obj3d[e];
          if (typeof (object._OBJ3d) !== 'undefined' && object._OBJ3d !== null)
            object._OBJ3d.position.add(npos);
        }
      }
      var boxpos = new THREE.Vector3(
        scenevar.item.box.pos.x,
        scenevar.item.box.pos.y,
        scenevar.item.box.pos.z);
      boxpos.add(npos);
      scenevar.item.box.pos.x = boxpos.x;
      scenevar.item.box.pos.y = boxpos.y;
      scenevar.item.box.pos.z = boxpos.z;

      var objpos = new THREE.Vector3();
      for (var e = 0; e < scenevar.obj.length; e++) {
        objpos = new THREE.Vector3(
          scenevar.obj[e]._Pos.x, scenevar.obj[e]._Pos.y, scenevar.obj[e]._Pos.z);
        objpos.add(npos);
        scenevar.obj[e]._Pos.x = objpos.x;
        scenevar.obj[e]._Pos.y = objpos.y;
        scenevar.obj[e]._Pos.z = objpos.z;
      }

    }

    if (typeof (scenevar.entity) !== 'undefined') { //Entity Object
      if (ANIMATED._data[scenevar.name]) {
        ANIMATED._data[scenevar.name].shape.remove(
          ANIMATED._data[scenevar.name].object
        );
        var boxen = HELPER.physicToGeometry(ANIMATED._data[scenevar.name].shape);
        ANIMATED._data[scenevar.name].shape.selfremove = true;
        ANIMATED._data[scenevar.name].shape = boxen;

        boxen.position.add(npos);
        boxen.material = ENGINE.Physic.skinMaterial;
        scenevar.entity.box.pos.x = boxen.position.x;
        scenevar.entity.box.pos.y = boxen.position.y;
        scenevar.entity.box.pos.z = boxen.position.z;
        boxen.attach(ANIMATED._data[scenevar.name].object);
        boxen.material.visible = false;
        ANIMATED._data[scenevar.name].object.position.set(
          scenevar.entity.model.pos.x,
          scenevar.entity.model.pos.y,
          scenevar.entity.model.pos.z
        );
        ANIMATED._data[scenevar.name].object.quaternion.set(
          scenevar.entity.model.qua.x,
          scenevar.entity.model.qua.y,
          scenevar.entity.model.qua.z,
          scenevar.entity.model.qua.w
        );

      }
    }

    if (typeof (scenevar.scene) !== 'undefined') { //3d and Physics   
      for (var e = 0; e < scenevar.scene.length; e++) {
        if (typeof (scenevar.scene[e]) == 'object') {
          var value = scenevar.scene[e];


          if (value._shape != null) {//Is Physic Object          
            value._OBJ3d = HELPER.physicToGeometry(value._shape);
            value._Scale.x = 1; value._Scale.y = 1; value._Scale.z = 1;
          }
          //console.log(npo,value._OBJ3d);
          value._OBJ3d.position.add(npos);
          //console.log(value._OBJ3d);
          ENGINE.TILE.updateScenevarPositions(value, tilepos);

          if (value._shape != null) {//Is Physic Object
            value._Pos = {
              x: value._OBJ3d.position.x,
              y: value._OBJ3d.position.y,
              z: value._OBJ3d.position.z
            }
            var remove3d = value._OBJ3d;
            ENGINE.TILE.updPhisicObj(value);
            remove3d.selfremove = true;
          }
        }
      }
    }

    ENGINE.EDITORM._tempBox.val = scenevar;
    HELPER.showTransform(ENGINE.EDITORM._tempBox);

  },

  _removeTile: function () {
  },

  _changetr: function () {
    var num = parseInt($('#sellight option:selected').val());
    if (num == 0 || num == 1) {
      return;
    }
    var target = parseInt($('#l1target option:selected').val());
    if (target == 0) {//bulb
      if (ENGINE.Light.lights[num].group.model == 3) {
        HELPER.showTransform(ENGINE.Light.lights[num].target);
        ENGINE.Light.lights[num].helper.visible = true;
      }
    }
    if (target == 1) {//lamp
      HELPER.showTransform(ENGINE.Light.lights[num]);
      ENGINE.Light.lights[num].helper.visible = true;
    }
  },


  _dellight: function () {
    var num = parseInt($('#sellight option:selected').val());
    if (num == 0 || num == 1) {
      alert('Impossible to remove Wolrd Light');
      return;
    }
    $('#sellight').val(0);
    HELPER.hideTransform();
    if (typeof (ENGINE.Light.lights[num].helper.target) !== 'undefined') {
      TransformControl.control.detach(ENGINE.Light.lights[num].helper.target);
      ENGINE.Light.lights[num].helper.target.selfremove = true;
    }
    ENGINE.scene.remove(ENGINE.Light.lights[num]);
    ENGINE.scene.remove(ENGINE.Light.lights[num].helper);
    delete ENGINE.Light.lights[num];
    ENGINE.EDITORM._updatelightcfg(0);
  },

  _addlight: function () {
    var modelsel = $('#laddnew option:selected').val();
    if (ENGINE.EDITORM._tileselected == null) {
      alert('Click on Tile First');
      return;
    }
    var pos = ENGINE.EDITORM._tileselected.position;
    var lpos = new THREE.Vector3(pos.x, pos.y + 10, pos.z);
    var l1 = null;
    if (modelsel == 3) {
      l1 = ENGINE.Light.addDirectionalLightShadow('lime', 1, 5, lpos);
      //lpos.sub(new THREE.Vector3(0,pos.y,0));
      l1.target = ENGINE.EDITORM._tileselected;
      ENGINE.EDITORM._updatelightcfg(ENGINE.Light.lights.length - 1);
    }
    if (modelsel == 4) {
      l1 = ENGINE.Light.addPointLightShadow('lime', 1, 20, lpos);
      ENGINE.EDITORM._updatelightcfg(ENGINE.Light.lights.length - 1);
    }
  },

  _issun: function () {
    var active = $('#l1isSun').is(':checked');
    var num = $('#sellight option:selected').val();
    if (typeof (num) == 'undefined') return;
    num = parseInt(num);
    for (var i = 0; i < ENGINE.Light.lights.length; i++) {
      if (typeof (ENGINE.Light.lights[i]) !== 'undefined') {
        if (i !== num) {
          ENGINE.Light.lights[i].isSun = undefined;
        } else {
          if (active == true) {
            ENGINE.Light.lights[i].isSun = true;
          } else {
            ENGINE.Light.lights[i].isSun = undefined;
          }
        }
      }
    }
  },

  _changesell: function () {
    var num = $('#sellight option:selected').val();
    if (typeof (num) == 'undefined') num = 0;
    ENGINE.EDITORM._updatelightcfg(parseInt(num));
  },

  _updatelightcfg: function (num) {
    if (typeof (num) == 'undefined') num = 0;
    HELPER.hideTransform();
    if (ENGINE.Light.lights.length == 0 || typeof (ENGINE.Light.lights[num]) == 'undefined') return;
    $('#sellightd').html('');
    var html = '<select id="sellight" onChange="ENGINE.EDITORM._changesell();">';
    for (var i = 0; i < ENGINE.Light.lights.length; i++) {
      if (typeof (ENGINE.Light.lights[i]) !== 'undefined') {
        var name = 'Ambient';
        var selected = '';
        if (i == num) selected = 'selected';
        if (ENGINE.Light.lights[i].group.model == 3) name = 'Directional' + i;
        if (ENGINE.Light.lights[i].group.model == 4) name = 'Point' + i;
        if (i == 0) name = 'World';
        if (i == 1) selected = 'style="display:none"'; //remve ligh shadow
        html += '<option value="' + i + '" ' + selected + '>' + name + '</option>'
      }
    }
    html += '</select>';
    $('#sellightd').html(html);
    $('#l1target').val('---');
    //config ----      
    var l1 = ENGINE.Light.lights[num];

    $('#l1on').val(l1.group.active == true ? 1 : 0);
    $('#l1color').val('#' + l1.color.getHexString());
    $('#l1itens').val(l1.intensity);

    if (typeof (l1.castShadow) !== 'undefined') {
      $('#l1asshadow').show();
      $('#l1shadow').val(l1.castShadow == true ? 1 : 0);
    } else {
      $('#l1asshadow').hide();
    }

    if (typeof (l1.distance) !== 'undefined') {
      $('#l1dist').val(l1.distance).parent().show();
    } else { $('#l1dist').parent().hide(); }

    if (typeof (l1.angle) !== 'undefined') {
      $('#l1angle').val(l1.angle).parent().show();
    } else { $('#l1angle').parent().hide(); }

    if (typeof (l1.penumbra) !== 'undefined') {
      $('#l1pen').val(l1.penumbra).parent().show();
    } else { $('#l1pen').parent().hide(); }

    if (typeof (l1.decay) !== 'undefined') {
      $('#l1deca').val(l1.decay).parent().show();
    } else { $('#l1deca').parent().hide(); }

    if (l1.isSun) {
      $('#l1isSun').prop('checked', true);
    } else {
      $('#l1isSun').prop('checked', false);
    }


    $('#sellightdcf select,input').each((index, input) => {
      $(input).off('change').on('change', () => {
        ENGINE.EDITORM._lightctrlchange(input);
      })
    })

  },


  _lightctrlchange: function (elem) {
    elem = $(elem);
    var num = $('#sellight option:selected').val();
    var l1 = ENGINE.Light.lights[parseInt(num)];

    if (elem.prop('id') == 'l1shadow') {
      l1.castShadow = elem.val() == 1 ? true : false;
    }
    if (elem.prop('id') == 'l1on') {
      l1.visible = elem.val() == 1 ? true : false;
      l1.group.active = elem.val() == 1 ? true : false;
    }
    if (elem.prop('id') == 'l1color')
      l1.color.set((elem.val().startsWith('#') ? '' : '#') + elem.val());
    if (elem.prop('id') == 'l1itens')
      l1.intensity = parseFloat(elem.val());
    if (elem.prop('id') == 'l1dist')
      l1.distance = parseFloat(elem.val());
    if (elem.prop('id') == 'l1deca')
      l1.decay = parseFloat(elem.val());
    if (elem.prop('id') == 'l1angle')
      l1.angle = parseFloat(elem.val());
    if (elem.prop('id') == 'l1pen')
      l1.penumbra = parseFloat(elem.val());


  },


  _loadEntityObj: function (tile, name, data, button) {
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
        ENGINE.Physic.bodyTeleport(
          ANIMATED._data[name].shape,
          new THREE.Vector3(
            tile.position.x + data.box.pos.x,
            ANIMATED._data[name].shape.position.y + data.box.pos.y,
            tile.position.z + data.box.pos.z
          )
        );
        ENGINE.EDITORM._cacheEntityItens(name, data.itens, tile);
        if (typeof (button) !== 'undefined') $(button).prop("disabled", null);
      }, data);
  },


  _loadItem: function (button) {
    var name = $('#loadisel option:selected').val();
    if (name == '---') return;
    if (ENGINE.EDITORM._tileselected == null) {
      alert('Select a Tile first');
      return;
    }
    var url = ENGINE.url + 'LOADITEM' + name;
    var tilep = ENGINE.EDITORM._tileselected.position;
    HELPER.downloadData(url, button, function (data) {
      ENGINE.ITEM.scenevar = null;
      ENGINE.ITEM.position = tilep;
      ENGINE.TILE.jsonToTileEditor(ENGINE.ITEM, data.obj);
      //ENGINE.ITEM.itemvar = data.item;
      if (typeof (ENGINE.EDITORM._tileselected.group.loaded) == "undefined")
        ENGINE.EDITORM._tileselected.group.loaded = [];
      ENGINE.EDITORM._tileselected.group.loaded.push(
        {
          name: name, //unique                    
          obj: data.obj, //loaded entity
          item: data.item,
          obj3d: ENGINE.ITEM.scenevar
        });

      //ENGINE.EDITORT.noControls=false;
    });
  },

  _loadEntity: function (button) {
    var ename = $('#loadent option:selected').val();
    if (ename == '---') return;
    if (ENGINE.EDITORM._tileselected == null) {
      alert('Select a Tile first');
      return;
    }
    var url = ENGINE.url + 'LAOADENT' + ename;
    HELPER.downloadData(url, button, function (data) {
      $(button).prop("disabled", true);
      ENGINE.EDITORM._entityCount += 1;
      var uname = ename + '-' + ENGINE.EDITORM._entityCount;
      if (typeof (ENGINE.EDITORM._tileselected.group.loaded) == "undefined")
        ENGINE.EDITORM._tileselected.group.loaded = [];
      ENGINE.EDITORM._tileselected.group.loaded.push(
        {
          name: uname, //unique                    
          ename: ename, //loaded entity
          entity: data
        });
      ENGINE.EDITORM._loadEntityObj(ENGINE.EDITORM._tileselected, uname, data, button);
    });
  },

  _changelgview: function () {
    //light.group={name: "Light", model: 2, active:true}
    var modelsel = parseInt($('#lmode option:selected').val());
    HELPER.hideTransform();
    $('#l1target').val('---');
    for (var i = 0; i < ENGINE.Light.lights.length; i++) {
      if (typeof (ENGINE.Light.lights[i]) !== 'undefined') {
        if (modelsel == 0) { //debug all helpers and lights on
          ENGINE.Light.lights[i].helper.visible = true;
          ENGINE.Light.lights[i].visible = true;
        }
        if (modelsel == 1) { //Final - World only and others
          ENGINE.Light.lights[i].helper.visible = false;
          if (typeof (ENGINE.Light.lights[i].helper.target) !== 'undefined')
            ENGINE.Light.lights[i].helper.target.visible = false;
          if (ENGINE.Light.lights[i].group.active == false || i == 1) {
            ENGINE.Light.lights[i].visible = false;
          } else {
            ENGINE.Light.lights[i].visible = true;
          }
        }
        if (modelsel > 1) {
          if (ENGINE.Light.lights[i].group.model == modelsel) {
            ENGINE.Light.lights[i].visible = true;
            ENGINE.Light.lights[i].helper.visible = true;
          } else {
            ENGINE.Light.lights[i].visible = false;
            ENGINE.Light.lights[i].helper.visible = false;
          }

        }

      }
    }
  },


  _folowSound:function(){
    var sndindex = $('#sndactors option:selected').val();
    if (typeof (sndindex) == 'undefined') return;
    sndindex = parseInt(sndindex);
    CONTROLS.target.copy(ENGINE.EDITORM._sounds[sndindex].audio.obj.position);
    CONTROLS.update();
    HELPER.blinkActor(ENGINE.EDITORM._sounds[sndindex].audio.obj);
  },

  playSelected:function(){
    var sndindex = $('#sndactors option:selected').val();
    if (typeof (sndindex) == 'undefined') return;
    sndindex = parseInt(sndindex);
    ENGINE.EDITORM._sounds[sndindex].audio.live.play();    
  },

  stopSelected:function(){
    var sndindex = $('#sndactors option:selected').val();
    if (typeof (sndindex) == 'undefined') return;
    sndindex = parseInt(sndindex);
    ENGINE.EDITORM._sounds[sndindex].audio.live.stop();
  },

  _soundBlink:function(){
    var sndindex = $('#sndactors option:selected').val();
    if (typeof (sndindex) == 'undefined') return;
    sndindex = parseInt(sndindex);
    if(ENGINE.EDITORM._sounds[sndindex].audio.obj && 
      ENGINE.EDITORM._sounds[sndindex].audio.obj!=null){
        HELPER.blinkActor(ENGINE.EDITORM._sounds[sndindex].audio.obj);
    HELPER.showTransform(ENGINE.EDITORM._sounds[sndindex].audio.obj);
    HELPER._transformHelper({ value: 'translate' });
      }
    
  },


  addasphereSound:function(name) {
    for (var i = 0; i < ENGINE.EDITORM._sounds.length; i++) {
      var selsound = ENGINE.EDITORM._sounds[i];
      if (selsound.audio.name == name) {
        var actPos = selsound.audio.pos;
        actPos = new THREE.Vector3(actPos.x, actPos.y + 0.5, actPos.z);
        var spphere = null;
        if(selsound.audio.type==0){
          spphere=HELPER.areaSphere(actPos, 1, 'gold', false, 5);
        }        
        selsound.audio.obj = spphere;
        HELPER.audioAtatch(selsound.audio.audio,spphere,(getaudio)=>{
            getaudio.audio.setVolume(selsound.audio.volume);
            selsound.audio.live=getaudio.audio;
            if(selsound.audio.type==1){
              ENGINE.camera.add(selsound.audio.live);
            }
          })
        break;
      }
    }
  },

  _insertSound: function (button,replace) {
    function checkId() {
      var ccid = $('#sndname').val().trim();
      if (ccid == '' || ccid.length < 4) {
        alert('Invalid Name'); return null;
      }
      for (var i = 0; i < ENGINE.EDITORM._sounds.length; i++) {
        if (typeof (ENGINE.EDITORM._sounds[i].audio.name) !== 'undefined' &&
          ENGINE.EDITORM._sounds[i].audio.name == ccid) {
          //alert('Name already Exists: ' + ccid); return null;
          console.log(replace);
          if(replace==false){
            $("#dialog2").dialog('close');
            return null;
          }
          if(replace==true){
            //ENGINE.EDITORM._sounds[i].audio.live.parent().remove(ENGINE.EDITORM._sounds[i].audio.live);
            if(ENGINE.EDITORM._sounds[i].audio.live.isPlaying==true)
            ENGINE.EDITORM._sounds[i].audio.live.stop();
            if(ENGINE.EDITORM._sounds[i].audio.obj!=null){
              ENGINE.EDITORM._sounds[i].audio.obj.selfremove=true;
            }else{
              ENGINE.camera.remove(ENGINE.EDITORM._sounds[i].audio.live);
            }            
            HELPER.hideTransform();
            ENGINE.EDITORM._sounds.splice(i,1);
            $("#dialog2").dialog('close');
            return ccid;
          }
          $("#dialog2").html(`
          <div align="center"><br>
          Name `+ccid+` already in list <br><br>
          <input type="button" value="Replace" onclick="ENGINE.EDITORM._insertSound(this,true)"/> 
          <input type="button" value="Cancel" onclick="ENGINE.EDITORM._insertSound(this,false)"/> 
          </div>
          `).dialog();
          return null;
        }
      }
      return ccid;
    }
    var name = checkId();
    if (name == null) return;
    var audio = $('#snstep').val();
    if (typeof (audio) == 'undefined' || audio == '---' || audio == null) {
      alert('Select a sound to Insert'); return null;
      return;
    }
    if (ENGINE.EDITORM._tileselected == null) {
      alert('Select a Tile first');
      return;
    }
    var sntype = $('#sndtype option:selected').val();
    sntype = parseInt(sntype);
    var position = null;
    if(sntype==1){
      position=new THREE.Vector3();
    }else{
      position=ENGINE.EDITORM._tileselected.position.clone();
    }    
    position = { x: position.x, y: position.y, z: position.z };
    var key = $('#sndkey').val().trim();
    var volume = $('#sndvol').val().trim();
    if (isNaN(volume) == true) {
      alert('Invalid volume value');
      return;
    }    
    volume = parseFloat(volume);
    ENGINE.EDITORM._sounds.push({
      audio:
        { name: name, audio: audio, volume: volume, key: key, type: sntype, pos: position },
      tile:ENGINE.EDITORM._tileselected.group.square
    });
    ENGINE.EDITORM._updateSoundList();
    //if (sntype == 0) {//sphere point sound
      ENGINE.EDITORM.addasphereSound(name);
    //}
  },

  _updateSoundList: function () {
    var soundlist = '';
    var destins = '';
    for (var i = 0; i < ENGINE.EDITORM._sounds.length; i++) {
      var soundsel = ENGINE.EDITORM._sounds[i].audio;
      var sndtype = soundsel.type == 0 ? 'P' : 'A';
      soundlist += '<option value="' + i + '">' + soundsel.name + ' ' + sndtype + ' ' + soundsel.audio + '</option>';
    }
    $('#sndactors').html(soundlist);

  },



}


