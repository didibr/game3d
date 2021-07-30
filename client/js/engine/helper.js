// For todays date;
var HELPER = {
  blinkColor: 0x0ff00,

  today: function (date) {
    return ((date.getDate() < 10) ? "0" : "") + date.getDate() + (((date.getMonth() + 1) < 10) ? "0" : "") + (date.getMonth() + 1) + date.getFullYear();
  },
  // For the time now
  timeNow: function (date) {
    return ((date.getHours() < 10) ? "0" : "") + date.getHours() + ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes() + ((date.getSeconds() < 10) ? "0" : "") + date.getSeconds();
  },

  areaSphere: function (position, radius, color, wire, layer) {
    var circleGeometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshBasicMaterial(
      { color: color, side: 2, transparent: true, opacity: 0.3, wireframe: wire });
    var circle = new THREE.Mesh(circleGeometry, material);
    circle.position.set(position.x, position.y, position.z);
    circle.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    ENGINE.scene.add(circle);
    if (layer) circle.layers.enable(layer);
    return circle;
  },

  areaCircular: function (position, radius, color, wire) {
    var circleGeometry = new THREE.CircleGeometry(radius, 32);
    var material = new THREE.MeshBasicMaterial(
      { color: color, side: 2, transparent: true, opacity: 0.3, wireframe: wire });
    var circle = new THREE.Mesh(circleGeometry, material);
    circle.position.set(position.x, position.y, position.z);
    circle.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    ENGINE.scene.add(circle);
    return circle;
  },

  rotateAboutPoint: function (obj, point, axis, theta) {
    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset
    obj.rotateOnAxis(axis, theta); // rotate the OBJECT    
  },

  updateArray: function (model, data) {
    for (var k = 0; k < Object.keys(model).length; k++) {
      var kname = Object.keys(model)[k];
      if (typeof (data[kname]) !== 'undefined') {
        model[kname] = data[kname];
      }
    }
  },

  setIntervalX: function (callback, lastcall, delay, repetitions) {
    var x = 0;
    var intervalID = window.setInterval(function () {
      callback();
      if (++x === repetitions) {
        lastcall();
        window.clearInterval(intervalID);
      }
    }, delay);
  },

  blinkObj: function (value) {
    //shape - material.color.setRGB(1,1,0.5);
    //obj3d - .children.forEach(function(xx){xx.material.color.setRGB(1,1,1);});
    function gR(obj3d, sett) {
      if (sett == true) {
        if (obj3d.visible == true) {
          obj3d.visible = false;
        } else {
          obj3d.visible = true;
        }
      } else {
        obj3d.visible = true;
      }
    }
    console.log(value);
    if (value._shape !== null) {
      HELPER.setIntervalX(
        () => { gR(value._shape, true); },
        () => { gR(value._shape, false); }
        , 100, 8);
    }
    if (value._OBJ3d !== null) {
      HELPER.setIntervalX(
        () => { value._OBJ3d.children.forEach(function (xx) { gR(xx, true); }); },
        () => { value._OBJ3d.children.forEach(function (xx) { gR(xx, false); }); }
        , 100, 8);
    }
  },

  blinkEntity: function (name) {
    function gR(obj3d, sett) {
      if (sett == true) {
        if (obj3d.visible == true) {
          obj3d.visible = false;
        } else {
          obj3d.visible = true;
        }
      } else {
        obj3d.visible = true;
      }
    }
    if (ANIMATED._data[name]) {
      HELPER.setIntervalX(
        () => { gR(ANIMATED._data[name].shape, true); },
        () => { gR(ANIMATED._data[name].shape, false); }
        , 100, 8);
    }
  },

  blinkActor: function (actor) {
    function gR(obj3d, sett) {
      if (sett == true) {
        if (obj3d.visible == true) {
          obj3d.visible = false;
        } else {
          obj3d.visible = true;
        }
      } else {
        obj3d.visible = true;
      }
    }
    HELPER.setIntervalX(
      () => { gR(actor, true); },
      () => { gR(actor, false); }
      , 100, 8);
  },


  physicToGeometry: function (phy) {
    var geometry = phy.geometry;
    //var mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var _OBJ3d = new THREE.Mesh(geometry, ENGINE.Physic.physicMaterial);
    ENGINE.scene.add(_OBJ3d);
    _OBJ3d.quaternion.set(phy.quaternion._x,
      phy.quaternion._y,
      phy.quaternion._z,
      phy.quaternion._w);
    _OBJ3d.position.set(phy.position.x,
      phy.position.y,
      phy.position.z);
    return _OBJ3d;
  },

  uploadModel: function (url, button, callback) {
    $(button).prop("disabled", true);
    $(button).prop("original", $(button).val());
    $(button).val("Sending...");
    var fd = new FormData();
    var files = $('#file')[0].files[0];
    fd.append('file', files);
    $.ajax({
      url: url,
      type: 'post',
      data: fd,
      contentType: false,
      processData: false,
      success: function (response) {
        $('#file').remove();
        $('#uploadiv').html('<input type="file" id="file" name="file" />');
        $(button).prop("disabled", null);
        $(button).val($(button).prop("original"));
        if (typeof (callback) !== 'undefined') callback(response);
      },
    });
  },


  uploadData: function (url, button, name, data, callback) {
    $(button).prop("disabled", true);
    $(button).prop("original", $(button).val());
    $(button).val("Sending...");
    var fd = new FormData();
    fd.append(name, data);
    console.log(data);
    $.ajax({
      url: url,
      type: 'post',
      data: fd,
      contentType: false,
      processData: false,
      success: function (response) {
        $(button).prop("disabled", null);
        $(button).val($(button).prop("original"));
        //no response needed
        if (typeof (callback) !== 'undefined') callback(response);
      },
    });
  },

  simpleuploadData: function (url, name, data, callback) {
    var fd = new FormData();
    fd.append(name, data);
    console.log(data);
    $.ajax({
      url: url,
      type: 'post',
      data: fd,
      contentType: false,
      processData: false,
      success: function (response) {
        //no response needed
        if (typeof (callback) !== 'undefined') callback(response);
      },
    });
  },

  downloadData: function (url, button, callback) {
    $(button).prop("disabled", true);
    $(button).prop("original", $(button).val());
    $(button).val("Sending...");
    //var fd = new FormData();
    //fd.append(name, '');  
    $.ajax({
      url: url,
      type: 'get',
      contentType: false,
      processData: false,
      success: function (response) {
        $(button).prop("disabled", null);
        $(button).val($(button).prop("original"));
        //no response needed
        if (typeof (callback) !== 'undefined') callback(response);
      },
    });
  },

  simpleDownloadSync: function (url) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: url,
        type: 'get',
        contentType: false,
        processData: false,
        success: function (data) {
          var result = data;
          resolve(result);
        },
        error: function (err) {
          reject(err);
        }
      });
    });
  },

  simpleDownload: function (url, callback) {
    $.ajax({
      url: url,
      type: 'get',
      contentType: false,
      processData: false,
      success: function (response) {
        if (typeof (callback) !== 'undefined') callback(response);
      },
      error: function (err) {
        if (typeof (callback) !== 'undefined') callback();
      }
    });
  },

  _transformHelper: function (edit) {
    var mode = edit.value;
    if (typeof (mode) == 'undefined') return;
    if (typeof (TransformControl) !== 'undefined' &&
      typeof (TransformControl.control) !== 'undefined') {
      TransformControl.control.setMode(mode);
      //if(TransformControl.control.object)
      //HELPER.showTransform(TransformControl.control.object);
    }
  },

  showTransform: function (obj) {
    if (typeof (obj) == 'undefined') return;
    ENGINE.scene.add(obj);
    ENGINE.scene.add(TransformControl.control);
    TransformControl.control.attach(obj);
    TransformControl.control.visible = true;
  },

  hideTransform: function () {
    TransformControl.control.detach();
    //const geometry = new THREE.SphereGeometry(0.25);
    //const material = new THREE.MeshBasicMaterial({ color: 'black' });
    //const objr = new THREE.Mesh(geometry, material);    
    //ENGINE.scene.add(objr);        
    //TransformControl.control.attach(objr);
    //TransformControl.control.detach(objr);
    TransformControl.control.visible = false;
    ENGINE.scene.remove(TransformControl.control);
    //ENGINE.scene.remove(objr);  
    //TransformControl.control.detach(TransformControl.control.object);      
  },

  decompres: function (data) {
    return LZString.decompress(JSONDATA.DATA);
  },

  script: function (data) {
    eval(data);
  },

  getBonneByNumber: function (number, friendName) {
    number = parseInt(number);
    switch (number) {
      case 0: return friendName == true ? "Consumable" : "";
      case 1: return friendName == true ? "Left Hand" : "LeftHand";     //mixamorig
      case 2: return friendName == true ? "Right Hand" : "RightHand";
      case 3: return friendName == true ? "Left Leg" : "LeftLeg";
      case 4: return friendName == true ? "Right Leg" : "RightLeg";
      case 5: return friendName == true ? "Left Foot" : "LeftFoot";
      case 6: return friendName == true ? "Right Foot" : "RightFoot";
      case 7: return friendName == true ? "Head" : "Head";
      case 8: return friendName == true ? "Neck" : "Neck";
      case 9: return friendName == true ? "Chest" : "Spine2";
      default: return ""
    }
  },



  objaddToBone: function (val, name, boneNumber) {
    var boneName = HELPER.getBonneByNumber(boneNumber);
    if (ANIMATED._data[name].bones[boneName]) {
      ANIMATED._data[name].bones[boneName].attach(val._OBJ3d);

      if (!val._Attached[boneNumber]) {
        val._Attached[boneNumber] =
          { _Pos: { x: 0, y: 0, z: 0 }, _Scale: { x: 1, y: 1, z: 1 }, _Quat: { x: 0, y: 0, z: 0, w: 1 } };
      }
      val._OBJ3d.position.set(
        val._Attached[boneNumber]._Pos.x,
        val._Attached[boneNumber]._Pos.y,
        val._Attached[boneNumber]._Pos.z);
      val._OBJ3d.quaternion.set(
        val._Attached[boneNumber]._Quat.x,
        val._Attached[boneNumber]._Quat.y,
        val._Attached[boneNumber]._Quat.z,
        val._Attached[boneNumber]._Quat.w);
      val._OBJ3d.scale.set(
        val._Attached[boneNumber]._Scale.x,
        val._Attached[boneNumber]._Scale.y,
        val._Attached[boneNumber]._Scale.z);
    }
  },

  boneatachedClean: function (_Attached) { //get iten rotation on bone
    var fakeata = new Array();
    for (var i = 0; i < _Attached.length; i++) {
      var valc = _Attached[i];
      if (valc &&
        new THREE.Vector3(valc._Pos.x, valc._Pos.y, valc._Pos.z).distanceTo(new THREE.Vector3(0, 0, 0)) == 0 &&
        new THREE.Vector3(valc._Scale.x, valc._Scale.y, valc._Scale.z).distanceTo(new THREE.Vector3(1, 1, 1)) == 0 &&
        new THREE.Vector3(valc._Quat.x, valc._Quat.y, valc._Quat.z, valc._Quat.w).distanceTo(new THREE.Vector4(0, 0, 0, 1)) == 0) {
        //nada huehue
      } else {
        fakeata[i] = valc;
      }
    }
    return fakeata;
  },

  _audioExists:[],
  stopAudios:function(){
    this._audioExists.forEach((audio)=>{
      if(audio.isPlaying==true)audio.stop();
    });
  },

  _audioBuffer: new Array(),
  audioAtatch: async function (audio, obj, callback) {
    var audioFile = ENGINE.url + 'AUDIOLOAD' + audio; //composer audio   
    if (this._audioBuffer[audioFile]) { //get from buffer preloaded
      console.log('buffer audio');
      var buffered = this._audioBuffer[audioFile];
      const audio = new THREE.PositionalAudio(await LISTENER());
      this._audioExists.push(audio);
      audio.setBuffer(buffered.buffer);
      audio.loop = buffered.loop;
      audio.setVolume(buffered.volume);
      if (obj != null) obj.add(audio);
      if (typeof (callback) != _UN)
        callback({ audio: audio, loop: buffered.loop, volume: buffered.volume });
      return;
    }
    var audiolist = await HELPER.simpleDownloadSync(audioFile);
    var loop = audiolist.loop;
    for (var i = 0; i < audiolist.audio.length; i++) {
      var file = audiolist.audio[i].file;
      var volume = audiolist.audio[i].volume
      var soundFile = ENGINE.url + ENGINE.conf.dir.audio + file; //audio file
      console.log('load audio');
      LOADER.audioLoader.load(soundFile, async function (buffer) {
        const audio = new THREE.PositionalAudio(await LISTENER());
        HELPER._audioExists.push(audio);
        audio.setBuffer(buffer);
        audio.loop = loop;
        audio.setVolume(volume);
        //HELPER._audioBuffer[audioFile] = { buffer: buffer, loop: loop, volume: volume };
        if (obj != null) obj.add(audio);
        if (typeof (callback) != _UN) callback({ audio: audio, loop: loop, volume: volume });
      });
    }


    /*LOADER.audioLoader.load('sounds/ping_pong.mp3', function (buffer) {
      const audio = new THREE.PositionalAudio(listener);
      audio.setBuffer(buffer);
      ball.add(audio);

    }
  })*/
  },


  footStepSound: function (player, snstep, action) {
    if (ENGINE.GAME._audioslist[player] &&
      ENGINE.GAME._audioslist[player][snstep] &&
      ENGINE.GAME._audioslist[player][snstep].live) {
      if (action == 'stop') {
        if(ENGINE.GAME._audioslist[player][snstep].live.isPlaying==true)
        ENGINE.GAME._audioslist[player][snstep].live.stop();
      }
      if (action == 'play') {
        if(ENGINE.GAME._audioslist[player][snstep].live.isPlaying != true)
        ENGINE.GAME._audioslist[player][snstep].live.play();
      }
    }
  }




}