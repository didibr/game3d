window.ENGINE.SKY={
    //setings
    
    //CODE
    mesh:null,

    create:function(tiles,image){
        var geometry, texture,material;
        var centermap=new THREE.Vector3();
        if(tiles && tiles!=null){
            var cells = tiles.length;
            var rows = tiles[0].length;
            var camstepbackZ = ((10 * rows) / 2)-5;
            var camstepbackX = ((10 * cells) / 2)-5;
            centermap.set(camstepbackX, 0.5, camstepbackZ);
            //console.log(centermap);            
        }
        if(this.mesh==null){
            geometry = new THREE.SphereGeometry( 500,60,40);//500, 60, 40 );
            geometry.scale( - 1, 1, 1 );
            texture = LOADER.textureLoader.load( image );
            material = new THREE.MeshBasicMaterial( { map: texture } );
            this.mesh = new THREE.Mesh( geometry, material );
        }else{
            texture = LOADER.textureLoader.load( image );
            this.mesh.material.map=texture;
        }        
        ENGINE.scene.add( this.mesh );        
        this.mesh.position.set(centermap.x,centermap.y,centermap.z);
        
    }


}