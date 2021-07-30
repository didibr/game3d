//Extra GEARS loaded on gear Directory
var ENGINE = {
  //loading:false,
  debugRay: false,
  url: "./",
  conf: null,
  login: '',
  pass: '',
  divObj: null,//Objeto Div contem o canvas
  canvObj: null,//Objeto Canvas na pagina
  scene: null,
  camera: null,
  renderer: null,
  rayintersects: [],
  onRender: null, //function callback
  textureLoader: new THREE.TextureLoader(),
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  clock: null,
  delta: 0,
  controls: CREATECONTROLS.create(),
  programs: new Array(),
  itemCache: new Array(), //Cache itens loaded in bones to clear

  debugobjcts: function () {
    ENGINE.intersects = ENGINE.raycaster.intersectObjects(ENGINE.scene.children, true);
    if (ENGINE.debugRay !== true) return;
    for (var i = 0; i < ENGINE.scene.children.length; i++) {
      var active = ENGINE.scene.children[i];
      if (typeof (active.group) != "undefined") {
        switch (active.group.name) {
          case "Tile":
            if (typeof (active.material) !== 'undefined' && typeof (active.material.emissive) !== 'undefined')
              active.material.emissive.g = 0;
            break;
          case "Model":
            active.children.forEach(function (acb) {
              if (acb.group.name == "ModelMesh")
                if (typeof (acb.material) !== 'undefined' && typeof (acb.material.emissive) !== 'undefined')
                  acb.material.emissive.g = 0;
            });
            break;
        }
      }
    }
    for (var e = 0; e < ENGINE.intersects.length; e++) {
      var intercept = ENGINE.intersects[e].object;
      if (typeof (intercept.group) != "undefined") {
        //console.log(intercept.group.name);
        switch (intercept.group.name) {
          case "Tile":
            if (typeof (intercept.material) !== 'undefined' && typeof (intercept.material.emissive) !== 'undefined')
              intercept.material.emissive.g = 0.1;
            break;
          case "ModelMesh":
            if (typeof (intercept.material) !== 'undefined' && typeof (intercept.material.emissive) !== 'undefined')
              intercept.material.emissive.g = 0.1;
            break;
        }
      }
    }
  },



  renderScene: function (ENGINEOBJ) {
    if (ENGINEOBJ.clock != null && typeof (ENGINEOBJ.clock) != 'undefined') {
      delta = ENGINEOBJ.clock.getDelta();
      //Remove Objects Tagued as selfremove=true
      /*
      for (var i = 0; i < ENGINE.scene.children.length; i++) {
        if (typeof (ENGINE.scene.children[i].selfremove) !== "undefined" &&
          ENGINE.scene.children[i].selfremove == true) {
          ENGINE.scene.remove(ENGINE.scene.children[i]);
        }
      }
      */
      var removeobjects = new Array();
      if (typeof (ENGINEOBJ) !== 'undefined' &&
        typeof (ENGINEOBJ.scene) !== 'undefined' && typeof (ENGINEOBJ.scene.traverse) == 'function')
        ENGINEOBJ.scene.traverse(function (objeto) {
          if (typeof (objeto.selfremove) !== "undefined" && objeto.selfremove == true) {
            //if(typeof (objeto.parent)!=='undefined'){
            removeobjects.push(objeto);
            //}
          }
        });
      for (var i = 0; i < removeobjects.length; i++) {
        if (removeobjects[i].parent && removeobjects[i].parent !== null)
          removeobjects[i].parent.remove(removeobjects[i]);
        ENGINEOBJ.clearObj(removeobjects[i]);
      }

      if (ENGINEOBJ.CAM._camupdate !== null) ENGINEOBJ.CAM._camupdate(delta);
      ENGINE.Light.update(delta);
      ENGINEOBJ.Physic.updatePhysics(delta);
      SHADER.update(ENGINEOBJ, delta);
      ANIMATED.update(delta);
      ENGINEOBJ.raycaster.setFromCamera(ENGINEOBJ.mouse, ENGINEOBJ.camera);
      ENGINEOBJ.debugobjcts();
      ENGINE.GAME.update(delta);
      if (typeof (onRender) == 'function') onRender(delta);
    } else {
      ENGINEOBJ.clock = new THREE.Clock();
    }
  },

  clearObj: function (obj) {
    Object.keys(obj).forEach((key) => {
      // Recursively call dispose() if possible.
      if (obj[key] && obj[key]!=null && typeof obj[key].dispose === 'function') {
        obj[key].dispose();
      }
      obj[key] = null;
    });
  },

  //------------CREATE
  showLoading: function (value) {
    if (value == true) {
      //ENGINE.renderer.setClearColor(new THREE.Color('#000000'));
      ENGINE.divObj.prepend(
        '<img id="loading" src="/images/loading.gif" style="position: absolute;"/>');
    } else {
      //ENGINE.renderer.setClearColor(new THREE.Color(ENGINE.bgCOLOR));
      $('#loading').remove();
    }
  },


  create: function (url, divObj, width, height, callback) {
    ENGINE.url = url;
    if(typeof(width)=='undefined' || typeof(height)=='undefined'){//fullsreem
      width = document.body.clientWidth;
      height = document.body.clientHeight;
    }
    HELPER.simpleDownload(url + 'CONFIG', (data) => {
      if (data) {
        ENGINE.conf = data;
        ENGINE._ammoCreate(divObj, width, height, callback);
      } else {
        ENGINE.DIALOG.popup('<br><br><b>Fail to Contact Server</b>', 'Not Connected');
      }
    })
  },

  _ammoCreate: function (divObj, width, height, callback) {
    SHADERES.load();//PRELOADERS       
    var ENGINE = this;
    divObj.html('');
    divObj.css('width', width + 'px');
    divObj.css('height', height + 'px');
    //$('#myc').css({ 'opacity' : 0 });
    Ammo().then(
      function (AmmoLib) {
        Ammo = AmmoLib;//Ammo Loaded
        ENGINE.divObj = divObj;
        ENGINE.clock = new THREE.Clock();
        ENGINE.scene = new THREE.Scene();
        ENGINE.camera = new THREE.PerspectiveCamera(
          45,
          width / height,
          0.1,
          5000
        );
        ENGINE.camera.up = new THREE.Vector3(0, 1, 0);
        ENGINE.renderer = new THREE.WebGLRenderer({ antialias: false });
        ENGINE.renderer.setPixelRatio(window.devicePixelRatio);
        //ENGINE.renderer.setClearColor( new THREE.Color(null) );
        //Create a WebGLRenderer and turn on shadows in the renderer
        ENGINE.renderer.shadowMap.enabled = true;
        ENGINE.renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;
        ENGINE.renderer.toneMapping = THREE.LinearToneMapping;//THREE.ACESFilmicToneMapping;
        ENGINE.renderer.setSize
          (
            width,
            height
          );
        //ENGINE.renderer.autoClear = false;
        THREE.Cache.enabled = true;
        ENGINE.camera.position.x = 0;
        ENGINE.camera.position.y = 0;
        ENGINE.camera.position.z = 0;
        ENGINE.camera.lookAt(new THREE.Vector3(0, 0, -1));
        ENGINE.canvObj = ENGINE.renderer.domElement;
        ENGINE.divObj[0].appendChild(ENGINE.canvObj);
       // window.addEventListener('mousemove', ENGINE._onMouseMove, false);
        $(window).off("mousemove").on("mousemove", ENGINE._onMouseMove);
        $(window).off("keydown").on("keydown", ENGINE._onKeyDown);
        requestAnimationFrame(ENGINE.onUpdate); //timer update delta
        //INITIALIZERS
        ENGINE.Physic.initPhysics(); //initialize physics
        SHADER.create(); //initialize shaders
        TransformControl.create();  //Create Editor Controls
        if (typeof (callback) == "function") { callback(); }
      }
    );
  },


  onUpdate: function () {
    ENGINE.renderScene(ENGINE);
    requestAnimationFrame(ENGINE.onUpdate);
  },




  clear: function () {
    $('#playdiv').hide();
    ENGINE.GAME._fullloaded= false;
    ENGINE.GAME._completeloaded= false;
    HELPER.hideTransform();
    ENGINE.EDITORM._tiles = null;
    ENGINE.EDITORM._tileselected = null;
    ENGINE.EDITORT.scenevar = [];
    ENGINE.EDITORT.scenevarCount = -1;
    ENGINE.debugRay = false;
    ENGINE.Physic.clear();
    ENGINE.Physic.debugPhysics = false;
    ENGINE.Light.lights = [];
    ANIMATED.clear();
    HELPER.stopAudios();
    for (var i = 0; i < ENGINE.itemCache.length; i++)
      if (ENGINE.itemCache[i].parent) ENGINE.itemCache[i].parent.remove(ENGINE.itemCache[i]);

    var elec = ENGINE.scene.children.length - 1;
    for (var i = elec; i >= 0; i--) { //inverse loop
      var obj = ENGINE.scene.children[i];
      //if (typeof (elem.type) !== "undefined" && elem.type == 'Group'
      if (typeof (obj.userData) !== "undefined"
        && typeof (obj.userData.physicsBody) !== "undefined") {
        ENGINE.Physic.removeObj(obj);
      } else {
        //ENGINE.scene.remove(obj);        
      }
    }

    //if (ENGINE.scene.children && ENGINE.scene.children.length > 0)
    /*
    ENGINE.scene.traverse(function (obj) {
      if (obj.geometry)
        obj.geometry.dispose();
      if (obj.material)
        obj.material.dispose();
      if (obj.mesh)
        obj.mesh.dispose();
      if (obj.texture)
        obj.texture.dispose();
    });
    */
    ENGINE.clearThree(ENGINE.scene);

  },



  clearThree: function (obj) {
    while (obj.children.length > 0) {
      ENGINE.clearThree(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    if (obj.geometry) obj.geometry.dispose();

    if (obj.material) {
      //in case of map, bumpMap, normalMap, envMap ...
      Object.keys(obj.material).forEach(prop => {
        if (!obj.material[prop])
          return;
        if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
          obj.material[prop].dispose();
      })
      obj.material.dispose();
    }
  },

  adminPopup:function(){
    ENGINE.DIALOG.reset();
    var data=`
    <div id="EEDITOR">
    <br>Engine Editor<br><br>
    <input type="button" value="Object" onclick="ENGINE.EDITORT.show();" />    
    <input type="button" value="Item" onclick="ENGINE.ITEM.show();" />  
    <input type="button" value="Sound" onclick="ENGINE.SOUND.show();" />
    <br><br> 
    <input type="button" value="Entity" onclick="ENGINE.ENTITY.show();" />       
    <input type="button" value="Map" onclick="ENGINE.EDITORM.show();" />        
    <input type="button" value="CONF" onclick="ENGINE.ADM.show();" />     
    </div>
    `;
    ENGINE.DIALOG.popup(data,'Editor',true);
  },

  _onKeyDown: function (event) {
    if (event.code == 'KeyZ' && (event.ctrlKey || event.metaKey)) {
      ENGINE.adminPopup();
    }
  },

  _onMouseMove: function (event) {
    // calculate mouse position in normalized device coordinates
    var cbound = ENGINE.canvObj.getBoundingClientRect();
    ENGINE.mouse.x =
      ((event.clientX - cbound.left) / (cbound.right - cbound.left)) * 2 - 1;
    ENGINE.mouse.y =
      -((event.clientY - cbound.top) / (cbound.bottom - cbound.top)) * 2 + 1;
  },

}