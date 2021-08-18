export const name = 'XXX';
//import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
//import { EffectComposer } from './js/post/EffectComposer.js';
//import { RenderPass } from './js/post/RenderPass.js';
//import { AfterimagePass } from './js/post/AfterimagePass.js';
import * as THREE from '/js/build/three.module.js';
import { GUI } from '/js/build/jsm/libs/dat.gui.module.js';
import { EffectComposer } from '/js/build/jsm/postprocessing/EffectComposer.js';

//Antialiases Pass
import { FXAAShader } from '/js/build/jsm/shaders/FXAAShader.js';
//import { CopyShader } from '/js/jsm/shaders/CopyShader.js';
//import { SSAOPass } from '/js/jsm/postprocessing/SSAOPass.js';

//Base Pass
import { ShaderPass } from '/js/build/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from '/js/build/jsm/postprocessing/RenderPass.js';

//Enhanced Pass
//import { AfterimagePass } from './js/js/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from '/js/build/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from '/js/build/jsm/postprocessing/FilmPass.js';
import { HorizontalBlurShader } from '/js/build/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from '/js/build/jsm/shaders/VerticalBlurShader.js';

//txture shaders
import { Water } from '/js/build/jsm/shaders/Water.js';


//utils
import { SkeletonUtils } from '/js/build/jsm/utils/SkeletonUtils.js';
import { TransformControls } from '/js/build/jsm/controls/TransformControls.js';
import { OrbitControls } from '/js/build/jsm/controls/OrbitControls.js';
import { OBJLoader } from '/js/build/jsm/loader/OBJLoader.js';
//import { MTLLoader } from '/js/loader/MTLLoader.js';
import { FBXLoader } from '/js/build/jsm/loader/FBXLoader.js';
import { CSS2DRenderer, CSS2DObject } from '/js/build/jsm/renderers/CSS2DRenderer.js';



//var _mttlloader = new MTLLoader();
//var _objloader = new OBJLoader();
//var _textureloader = new THREE.TextureLoader();
window.THREE = THREE;
var audioListener = null;
window.CONTROLS = null;

window.RENDERER={
  css:function(obj){
    return new CSS2DObject( obj );
  },
  renderer:CSS2DRenderer
}

window.LISTENER = async () => {
  if (typeof (audioListener) == 'undefined' || audioListener == null) {
    audioListener = new THREE.AudioListener();
    audioListener.setMasterVolume(0);
    ENGINE.camera.add(audioListener);
    //console.log('create listener');
    return audioListener;
  }
  //console.log('using exitent listener');
  return audioListener;
};

window.CREATECONTROLS = {
  create: function () {
    class ControlDispatcher extends THREE.EventDispatcher { };
    CONTROLS = new ControlDispatcher();
  }
}

window.LOADER = {
  audioLoader: new THREE.AudioLoader(),
  objLoader: new OBJLoader(),
  //mttlLoader: _mttlloader,
  textureLoader: new THREE.TextureLoader(),
  fbxloader: new FBXLoader(),
  fontloader: new THREE.FontLoader()
}

window.OrbitControl = {
  create: function (camera, domrender) {
    CONTROLS = new OrbitControls(camera, domrender);
    return CONTROLS;
  }
}

window.ANIMATED = {
  cname: class {
    name = null;
    clip = null;
  },
  _variable: class {
    active = [];
    mixer = null;
    action = null;
    object = null;
    shape = null;
    bones = null;
    sca = null; //last applyed scale    
  },
  _animations: null,
  _data: new Array(),
  _changes: new Array(),//changes in use
  _loaded: new Array(), //already loaded models

  //USE TO UPDATE ANIMATIONS ON JSON FILE - on DEVELOPMENT
  updateAnimations: function (modelUrl) {
    ANIMATED.load(modelUrl, 'model', 0.985,
      function (mobj) {
        mobj.visible = false;
        //ANIMATED._animations=mobj.animations;
        var data = JSON.stringify(mobj.animations);
        //var url = ENGINE.url + ENGINE.conf.dir.upload + '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
        console.log(data);
        //HELPER.simpleuploadData(url, 'SAVANIMATIONS', data, function () {
        //  console.log('Animations Uploaded',mobj.animations.length);
        //});
      });
  },

  _finishload: function (object, fbx, name, scale, callbak, extracfg) {
    if (typeof (scale) == 'undefined') scale = 0.985;
    object.scale.subScalar(scale);
    ANIMATED._data[name] = new ANIMATED._variable();
    ANIMATED._data[name].object = object;
    ANIMATED._data[name].shape = ENGINE.Physic.createRigidSkin(extracfg);
    ANIMATED._data[name].shape.group.login = name;
    ANIMATED._data[name].mixer = new THREE.AnimationMixer(object);
    ANIMATED._data[name].sca = scale;
    ANIMATED._data[name].action = new Array();
    ANIMATED._data[name].bones = new Array();
    var audio = new THREE.Object3D();
    ANIMATED._data[name].audio = audio;


    //console.log(ANIMATED._animations.length);
    object.animations = new Array();
    for (var i = 0; i < ANIMATED._animations.length; i++) {
      var anim = THREE.AnimationClip.parse(ANIMATED._animations[i]);
      object.animations.push(anim);
    }

    var firstname = null;
    for (var i = 0; i < object.animations.length; i++) {
      var clip = object.animations[i].name;
      var clipAnim=ANIMATED._data[name].mixer.clipAction(object.animations[i]);
      clip = clip.split('|');
      clip = clip[clip.length - 1];
      if (firstname == null || clip == 'idle') firstname = clip;
      ANIMATED._data[name].action[clip] = clipAnim;       
      ANIMATED._data[name].action[clip].togle = function () {
        ANIMATED.swap(name, this);
      }
      switch (clip) {
        //unique
        case 'swdie':  break;
        case 'tpose':  break;
        //legworks
        case 'swwalk':  break;
        case 'idledie':  break;
        case 'idle':  break;
        case 'idlearmed':  break;
        case 'run':  break;
        case 'swrun':  break;
        case 'walk':  break;
        //uperbody
        case 'swwithdraw':  break;
        case 'archaim':  break;
        case 'swatack': clipAnim.timeScale=2; break;
        case 'swdraw':  break;
        case 'punch':  break;
        case 'drop':  break;
        //extra
        case 'swimpact':  break;
        case 'jump':  clipAnim.timeScale=1.5;break;
      }
    }
    if (firstname !== null) ANIMATED._data[name].action[firstname].play();
    ANIMATED._data[name].active = [];

    object.traverse(function (child) {
      //try{
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.transparent = false;
        if (child.material.specular)
          child.material.specular.setScalar(0.2);
      }
      if (child.isBone && child.name) {
        var boneName = child.name;
        if (boneName.startsWith('mixamorig') == true)
          boneName = boneName.substr('mixamorig'.length, boneName.length);
        while (isNaN(boneName[0]) == false) {
          boneName = boneName.substr(1, boneName.length)
        }
        ANIMATED._data[name].bones[boneName] = child;
      }
      //}catch{e}{
      //window.TT=child;
      //console.log('Error 140',name,fbx);
      //}      
    });
    object.add(audio);

    ENGINE.scene.add(object);
    var shapepos = ANIMATED._data[name].shape.position.clone();
    object.position.y = shapepos.y - 1.30;
    ANIMATED._data[name].shape.attach(object);
    ENGINE.Physic.bodyTeleport(ANIMATED._data[name].shape, shapepos.add(new THREE.Vector3(0, 4, 0)));
    if (!ANIMATED._loaded[fbx]) ANIMATED._loaded[fbx] = { obj: object, audio: audio, sca: scale };
    if (typeof (callbak) == 'function') callbak(object);
  },



  _preload: function (fbx, name, scale, callbak, extracfg) {
    if (typeof (ANIMATED._data[name]) !== 'undefined') {
      console.warn('Animation Already Exist: ' + name);
      if (typeof (callbak) == 'function') callbak(ANIMATED._data[name].object);
      return;
    }
    if (ANIMATED._loaded[fbx]) {

      //Clone existent same Model/Skelleton and Animations, rescale and position to default            
      //var havebars=ANIMATED._loaded[fbx].bars;
      //if(havebars)ANIMATED._loaded[fbx].obj.remove(havebars); //remove atached bars
      ANIMATED._loaded[fbx].obj.remove(ANIMATED._loaded[fbx].audio); //remove atached audios
      var object = SkeletonUtils.clone(ANIMATED._loaded[fbx].obj);
      ANIMATED._loaded[fbx].obj.add(ANIMATED._loaded[fbx].audio); //put audios back
      //if(havebars)ANIMATED._loaded[fbx].obj.add(havebars);//put bars back
      object.scale.addScalar(ANIMATED._loaded[fbx].sca);
      for (var i = 0; i < ANIMATED._loaded[fbx].obj.animations.length; i++) {
        object.animations.push(ANIMATED._loaded[fbx].obj.animations[i].clone());
      }
      object.position.set(0, 0, 0);
      object.quaternion.set(0, 0, 0, 1);
      ANIMATED._finishload(object, fbx, name, scale, callbak, extracfg);
    } else {
      LOADER.fbxloader.load(fbx, function (object) {
        ANIMATED._finishload(object, fbx, name, scale, callbak, extracfg);
      });
    }
  },


  load: function (fbx, name, scale, callbak, extracfg) {
    if (ANIMATED._animations == null) {
      $.getJSON(ENGINE.url + 'animations.json', function (data) {
        ANIMATED._animations = data;
        ANIMATED._preload(fbx, name, scale, callbak, extracfg);
      });
    } else {
      ANIMATED._preload(fbx, name, scale, callbak, extracfg);
    }
  },


  update: function (delta) {
    for (var k = 0; k < Object.keys(this._data).length; k++) {
      var kname = Object.keys(this._data)[k];
      if (typeof (this._data[kname]) !== 'undefined') {
        if (this._data[kname].mixer)
          this._data[kname].mixer.update(delta);
      }
    }
    for (var i = 0; i < ANIMATED._changes.length; i++) {
      var data = ANIMATED._changes[i];
      var playw = 0;
      if (typeof (data.clip) != 'undefined' || data.clip != null){
        playw = ANIMATED._data[data.name].action[data.clip].weight;
      }        
      playw = playw - (delta * data.time);
      if (playw <= 0) {
        playw = 0;
        if (typeof (data.clip) != 'undefined' || data.clip != null) {
          ANIMATED._data[data.name].action[data.clip].weight = playw;
          ANIMATED._data[data.name].action[data.clip].stop();
        }
        ANIMATED._data[data.name].active[data.type] = data.newp;
        ANIMATED._data[data.name].action[data.newp].weight = 1;
        this.deanimateType(data.name,data.newp,false);
        ANIMATED._changes.splice(i, 1);
        break;
      } else {
        ANIMATED._data[data.name].action[data.clip].weight = playw;
        ANIMATED._data[data.name].action[data.newp].weight = 1 - playw;
      }
    }
  },

  deanimateType:function(name,newpose,selftoo){
    if(typeof(ANIMATED._data[name])=='undefined'){
      console.warn('deanimateType no animation for ',name);
      return;
    }
    var ctype=this.getType(newpose);
    for (var i = 0; i<Object.keys(ANIMATED._data[name].action).length;i++) {
      var cname = Object.keys(ANIMATED._data[name].action)[i];      
      if(ctype==this.getType(cname)){
        if(cname!=newpose){
          ANIMATED._data[name].action[cname].weight=0;
          ANIMATED._data[name].action[cname].stop();
        }else if(selftoo==true){
          ANIMATED._data[name].action[cname].weight=0;
          ANIMATED._data[name].action[cname].stop();
          ANIMATED._data[name].active[ctype]='tpose';          
        }        
      }      
    }
  },

  getType: function (newpose) {
    var atype = 4;
    switch (newpose) {
      //unique
      case 'swdie': atype = 0; break;
      case 'tpose': atype = 0; break;
      //legworks
      case 'swwalk': atype = 1; break;
      case 'idledie': atype = 1; break;
      case 'idle': atype = 1; break;
      case 'idlearmed': atype = 1; break;
      case 'run': atype = 1; break;
      case 'swrun': atype = 1; break;
      case 'walk': atype = 1; break;
      //uperbody
      case 'swwithdraw': atype = 2; break;
      case 'archaim': atype = 2; break;
      case 'swatack': atype = 2; break;
      case 'swdraw': atype = 2; break;
      case 'punch': atype = 2; break;
      case 'drop': atype = 2; break;
      //extra
      case 'swimpact': atype = 3; break;
      case 'jump': atype = 3; break;
    }
    return atype;
  },

  swap: function (name, animation) {
    var clip = animation._clip.name;
    clip = clip.split('|');
    clip = clip[clip.length - 1];
    ANIMATED.change(name, clip);
    /*var clipname = ANIMATED._data[name].active;
    if (typeof (ANIMATED._data[name]) == 'undefined' ||
      typeof (ANIMATED._data[name].action[newpose]) == 'undefined') {
      console.warn('Animation or clip not found', name, newpose);
      return;
    }
    ANIMATED._data[name].action[clipname].weight = 0;
    ANIMATED._data[name].action[clipname].stop();    
    ANIMATED._data[name].action[newpose].weight = 1;
    ANIMATED._data[name].action[newpose].play();    
    */
  },

  change: function (name, newpose, speed) {
    if (typeof (speed) == 'undefined') speed = 1;
    var ctype = this.getType(newpose);
    var clipname = ANIMATED._data[name].active[ctype];
    if (typeof (ANIMATED._data[name]) == 'undefined' ||
      typeof (ANIMATED._data[name].action[newpose]) == 'undefined') {
      console.warn('Animation or clip not found', name, newpose);
      return;
    }
    //ANIMATED._data[name].action[newpose].weight = 0;
    ANIMATED._data[name].action[newpose].play();
    var onlist=false;
    for (var i = 0; i < ANIMATED._changes.length; i++) {
      var data = ANIMATED._changes[i];
      if(data.name==name && data.clip==clipname && data.type==ctype && data.newp==newpose && data.time==speed){
        onlist=true;
        break;
      }
    }
    if(onlist==false && clipname!=newpose)
    ANIMATED._changes.push({ name: name, clip: clipname, type: ctype, newp: newpose, time: speed });
  },

  clear: function () {
    ANIMATED._changes = new Array();
    for (var k = 0; k < Object.keys(ANIMATED._data).length; k++) {
      var modelname = Object.keys(ANIMATED._data)[k];
      if (typeof (ANIMATED._data[modelname]) !== 'undefined') {
        for (var a = 0; a < Object.keys(ANIMATED._data[modelname].action).length; a++) {
          var cliname = Object.keys(ANIMATED._data[modelname].action)[a];
          var clip = ANIMATED._data[modelname].action[cliname];
          clip.stop();
          ANIMATED._data[modelname].mixer.uncacheClip(clip);
        }
        ANIMATED._data[modelname].mixer.uncacheRoot(ANIMATED._data[modelname].object);
        ENGINE.Physic.removeObj(ANIMATED._data[modelname].shape);
        ENGINE.scene.remove(ANIMATED._data[modelname].object);
      }
    }

  }


}

window.TransformControl = {
  raycaster: null,
  pointer: new THREE.Vector2(),
  onUpPosition: new THREE.Vector2(),
  onDownPosition: new THREE.Vector2(),
  transformControl: null,
  control: null,
  cameraPersp: null,
  cameraOrtho: null,
  currentCamera: null,
  onfocus: function () { },
  create: function () {
    //try {
    this.control = new TransformControls(ENGINE.camera, ENGINE.renderer.domElement);
    //this.control.addEventListener('change', this.render);
    this.control.addEventListener('dragging-changed', function (event) {
      if (typeof (ENGINE.CAM.camera[ENGINE.CAM.MODEL.ORBIT]) !== 'undefined') {
        if (typeof (CONTROLS) !== null && typeof (CONTROLS.object) !== 'undefined') {
          CONTROLS.enabled = !event.value;
        }
      }
    });
    this.control.onFocus(function (focused) {
      SHADER.enabled = !focused;
      if (typeof (TransformControl.onfocus) !== 'undefined')
        TransformControl.onfocus(focused);
      TransformControl.threatPhysic(focused);
    });


    //} catch (e) { console.log('TransfCOntro', e); }
  },

  threatPhysic: function (focus) {
    if (TransformControl.control.object !== null &&
      typeof (TransformControl.control.object.group) !== 'undefined') {
      if (TransformControl.control.object.group.name == 'PhysicBody') {
        ENGINE.TILE.physicTrnasform(focus);
      }
      if (TransformControl.control.object.group.name == 'Model') {
        ENGINE.TILE.objTrnasform(focus);
      }
    }
  }

}


window.SHADER = {
  enabled: true,
  //-------- AVAIABLE SHADDERS
  darkMaterial: null,
  materials: {},
  //---------
  filmLayer: null,
  filmComposer: null,
  //---------
  bloomLayer: null,
  bloomComposer: null,
  //---------
  blurLayer: null,
  blurComposer: null,
  //#########
  finalComposer: null,
  passes: [], //stored passes
  filters: { FXAA: null },

  createMaterials: function () {
    try {
      this.materials['LAVA'] = {
        uniforms: null,
        material: null,
        onUpdate: null
      }
      this.materials.LAVA.uniforms = {
        "fogDensity": { value: 0.015 },
        "fogColor": { value: new THREE.Vector3(0, 0, 0) },
        "time": { value: 1.0 },
        "uvScale": { value: new THREE.Vector2(0.2, 0.2) },
        "texture1": { value: LOADER.textureLoader.load('./images/cloud.png') },
        "texture2": { value: LOADER.textureLoader.load('./images/lavatile.jpg') }
      };
      this.materials.LAVA.uniforms["texture1"].value.wrapS =
        this.materials.LAVA.uniforms["texture1"].value.wrapT = THREE.RepeatWrapping;
      this.materials.LAVA.uniforms["texture2"].value.wrapS =
        this.materials.LAVA.uniforms["texture2"].value.wrapT = THREE.RepeatWrapping;
      const size = 0.65;
      this.materials.LAVA.material = new THREE.ShaderMaterial({
        uniforms: this.materials.LAVA.uniforms,
        vertexShader: SHADERES.vertex['vertlava'],
        fragmentShader: SHADERES.fragment['fraglava']
      });
      this.materials.LAVA.onUpdate = function (delta) {
        var dt2 = 5 * delta;
        SHADER.materials.LAVA.uniforms['time'].value += 0.2 * dt2;
      }
    } catch (e) { console.log('Shader Lava', e); }


    //WaterOcean
    try {
      this.materials['OCEAN'] = {
        material: null,
        uniforms: null,
        water: null,
        onUpdate: null
      }
      const oceanGeometry = new THREE.PlaneGeometry(20, 20);
      this.materials.OCEAN.water = new Water(
        oceanGeometry,
        {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: LOADER.textureLoader.load('./images/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          }),
          sunDirection: new THREE.Vector3(),
          sunColor: 0xffffff,
          waterColor: 0x49bdf7,
          distortionScale: 4,
          fog: undefined
        }
      );
      this.materials.OCEAN.material = this.materials.OCEAN.water.material;
      this.materials.OCEAN.uniforms = this.materials.OCEAN.water.material.uniforms;
      this.materials.OCEAN.onUpdate = function (delta) {
        SHADER.materials.OCEAN.uniforms['time'].value += 1.0 / 60.0;
        SHADER.materials.OCEAN.uniforms.eye.value.copy(ENGINE.camera.position);
        for (var i = 0; i < ENGINE.Light.lights.length; i++) {
          if (typeof (ENGINE.Light.lights[i]) !== 'undefined') {
            if (ENGINE.Light.lights[i].isSun) {
              SHADER.materials.OCEAN.uniforms.sunDirection.value.copy(
                ENGINE.Light.lights[i].position);
              SHADER.materials.OCEAN.uniforms.sunColor.value = ENGINE.Light.lights[i].color;
            }
          }
        }
      }
    } catch (e) { console.log('Shader Ocean', e); }

    //WaterOcean
    try {
      this.materials['WATER'] = {
        uniforms: null,
        material: null,
        onUpdate: null
      }
      this.materials.WATER.uniforms = {
        "fogDensity": { value: 0.015 },
        "fogColor": { value: new THREE.Vector3(0, 0, 0) },
        "time": { value: 1.0 },
        "uvScale": { value: new THREE.Vector2(0.04, 0.04) },
        "texture1": { value: LOADER.textureLoader.load('./images/cloud.png') },
        "texture2": { value: LOADER.textureLoader.load('./images/water.jpg') }
      };
      this.materials.WATER.uniforms["texture1"].value.wrapS =
        this.materials.WATER.uniforms["texture1"].value.wrapT = THREE.RepeatWrapping;
      this.materials.WATER.uniforms["texture2"].value.wrapS =
        this.materials.WATER.uniforms["texture2"].value.wrapT = THREE.RepeatWrapping;
      const size = 0.65;
      this.materials.WATER.material = new THREE.ShaderMaterial({
        uniforms: this.materials.WATER.uniforms,
        vertexShader: SHADERES.vertex['vertlava'],
        fragmentShader: SHADERES.fragment['fragwater']
      });
      this.materials.WATER.onUpdate = function (delta) {
        var dt2 = 5 * delta;
        SHADER.materials.WATER.uniforms['time'].value += 0.2 * dt2;
      }
    } catch (e) { console.log('Shader Lava', e); }


  },

  update: function (ENGINE, delta) {
    if (SHADER.enabled == false) {
      if (typeof (ENGINE.camera) !== 'undefined') {
        ENGINE.renderer.render(ENGINE.scene, ENGINE.camera);
      }
      return;
    }    

    if (this.bloomComposer == null || typeof (this.materials) == 'undefined') return;

    if (typeof (this.materials.LAVA) !== 'undefined') {
      this.materials.LAVA.onUpdate(delta);
    }
    if (typeof (this.materials.OCEAN) !== 'undefined') {
      this.materials.OCEAN.onUpdate(delta);
    }
    if (typeof (this.materials.WATER) !== 'undefined') {
      this.materials.WATER.onUpdate(delta);
    }


    ENGINE.scene.traverse(this.darkenNonBloomed);
    this.bloomComposer.render();
    ENGINE.scene.traverse(this.restoreMaterial);

    ENGINE.scene.traverse(this.darkenNonFilmed);
    this.filmComposer.render();
    ENGINE.scene.traverse(this.restoreMaterial);

    ENGINE.scene.traverse(this.darkenNonBlured);
    this.blurComposer.render();
    ENGINE.scene.traverse(this.restoreMaterial);

    this.finalComposer.render();

    ENGINE.renderer.clearDepth();
    ENGINE.renderer.render( ENGINE.scene2, ENGINE.camera2 );        
  },

  makevertex: function (texture) {
    return new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          xTexture: { value: texture }
        },
        vertexShader: SHADERES.vertex['vertexshader'],
        //document.getElementById('vertexshader').textContent,
        fragmentShader: SHADERES.fragment['fragmentshader'],
        //document.getElementById('fragmentshader').textContent,
        defines: {}
      }), "baseTexture"
    );
  },

  create: function () {
    this.createMaterials();


    //base composer and materials
    this.darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    const renderScene = new RenderPass(ENGINE.scene, ENGINE.camera);
    this.finalComposer = new EffectComposer(ENGINE.renderer);
    this.finalComposer.addPass(renderScene);
    var vetor2 = new THREE.Vector2(ENGINE.canvObj.width, ENGINE.canvObj.height);



    //######### EFFECT BLOOMPASS
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(10);
    const params = {
      exposure: 1,
      bloomStrength: 0.5,
      bloomThreshold: 0,
      bloomRadius: 0,
      scene: "Scene with Glow"
    };
    var pass = new UnrealBloomPass(vetor2, 1.5, 0.4, 0.85);
    //this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    pass.threshold = params.bloomThreshold;
    pass.strength = params.bloomStrength;
    pass.radius = params.bloomRadius;
    this.bloomComposer = new EffectComposer(ENGINE.renderer);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(renderScene);
    //this.bloomComposer.addPass(  this.fxaaPass );
    this.bloomComposer.addPass(pass);
    var finalpass = this.makevertex(this.bloomComposer.renderTarget2.texture);
    finalpass.needsSwap = true;
    this.finalComposer.addPass(finalpass);
    this.passes.push({ name: 'Bloom', layer: 10, config: pass })


    //######### EFFECT FILM
    this.filmLayer = new THREE.Layers();
    this.filmLayer.set(11);
    pass = new FilmPass(
      0.95,   //0.35 noise intensity
      0.5,  //0.025 scanline intensity
      648,    // scanline count
      false,  // grayscale
    );
    this.filmComposer = new EffectComposer(ENGINE.renderer);
    this.filmComposer.renderToScreen = false;
    this.filmComposer.addPass(renderScene);
    //this.filmComposer.addPass(  this.fxaaPass );
    this.filmComposer.addPass(pass);
    finalpass = this.makevertex(this.filmComposer.renderTarget2.texture);
    finalpass.needsSwap = true;
    this.finalComposer.addPass(finalpass);
    this.passes.push({ name: 'Film', layer: 11, config: pass })


    //######### EFFECT Blur
    this.blurLayer = new THREE.Layers();
    this.blurLayer.set(12);
    pass = new ShaderPass(HorizontalBlurShader);
    var pass2 = new ShaderPass(VerticalBlurShader);
    pass.uniforms['h'].value = 0.01;//2 / ( ENGINE.canvObj.width / 2 );
    pass2.uniforms['v'].value = 0.01;//2 / ( ENGINE.canvObj.height / 2 );
    this.blurComposer = new EffectComposer(ENGINE.renderer);
    this.blurComposer.renderToScreen = false;
    this.blurComposer.addPass(renderScene);
    //this.filmComposer.addPass(  this.fxaaPass );
    this.blurComposer.addPass(pass);
    this.blurComposer.addPass(pass2);
    finalpass = this.makevertex(this.blurComposer.renderTarget2.texture);
    finalpass.needsSwap = true;
    this.finalComposer.addPass(finalpass);
    this.passes.push({ name: 'Bluur', layer: 12, config: pass })


    //FINAL FILTERS on Window
    this.filters.FXAA = new ShaderPass(FXAAShader);
    const pixelRatio = ENGINE.renderer.getPixelRatio();
    this.filters.FXAA.material.uniforms['resolution'].value.x = 1 / (vetor2.x * pixelRatio);
    this.filters.FXAA.material.uniforms['resolution'].value.y = 1 / (vetor2.y * pixelRatio);
    this.filters.FXAA.enabled = false;
    this.finalComposer.addPass(this.filters.FXAA);


    //const renderScene2 = new RenderPass(ENGINE.scene2, ENGINE.camera2);    
    //this.finalComposer.addPass(renderScene2);
  },

  darkenNonBlured: function (obj) {
    if (SHADER.blurLayer != null && (obj.isMesh||obj.isSprite) &&
      SHADER.blurLayer.test(obj.layers) === false )  {
      SHADER.materials[obj.uuid] = obj.material;
      obj.material = SHADER.darkMaterial;
    }
  },

  darkenNonFilmed: function (obj) {
    if (SHADER.filmLayer != null && (obj.isMesh||obj.isSprite) &&
      SHADER.filmLayer.test(obj.layers) === false ) {
      SHADER.materials[obj.uuid] = obj.material;
      obj.material = SHADER.darkMaterial;
    }
  },

  darkenNonBloomed: function (obj) {
    if (SHADER.bloomLayer != null && (obj.isMesh||obj.isSprite) &&
      SHADER.bloomLayer.test(obj.layers) === false) {
      SHADER.materials[obj.uuid] = obj.material;
      obj.material = SHADER.darkMaterial;
    }
  },

  restoreMaterial: function (obj) {
    if (typeof (SHADER.materials[obj.uuid]) !== 'undefined') {
      obj.material = SHADER.materials[obj.uuid];
      delete SHADER.materials[obj.uuid];
    }
  },

  disposeMaterial: function (obj) {
    if (obj.material) {
      obj.material.dispose();
    }
  },

}
