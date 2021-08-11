///#################################
///################# CameraHelper
///#################################
ENGINE.CAM = {
  //controls: null,
  _fdif: null,
  _folow: null,
  camera: [],
  MODEL: { NONE: 0, ORBIT: 1, FOLOW: 2 },
  _camupdate: function () {
    if (CONTROLS !== null && typeof (CONTROLS.update) !== 'undefined')
      CONTROLS.update();
  },

  change: function (model, position, lookAt, renderer) {
    var p = position;
    var l = lookAt;
    var r = ENGINE.renderer.domElement;
    if(typeof(renderer)!='undefined')r=renderer;

    if (model == this.MODEL.NONE) {
      if (CONTROLS !== null && CONTROLS.enabled) CONTROLS.enabled = false;
    }


    if (model == this.MODEL.ORBIT) {
      if (CONTROLS !== null && CONTROLS.enabled) CONTROLS.enabled = false;
      if (typeof (this.camera[model]) !== 'undefined') {
        CONTROLS = this.camera[model];
        CONTROLS.enabled = true;
      } else {
        CONTROLS = OrbitControl.create(ENGINE.camera, r);
        this.camera[model] = CONTROLS;
      }
      //this.controls.autoRotate = true;
      if (typeof (l.x) != "undefined") {
      } else if (typeof (l.position) != "undefined" &&
        typeof (l.position.x) != "undefined") {
        l = l.position;
      } else l = new THREE.Vector3(0, 0, 0);
      CONTROLS.target.set(l.x, l.y, l.z);
      if (typeof (p.x) != "undefined") {
      } else if (typeof (p.position) != "undefined" &&
        typeof (p.position.x) != "undefined") {
        p = p.position;
      } else p = new THREE.Vector3(0, 0, 0);
      ENGINE.camera.position.set(p.x, p.y, p.z);
      this._fdif = null;
      this._camupdate = null;
      CONTROLS.update();
    }


    if (model == this.MODEL.FOLOW) {
      if (CONTROLS !== null && CONTROLS.enabled) CONTROLS.enabled = false;
      if (typeof (this.camera[model]) !== 'undefined') {
        CONTROLS = this.camera[model];
        CONTROLS.enabled = true;
      } else {
        ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT, position, lookAt);
        this.camera[model] = CONTROLS;
      }
      CONTROLS.enablePan = false;
      CONTROLS.enableZoom = false;
      CONTROLS.enableDamping = false;
      CONTROLS.enableRotate = false;
      this._fdif = new THREE.Vector3(0, 0, 0);
      this._fdif.x = CONTROLS.target.x - ENGINE.camera.position.x;
      this._fdif.y = CONTROLS.target.y - ENGINE.camera.position.y;
      this._fdif.z = CONTROLS.target.z - ENGINE.camera.position.z;
      this._folow = lookAt;
      this._camupdate = function (delta) {
        var p = ENGINE.CAM._folow;
        var f = ENGINE.CAM._fdif;
        if (typeof (p.x) != "undefined") {
        } else if (typeof (p.position) != "undefined" &&
          typeof (p.position.x) != "undefined") {
          p = p.position;
        } else p = new THREE.Vector3(0, 0, 0);
        ENGINE.camera.position.set(p.x - f.x, p.y - f.y, p.z - f.z);
      }
    }


    //############ RESET DEFAULTS #################
    CONTROLS.minDistance = 0;
    CONTROLS.maxDistance = 10000;
    CONTROLS.maxPolarAngle=Math.PI;
    CONTROLS.minPolarAngle=-Math.PI;
    CONTROLS.screenSpacePanning = true;
    CONTROLS.enablePan = true;
    CONTROLS.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    }

  }

}