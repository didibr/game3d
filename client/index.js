var startCONFIG={ //Initial configuration for browser
  websock_secure : true,
  default_login  : 'didi',
  default_pass   : '1234'  
}

var starter = setInterval(function () { //waiting shadders loaded
  if (typeof (SHADER) !== "undefined") {
    clearInterval(starter);
    jsload();
  }
}, 1000);


function jsload() {
  function loadJS(e) {
    var t = document.createElement("script"); t.async = false;
    t.src = e, document.getElementsByTagName("head")[0].appendChild(t)
  }
  loadJS('https://code.jquery.com/jquery-3.5.1.js');
  loadJS('https://code.jquery.com/ui/1.12.1/jquery-ui.js');
  //loadJS('js/build/three.js');
  loadJS('js/build/ammo.js');
  //xxxloadJS('js/build/three.module.js');
  //xxxloadJS('js/engine/postmodule.js');
  //loadJS('js/animation/MMDAnimationHelper.js');
  //loadJS('js/animation/MMDPhysics.js');
  //loadJS('js/animation/CCDIKSolver.js');
  //loadJS('js/loader/MMDLoader.js');
  //loadJS('js/loader/mmdparser.js');
  //loadJS('js/loader/TGALoader.js');
  loadJS('js/engine/socket.js');
  //loadJS('zip.js');  
  loadJS('js/engine/helper.js');
  loadJS('js/engine/xshader.js');
  loadJS('js/engine/engine.js');  
  loadJS('js/engine/gear/light.js');
  loadJS('js/engine/gear/camera.js');
  loadJS('js/engine/gear/physic.js');
  loadJS('js/engine/gear/tile.js');
  loadJS('js/engine/gear/dialog.js');
  loadJS('js/engine/gear/editort.js');
  loadJS('js/engine/gear/editorm.js');
  loadJS('js/engine/gear/item.js');
  loadJS('js/engine/gear/entity.js');
  loadJS('js/engine/gear/sound.js');
  loadJS('js/engine/gear/adm.js');  
  loadJS('js/engine/game.js');
  starter = setInterval(function () {
    console.log('waiting engine');
    if (typeof ($) !== "undefined" && typeof (ENGINE) !== "undefined") {
      clearInterval(starter);
      $(document).ready(function () {
        firstLoad();
      });
    }
  }, 1000);
}


function firstLoad() {
  $(document).tooltip({ track: true });
  SOCKET.secure=startCONFIG.websock_secure;
  ENGINE.login=startCONFIG.default_login;ENGINE.pass=startCONFIG..default_pass;
  //ENGINE.create('http://192.168.0.2/',$('#myc'), 600, 340);
  var myul=window.location.href.replace('index.html','');
  ENGINE.create(myul,$('#myc'),600,340,()=>{
    $('#myc').append(
      `<div id="playdiv" align=center style="color:white;position: absolute;left: 50%;top: 50%;">          
      <br><input type="button" value="Play" onclick="ENGINE.GAME.play();" />  
      <br><i style="color: #5f6c7b;font-size: 12px;">
        Working on progress...</i></div>`
      );
      $('#playdiv').css('left',
      parseInt(parseInt($('#playdiv').css('left'))-($('#playdiv').width()/2))+'px'
      )
  });  
  $('#test').prop("disabled", false);
  console.log('Engine Loaded');  
}



function ob3D() {
  var OBJFile = './models/3d.obj';
  var MTLFile = './models/3d.mtl';
  var JPGFile = './textures/extra/teste.png';
  var texture = new THREE.TextureLoader().load(JPGFile);
  //var materials = LOADER.mttlLoader.load(MTLFile,function(mtl){});
  //materials.preload();
  var object = LOADER.objLoader.load(OBJFile, function (obj) {
    obj.traverse(function (child) {
      if (child.isMesh) child.material.map = texture;
    });
    //object.position.y = - 95;
    obj.position.set(0, 0, 0);
    ENGINE.scene.add(obj);
  });
  //object.setMaterials(materials);
  /*
    object.traverse(function (child) {   // aka setTexture
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
      }
    });
    */
  //ENGINE.scene.add(object);
}

var cube;
function createCubeTest() {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const tam = new THREE.Vector3();
  pos.set(25, 25, 25);
  quat.set(0, 0, 0, 1);
  tam.set(1, 1, 1);
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5));
  shape.setMargin(0.5);
  ENGINE.Physic.createRigidBody(cube, shape, 0.1, pos, quat);
  cube.castShadow = true;
  cube.receiveShadow = true;
}

var sphere;
function createSphereTest() {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const tam = new THREE.Vector3();
  pos.set(0, 4, -2);
  quat.set(0, 0, 0, 1);
  tam.set(0.5, 0.5, 0.5);
  const geometry = new THREE.SphereGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  sphere = new THREE.Mesh(geometry, material);
  const shape = new Ammo.btSphereShape(tam.x * 0.5);
  shape.setMargin(0.5);
  ENGINE.Physic.createRigidBody(sphere, shape, 0.1, pos, quat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
}


function customForm() {
  ENGINE.EDITORT.position = ENGINE.EDITORT._tileditoOBJ.position;
  const extrudeSettings = { depth: 1, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
  const sqLength = 2;
  const squareShape = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, sqLength)
    .lineTo(sqLength, sqLength)
    .lineTo(sqLength, 0)
    .lineTo(0, 0);
  var wall = ENGINE.TILE.creteCustomWall(ENGINE.EDITORT, squareShape, extrudeSettings);
  return wall;
}


var rp = null;
var pp = null;
function criaPP() {
  var width = 10
  var height = 10;
  const separator = 0.5;
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const tam = new THREE.Vector3();
  pos.set(0, (height / 2) + separator, 0);
  quat.set(0, 0, 0, 1);
  tam.set(width, height, 1);
  //var material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  LOADER.objLoader.load('./textures/obj/3d.obj', (root) => {
    root.position = pos;
    ENGINE.textureLoader.load("./textures/models/k.png", function (texture) {
      //var material = new THREE.MeshLambertMaterial( { map: texture } );
      //PP = new THREE.Mesh( root, material );
      //ENGINE.scene.add(PP);
      //console.log(texture,root);
      rp = root;
      //pp=texture;
      rp.children[0].material.map = texture;
      rp.children[0].material.transparent = true;
      ENGINE.scene.add(rp);

    });
  });
}

