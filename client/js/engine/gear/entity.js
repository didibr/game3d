ENGINE.ENTITY = {
  _tileditoOBJ: null,

  variables: class {
    model = {
      pos: { x: 0, y: 0, z: 0 },
      qua: { x: 0, y: 0, z: 0, w: 0 },
      sca: 0.985,
      name: null,
      url: null,
    }
    box = {
      pos: { x: 0, y: 0, z: 0 },//extra position on tile
      sca: { x: 0, y: 0, z: 0 }, //not used
      qua: { x: 0, y: 0, z: 0, w: 1 }
    }
    attr = {
      moviment: 0, //0Static - 1Walking - 2runing - 3sleeping
      agressive: false,
      lvl: 1,
      hp: 50,
      str: 50,
      dex: 50,
      qtd: 1,
      areaspaw: 0.5,
      areachase: 8,
      revive: 1,
      revivetime: 30
    }
    audios=new Array()
    itens = new Array()
    drops = new Array()
  },
  itemvar: null,
  _chasearea: null,
  _spawnarea: null,


  _configureBaseView: function (noReset) {
    ENGINE.clear();
    ENGINE.Physic.debugPhysics = true;
    ENGINE.Light.addAmbient("#ffffff", 0.5);
    var l1 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
      new THREE.Vector3(100, 100, 100));
    l1.helper.visible = false;
    //add single Tile
    ENGINE.ENTITY._tileditoOBJ =
      ENGINE.TILE._createSingleTile(10, 10, new THREE.Vector3(0, 0, 0));
    //change camera to ORBIT
    ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT,
      new THREE.Vector3(0, 10, -10),
      new THREE.Vector3(0, 0, 0));
    if (noReset != true) ENGINE.DIALOG.reset();
    //ENGINE.scene.add(TransformControl.control);
    ENGINE.ENTITY.itemvar = new ENGINE.ENTITY.variables();
    ENGINE.renderer.setClearColor('black');
    ENGINE.camera.position.set(-9.219469940584964e-14, 10.23176338959461, 11.86838449707103);
    ENGINE.camera.quaternion.set(-0.3482833486152888, -3.640863051730007e-15, -1.3527484992407182e-15, 0.9373893049727637);
    const texture = ENGINE.textureLoader.load(ENGINE.url + "images/ground/xf.png");
    ENGINE.ENTITY._tileditoOBJ.material.map = texture;
    if (ENGINE.ENTITY._chasearea == null)
      ENGINE.ENTITY._chasearea = HELPER.areaCircular(new THREE.Vector3(0, 0.51, 0), 0.01, '#aaaa00', false);
    if (ENGINE.ENTITY._spawnarea == null)
      ENGINE.ENTITY._spawnarea = HELPER.areaCircular(new THREE.Vector3(0, 0.52, 0), 0.01, '#ff0000', false);
    ENGINE.ENTITY._chasearea.visible = false;
    ENGINE.ENTITY._spawnarea.visible = false;
    ENGINE.Physic.skinMaterial.visible = true;
  },

  show: function (noReset, name) {
    if (ENGINE.login == null) {
      ENGINE.DIALOG.login('Login', 'Admin Login', function (login, pass) {
        ENGINE.login = login;
        ENGINE.pass = pass;
        ENGINE.ENTITY.show();
      });
      return;
    }

    if (noReset !== true)
      ENGINE.ENTITY._configureBaseView();//initial configuration      
    ENGINE.DIALOG.load('entity.html', function (dialog) {
      ENGINE.DIALOG.popup(dialog, 'Entity Editor', true);
      if (typeof (name) !== 'undefined') $('#saveas').val(name);
      $("#tabs").tabs();
      $("#Ttabs").tabs();
      $('div[aria-describedby="dialog"]').css({ 'left': '0px', 'top': '0px' });
      ENGINE.ENTITY._tabSelect(1);
    });
    this._preparesounds();
  },



  _loadFbx: function (button) {
    //downloadData(url,button,name,callback
    var name = $('#addobj option:selected').val();
    var local = $('#addobj option:selected').attr('local');
    if (name == '---' || typeof (local) == 'undefined') return;
    var url = ENGINE.url + local + name;
    HELPER.hideTransform();
    ANIMATED.clear();
    ANIMATED._data = new Array();
    //if (ENGINE.ENTITY.itemvar.sca == null) ENGINE.ENTITY.itemvar.model.sca = 0.985;
    ENGINE.ENTITY.itemvar.model.url = url;
    ENGINE.ENTITY.itemvar.model.name = name;
    ANIMATED.load(url, name, ENGINE.ENTITY.itemvar.model.sca, function (mobj) {
      ENGINE.ENTITY._getitemconfig();
      ENGINE.ENTITY._updateItens();
    });
  },


  _repaintareas: function () {
    var visible = ENGINE.ENTITY._chasearea.visible;
    ENGINE.ENTITY._chasearea.selfremove = true;
    ENGINE.ENTITY._chasearea =
      HELPER.areaCircular(new THREE.Vector3(0, 0.51, 0),
        ENGINE.ENTITY.itemvar.attr.areachase, '#aaaa00', false);
    ENGINE.ENTITY._chasearea.visible = visible;
    ENGINE.ENTITY._spawnarea.selfremove = true;
    ENGINE.ENTITY._spawnarea =
      HELPER.areaCircular(new THREE.Vector3(0, 0.52, 0),
        ENGINE.ENTITY.itemvar.attr.areaspaw, '#ff0000', false);
    ENGINE.ENTITY._spawnarea.visible = visible;
  },

  _getitemconfig: function () {
    $('#helperctrl').val('---');
    $('#enscale').val(ENGINE.ENTITY.itemvar.model.sca);
    $('#atagressive').val(ENGINE.ENTITY.itemvar.attr.agressive);
    $('#atlvl').val(ENGINE.ENTITY.itemvar.attr.lvl);
    $('#athp').val(ENGINE.ENTITY.itemvar.attr.hp);
    $('#atstr').val(ENGINE.ENTITY.itemvar.attr.str);
    $('#atdex').val(ENGINE.ENTITY.itemvar.attr.dex);
    $('#atqtd').val(ENGINE.ENTITY.itemvar.attr.qtd);
    $('#atareaspaw').val(ENGINE.ENTITY.itemvar.attr.areaspaw);
    $('#atareachase').val(ENGINE.ENTITY.itemvar.attr.areachase);
    $('#atagressive').val(ENGINE.ENTITY.itemvar.attr.agressive == true ? 1 : 0);
    $('#atmoviment').val(ENGINE.ENTITY.itemvar.attr.moviment);
    //$('#atagressive').val(ENGINE.ENTITY.itemvar.attr.agressive);
    ENGINE.ENTITY._repaintareas();
    $('#entitydata select,input').each((index, input) => {
      $(input).off('change').on('change', () => {
        ENGINE.ENTITY._enchange(input);
      })
    });
    $('#attributes select,input').each((index, input) => {
      $(input).off('change').on('change', () => {        
        ENGINE.ENTITY._enchange(input);
      })
    });
    $('#attributes2 select,input').each((index, input) => {
      $(input).off('change').on('change', () => {        
        ENGINE.ENTITY._enchange(input);
      })
    });
  },

  _enchange: function (elem) {
    elem = $(elem);
    var name = ENGINE.ENTITY.itemvar.model.name;
    if (elem.prop('id') == 'enscale') {
      var oldscale = ANIMATED._data[name].sca;
      var newscale = parseFloat(elem.val());
      ANIMATED._data[name].object.scale.addScalar(oldscale);
      ANIMATED._data[name].object.scale.subScalar(newscale);
      ANIMATED._data[name].sca = newscale;
      ENGINE.ENTITY.itemvar.model.sca = newscale;
    }
    if (elem.prop('id') == 'atmoviment') {
      ENGINE.ENTITY.itemvar.attr.moviment = parseInt(elem.val());
    }
    if (elem.prop('id') == 'atagressive') {
      ENGINE.ENTITY.itemvar.attr.agressive = parseInt(elem.val()) == 1 ? true : false;
    }
    if (elem.prop('id') == 'atlvl') {
      ENGINE.ENTITY.itemvar.attr.lvl =
        Math.min(100, Math.max(1, parseInt(elem.val())));
    }
    if (elem.prop('id') == 'athp') {
      ENGINE.ENTITY.itemvar.attr.hp =
        Math.min(100, Math.max(1, parseInt(elem.val())));
    }
    if (elem.prop('id') == 'atstr') {
      ENGINE.ENTITY.itemvar.attr.str =
        Math.min(100, Math.max(1, parseInt(elem.val())));
    }
    if (elem.prop('id') == 'atdex') {
      ENGINE.ENTITY.itemvar.attr.dex =
        Math.min(100, Math.max(1, parseInt(elem.val())));
    }
    if (elem.prop('id') == 'atqtd') {
      ENGINE.ENTITY.itemvar.attr.qtd =
        Math.min(20, Math.max(1, parseInt(elem.val())));
    }
    if (elem.prop('id') == 'atareaspaw') {
      ENGINE.ENTITY.itemvar.attr.areaspaw =
        Math.min(99, Math.max(0.5, parseFloat(elem.val())));
      if (ENGINE.ENTITY.itemvar.attr.areachase <= ENGINE.ENTITY.itemvar.attr.areaspaw) {
        ENGINE.ENTITY.itemvar.attr.areachase = ENGINE.ENTITY.itemvar.attr.areaspaw + 1;
        $('#atareachase').val(ENGINE.ENTITY.itemvar.attr.areachase);
      }
      ENGINE.ENTITY._repaintareas();
      //areaCircular: function (position, radius, color,wire) {        
    }
    if (elem.prop('id') == 'atareachase') {
      ENGINE.ENTITY.itemvar.attr.areachase =
        Math.min(100, Math.max(1.5, parseFloat(elem.val())));
      if (ENGINE.ENTITY.itemvar.attr.areachase <= ENGINE.ENTITY.itemvar.attr.areaspaw) {
        ENGINE.ENTITY.itemvar.attr.areaspaw = ENGINE.ENTITY.itemvar.attr.areachase - 1;
        $('#atareaspaw').val(ENGINE.ENTITY.itemvar.attr.areaspaw);
      }
      ENGINE.ENTITY._repaintareas();
    }
    if (elem.prop('id') == 'atrevive') {
      ENGINE.ENTITY.itemvar.attr.revive = parseInt(elem.val()) === '1' ? true : false;
    }
    if (elem.prop('id') == 'atrevivetime') {
      ENGINE.ENTITY.itemvar.attr.revivetime = Math.min(1, Math.max(9999, parseInt(elem.val())));
    }
  },

  _transf: function (edit) {
    var mode = edit.value;
    if (typeof (mode) == 'undefined') return;
    if (ENGINE.ENTITY.itemvar.model.name == null) return;
    if (mode == '---') {
      HELPER.hideTransform();
      return;
    }
    HELPER.showTransform(ANIMATED._data[ENGINE.ENTITY.itemvar.model.name].object);
    HELPER._transformHelper(edit)
    ANIMATED._data[ENGINE.ENTITY.itemvar.model.name].shape.add(
      ANIMATED._data[ENGINE.ENTITY.itemvar.model.name].object);
  },

  _tabSelect: function (num) {
    if (ENGINE.ENTITY._chasearea != null) {
      ENGINE.ENTITY._spawnarea.visible = false;
      ENGINE.ENTITY._chasearea.visible = false;
    }
    if (num == 1) {
      $('#loadtas').load(ENGINE.url + 'GETENTITYS');
    }
    if (num == 2) {//LOAD FBX
      $('#loadas').load(ENGINE.url + 'GETFBXNAMES', function () {
        if (ENGINE.ENTITY.itemvar.model.name != null) {
          $('#addobj').val(ENGINE.ENTITY.itemvar.model.name);
          ANIMATED._data[ENGINE.ENTITY.itemvar.model.name].shape.material.opacity = 0.3;
        }
      });
    }
    if (num == 3) {
      console.log('is3');
      if (ENGINE.ENTITY._chasearea != null) {
        ENGINE.ENTITY._spawnarea.visible = true;
        ENGINE.ENTITY._chasearea.visible = true;
      }
    }
    if (num != 2) {
      if (ENGINE.ENTITY.itemvar.model.name != null)
        ANIMATED._data[ENGINE.ENTITY.itemvar.model.name].shape.material.opacity = 0;
    }
    if (num == 5) {
      $('#loaditenssel').load(ENGINE.url + 'GETITEMNAMES', function () {
        $('#loaditenssel').html($('#loaditenssel').html().replace('loadisel', 'loaditenssel'))
      });
    }
    if (num == 6) {
      $('#loaddrops').load(ENGINE.url + 'GETITEMNAMES', function () {
        $('#loaddrops').html($('#loaddrops').html().replace('loadisel', 'loaddropsel'))
      });
    }
  },

 

  _removeDrop:function(button){
    var index = $('#edrops option:selected').val();    
    if (typeof(index)=='undefined') return;
    index=parseInt(index);
    ENGINE.ENTITY.itemvar.drops.splice(index,1);    
    ENGINE.ENTITY._updateItens();        
  },

  _insertDrop: function (button) {
    var name = $('#loaddropsel option:selected').val();
    var rate = $('#dropchance').val();
    if (name == '---') return;
    if (ENGINE.ENTITY.itemvar == null ||
      typeof (ENGINE.ENTITY.itemvar.model) == 'undefined' ||
      ENGINE.ENTITY.itemvar.model.name == null) return;
    for (var i = 0; i < ENGINE.ENTITY.itemvar.drops.length; i++) {
      if (ENGINE.ENTITY.itemvar.drops[i].name == name) {
        ENGINE.ENTITY.itemvar.drops[i].rate = rate;
        ENGINE.ENTITY._updateItens();
        return;
      }
    }
    ENGINE.ENTITY.itemvar.drops.push({name:name,rate:rate});
    ENGINE.ENTITY._updateItens();
  },

  _insertItem: function (button) {
    var name = $('#loaditenssel option:selected').val();
    var itemtype = $('#itemtype option:selected').val();
    itemtype = parseInt(itemtype);
    if (name == '---' || HELPER.getBonneByNumber(itemtype) == '') return;
    var url = ENGINE.url + 'LOADITEM' + name;
    HELPER.downloadData(url, button, function (data) {

      var objlist = "";
      for (var i = 0; i < data.obj.length; i++) {
        if (typeof (data.obj[i]._Attached) == 'undefined' ||
          typeof (data.obj[i]._Attached[itemtype]) == 'undefined' || data.obj[i]._Attached[itemtype] == null) {
          objlist += data.obj[i]._OBJ + " ";
        }
      }
      if (objlist !== "") {
        alert(name + ' ITEM contains the Objects:\n"' + objlist.trim() + '"\nThat has no defined position for ' +
          HELPER.getBonneByNumber(itemtype, true));
        return;
      }
      for (var i = 0; i < ENGINE.ENTITY.itemvar.itens.length; i++) {
        if (ENGINE.ENTITY.itemvar.itens[i].type == itemtype) {
          alert('Already exist item on ' + HELPER.getBonneByNumber(itemtype, true));
          return;
        }
      }
      ENGINE.ENTITY.position = ENGINE.ENTITY._tileditoOBJ.position;
      ENGINE.TILE.jsonToTileEditor(ENGINE.ENTITY, data.obj);
      ENGINE.ENTITY.itemvar.itens.push({ obj: data.obj, scene: ENGINE.ENTITY.scenevar, name: name, type: itemtype });
      ENGINE.ENTITY._updateItens();
    });

    if (ENGINE.ENTITY._updateItemTimer != null) clearTimeout(ENGINE.ENTITY._updateItemTimer);
    ENGINE.ENTITY._updateItemTimer = setTimeout(() => {
      ENGINE.ENTITY._updateItens();
    }, 1000);
  },

  _updateItemTimer: null,

  _updateItens: async function () {
    var itemlist = '';
    var droplist ='';
    var name = ENGINE.ENTITY.itemvar.model.name;
    var itens = ENGINE.ENTITY.itemvar.itens;
    for (var i = 0; i < itens.length; i++) {
      if (name != null && typeof (ANIMATED._data[name]) !== 'undefined' && itens[i] != null) {

        if (typeof (itens[i].scene) == 'undefined') { //no loaded 3dobj   
          var url = ENGINE.url + 'LOADITEM' + itens[i].name;
          var data = await HELPER.simpleDownloadSync(url);
          ENGINE.ENTITY.position = ENGINE.ENTITY._tileditoOBJ.position;
          ENGINE.TILE.jsonToTileEditor(ENGINE.ENTITY, data.obj);
          ENGINE.ENTITY.itemvar.itens[i].obj = data.obj;
          ENGINE.ENTITY.itemvar.itens[i].scene = ENGINE.ENTITY.scenevar;
          if (ENGINE.ENTITY._updateItemTimer != null) clearTimeout(ENGINE.ENTITY._updateItemTimer);
          ENGINE.ENTITY._updateItemTimer = setTimeout(() => {
            ENGINE.ENTITY._updateItens();
          }, 1000);
        } else { //3d object loaded
          itemlist += '<option value="' + i + '">' + HELPER.getBonneByNumber(itens[i].type, true) + ' - ' + name + '</option>';
          for (var b = 0; b < itens[i].scene.length; b++) {
            var val = itens[i].scene[b];
            if (val._OBJ3d != null) {
              HELPER.objaddToBone(val, name, itens[i].type);
              ENGINE.itemCache.push(val._OBJ3d);
            }
          }
        }

      }
    }
    for (var i = 0; i < ENGINE.ENTITY.itemvar.drops.length; i++) {      
        droplist += '<option value="' + i + '">' + ENGINE.ENTITY.itemvar.drops[i].name +' - ' + 
        ENGINE.ENTITY.itemvar.drops[i].rate + '%</option>';      
    }
    $('#eitens').html(
      '<select id="eitens" style="width:300px;padding: 4px;" size="10">' +
      itemlist +
      '</select>');
      $('#edrops').html(
        '<select id="edrops" style="width:300px;padding: 4px;" size="10">' +
        droplist +
        '</select>');
  },

  _removeItem: function (button) {
    var remove = $('#eitens option:selected').val();
    if (typeof (remove) == 'undefined') return;
    remove = parseInt(remove);
    var itens = ENGINE.ENTITY.itemvar.itens;
    if (typeof (itens[remove].scene) !== 'undefined' && itens[remove].scene != null)
      for (var b = 0; b < itens[remove].scene.length; b++) {
        var val = itens[remove].scene[b];
        if (val._OBJ3d != null) {
          //val._OBJ3d.parent.remove(val._OBJ3d);
          val._OBJ3d.selfremove = true;
        }
      }
    //delete itens[remove];
    itens.splice(remove, 1);
    ENGINE.ENTITY._updateItens();
  },


  _preparesounds:async function(){
    var audiolst=await HELPER.simpleDownloadSync(ENGINE.url + 'AUDIONAMES');
    audiolst=audiolst.replace('disabled','');
    $('.snd').each((num,obj)=>{
      $(obj).html(audiolst);
    })
  },

  getAudios:function(){
    var retorna = [];
    $('.snd').each((num,obj)=>{
      obj=$(obj);
      if(obj.attr('id') && obj.find('option:selected').val()!=='---'){
        retorna.push({id:obj.attr('id'), audio:obj.find('option:selected').val()});
      }    
    })
    return retorna;
  },


  _loadEntity: async function (button) {
    var name = $('#loadent option:selected').val();
    if (name == '---') return;
    $('#saveas').val(name);
    var url = ENGINE.url + 'LAOADENT' + name;
    //var data = await HELPER.simpleDownloadSync(url);
    HELPER.downloadData(url,button,function(data){
    $(button).prop("disabled", true);
    ENGINE.ENTITY._configureBaseView(true);//initial configuration             
    ANIMATED._data = new Array();
    ENGINE.ENTITY.itemvar = new ENGINE.ENTITY.variables();
    HELPER.updateArray(ENGINE.ENTITY.itemvar,data)
    //ENGINE.ENTITY.itemvar = data;
    ANIMATED.load(
      ENGINE.ENTITY.itemvar.model.url,
      ENGINE.ENTITY.itemvar.model.name,
      ENGINE.ENTITY.itemvar.model.sca,
      function (mobj) {

        mobj.position.set(
          ENGINE.ENTITY.itemvar.model.pos.x,
          ENGINE.ENTITY.itemvar.model.pos.y,
          ENGINE.ENTITY.itemvar.model.pos.z);
        mobj.quaternion.set(
          ENGINE.ENTITY.itemvar.model.qua.x,
          ENGINE.ENTITY.itemvar.model.qua.y,
          ENGINE.ENTITY.itemvar.model.qua.z,
          ENGINE.ENTITY.itemvar.model.qua.w);
        $(button).prop("disabled", null);

       
        ENGINE.ENTITY._chasearea.visible = false;
        ENGINE.ENTITY._spawnarea.visible = false;
        ANIMATED._data[ENGINE.ENTITY.itemvar.model.name].shape.material.opacity = 0;
        ENGINE.ENTITY._getitemconfig();
        ENGINE.ENTITY._updateItens();

      });
    });

  },


  _saveEntity: function (button) {
    var ename = $('#saveas').val();
    if (ename.length < 4) {
      alert('Invalid Name'); return;
    }
    var name = ENGINE.ENTITY.itemvar.model.name;
    if (name == undefined || name == null) return;

    ENGINE.ENTITY.itemvar.model.pos.x = ANIMATED._data[name].object.position.x;
    ENGINE.ENTITY.itemvar.model.pos.y = ANIMATED._data[name].object.position.y;
    ENGINE.ENTITY.itemvar.model.pos.z = ANIMATED._data[name].object.position.z;
    ENGINE.ENTITY.itemvar.model.qua.x = ANIMATED._data[name].object.quaternion.x;
    ENGINE.ENTITY.itemvar.model.qua.y = ANIMATED._data[name].object.quaternion.y;
    ENGINE.ENTITY.itemvar.model.qua.z = ANIMATED._data[name].object.quaternion.z;
    ENGINE.ENTITY.itemvar.model.qua.w = ANIMATED._data[name].object.quaternion.w;
    ENGINE.ENTITY.itemvar.model.sca = ANIMATED._data[name].sca;

    var item = new ENGINE.ENTITY.variables();
    for (var i = 0; i < ENGINE.ENTITY.itemvar.itens.length; i++) {
      delete ENGINE.ENTITY.itemvar.itens[i].obj;
      delete ENGINE.ENTITY.itemvar.itens[i].scene;
    }
    item.itens = ENGINE.ENTITY.itemvar.itens;
    item.drops = ENGINE.ENTITY.itemvar.drops;
    item.audios = ENGINE.ENTITY.getAudios();
    HELPER.updateArray(item.model, ENGINE.ENTITY.itemvar.model);
    HELPER.updateArray(item.box, ENGINE.ENTITY.itemvar.box);
    HELPER.updateArray(item.attr, ENGINE.ENTITY.itemvar.attr);


    var jsonv = JSON.stringify({ name: ename, elements: item });
    var url = ENGINE.url + ENGINE.conf.dir.upload + '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
    HELPER.uploadData(url, button, 'SAVENTITY', jsonv, function () {
      ENGINE.EDITORT._tabSelect(1);
      ENGINE.ENTITY._updateItens();
    });

  },


}




//EFFECT on MESH
//ANIMATED._data["xbot.fbx"].object.children[0].layers.toggle(10);
    //ANIMATED._data["xbot.fbx"].shape.layers.toggle(10);
    //ANIMATED._data["xbot.fbx"].object.children[0].material.color.set('#0026e1');