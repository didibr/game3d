///#################################
///################# TILEDITOR
///#################################
ENGINE.TILE = {
  width: 10,
  height: 10,
  separator: 0.5,
  //_baseTile: null,

  show: function () {
  },
  close: function () {
  },

  creteCustomWall: function (CALLER, shape, extrudeSettings, extraX, extraY, extraZ) {
    if (typeof (extraX) == 'undefined') extraX = 0;
    if (typeof (extraY) == 'undefined') extraY = 0;
    if (typeof (extraZ) == 'undefined') extraZ = 0;
    var tpos = CALLER.position;
    if (typeof (CALLER.scenevar) == 'undefined') {
      CALLER.scenevar = [];
      CALLER.scenevarCount = -1;
    }
    var group = new THREE.Group();
    var geometry = new THREE.ShapeGeometry(shape);
    geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    var material=new THREE.MeshPhongMaterial({ color: 'blue' });
    var mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    group.position.set(tpos.x + extraX, tpos.y + extraY, tpos.z + extraZ);
    group['group'] = { name: 'model', file: 'Custom' };
    
    var obval = new ENGINE.EDITORT.variables();
    CALLER.scenevarCount += 1;
    obval.index = CALLER.scenevarCount;
    obval.selected = true;
    obval._OBJ = 'Custom';
    obval._Pos = {
      x: group.position.x,
      y: group.position.y,
      z: group.position.z
    };
    obval._OBJ3d = group;
    CALLER.scenevar.push(obval);
    ENGINE.scene.add(group);
    return group;
  },

  createTiles: function (width, height, cells, rows) {
    //if (this._baseTile != null) ENGINE.scene.remove(this._baseTile);
    var pos = new THREE.Vector3();
    const separator = 0.5;
    var baseTile = Array.from(Array(cells), () => new Array(rows));
    for (var i = 0; i < cells; i++) {
      for (var e = 0; e < rows; e++) {
        pos.x = (width * i) + separator;
        pos.z = (height * e) + separator;
        var tile = ENGINE.TILE._createSingleTile(width, height, pos);
        tile.group.square = i + 'x' + e;
        //texture.wrapS = THREE.RepeatWrapping;
        //texture.wrapT = THREE.RepeatWrapping;
        //texture.repeat.set(40, 40);
        baseTile[i][e] = tile;
      }
    }
    return baseTile;
  },

  getTileByXY: function (x, y) {
    var xy = x + 'x' + y;
    var scenec = ENGINE.scene.children;
    for (var i = 0; i < scenec.length; i++) {
      if (typeof (scenec[i].group) !== 'undefined' && typeof (scenec[i].group.square) !== 'undefined') {
        if (scenec[i].group.square == xy) return scenec[i];
      }
    }
    return null;
  },

  _createSingleTile: function (width, height, pos) {
    //const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const tam = new THREE.Vector3();
    //pos.set(0, 0, 0);
    quat.set(0, 0, 0, 1);
    tam.set(width, 1, height);
    var material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    material.transparent = true;
    const texture = ENGINE.textureLoader.load(ENGINE.url+"images/ground/x.png");
    //"./textures/grid.png"
    var basebox = new THREE.BoxGeometry(tam.x, tam.y, tam.z, 1, 1, 1);
    var ammosize = new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5);
    var tile = new THREE.Mesh(basebox, material);
    var shape = new Ammo.btBoxShape(ammosize);    
    shape.setMargin(0.5);
    ENGINE.Physic.createRigidBody(tile, shape, 0, pos, quat);
    tile.castShadow = false;
    tile.receiveShadow = true;
    //texture.wrapS = THREE.RepeatWrapping;
    //texture.wrapT = THREE.RepeatWrapping;
    //texture.repeat.set(40, 40);
    tile.material.map = texture;
    tile.material.needsUpdate = true;
    tile.group = { name: "Tile" };
    return tile;
  },


  jsonToTileEditor: function (CALLER, json, extraX, extraY, extraZ) {
    //Load Tile for EDITOR
    if (typeof (extraX) == 'undefined') extraX = 0;
    if (typeof (extraY) == 'undefined') extraY = 0;
    if (typeof (extraZ) == 'undefined') extraZ = 0;
    var tpos = CALLER.position;
    CALLER.scenevar = [];
    CALLER.scenevarCount = -1;
    for (var i = 0; i < json.length; i++) {
      for (var e = 0; e < CALLER.scenevar.length; e++) {
        if (typeof (CALLER.scenevar[e]) == 'object') {
          var value = CALLER.scenevar[e];
          if (value._OBJ != null) { value.selected = false; }
        }
      }
      //console.log(CALLER.scenevar);
      var obval = new ENGINE.EDITORT.variables();
      CALLER.scenevarCount = i;
      for (var k = 0; k < Object.keys(obval).length; k++) {
        var kname = Object.keys(obval)[k];
        if (typeof (json[i][kname]) !== 'undefined') {
          obval[kname] = json[i][kname];
        }
      }
      obval._Pos = {
        x: tpos.x + json[i]._Pos.x + extraX,
        y: tpos.y + json[i]._Pos.y + extraY,
        z: tpos.z + json[i]._Pos.z + extraZ
      };
      //obval._Scale = xscale;
      //obval._OBJ3d = val._shape == null ? true : false;
      obval._shape = null;
      obval.index = i;
      obval.selected = true;
      if (json[i]._Texture == "") obval._Texture = null;

      //obval._OBJ = json[i].obj;      
      //obval._TextureCF = json[i].textcf;      
      //obval._Quat = json[i].quat;
      //obval._Scale = json[i].scale;

      if (json[i]._OBJ3d == true) { //3dObj        
        obval._OBJ3d = null;
        obval._shape = null;
        CALLER.scenevar[i] = obval;
        ENGINE.TILE.addObjToScene(obval, function (obj) {

        });
      } else { //PhysicObj  
        obval._OBJ3d = null;
        obval._shape =
          ENGINE.Physic.addPhisicBox(obval._Pos, json[i]._Quat, json[i]._Scale);
        CALLER.scenevar[i] = obval;
        //ENGINE.EDITOR._mapClick(0);
      }

    }
  },

  addObjToScene: function (objVar, callback) {
    //console.log('var',objVar);
    if (objVar._OBJ3d == null) {
      LOADER.objLoader.load(ENGINE.url + ENGINE.conf.dir.models + 
      objVar._OBJ, function (obj) {
        if (TransformControl.control !== null)
          TransformControl.control.attach(obj);
        objVar._OBJ3d = obj;
        objVar._OBJ3d.group = { name: "Model", file: objVar._OBJ }
        objVar._OBJ3d.children.forEach(function (acb) {
          acb.group = { name: "ModelMesh" }
        });

        if (objVar._Pos == null) {
          obj.position.set(
            0,
            1,
            0);
        } else {
          obj.position.set(objVar._Pos.x, objVar._Pos.y, objVar._Pos.z);
        }
        if (objVar._Quat !== null && typeof (objVar._Quat.x) !== 'undefined') {
          obj.quaternion.set(
            objVar._Quat.x, objVar._Quat.y, objVar._Quat.z, objVar._Quat.w);
        }
        if (objVar._Scale !== null && typeof (objVar._Scale.x) !== 'undefined') {
          obj.scale.set(
            objVar._Scale.x, objVar._Scale.y, objVar._Scale.z);
        }
        if (objVar._Texture !== null) {
          ENGINE.TILE.addTextureToObj(objVar);
        } else {
          objVar._Texture = ENGINE.url + "images/base3d.png";
          ENGINE.TILE.addTextureToObj(objVar, () => { objVar._Texture = null; });
        }
        if (typeof (callback) !== 'undefined') callback(obj);
        ENGINE.scene.add(obj);
        //if (noUpdate != true) ENGINE.EDITORT._mapClick(0);//update textbox
      });
    } else {
      ENGINE.scene.add(objVar._OBJ3d);
    }
  },

  aplytexturechanges: function (objVar) {
    objVar._OBJ3d.traverse(function (child) {
      if (child.isMesh) {
        Object.keys(objVar._Shader).forEach((name) => {
          var layer = objVar._Shader[name];
          child.layers.enable(layer);
        });
        //aplica configuracao          
        child.material.side = objVar._TextureCF.side;
        child.material.transparent = objVar._TextureCF.transp == 0 ? false : true;
        child.material.opacity = objVar._TextureCF.opac;
        child.receiveShadow = objVar._TextureCF.rcvsh== 0 ? false : true;
        child.castShadow = objVar._TextureCF.castsh == 0 ? false : true;        
        if (typeof (child.material.map) !== 'undefined') {
          if (child.material.map.matrixAutoUpdate === true) {            
            child.material.map.offset.set(objVar._TextureCF.offset.x, objVar._TextureCF.offset.y);
            child.material.map.repeat.set(objVar._TextureCF.repeat.x, objVar._TextureCF.repeat.y);
            child.material.map.center.set(objVar._TextureCF.center.x, objVar._TextureCF.center.y);
            child.material.map.rotation = objVar._TextureCF.rotation;
          } else {            
            child.material.map.matrix
              .identity()
              .translate(- objVar._TextureCF.center.x, - objVar._TextureCF.center.y)
              .rotate(objVar._TextureCF.rotation)
              .scale(objVar._TextureCF.repeat.x, objVar._TextureCF.repeat.y)
              .translate(objVar._TextureCF.center.x, objVar._TextureCF.center.y)
              .translate(objVar._TextureCF.offset.x, objVar._TextureCF.offset.y)
            //child.material.map.rotation = objVar._TextureCF.rotation;
            //child.material.map.repeat.y = objVar._TextureCF.repeat.x;
            //child.material.map.repeat.x = objVar._TextureCF.repeat.y;
            //child.material.map.offset.x = objVar._TextureCF.offset.x;
            //child.material.map.offset.y = objVar._TextureCF.offset.y;
            //child.material.map.center.x = objVar._TextureCF.center.x;
            //child.material.map.center.y = objVar._TextureCF.center.y;
          }
        }
        if (typeof (child.material.color) !== 'undefined') {
          child.material.color.set(objVar._TextureCF.color);
        }
        child.material.needsUpdate = true;
      }
    });

  },

  addTextureToObj: function (objVar, callback) {
    if (typeof (objVar._Texture) == 'undefined' || objVar._Texture == null) return;
    var file = objVar._Texture;
    if (file.startsWith('SHADER:') == true) {//shader texture
      file = file.replace('SHADER:', '');
      objVar._OBJ3d.traverse(function (child) {
        if (child.isMesh) {
          child.material = SHADER.materials[file].material;
        }
      });
      ENGINE.TILE.aplytexturechanges(objVar);
      if (typeof (callback) !== 'undefined') callback();
    } else { //Image Texture
      LOADER.textureLoader.load(file, function (texture) {
        objVar._Texture = file;
        objVar._OBJ3d.traverse(function (child) {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ map: texture });                   
            //new THREE.MeshBasicMaterial({ map: texture });
            child.material.needsUpdate = true;
          }
        });
        ENGINE.TILE.aplytexturechanges(objVar);
        if (typeof (callback) !== 'undefined') callback();
      });
    }


  },

  objTrnasform: function (focus) {
    if (focus == true) return;    
    try { 
      if(typeof(ENGINE.EDITORT._tileditoOBJ)!=='undefined' && ENGINE.EDITORT._tileditoOBJ!==null)
      ENGINE.EDITORT._mapClick(0); } catch (e) { }
    try { 
      if(typeof(ENGINE.EDITORM._tempBox)!=='undefined' && ENGINE.EDITORM._tempBox!==null)
      ENGINE.EDITORM._changebox(); } catch (e) { }
  },

  physicTrnasform: function (focus) {
    function addPhisicBoxFake(pos, quat, tam) {
      var geometry = new THREE.BoxGeometry(tam.x, tam.y, tam.z);
      var pobj = new THREE.Mesh(geometry, ENGINE.Physic.physicMaterial);  
      pobj.userData.physicsBody = null;
      pobj.position.copy(pos);
      pobj.quaternion.copy(quat);
      pobj.group = { name: "PhysicBody", type: 'Fake', obs: 'Fake' };
      ENGINE.scene.add(pobj);      
      return pobj;
    }
    ENGINE.EDITORT._loopVar(function (val) {
      if (val.selected == true && val._shape != null) {
        const pos = new THREE.Vector3(val._shape.position.x, val._shape.position.y, val._shape.position.z);
        const quat = new THREE.Quaternion(
          val._shape.quaternion.x, val._shape.quaternion.y, val._shape.quaternion.z, val._shape.quaternion.w);
        const tam = new THREE.Vector3(
          (val._shape.geometry.parameters.width - 1) + val._shape.scale.x,
          (val._shape.geometry.parameters.height - 1) + val._shape.scale.y,
          (val._shape.geometry.parameters.depth - 1) + val._shape.scale.z);
        var body = val._shape.userData.physicsBody;
        var oldshape = null;
        if (focus == true) {
          if (body == null) {
            return;
          } else {
            oldshape = val._shape;
            val._shape = addPhisicBoxFake(pos, quat, tam);
            TransformControl.control.object = val._shape;
            //val._shape.group.val = val;
            oldshape.userData.physicsBody.setCollisionFlags(4);
            ENGINE.Physic.physicsWorld.removeRigidBody(oldshape.userData.physicsBody);
            oldshape.selfremove = true;
          }
        } else {
          if (body == null) {
            oldshape = val._shape;
            val._shape = ENGINE.Physic.addPhisicBox(pos, quat, tam);
            TransformControl.control.object = val._shape;
            //val._shape.group.val = val;
            oldshape.selfremove = true;
            val._OBJ3d = val._shape;
            try { ENGINE.EDITORT._mapClick(0); } catch (e) { }
            val._OBJ3d = null;
          } else {
            return;
          }
        }
      }
    });

  },


  updPhisicObj: function (val) {
    const pos = new THREE.Vector3(val._Pos.x, val._Pos.y, val._Pos.z);
    const quat = new THREE.Quaternion(
      val._Quat.x, val._Quat.y, val._Quat.z, val._Quat.w);
    const tam = new THREE.Vector3(
      (val._shape.geometry.parameters.width - 1) + val._Scale.x,
      (val._shape.geometry.parameters.height - 1) + val._Scale.y,
      (val._shape.geometry.parameters.depth - 1) + val._Scale.z);
    var body = val._shape.userData.physicsBody;
    var oldhsape = val._shape;
    body.setCollisionFlags(4);
    TransformControl.control.detach(val._shape);
    ENGINE.Physic.physicsWorld.removeRigidBody(body);
    val._shape = ENGINE.Physic.addPhisicBox(pos, quat, tam);
    if (val.selected == true && typeof (TransformControl.control) !== 'undefined') {
      TransformControl.control.attach(val._shape);
      val._shape.group.val = val;
    }
    val._OBJ3d = null;
    oldhsape.selfremove = true;

  },


  updateScenevarPositions: function (objVar, tilepos) {
    if (typeof (objVar) == "undefined") return;
    var xobj = null;
    if (objVar._OBJ3d !== null) {//3dobj
      xobj = objVar._OBJ3d;
    } else { //physics
      xobj = objVar._shape;
    }
    objVar._Pos = {
      x: xobj.position.x - tilepos.x,
      y: xobj.position.y - tilepos.y,
      z: xobj.position.z - tilepos.z
    };
    objVar._Quat = {
      x: xobj.quaternion._x,
      y: xobj.quaternion._y,
      z: xobj.quaternion._z,
      w: xobj.quaternion._w
    };
    objVar._Scale = { x: xobj.scale.x, y: xobj.scale.y, z: xobj.scale.z }
  }

}