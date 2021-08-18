///#################################
///################# PHISICS WORLD
///#################################
ENGINE.Physic = {
  debugPhysics: false,
  _wired: true,
  _debugf: 0,
  rigidBodies: [],
  physicsWorld: null,
  gravityConstant: - 9.8,
  transformAux1: null,
  physicMaterial: null,
  skinMaterial: null,
  collide: {
    collisionConfiguration: null,
    dispatcher: null,
    broadphase: null,
    solver: null,
    softBodySolver: null
  },
  initPhysics: function () {
    // Physics configuration
    //var ME = ENGINE.Physic.avar;
    this.collide.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    //const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    this.collide.dispatcher = new Ammo.btCollisionDispatcher(this.collide.collisionConfiguration);
    this.collide.broadphase = new Ammo.btDbvtBroadphase();
    this.collide.solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.collide.softBodySolver = new Ammo.btDefaultSoftBodySolver();
    //this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      this.collide.dispatcher, this.collide.broadphase, this.collide.solver, this.collide.collisionConfiguration);
    this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravityConstant, 0));
    //this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, this.gravityConstant, 0));
    this.transformAux1 = new Ammo.btTransform();
    /*
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    //var overlappingPairCache = new Ammo.btAxisSweep3(new Ammo.btVector3(-10,-10,-10),new Ammo.btVector3(10,10,10));
    var solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    //this.m_dynamicsWorld.getSolverInfo().set_m_numIterations(10);
    this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravityConstant, 0));
    */
    this.skinMaterial = new THREE.MeshBasicMaterial(
      { color: 'gold', opacity: 0.3, transparent: true, depthWrite: false, wireframe: true });
    this.physicMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.physicMaterial.transparent = true;
    this.physicMaterial.wireframe = true;
    this.physicMaterial.opacity = 1;
  },

  getObjectByID: function (id, callback) {
    ENGINE.scene.traverse((obj) => {
      if (obj && obj.userData && obj.userData.physicsBody && obj.userData.physicsBody.a)
        if (obj.userData.physicsBody.a == id && typeof (callback)) callback(obj);
    });
  },

  wired: function (value) {
    if (value == true) {
      ENGINE.Physic.physicMaterial.wireframe = true;
      ENGINE.Physic.physicMaterial.opacity = 1;
    } else {
      ENGINE.Physic.physicMaterial.wireframe = false;
      ENGINE.Physic.physicMaterial.opacity = 0.5;
    }
    ENGINE.Physic._wired = value;
  },

  addPhisicBox: function (pos, quat, tam) {
    var geometry = new THREE.BoxGeometry(tam.x, tam.y, tam.z);
    var pobj = new THREE.Mesh(geometry, ENGINE.Physic.physicMaterial);
    const shape = new Ammo.btBoxShape(
      new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5));
    shape.setMargin(0.5);
    ENGINE.Physic.createRigidBody(pobj, shape, 0.001, pos, quat);
    pobj.userData.physicsBody.setMassProps(0, 0);//set mass = 0;
    return pobj;
  },

  createRigidSkin: function (extracfg) {
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    var mass = 15;
    if (typeof (extracfg) !== 'undefined') {
      //if(extracfg.pos)pos=new THREE.Vector3(extracfg.pos.x,extracfg.pos.y,extracfg.pos.z);
      if (extracfg.box && extracfg.box.qua) quat =
        new THREE.Quaternion(
          extracfg.box.qua.x,
          extracfg.box.qua.y,
          extracfg.box.qua.z,
          extracfg.box.qua.w);
    }

    var tam = new THREE.Vector3(0.8, 2.55, 0.7); //default player size box
    const geometry = 
    //new THREE.CylinderGeometry(tam.x * 0.5, tam.x * 0.5, tam.y);
    new THREE.BoxGeometry(tam.x, tam.y, tam.z);
    //const material = new THREE.MeshBasicMaterial(
    //  { color: 'gold',opacity: 0.3, transparent: true, depthWrite: false,wireframe: true });
    //material.wireframe: true;
    //material.transparent = true;
    //material.opacity=0.3;
    var threeObject = new THREE.Mesh(geometry, ENGINE.Physic.skinMaterial);
    var shape = 
    //new Ammo.btCylinderShapeZ(new Ammo.btVector3( tam.x * 0.5, tam.x * 0.5, tam.y ))    
    new Ammo.btBoxShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5));    
    shape.setMargin(0.5);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y+5, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const physicbody = new Ammo.btRigidBody(rbInfo);
    physicbody.setFriction(0.8);

    physicbody.setAngularFactor(new Ammo.btVector3(0.0, 0.0, 0.0));
    //physicbody.setLinearFactor(new  Ammo.btVector3(1, 0, 1));

    threeObject.userData.physicsBody = physicbody;
    threeObject.userData.physicsShape = shape;

    threeObject.group = { name: "Player", type: 'Human' };
    ENGINE.scene.add(threeObject);

    //enable layer shaders in object inside
    for (var i = 0; i < SHADER.passes.length; i++) {
      threeObject.layers.enable(SHADER.passes[i].layer);
    }

    this.rigidBodies.push(threeObject);
    // Disable deactivation
    physicbody.setActivationState(4);
    physicbody.setCollisionFlags(0);
    this.physicsWorld.addRigidBody(physicbody);

    //console.log(body);
    //threeObject.attach(body);

    //var scal=body.scale.clone();
    //var objbox = new THREE.Box3().setFromObject(body);
    //var box = new THREE.BoxHelper( object, 0xffff00 );
    //ANIMATED._data["a"].object.children[0].geometry
    //var box = new THREE.BoxHelper( ANIMATED._data["a"].object.children[0], 0xffff00 );
    return threeObject;
  },

  createRigidBody: function (threeObject, physicsShape, mass, pos, quat) {
    if (typeof (pos) != 'undefined') {
      threeObject.position.copy(pos);
    } else {
      pos = threeObject.position;
    }
    if (typeof (quat) != 'undefined') {
      threeObject.quaternion.copy(quat);
    } else {
      quat = threeObject.quaternion;
    }

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    threeObject.userData.physicsBody = body;
    threeObject.userData.physicsShape = physicsShape;
    var ACTSTATE = {
      ACTIVE: 1,
      ISLAND_SLEEPING: 2,
      WANTS_DEACTIVATION: 3,
      DISABLE_DEACTIVATION: 4,
      DISABLE_SIMULATION: 5
    }
    var KINECTSTA = {
      CF_STATIC_OBJECT: 1,
      CF_KINEMATIC_OBJECT: 2,
      CF_NO_CONTACT_RESPONSE: 4,
      CF_CUSTOM_MATERIAL_CALLBACK: 8,//this allows per-triangle material (friction/restitution)
      CF_CHARACTER_OBJECT: 16,
      CF_DISABLE_VISUALIZE_OBJECT: 32, //disable debug drawing
      CF_DISABLE_SPU_COLLISION_PROCESSING: 64//disable parallel/SPU processing
    }
    var bodytype = '';
    if (mass == 0 || mass == 0.001) { bodytype = 'static'; } else { bodytype = 'moveable'; }
    threeObject.group = { name: "PhysicBody", type: bodytype };
    ENGINE.scene.add(threeObject);

    if (mass > 0) {
      this.rigidBodies.push(threeObject);
      // Disable deactivation
      body.setActivationState(ACTSTATE.DISABLE_DEACTIVATION);
      body.setCollisionFlags(0);
    }

    this.physicsWorld.addRigidBody(body);
  },

  removeObj: function (oject) {
    if (typeof (oject) == 'undefined' || oject == null) return;
    if (typeof (oject.userData) == "undefined") return false;
    if (typeof (oject.userData.physicsBody) == "undefined") return false;
    oject.userData.physicsBody.setCollisionFlags(4);
    ENGINE.scene.remove(oject);
    ENGINE.Physic.physicsWorld.removeRigidBody(oject.userData.physicsBody);
    return true;
  },

  clear: function () {
    for (var i = 0; i < ENGINE.Physic.rigidBodies.length; i++) {
      const objThree = ENGINE.Physic.rigidBodies[i];
      const objPhys = objThree.userData.physicsBody;
      objPhys.setCollisionFlags(4);
      ENGINE.Physic.physicsWorld.removeRigidBody(objPhys);
      ENGINE.scene.remove(objThree);
      ENGINE.Physic.rigidBodies = [];
    }
  },

  updatePhysics: function (deltaTime) {
    // Step world
    if (typeof (this.physicsWorld) == "undefined" || this.physicsWorld == null) return;
    if (this.transformAux1 == null) return;
    //console.log('up');
    this.physicsWorld.stepSimulation(deltaTime);

    ENGINE.Physic._debugf += deltaTime; //DebugObjects Physics
    if (ENGINE.Physic.debugPhysics == true) {
      if (ENGINE.Physic.physicMaterial.visible == false)
        ENGINE.Physic.physicMaterial.visible = true;
      if (ENGINE.Physic._debugf > 1) {
        ENGINE.Physic.physicMaterial.emissive.setRGB(0, 0, 0);
      } else {
        ENGINE.Physic.physicMaterial.emissive.setRGB(1, 0, 0);
      }
      if (ENGINE.Physic._debugf > 2) ENGINE.Physic._debugf = 0;
    } else {
      if (ENGINE.Physic.physicMaterial.visible == true)
        ENGINE.Physic.physicMaterial.visible = false;
    }
    // Update rigid bodies
    for (let i = 0, il = this.rigidBodies.length; i < il; i++) {
      const objThree = this.rigidBodies[i];
      if (objThree.userData != null && objThree.userData.physicsBody) {
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if (ms) {
          ms.getWorldTransform(this.transformAux1);
          const p = this.transformAux1.getOrigin();
          const q = this.transformAux1.getRotation();
          //part of movimentation
          ENGINE.Physic.calculateMoves(objThree, objPhys, deltaTime);
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }

      }
    }
  },

  calculateMoves: function (objThree, objPhys, delta) {
    if (typeof (objPhys.move) != 'undefined' && objPhys.move.ACTIVE == true) {

      var world = objPhys.getWorldTransform();
      var positionA = world.getOrigin();
      var rotationA = world.getRotation();
      var position = new THREE.Vector3(positionA.x(), positionA.y(), positionA.z());
      var rotation = new THREE.Quaternion(rotationA.x(), rotationA.y(), rotationA.z(), rotationA.w());
      if (typeof (objPhys.fakeobj) == 'undefined') {
        objPhys.fakeobj = new THREE.Object3D(objPhys.parent);
        objPhys.fakeobj.name = objPhys.move.playerName;
      }
      objPhys.fakeobj.position.copy(position);
      objPhys.fakeobj.quaternion.copy(rotation);

      var isNPC=false;
      var login = objPhys.fakeobj.name;
      var speemov = objPhys.move.speed;
      var playervar = ENGINE.GAME._players[login];
      if(!playervar){
        playervar=ENGINE.GAME._npcData[login];
        isNPC=true;
      }
      var playerobj = null;
      var running = false;
      
      //if(playervar && playervar.onAction==true)return;

      var actRun='run';
      var actIdle='idle';
      var actWalk='walk';
      for(var i=0;i<ENGINE.GAME._itenslist[login].itens.length;i++){
        if(ENGINE.GAME._itenslist[login].itens[i].type==2){
          actRun='swrun';
          actIdle='idlearmed';
          actWalk='swwalk';
        }
      }

      if (typeof (playervar) != 'undefined') {
        if (playervar.speed){
          speemov += playervar.speed; //passive add extra player speed (buff)
        }else{
          //playervar.speed=ENGINE.GAME._speed.player;
        }
        if(!playervar.speedExtra)playervar.speedExtra=0;
        playerobj = ANIMATED._data[login];
        if (speemov > ENGINE.GAME._speed.player) running = true; //anny speed over base is running
      }


      var distance = position.distanceTo(objPhys.move.destin);
      if(objPhys.move.distance==null){ //recalculate tistance and direction when fail
        objPhys.move.distance=distance;        
      }
      objPhys.move.direction=new THREE.Vector3().subVectors(objPhys.move.destin, position).normalize();

      //console.log(distance, objPhys.move.distance)

      if (distance > objPhys.move.distance || distance<0.5) { //chegou no ponto ou ultrapassou
        objPhys.move.ACTIVE = false;
        //##### ANIMATION AREA for IDLE /stop
        if (playerobj) {
          ANIMATED.change(login, actIdle, 10);
          HELPER.footStepSound(login,'snstep','stop');          
        }              
      } else {                              //se movendo para a direcao
        //objPhys.setLinearFactor(new  Ammo.btVector3(1, 0, 1));
        //objPhys.setLinearFactor(new  Ammo.btVector3(1, 1, 1));      

        if(distance==objPhys.move.distance){//stuck
          if(isNPC==true){
            ENGINE.GAME.playerAction(login,{jump:true});
          }
        }

        //##### ANIMATION AREA for walk
        if(playervar.speedExtra>0 && distance<2){
          playervar.speedExtra=0;
          running=false;
        }

        
     
        if (playerobj && running == true && playerobj.active.includes(actRun)!=true) {
          ANIMATED.change(login, actRun, 10);
        }
        if (playerobj && running == false){          
          if(playerobj.active.includes(actWalk)!=true) {
          ANIMATED.change(login, actWalk, 10);
          HELPER.footStepSound(login,'snstep','play');
          }
          //if(distance<1){
           // var lerped=Math.min(1, Math.max(0,distance-0.5));          
           // ANIMATED._data[login].action.walk.weight=lerped;
            //ENGINE.GAME._players[login].speedReduction=lerped;
         // }
        }
        
        objPhys.fakeobj.position.addScaledVector(objPhys.move.direction, speemov * delta);
        
        objPhys.move.distance = distance;
        var dest=objPhys.fakeobj.position.clone().addScaledVector(objPhys.move.direction, 2);
        //if(objPhys.fakeobj.position.y<1.76)objPhys.fakeobj.position.y=1.76;        
        dest.y=objPhys.fakeobj.position.y+0.05;    
        objPhys.fakeobj.lookAt(dest); //look at destin

        positionA.setValue(objPhys.fakeobj.position.x, objPhys.fakeobj.position.y, objPhys.fakeobj.position.z);
        world.setOrigin(positionA);

        rotationA.setValue(objPhys.fakeobj.quaternion.x, objPhys.fakeobj.quaternion.y, objPhys.fakeobj.quaternion.z, objPhys.fakeobj.quaternion.w);
        world.setRotation(rotationA);

        if(playervar){
          playervar.pos=objPhys.fakeobj.position.clone();
          playervar.qua=objPhys.fakeobj.quaternion.clone();
          if(!playervar.angle || !playervar.angle.isVector3)
          playervar.angle=new THREE.Vector3();
          objThree.getWorldDirection(playervar.angle);            
        }
        //ms.setWorldTransform(world);
      }

    }
  },

  bodyMove: function (object, position, speed, playerName) {
    //var cameraDirection = camera.getWorldDirection().multiplyScalar(speed * dir.ud);
    //var objThree = object;
    var p = null;
    if (position.isVector3) {
      p = position.clone();
    } else {
      if (position.position && position.position.isVector3) {
        p = position.position.clone();
      } else {
        console.error("Invalid Position"); return;
      }
    }
    p = new THREE.Vector3(p.x, p.y + 1.4, p.z);
    if (object.isObject3D && object.userData.physicsBody) {
      object = object.userData.physicsBody;
    }
    var orig = object.getWorldTransform().getOrigin();
    var from = new THREE.Vector3(orig.x(), orig.y(), orig.z());
    if (typeof (speed) == "undefined") speed = 0.5;
    if (typeof (object.move) == 'undefined' || object.move==null) object.move = {};
    object.move.playerName = playerName;
    object.move.ACTIVE = true;
    object.move.speed = speed;
    object.move.destin = p;
    object.move.distance = from.distanceTo(p) + 1;
    //object.move.animation = animation;
    object.move.direction = new THREE.Vector3().subVectors(p, from).normalize();
  },

  bodyUpdate: async function (object, nposition, nrotation) {
    if (object.isObject3D && object.userData.physicsBody) {
      object = object.userData.physicsBody;
    } else {
      if (typeof (object.getWorldTransform) == 'undefined') return;
    }
    //console.log(object,nposition,nrotation);
    var world = object.getWorldTransform();
    var positionA = world.getOrigin();
    var rotationA = world.getRotation();
    positionA.setValue(nposition.x, nposition.y, nposition.z);
    world.setOrigin(positionA);
    rotationA.setValue(nrotation.x, nrotation.y, nrotation.z, nrotation.w);
    world.setRotation(rotationA);
  },


  bodyJump: function (object, size) {
    var objThree = object;
    var body = objThree.userData.physicsBody;
    var jumpdirection = new Ammo.btVector3(0, size, 0);
    body.setLinearVelocity(jumpdirection);
  },


  bodyAplyForce: function (object, direction, size) {
    var objThree = object;
    var body = objThree.userData.physicsBody;
    var p = direction;
    if (typeof (p) == "undefined" || typeof (p.x) == "undefined") p = p.position;
    if (typeof (p.x) == "undefined") { console.error("Invalid Position"); return; }
    var dir = new THREE.Vector3();
    dir.subVectors(p, objThree.position).normalize();
    if (dir.x == 0 && dir.y == 0 && dir.z == 0) return;
    var nforce = new Ammo.btVector3(dir.x, dir.y, dir.z);
    //body.setLinearVelocity(jumpdirection);
    nforce.normalize();
    nforce.op_mul(size);
    body.applyForce(nforce, new Ammo.btVector3(0, 0, 0));
  },

  bodyTeleport: function (object, position) {
    var objThree = object;
    var p = position;
    if (typeof (p) == "undefined" || typeof (p.x) == "undefined") p = p.position;
    if (typeof (p.x) == "undefined") { console.error("Invalid Position"); return; }
    var body = objThree.userData.physicsBody;
    var world = body.getWorldTransform();
    var origin = world.getOrigin();
    origin.setValue(p.x, p.y, p.z);
  },

  bodyStopMove: function (object) {
    object.userData.move.ACTIVE = false;
  }
}