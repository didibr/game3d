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
  scene2: null,
  camera2:null,
  renderer: null,
  rayintersects: [],
  onRender: null, //function callback
  textureLoader: new THREE.TextureLoader(),
  raycaster: new THREE.Raycaster(),
  mousePos: new THREE.Vector2(),
  mouseSprite: null,
  clock: null,
  delta: 0,
  controls: CREATECONTROLS.create(),
  programs: new Array(),
  itemCache: new Array(), //Cache itens loaded in bones to clear
  ortho:{
    cursor:null,
    cursorGroup:null,
  },


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
      //######### REMOVES SELFREMOVE ####################     
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
      //######### CURSOR FOLOW ################
      if (this.ortho.cursorGroup != null) {
        var cbound = this.canvObj.getBoundingClientRect();
        /*var cw = ((((cbound.right - cbound.left) * +(this.mousePos.x)) + (cbound.right - cbound.left)) / 2) + 
        cbound.left;
        var ch = ((((cbound.bottom - cbound.top) * -(this.mousePos.y)) + (cbound.bottom - cbound.top)) / 2) + 
        cbound.top;
        $('#cursor').css({ 'left': cw + 'px', 'top': ch + 'px' })*/
        //var div=ENGINE.canvObj.width*ENGINE.canvObj.height;
        var cx=(this.canvObj.width/600)*this.mousePos.x;
        var cy=(this.canvObj.height/600)*this.mousePos.y;
        this.ortho.cursorGroup.position.set(cx,cy,this.ortho.cursorGroup.position.z);
      }


      if (ENGINEOBJ.CAM._camupdate !== null) ENGINEOBJ.CAM._camupdate(delta);
      ENGINE.Light.update(delta);
      ENGINEOBJ.Physic.updatePhysics(delta);
      SHADER.update(ENGINEOBJ, delta);
      ANIMATED.update(delta);
      ENGINEOBJ.raycaster.setFromCamera(ENGINEOBJ.mousePos, ENGINEOBJ.camera);
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
      if (obj[key] && obj[key] != null && typeof obj[key].dispose === 'function') {
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

  
  mouseShow:function(cursor){    
    ENGINE.scene2.clear();
    if(typeof(cursor)=='undefined' || cursor==null){
      $('*').css({cursor:"default"});
    }else{    
      $('*').css({cursor:"none"}); 
      this.ortho.cursorGroup=new THREE.Group();
      const texture=LOADER.textureLoader.load( "./images/"+cursor);				
      const material = new THREE.SpriteMaterial( { map: texture } );
      this.ortho.cursor = new THREE.Sprite( material );
      this.ortho.cursorGroup.add(this.ortho.cursor);
      this.ortho.cursorGroup.scale.set(0.07,0.07,1);
      this.ortho.cursorGroup.position.z=-0.01;
      this.ortho.cursor.position.set(0.5,-0.5,0);
      ENGINE.scene2.add(this.ortho.cursorGroup); 
    }        
  },


  create: function (url, divObj, width, height, callback) {
    ENGINE.url = url;
    if (typeof (width) == 'undefined' || typeof (height) == 'undefined') {//fullsreem
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
        //### 3d ###
        ENGINE.scene = new THREE.Scene();
        ENGINE.camera = new THREE.PerspectiveCamera(
          45,
          width / height,
          0.1,
          5000
        );
        ENGINE.camera.up = new THREE.Vector3(0, 1, 0);
        ENGINE.camera.position.x = 0;
        ENGINE.camera.position.y = 0;
        ENGINE.camera.position.z = 0;
        ENGINE.camera.lookAt(new THREE.Vector3(0, 0, -1));
        //### 2d #
        ENGINE.scene2 = new THREE.Scene();
        ENGINE.scene2.background=null;
        ENGINE.camera2 = //new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
        new THREE.PerspectiveCamera( 35, width / height, 0.1, 100 );				
				ENGINE.camera2.position.z = 1.78;
        //### renderer
        ENGINE.renderer = new THREE.WebGLRenderer({ antialias: false });
        ENGINE.renderer.alpha=true;
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
        ENGINE.renderer.autoClear = false;
        ENGINE.renderer.preserveDrawingBuffer=true;
        THREE.Cache.enabled = true;
        ENGINE.canvObj = ENGINE.renderer.domElement;
        ENGINE.divObj[0].appendChild(ENGINE.canvObj);
        // window.addEventListener('mousemove', ENGINE._onMouseMove, false);
        $(window).off("mousemove").on("mousemove", ENGINE._onMouseMove);
        $(window).off("keydown").on("keydown", ENGINE._onKeyDown);
        $(window).off("resize").on("resize", ENGINE._onWindowResize );
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
    ENGINE.GAME._fullloaded = false;
    ENGINE.GAME._completeloaded = false;
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

  adminPopup: function () {
    ENGINE.DIALOG.reset();
    var data = `
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
    ENGINE.DIALOG.popup(data, 'Editor', true);
  },

  _onWindowResize:function(){
    console.log('Resize');
    const width = ENGINE.divObj.width();
    const height = ENGINE.divObj.height();
    ENGINE.camera.aspect = width / height;
    ENGINE.camera.updateProjectionMatrix();    
    ENGINE.camera.updateProjectionMatrix();     
    ENGINE.renderer.setSize( width, height );    

    //ENGINE.camera2.left = - width / 2;
    //ENGINE.camera2.right = width / 2;
    //ENGINE.camera2.top = height / 2;
    //ENGINE.camera2.bottom = - height / 2;
    ENGINE.camera2.aspect = width / height;    
    ENGINE.camera2.updateProjectionMatrix();    
    if(ENGINE.GAME._cssrender){
      ENGINE.GAME._cssrender.setSize( width, height ); 
      $(ENGINE.GAME._cssrender.domElement).css('left',ENGINE.canvObj.offsetLeft+'px');
      $(ENGINE.GAME._cssrender.domElement).css('top',ENGINE.canvObj.offsetTop+'px');
    }        
    $('#playdiv').css('left','');
  },

  _onKeyDown: function (event) {
    if (event.code == 'KeyZ' && (event.ctrlKey || event.metaKey)) {
      ENGINE.adminPopup();
    }
  },

  _onMouseMove: function (event) {
    // calculate mouse position in normalized device coordinates
    var cbound = ENGINE.canvObj.getBoundingClientRect();
    ENGINE.mousePos.x =
      ((event.clientX - cbound.left) / (cbound.right - cbound.left)) * 2 - 1;
    ENGINE.mousePos.y =
      -((event.clientY - cbound.top) / (cbound.bottom - cbound.top)) * 2 + 1;
  },

}