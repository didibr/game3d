WSOconnect=function(url){
    WSold.wsConnect(url);
}

WSOmessage=function(messag){    
}

WSOsend=function(key,message){
  //console.log(key,message);
    WSold.socket.send(JSON.stringify({ KEY: key, DATA: message }));
}

window.WSold = {
    secure: false,
    protocol: 'game1',
    socket: null,
    lastcon:null,
  
    send: function (key, data) {
      WSold.socket.send(JSON.stringify({ KEY: key, DATA: data }));
    },
  
  
    wsConnect: function (url,callback) {    
      var connection='';
      WSold.socket = new WebSocket(url,WSold.protocol);
      /*
      if(WSold.secure==true){
        connection={url: url, proto:this.protocol};
        WSold.socket = new WebSocket("wss://"+connection.url,connection.proto );
      }else{
        connection={url: url, proto:this.protocol};
        WSold.socket = new WebSocket("ws://"+connection.url,connection.proto );
      } */   
      WSold.socket.onopen = function () {    
        //WSold.lastcon=connection;      
        //if(typeof(callback)!='undefined')callback();
        //console.log('a')
        //var package= JSON.stringify({ KEY: 'GETPLAYERCONFIG', DATA: { login: 'a', pass: 'a' } }); 
        //WSold.socket.send(package);
      };
      WSold.socket.onmessage = function ({data}) {
        //WSold.socketMessage(message.data);
        //console.log('b')
        const package = JSON.parse(data);
        WSOmessage({data:package});
      };
      WSold.socket.onerror = function (error) {      
        //console.log('c')
       // WSold.GAME=null;     
        //if(typeof(callback)!='undefined')callback(error);
      };
    }
  }
  