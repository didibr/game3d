window.SOCKET = {
  secure: false,
  protocol: 'game1',
  socket: null,
  lastcon:null,

  send: function (key, data) {
    SOCKET.socket.send(JSON.stringify({ KEY: key, DATA: data }));
  },

  socketMessage: function (message) {    
    var JSONDATA = null;
    try {
      JSONDATA = JSON.parse(message);
    }
    catch (e) {
      console.log('Socket Error', e);
      return;
    }
    if(JSONDATA.MOVETO || JSONDATA.PING || JSONDATA.UPDATEPLAYER){

    }else{
      console.log('Received', JSONDATA);
    }    
    //console.log(message,JSONDATA);
    if(JSONDATA && JSONDATA!=null)
    ENGINE.GAME.message(JSONDATA);
  },

  recon:function(execute){
    
    if(SOCKET.socket.readyState!=1){
     if(SOCKET.lastcon!==null){
       SOCKET.wsConnect(SOCKET.lastcon.url,execute);
     }else{
      //if(typeof(execute)=='function')execute();
     }
    }else{
      if(typeof(execute)=='function')execute();
    }
  },

  wsConnect: function (url,callback) {    
    var connection='';
    if(SOCKET.secure==true){
      connection={url: url, proto:this.protocol};
      SOCKET.socket = new WebSocket("wss://"+connection.url,connection.proto );
    }else{
      connection={url: url, proto:this.protocol};
      SOCKET.socket = new WebSocket("ws://"+connection.url,connection.proto );
    }    
    SOCKET.socket.onopen = function () {    
      SOCKET.lastcon=connection;      
      if(typeof(callback)!='undefined')callback();
    };
    SOCKET.socket.onmessage = function (message) {
      SOCKET.socketMessage(message.data);
    };
    SOCKET.socket.onerror = function (error) {      
      SOCKET.GAME=null;     
      if(typeof(callback)!='undefined')callback(error);
    };
  }
}
