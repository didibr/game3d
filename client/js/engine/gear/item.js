ENGINE.ITEM = {
  _tileditoOBJ: null,
  _contactBox: null,
  scenevarCount: -1,
  scenevar: [],
  variables: class {
    box = {
      pos: { x: 0, y: 0, z: 0 },
      qua: { x: 0, y: 0, z: 0, w: 0 },
      sca: { x: 0, y: 0, z: 0 }
    }
    actions = {
      needlife: 0, needstr: 0, needdex: 0, needmana: 0, needgold: 0, needkey: "",
      givelife: 0, givestr: 0, givedex: 0, givemana: 0, givegold: 0, givedmg:0, givearmor:0 ,givekey: ""
    }
    atribute = {
      usable: true, stock: false, dropable: false,
      max: 1, price: 0, type:0
    }
    extra = {
      icon: 'images/defaulticon.png'
    }
  },
  itemvar: null,

  _configureBaseView: function (noReset) {
    if (typeof (TransformControl.control.object) !== 'undefined') {
      TransformControl.control.detach(TransformControl.control.object);
    }
    ENGINE.clear();
    ENGINE.Physic.debugPhysics = true;
    ENGINE.Light.addAmbient("#ffffff", 0.5);
    var l1 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
      new THREE.Vector3(100, 100, 100));
    l1.helper.visible = false;
    //add single Tile
    ENGINE.ITEM._tileditoOBJ =
      ENGINE.TILE._createSingleTile(10, 10, new THREE.Vector3(0, 0, 0));
    //change camera to ORBIT
    ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT,
      new THREE.Vector3(0, 10, -10),
      new THREE.Vector3(0, 0, 0));
    if (noReset != true) ENGINE.DIALOG.reset();
    ENGINE.scene.add(TransformControl.control);
    ENGINE.ITEM.itemvar = new ENGINE.ITEM.variables();
    ENGINE.renderer.setClearColor('black');
  },

  show: function (noReset, name) {
    if (ENGINE.login == null) {
      ENGINE.DIALOG.login('Login', 'Admin Login', function (login, pass) {
        ENGINE.login = login;
        ENGINE.pass = pass;
        ENGINE.ITEM.show();
      });
      return;
    }

    if (noReset !== true)
      ENGINE.ITEM._configureBaseView();//initial configuration      
    ENGINE.DIALOG.load('item.html', function (dialog) {
      ENGINE.DIALOG.popup(dialog, 'Item Editor', true);
      if (typeof (name) !== 'undefined') $('#saveas').val(name);
      $("#tabs").tabs();
      $("#Ttabs").tabs();
      $("#T2tabs").tabs();
      $('div[aria-describedby="dialog"]').css({ 'left': '0px', 'top': '0px' });
      ENGINE.ITEM._tabSelect(1);
      $('#T2tabs-1,#T2tabs-2,#tabs-4 select,input').each((index, input) => {
        $(input).off('change').on('change', () => {
          ENGINE.ITEM._controlschange(input);
        })
      })
    });

  },

  _controlschange: function (elem) {
    elem = $(elem);
    var eID = elem.prop('id');
    if (typeof (ENGINE.ITEM.itemvar.actions[eID]) !== 'undefined') {
      ENGINE.ITEM.itemvar.actions[eID] = elem.val();
      if (eID !== 'needkey' && eID !== 'givekey')
        ENGINE.ITEM.itemvar.actions[eID] =
          parseInt(ENGINE.ITEM.itemvar.actions[eID]);
    }
    if (typeof (ENGINE.ITEM.itemvar.atribute[eID]) !== 'undefined') {
      if (eID === 'usable' || eID === 'stock' || eID === 'dropable') {
        ENGINE.ITEM.itemvar.atribute[eID] = elem.find('option:selected').val() === '1' ? true : false;
      } else {
        ENGINE.ITEM.itemvar.atribute[eID] = parseInt(elem.val());
      }
    }

  },

  _datatocontrol: function () {
    for (var i = 0; i < Object.keys(ENGINE.ITEM.itemvar.actions).length; i++) {
      var eID = Object.keys(ENGINE.ITEM.itemvar.actions)[i];
      var val = ENGINE.ITEM.itemvar.actions[eID];
      if ($('#' + eID)[0]) {
        $('#' + eID).val(val);
      }
    }
    for (var i = 0; i < Object.keys(ENGINE.ITEM.itemvar.atribute).length; i++) {
      var eID = Object.keys(ENGINE.ITEM.itemvar.atribute)[i];
      var val = ENGINE.ITEM.itemvar.atribute[eID];      
      if ($('#' + eID)[0]) {
        if (eID === 'usable' || eID === 'stock' || eID === 'dropable') {
          $('#' + eID).val(val==true ? 1 : 0);
        }else{          
          $('#' + eID).val(val);
        }        
      }
    }
  },

  _tabSelect: function (num) {
    if (num == 1) {//Load Items
      $('#loadtas').load(ENGINE.url + 'GETITEMNAMES');
    }
    if (num == 2) {//SAVE LOAD
      $('#loadas').load(ENGINE.url + 'GETTILENAMES');
      $('#avaiatextures').load(ENGINE.url + 'GETTEXTURES', function () {
        $('#avaiatextures').html(

          $('#avaiatextures').html().replaceAll('.EDITORT.', '.ITEM.')

        );
      });
    }
    if(ENGINE.ITEM._contactBox!==null)
    if(num==2 || num==10){
      ENGINE.ITEM._contactBox.visible=true;
      HELPER.showTransform(ENGINE.ITEM._contactBox);      
    }else{
      HELPER.hideTransform();
      ENGINE.ITEM._contactBox.visible=false;
    }
  },

  _loadTile: function (button) {
    var name = $('#loadasel option:selected').val();
    if (name == '---') return;
    var cmp = ENGINE.camera.position.clone();
    var qt = ENGINE.camera.quaternion.clone();
    var url = ENGINE.url + 'LOADTILE' + name;
    var oldtitem = ENGINE.ITEM.itemvar;
    //noControls=true;
    HELPER.downloadData(url, button, function (data) {
      ENGINE.clear();
      ENGINE.ITEM._configureBaseView(true);//initial configuration                 
      ENGINE.ITEM.position = ENGINE.ITEM._tileditoOBJ.position;
      ENGINE.TILE.jsonToTileEditor(ENGINE.ITEM, data);
      ENGINE.ITEM.itemvar = oldtitem;
      ENGINE.camera.position.copy(cmp);
      ENGINE.camera.quaternion.copy(qt);
      ENGINE.ITEM.createBox({ x: 0, y: 2.97, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 5, y: 5, z: 5 });
      setTimeout(() => { HELPER.showTransform(ENGINE.ITEM._contactBox); }, 100);      
    });
  },


  createBox: function (pos, qua, sca) {
    const geometry = new THREE.BoxGeometry(sca.x, sca.y, sca.z, 4, 4, 4);
    const material = new THREE.MeshStandardMaterial({ color: 'gold' });
    //material.transparent = true;
    //material.opacity = 0.5;
    material.wireframe = true;
    material.emissive.setColorName('gold');
    ENGINE.ITEM._contactBox = new THREE.Mesh(geometry, material);
    ENGINE.ITEM._contactBox.position.set(pos.x, pos.y, pos.z);
    ENGINE.ITEM._contactBox.quaternion.set(qua.x, qua.y, qua.z, qua.w);
    ENGINE.scene.add(ENGINE.ITEM._contactBox);
    //setTimeout(() => { HELPER.showTransform(ENGINE.ITEM._contactBox); }, 1000);
  },


  _loadItem: function (button) {
    //downloadData(url,button,name,callback
    var name = $('#loadisel option:selected').val();
    if (name == '---') return;
    $('#saveas').val(name);
    var url = ENGINE.url + 'LOADITEM' + name;
    //noControls=true;
    ENGINE.clear();
    ENGINE.ITEM._configureBaseView();//initial configuration       
    ENGINE.ITEM.show(true, name);

    HELPER.downloadData(url, button, function (data) {
      ENGINE.ITEM.position = ENGINE.ITEM._tileditoOBJ.position;
      ENGINE.TILE.jsonToTileEditor(ENGINE.ITEM, data.obj);
      ENGINE.ITEM.itemvar = data.item;

      ENGINE.ITEM.createBox(
        ENGINE.ITEM.itemvar.box.pos,
        ENGINE.ITEM.itemvar.box.qua,
        ENGINE.ITEM.itemvar.box.sca
      );
      
      $('#iconimg').html('<img src="' + ENGINE.url +
        ENGINE.ITEM.itemvar.extra.icon
        + '" style="width:74px;height:74px">');
            
      HELPER.hideTransform();
      ENGINE.ITEM._contactBox.visible=false;            
      setTimeout(()=>{ENGINE.ITEM._datatocontrol();},1000);
    });
  },

  _iconcharge: function () {
    var item = $('#loadisel option:selected').attr('item');
    if (typeof (item) == 'undefined') {
      $('#iconimg').html('<img src="' + ENGINE.url +
        'images/defaulticon.png" style="width:74px;height:74px">');
    } else {
      $('#iconimg').html('<img src="' + ENGINE.url + item
        + '" style="width:74px;height:74px">');
    }

  },


  _saveItem: function (button) {
    var nome = $('#saveas').val();
    if (nome.length < 4) {
      alert('Invalid Name');
      return;
    }
    var jsonv = "";
    var jsona = [];
    var xscale;
    ENGINE.ITEM._loopVar(function (val) {
      xscale = val._Scale;
      if (val._shape !== null) {
        xscale = {
          x: val._shape.geometry.parameters.width,
          y: val._shape.geometry.parameters.height,
          z: val._shape.geometry.parameters.depth
        }
      }
      var item = new ENGINE.EDITORT.variables();//ancestor          
      for (var k = 0; k < Object.keys(item).length; k++) {
        var kname = Object.keys(item)[k];
        if (typeof (val[kname]) !== 'undefined') {
          item[kname] = val[kname];
        }
      }
      item._Scale = xscale;
      item._OBJ3d = val._shape == null ? true : false;
      item._shape = null;
      jsona.push(item);
    });

    //ITEM TRREATMENT
    ENGINE.ITEM.itemvar.box.sca = {
      x: ENGINE.ITEM._contactBox.geometry.parameters.width *
        ENGINE.ITEM._contactBox.scale.x,
      y: ENGINE.ITEM._contactBox.geometry.parameters.height *
        ENGINE.ITEM._contactBox.scale.y,
      z: ENGINE.ITEM._contactBox.geometry.parameters.depth *
        ENGINE.ITEM._contactBox.scale.z
    };
    ENGINE.ITEM.itemvar.box.pos = {
      x: ENGINE.ITEM._contactBox.position.x,
      y: ENGINE.ITEM._contactBox.position.y,
      z: ENGINE.ITEM._contactBox.position.z
    };
    ENGINE.ITEM.itemvar.box.qua = {
      x: ENGINE.ITEM._contactBox.quaternion.x,
      y: ENGINE.ITEM._contactBox.quaternion.y,
      z: ENGINE.ITEM._contactBox.quaternion.z,
      w: ENGINE.ITEM._contactBox.quaternion.w
    };


    jsonv =
      JSON.stringify({ name: nome, elements: { obj: jsona, item: ENGINE.ITEM.itemvar } });
    var url = ENGINE.url + ENGINE.conf.dir.upload +
      '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
    HELPER.uploadData(url, button, 'SAVEITEM', jsonv, function () {
      ENGINE.ITEM._tabSelect(1);
    });
  },


  _textureSel: function (img) {
    var file = $(img).attr('data-file');
    var path = $(img).attr('path');
    ENGINE.ITEM.itemvar.extra.icon = path + file;
    $('#iconimg').html('<img src="' + ENGINE.url +
      ENGINE.ITEM.itemvar.extra.icon
      + '" style="width:74px;height:74px">');
  },


  _loopVar: function (callback) {
    if (typeof (callback) == 'function') {
      for (var i = 0; i < ENGINE.ITEM.scenevar.length; i++) {
        if (typeof (ENGINE.ITEM.scenevar[i]) == 'object')
          callback(ENGINE.ITEM.scenevar[i]);
      }
    }
  },





}