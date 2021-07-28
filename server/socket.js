var server = require('websocket').server;
var http = require('http');
//const crypto = require("crypto");

module.exports = {
  protocolName:"uniquename",
  socket:null,
  lastid:0,
  START: function (HTTPSERVER, MESSAGE) {
    this.socket = new server({
      httpServer: HTTPSERVER,
      //autoAcceptConnections: true,
      maxReceivedFrameSize: 64 * 1024 * 1024,   // 64MiB
      maxReceivedMessageSize: 64 * 1024 * 1024, // 64MiB
      fragmentOutgoingMessages: false,
      keepalive: true,
      //disableNagleAlgorithm: false
    });
    console.log('WebSocket Created');
    //console.log(this.socket);
    this.ONREQUEST(MESSAGE);
  },

  Wsinitialize: function (connection, MESSAGE) {
    // New connection
    //console.log('ws',MESSAGE);
    if (typeof (MESSAGE) != null) //conected message
      MESSAGE({
        KEY: 'CONNECTED',
        ID: 'KEY'+connection.id,
        CONNECTION: connection,       
      }, connection);
    // WebSocket events
    // message on client needs a JSON string structure
    // with TYPE header or ignored
    connection.on("message", message => {      
      var JSONMESSAGE = null;
      if (typeof (MESSAGE) != null)
        try {
          //console.log('reader',message.utf8Data);
          JSONMESSAGE = JSON.parse(message.utf8Data);
          if (typeof (JSONMESSAGE.KEY) != 'undefined') {
            JSONMESSAGE.ID = 'KEY'+connection.id;         
            MESSAGE(JSONMESSAGE, connection);
          }
        }
        catch (e) {
        }
    });
    connection.on("close", () => {
      //if(typeof(MESSAGE)!=null)
      //MESSAGE(`DISCONECTED: ${connection.id}`,connection);
      MESSAGE({
        KEY: 'DISCONECTED',
        ID: 'KEY'+connection.id,
        CONNECTION: connection
      });
    });
  },

  ONREQUEST: function (MESSAGE) {    
    this.socket.on("request", req => {
      //console.log('rq',req.requestedProtocols);
      // Check protocol
      if (req.requestedProtocols.includes(this.protocolName)) {
        // Accept connection
        const connection = req.accept(this.protocolName)
        connection.id = this.lastid;
        this.lastid += 1;
        //crypto.randomBytes(CONFIG.IDLength).toString("hex")
        // Initialize
        this.Wsinitialize(connection, MESSAGE)
      } else {
        req.accept(req.requestedProtocols[0])
          .drop(1002, "ERROR: INVALID WEBSOCKET REQUEST");
      }
    });
  },

}




