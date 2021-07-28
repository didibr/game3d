ENGINE.EDITORT = {
  startPosition: { x: 0, y: 1, z: 0 },//Default Start Position of Objects
  scenevarCount: -1,
  scenevar: [],
  _tileditoOBJ: null,
  _activeBone: "",
  //noControls:true,
  variables: class {
    index = 0 //usado para criar vinculo
    selected = false; //se é obj selecionado
    _OBJ = null //nome do modelo se Modelo3d
    _shape = null //phisicbody na scene
    _OBJ3d = null //obj na scene    
    _Pos = { x: 0, y: 1, z: 0 }
    _Quat = { x: 0, y: 0, z: 0, w: 1 }
    _Scale = { x: 1, y: 1, z: 1 }
    _Attached = new Array()
    _Texture = null //nome da textura aplicada
    _TextureCF =
      {
        side: 2, transp: 0, opac: 1, rcvsh: 0, castsh: 0,
        repeat: { x: 1, y: 1 }, offset: { x: 0, y: 0 }, center: { x: 0, y: 0 },
        rotation: 0, color: '#ffffff'
      }
    _Shader = {}
  },


  _configureBaseView: function () {
    ENGINE.clear();
    ENGINE.Physic.debugPhysics = true;
    ENGINE.Light.addAmbient("#ffffff", 0.5);
    var l1 = ENGINE.Light.addDirectionalLightShadow("#ffffff", 0.5, 100,
      new THREE.Vector3(100, 100, 100));
    l1.helper.visible = false;
    //add single Tile
    ENGINE.EDITORT._tileditoOBJ =
      ENGINE.TILE._createSingleTile(10, 10, new THREE.Vector3(0, 0, 0));
    //change camera to ORBIT
    ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT,
      new THREE.Vector3(0, 10, -10),
      new THREE.Vector3(0, 0, 0));
    ENGINE.DIALOG.reset();
    //ENGINE.scene.add(TransformControl.control);    
    ENGINE.renderer.setClearColor('black');
    ENGINE.camera.position.set(-9.219469940584964e-14, 10.23176338959461, 11.86838449707103);
    ENGINE.camera.quaternion.set(-0.3482833486152888, -3.640863051730007e-15, -1.3527484992407182e-15, 0.9373893049727637);
    ENGINE.Physic.skinMaterial.visible = false;
  },



  show: function (noReset, name) {
    if (ENGINE.login == null) {
      ENGINE.DIALOG.login('Login', 'Admin Login', function (login, pass) {
        ENGINE.login = login;
        ENGINE.pass = pass;
        ENGINE.EDITORT.show();
      });
      return;
    }
    if (typeof (noReset) == 'undefined' || noReset != true)
      ENGINE.EDITORT._configureBaseView();//initial configuration      
    ENGINE.DIALOG.load('editort.html', function (dialog) {
      ENGINE.DIALOG.popup(dialog, 'Object Editor', true);
      if (typeof (name) !== 'undefined') $('#saveas').val(name);
      $("#tabs").tabs();
      $("#Ttabs").tabs();
      $('#objPos').off('change').change(function () { ENGINE.EDITORT._textToObjUpd(this); });
      $('#objRot').off('change').change(function () { ENGINE.EDITORT._textToObjUpd(this); });
      $('#objSca').off('change').change(function () { ENGINE.EDITORT._textToObjUpd(this); });
      ENGINE.EDITORT._tabSelect(3);
      $('div[aria-describedby="dialog"]').css({ 'left': '0px', 'top': '0px' });
    });
    ANIMATED._data = new Array();
    ANIMATED.load(ENGINE.url + ENGINE.conf.dir.dummy + '.fbx',  ENGINE.conf.dir.dummy, 0.985,
      function (mobj) {
        ANIMATED._data[ ENGINE.conf.dir.dummy].object.visible = false;
      });
      
  },

  atachedHelper: function (selector) {
    var option = $('#atached option:selected');
    if (option.val() === '---') {
      ANIMATED._data[ ENGINE.conf.dir.dummy].object.visible = false;
      HELPER.hideTransform();
      ENGINE.EDITORT._loopVar(function (val) {
        if (val._OBJ3d != null && !val._OBJ3d.parent.isScene) {
          val._OBJ3d.parent.remove(val._OBJ3d);
          ENGINE.scene.add(val._OBJ3d);
          val._OBJ3d.position.set(val._Pos.x, val._Pos.y, val._Pos.z);
          val._OBJ3d.quaternion.set(val._Quat.x, val._Quat.y, val._Quat.z, val._Quat.w);
          val._OBJ3d.scale.set(val._Scale.x, val._Scale.y, val._Scale.z);
          HELPER.showTransform(val._OBJ3d);
        }
      });
      return;
    }
    ENGINE.EDITORT._loopVar(function (val) {
      if (val._shape != null) {
        alert('Helper not Work with Physic Objects');
        $('#atached').val('---');
        return;
      }
    });    
    ENGINE.EDITORT._activeBone=parseInt(option.val());
    //var boneName=HELPER.getBonneByNumber(ENGINE.EDITORT._activeBone);
    //if (boneName=="") return;
    ANIMATED._data[ ENGINE.conf.dir.dummy].object.visible = true;
    ENGINE.EDITORT._loopVar(function (val) {
      if (val._OBJ3d !=null){
        HELPER.objaddToBone(val, ENGINE.conf.dir.dummy,ENGINE.EDITORT._activeBone);
      }
    });
    
    
  },

 


  _applyTextureChanges: function () {
    ENGINE.EDITORT._loopVar(function (val) {
      if (val.selected == true && val._OBJ3d != null) {
        val._TextureCF.side = parseInt($('#matSide option:selected').val());
        val._TextureCF.transp = parseInt($('#matTransp option:selected').val());
        val._TextureCF.opac = parseFloat($('#matOpac').val());
        val._TextureCF.rcvsh = parseInt($('#matRcvS option:selected').val());
        val._TextureCF.castsh = parseInt($('#matCastS option:selected').val());
        val._TextureCF.color = $('#matColor').val();
        val._TextureCF.rotation = parseFloat($('#mrotation').val());
        val._TextureCF.repeat.x = parseFloat($('#repeatx').val());
        val._TextureCF.repeat.y = parseFloat($('#repeaty').val());
        val._TextureCF.offset.x = parseFloat($('#offsetx').val());
        val._TextureCF.offset.y = parseFloat($('#offsety').val());
        val._TextureCF.center.x = parseFloat($('#centerx').val());
        val._TextureCF.center.y = parseFloat($('#centery').val());
        //console.log(val._TextureCF.castsh);
        ENGINE.TILE.aplytexturechanges(val);
      }
    });
  },

  _resettextures: function () {
    ENGINE.EDITORT._loopVar(function (val) {
      if (val.selected == true && val._OBJ3d != null) {
        var defval = new ENGINE.EDITORT.variables();
        val._TextureCF.side = defval._TextureCF.side;
        val._TextureCF.transp = defval._TextureCF.transp;
        val._TextureCF.opac = defval._TextureCF.opac;
        val._TextureCF.rcvsh = defval._TextureCF.rcvs;
        val._TextureCF.castsh = defval._TextureCF.castsh;
        val._TextureCF.color = defval._TextureCF.color;
        val._TextureCF.rotation = defval._TextureCF.rotation;
        val._TextureCF.repeat.x = defval._TextureCF.repeat.x;
        val._TextureCF.repeat.y = defval._TextureCF.repeat.y;
        val._TextureCF.offset.x = defval._TextureCF.offset.x;
        val._TextureCF.offset.y = defval._TextureCF.offset.y;
        val._TextureCF.center.x = defval._TextureCF.center.x;
        val._TextureCF.center.y = defval._TextureCF.center.y;
        //console.log(val._TextureCF.castsh);
        ENGINE.TILE.aplytexturechanges(val);
      }
    });
  },

  _updateObText: function (val) {
    ENGINE.EDITORT._lockTextChange = true;
    if (ANIMATED._data[ ENGINE.conf.dir.dummy].object.visible == true) {
      val._Attached[ENGINE.EDITORT._activeBone]._Quat = {
        x: val._OBJ3d.quaternion._x, y: val._OBJ3d.quaternion._y,
        z: val._OBJ3d.quaternion._z, w: val._OBJ3d.quaternion._w
      };
      val._Attached[ENGINE.EDITORT._activeBone]._Pos =
        { x: val._OBJ3d.position.x, y: val._OBJ3d.position.y, z: val._OBJ3d.position.z };
      val._Attached[ENGINE.EDITORT._activeBone]._Scale =
        { x: val._OBJ3d.scale.x, y: val._OBJ3d.scale.y, z: val._OBJ3d.scale.z };
    } else {
      val._Quat = {
        x: val._OBJ3d.quaternion._x, y: val._OBJ3d.quaternion._y,
        z: val._OBJ3d.quaternion._z, w: val._OBJ3d.quaternion._w
      };
      val._Pos = { x: val._OBJ3d.position.x, y: val._OBJ3d.position.y, z: val._OBJ3d.position.z };
      val._Scale = { x: val._OBJ3d.scale.x, y: val._OBJ3d.scale.y, z: val._OBJ3d.scale.z };
    }
    var _OBJ3d = val._OBJ3d;
    $('#objPos').val(_OBJ3d.position.x + ':' + _OBJ3d.position.y + ':' + _OBJ3d.position.z);
    $('#objRot').val(_OBJ3d.quaternion.x + ':' + _OBJ3d.quaternion.y + ':' + _OBJ3d.quaternion.z + ':' + _OBJ3d.quaternion.w);
    $('#objSca').val(_OBJ3d.scale.x + ':' + _OBJ3d.scale.y + ':' + _OBJ3d.scale.z);
    $('#matSide').val(val._TextureCF.side);
    $('#matTransp').val(val._TextureCF.transp);
    $('#matOpac').val(val._TextureCF.opac);
    $('#matRcvS').val(val._TextureCF.rcvsh);
    $('#matCastS').val(val._TextureCF.castsh);
    $('#mrotation').val(val._TextureCF.rotation);
    $('#matColor').val(val._TextureCF.color);
    $('#repeatx').val(val._TextureCF.repeat.x);
    $('#repeaty').val(val._TextureCF.repeat.y);
    $('#offsetx').val(val._TextureCF.offset.x);
    $('#offsety').val(val._TextureCF.offset.y);
    $('#centerx').val(val._TextureCF.center.x);
    $('#centery').val(val._TextureCF.center.y);

    if (val._shape != null) {//Is Physic Object
      ENGINE.TILE.updPhisicObj(val);
    }
    ENGINE.EDITORT._lockTextChange = false;
  },

  _mapClick: function (num) {
    var step = parseFloat($('#stepSize').val());
    ENGINE.EDITORT._loopVar(function (val) {
      if (val.selected == true) {
        if (val._shape != null) {//Is Physic Object
          val._OBJ3d = val._shape;
        }
        if (val._OBJ3d != null) {//---OBJECT3d
          if (num == 1) { //y+         
            val._OBJ3d.position.y += step;
          }
          if (num == 2) {  //z+        
            val._OBJ3d.position.z += step;
          }
          if (num == 3) {  //rotate       
            var axisR = $('#rotateAx option:selected').val();
            var currentR = parseFloat($('#rotAngle').val());
            if (currentR != 0) currentR = (Math.PI / 180) * currentR;
            if (axisR == "X") val._OBJ3d.rotateX(currentR);
            if (axisR == "Y") val._OBJ3d.rotateY(currentR);
            if (axisR == "Z") val._OBJ3d.rotateZ(currentR);
          }
          if (num == 4) {  // x+    
            val._OBJ3d.position.x += step;
          }
          if (num == 5) {  //x-     
            val._OBJ3d.position.x -= step;
          }
          if (num == 6) {  //y-      
            val._OBJ3d.position.y -= step;
          }
          if (num == 7) {  //z-      
            val._OBJ3d.position.z -= step;
          }
          if (num == 8) {  //Scale
            var axisR = $('#rotateAx option:selected').val();
            if (axisR == "X") val._OBJ3d.scale.x += step;
            if (axisR == "Y") val._OBJ3d.scale.y += step;
            if (axisR == "Z") val._OBJ3d.scale.z += step;
          }
          if (num == 9) {  //Reset
            val._OBJ3d.scale.set(1, 1, 1);
            val._OBJ3d.rotation.set(0, 0, 0);
            val._OBJ3d.position.set(
              ENGINE.EDITORT.startPosition.x,
              ENGINE.EDITORT.startPosition.y,
              ENGINE.EDITORT.startPosition.z);
          }
        }
        ENGINE.EDITORT._updateObText(val);
      }
    });
  },


  _lockTextChange: false, //------------ Modify obj pos by TextBox
  _textToObjUpd: function (edit) {
    if (ENGINE.EDITORT._lockTextChange == true) return;
    ENGINE.EDITORT._loopVar(function (val) {
      if (val.selected == true) {
        var xyz = edit.value.split(':');
        if (xyz.length == 3) {
          if (edit.id == 'objPos') {
            if (val._OBJ3d != null) { //3dobj
              val._OBJ3d.position.set(
                parseFloat(xyz[0]), parseFloat(xyz[1]), parseFloat(xyz[2]));
            } else {//physic obj
              val._Pos = {
                x: parseFloat(xyz[0]),
                y: parseFloat(xyz[1]),
                z: parseFloat(xyz[2])
              };
              ENGINE.TILE.updPhisicObj(val);
            }
          }
          if (edit.id == 'objSca') {
            if (val._OBJ3d != null) {//3dobj
              val._OBJ3d.scale.set(
                parseFloat(xyz[0]), parseFloat(xyz[1]), parseFloat(xyz[2]));
            } else { //physic obj
              val._Scale = {
                x: parseFloat(xyz[0]),
                y: parseFloat(xyz[1]),
                z: parseFloat(xyz[2])
              };
              ENGINE.TILE.updPhisicObj(val);
            }
          }
        }
        if (xyz.length == 4) {
          if (edit.id == 'objRot') {
            if (val._OBJ3d != null) {//3dobj
              val._OBJ3d.quaternion.set(
                parseFloat(xyz[0]), parseFloat(xyz[1]),
                parseFloat(xyz[2]), parseFloat(xyz[3]));
            } else {//physic obj
              val._Quat = {
                x: parseFloat(xyz[0]), y: parseFloat(xyz[1]),
                z: parseFloat(xyz[2]), w: parseFloat(xyz[3])
              };
              ENGINE.TILE.updPhisicObj(val);
            }
          }
        }
        ENGINE.EDITORT._updateObText(val);
        //if(val._shape!==null)val._OBJ3d=null;
      }
    });
  },



  _addPhisicObj: function () {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const tam = new THREE.Vector3();
    pos.set(ENGINE.EDITORT.startPosition.x,
      ENGINE.EDITORT.startPosition.y,
      ENGINE.EDITORT.startPosition.z);
    quat.set(0, 0, 0, 1);
    tam.set(1, 1, 1);
    //>>>>>>>>>>>>>>>
    var pobj = ENGINE.Physic.addPhisicBox(pos, quat, tam);
    //pobj.userData.physicsBody.setActivationState(0);
    ENGINE.EDITORT._loopVar(function (value) {
      if (value._OBJ != null) {
        value.selected = false;
      }
    });
    var obval = new ENGINE.EDITORT.variables();
    ENGINE.EDITORT.scenevarCount += 1;
    var obcount = ENGINE.EDITORT.scenevarCount;
    obval._OBJ = 'Physic' + obcount;
    obval._shape = pobj;
    obval.index = obcount;
    obval.selected = true;
    ENGINE.EDITORT.scenevar[obcount] = obval;
    ENGINE.EDITORT._updateSceneSel();
    ENGINE.EDITORT._mapClick(0);//update textbox
  },

  _updateSceneSel: function () {
    var html = '<select id="remobj" style="width:80%">';
    var remactive = false;
    html += '<option value="---" selected="true" disabled="disabled">---</option>';
    ENGINE.EDITORT._loopVar(function (value) {
      if (value._OBJ != null) {
        var file = value._OBJ;
        var index = value.index;
        if (value.selected == true) {
          html = html.replace('selected="true"', '');
          html += '<option value="' + index + '" selected="true">' +
            file + '</option>';
          remactive = true;
        } else {
          html += '<option value="' + index + '">' + file + '</option>';
        }
      }
    });
    html += '</select>';
    if (remactive == true) {
      html += '<input type="button" onClick="ENGINE.EDITORT._delOBJ();" value="DEL">';
    }
    $('#sceneobjs').html(html);
    $('#remobj').on('change', function () {
      ENGINE.EDITORT._objSel($(this).find('option:selected'));
    });
  },


  _objSel: function (opt) {
    ENGINE.EDITORT._loopVar(function (value) {
      if (value._OBJ != null) {
        value.selected = false;
        if (value.index == opt.val()) {
          value.selected = true;
          HELPER.blinkObj(value);
          if (value._OBJ3d != null) {
            HELPER.showTransform(value._OBJ3d);
          }
          if (value._shape != null) {
            //TransformControl.control.attach(value._shape);
          }
        }
      }
    });
    ENGINE.EDITORT._mapClick(0);//update textbox
  },

  _textureSel: function (img) {
    var file = $(img).attr('data-file');
    var path = $(img).attr('path');
    ENGINE.EDITORT._loopVar(function (value) {
      if (value._OBJ != null && value._OBJ3d != null && value.selected == true) {
        if (path == 'SHADER') {
          value._OBJ3d.children[0].material = SHADER.materials[file].material;
          value._Texture = 'SHADER:' + file;
        } else {
          value._Texture = ENGINE.url + path + file;
          ENGINE.TILE.addTextureToObj(value);
        }
      }
    });
  },

  _delOBJ: function () {
    ENGINE.EDITORT._loopVar(function (value) {
      if (value._OBJ != null && value.selected == true) {
        if (value._OBJ3d != null) { //3d Obj
          if (TransformControl.control.object == value._OBJ3d)
            HELPER.hideTransform();
          ENGINE.scene.remove(value._OBJ3d);
          delete (ENGINE.EDITORT.scenevar[value.index]);
          ENGINE.EDITORT._updateSceneSel();
        }
        if (value._shape != null) { //physic Obj
          //disable contact
          if (TransformControl.control.object == value._shape)
            HELPER.hideTransform();
          ENGINE.Physic.removeObj(value._shape);
          delete (ENGINE.EDITORT.scenevar[value.index]);
          ENGINE.EDITORT._updateSceneSel();
        }
      }
    });
  },

  _addOBJ: function () {//Add select OBJ3D to scene  
    ENGINE.EDITORT._loopVar(function (value) {
      if (value._OBJ != null) {
        value.selected = false;
      }
    });
    var objsel = $('#addobj option:selected').val();
    if (typeof (objsel) == 'undefined') return;
    var obval = new ENGINE.EDITORT.variables();
    ENGINE.EDITORT.scenevarCount += 1;
    var obcount = ENGINE.EDITORT.scenevarCount;
    obval._OBJ = objsel;
    obval.index = obcount;
    obval.selected = true;
    ENGINE.EDITORT.scenevar[obcount] = obval;
    ENGINE.EDITORT._updateSceneSel();
    ENGINE.TILE.addObjToScene(obval, function (obj) {
      //if(ENGINE.EDITORT.noControls==false)
      HELPER.showTransform(obj);
    });

  },

  _loopVar: function (callback) {
    if (typeof (callback) == 'function') {
      for (var i = 0; i < ENGINE.EDITORT.scenevar.length; i++) {
        if (typeof (ENGINE.EDITORT.scenevar[i]) == 'object')
          callback(ENGINE.EDITORT.scenevar[i]);
      }
    }
  },

  noupdatetextures: true,
  _tabSelect: function (num) {
    noupdatetextures = true;
    //sceneobjs - avaiaobjs
    if (num == 1) { //LOAD 3d OBJECTS
      $('#avaiaobjs').load(ENGINE.url + 'GETMODELS', function () {
        $('#avaiaobjs').html($('#avaiaobjs').html() +
          `<input type="button" 
        onClick="ENGINE.EDITORT._addOBJ();" value="ADD">`)
      });
      ENGINE.EDITORT._updateSceneSel();
      ENGINE.EDITORT._loopVar(function (val) {
        if (val.selected == true && val._OBJ3d != null) {
          HELPER.showTransform(val._OBJ3d);
        }
      });
    } else {
      HELPER.hideTransform();
    }
    if (num == 2) {//TEXTURES
      //list shader materials
      $('#avaiatextures').load(ENGINE.url + 'GETTEXTURES', function () {
        $(this).html(
          `<img src="./images/material.png" title="LAVA" data-file="LAVA" path="SHADER" onclick="ENGINE.EDITORT._textureSel(this);">
        <img src="./images/material.png" title="OCEAN" data-file="OCEAN" path="SHADER" onclick="ENGINE.EDITORT._textureSel(this);">
        <img src="./images/material.png" title="WATER" data-file="WATER" path="SHADER" onclick="ENGINE.EDITORT._textureSel(this);">
        `+ $(this).html());
      });

      ENGINE.EDITORT._loopVar(function (val) {
        if (val.selected == true && val._OBJ3d != null && val._Texture != null) {
          ENGINE.EDITORT._updateObText(val);
        } else {
        }
      });
    }
    if (num == 3) {//SAVE LOAD
      $('#loadas').load(ENGINE.url + 'GETTILENAMES');
    }
    if (num == 11) {//Texture Options
      noupdatetextures = false;
      $('#Ttabs-2control input,select').each((index, input) => {
        $(input).off('change').on('change', () => {
          ENGINE.EDITORT._applyTextureChanges();
        })
      })
    }
    if (num == 12) {//ShaderList      
      ENGINE.EDITORT._loopVar(function (val) {
        if (val.selected == true && val._OBJ3d != null) {
          var html = '<br>';
          SHADER.passes.forEach((elem) => {
            var checked = typeof (val._Shader[elem.name]) == 'undefined' ? '' : 'checked';
            html += '<p class="pSpace">' + elem.name + ':</p>';
            html += '<input type="checkbox" ' + checked + ' name="' + elem.name + '" id="shader' +
              elem.layer + '" onClick="ENGINE.EDITORT._shaderSel(this);"/><br>';
          });
          $('#shaderlist').html(html);
        }
      });


    }
  },

  _shaderSel: function (chk) {
    //ENGINE.EDITORT.scenevar[0]._Shader[11]='Bloom';
    var name = $(chk).attr('name');
    var layer = parseInt($(chk).attr('id').replace('shader', ''));
    var onoff = $(chk).is(":checked");
    ENGINE.EDITORT._loopVar(function (val) {
      if (val.selected == true && val._OBJ3d != null) {
        if (onoff == true) {
          if (val._OBJ3d.isMesh) { val._OBJ3d.layers.enable(layer); }
          if (typeof (val._OBJ3d.children) !== 'undefined' && val._OBJ3d.children[0].isMesh) {
            val._OBJ3d.children[0].layers.enable(layer);
          }
          val._Shader[name] = layer;
        } else {
          if (val._OBJ3d.isMesh) { val._OBJ3d.layers.disable(layer); }
          if (typeof (val._OBJ3d.children) !== 'undefined' && val._OBJ3d.children[0].isMesh) {
            val._OBJ3d.children[0].layers.disable(layer);
          }
          delete val._Shader[name];
        }
      }
    });
  },


  _loadModel: function (button) {
    $('#file').change(function () {
      var url = ENGINE.url + ENGINE.conf.dir.upload + '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
      HELPER.uploadModel(url, button, function (response) {
        if (response != 0) {
          alert('File Uploaded');
          if (typeof (FILEUPLOADED) == 'function') {
            FILEUPLOADED();
            FILEUPLOADED = undefined;
          }
        }
      });//onHelper
    });
    $('#file').click();//btuploadmodel        
  },


  _loadTile: function (button) {
    //downloadData(url,button,name,callback
    var name = $('#loadasel option:selected').val();
    if (name == '---') return;
    //$('#saveas').val(name);
    var url = ENGINE.url + 'LOADTILE' + name;
    //noControls=true;
    HELPER.downloadData(url, button, function (data) {
      ENGINE.clear();
      ENGINE.EDITORT._configureBaseView();//initial configuration       
      ENGINE.EDITORT.position = ENGINE.EDITORT._tileditoOBJ.position;
      ENGINE.TILE.jsonToTileEditor(ENGINE.EDITORT, data);
      ENGINE.EDITORT.show(true, name);
      setTimeout(() => {
        ENGINE.EDITORT._loopVar(function (val) {
          if (val.selected == true) {
            //if (val._OBJ3d != null) HELPER.showTransform(val._OBJ3d);
            //if (val._shape != null) HELPER.showTransform(val._shape);
          }
        });
      }, 500);

      //ENGINE.EDITORT.noControls=false;
    });
  },

  _saveTile: function (button) {
    var nome = $('#saveas').val();
    if (nome.length < 4) {
      alert('Invalid Name');
      return;
    }
    var jsonv = "";
    var jsona = [];
    ENGINE.EDITORT._loopVar(function (val) {
      var xscale = val._Scale;
      if (val._shape !== null) {
        xscale = {
          x: val._shape.geometry.parameters.width,
          y: val._shape.geometry.parameters.height,
          z: val._shape.geometry.parameters.depth
        }
      }
      val._Attached=HELPER.boneatachedClean(val._Attached);
      var item = new ENGINE.EDITORT.variables();
      HELPER.updateArray(item, val);
      //item._Pos = xpos;
      item._Scale = xscale;
      item._OBJ3d = val._shape == null ? true : false;
      item._shape = null;
      jsona.push(item);
    });
    jsonv = JSON.stringify({ name: nome, elements: jsona });
    var url = ENGINE.url + ENGINE.conf.dir.upload + '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
    HELPER.uploadData(url, button, 'SAVETILE', jsonv, function () {
      ENGINE.EDITORT._tabSelect(3);
    });
  }


}