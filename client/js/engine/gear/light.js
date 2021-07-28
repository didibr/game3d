///#################################
///################# Lighting
///#################################
ENGINE.Light = {  
  lights: [],  
  update:function(delta){
    for (var i = 0; i < ENGINE.Light.lights.length; i++) {
      if (
      typeof(ENGINE.Light.lights[i])!=='undefined' &&
      typeof(ENGINE.Light.lights[i].helper)!=='undefined' &&
      typeof(ENGINE.Light.lights[i].helper.update)!=='undefined'){
        if(ENGINE.Light.lights[i].group.model==3)
        ENGINE.Light.lights[i].target=ENGINE.Light.lights[i].helper.target;
        ENGINE.Light.lights[i].helper.update();
      }
    }
      
  },
  addAmbient: function (color, intensity) {
    var light = new THREE.AmbientLight(color);
    light.intensity = intensity;
    light.group={name: "Light", model: 2, active:true}    
    light.helper={visible:false};
    ENGINE.scene.add(light);
    this.lights.push(light);
    return light;
  },
  addPointLightShadow:function (color, intensity, distance, position) {
    var light = new THREE.PointLight( color, intensity, distance );    
    light.castShadow = false; // default false  
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default    
    light.group={name: "Light", model: 4, active:false}
    //const geometry = new THREE.SphereGeometry(0.25);
    //const material = new THREE.MeshBasicMaterial({ color: color });
    //const bulb = new THREE.Mesh(geometry, material);
    //helper.add(bulb);
    //light.add(bulb);
    const sphereSize = 0.25;
    const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
    pointLightHelper;visible=false;
    light.helper=pointLightHelper;
    ENGINE.scene.add(light);    
    ENGINE.scene.add(pointLightHelper);    
    light.position.set(position.x, position.y, position.z);    
    this.lights.push(light);
    return light;
  },

  addDirectionalLightShadow: function (color, intensity, size, position) {
    var light = new THREE.SpotLight(color, intensity, 100);
    light.position.set(0, 1, 0); //default; light shining from top
    light.castShadow = true; // default false      
    //Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
    light.shadow.camera.left = - size;
    light.shadow.camera.right = size;
    light.shadow.camera.top = size;
    light.shadow.camera.bottom = - size;
    light.distance=300;
    light.group={name: "Light", model: 3, active:false}
    //var helper = new THREE.CameraHelper(light.shadow.camera);
    const helper = new THREE.SpotLightHelper( light);
    const geometry = new THREE.SphereGeometry(0.25);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const bulb = new THREE.Mesh(geometry, material);
    helper.target=bulb;
    bulb.visible=false;
    //light.add(bulb);  
    //targetObject.group={name: "Helper"};    
    ENGINE.scene.add(helper);
    ENGINE.scene.add(bulb);
    light.target = helper.target;
    light.position.set(position.x, position.y, position.z);
    bulb.position.set(position.x, position.y-5, position.z);
    ENGINE.scene.add(light);
    //ENGINE.scene.remove(targetObject);
    light.helper = helper;
    this.lights.push(light);
    return light;
  }
}