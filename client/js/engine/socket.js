/**
 * Array to store all the connected ports in.
 */
const connectedPorts = [];

// Create socket instance.
var socket = new WebSocket('ws://localhost','game1');

socket.onopen = function () {    
  JSON.stringify({ KEY: 'GETPLAYERCONFIG', DATA: { login: 'a', pass: 'a' } }); 
  socket.send(package);
  //const package = JSON.parse({message:'connected'});
  //connectedPorts.forEach(port => port.postMessage(package));
};

socket.onmessage = function ({ data }) {
  const package = JSON.parse(data);
  connectedPorts.forEach(port => port.postMessage(package));
};

socket.onerror = function () {      
  const package = JSON.parse({ERROR:'erro'});
  connectedPorts.forEach(port => port.postMessage(package));
}
socket.onclose=socket.onerror;

function connect(url){
  //'ws://192.168.0.2:8080'
  var nsocket = new WebSocket(url,'game1');
  nsocket.onopen=socket.onopen;  
  nsocket.onmessage=socket.onmessage;
  nsocket.onerror=socket.onerror;
  socket=nsocket;
}

/**
 * When a new thread is connected to the shared worker,
 * start listening for messages from the new thread.
 */
self.addEventListener('connect', ({ ports }) => {
  const port = ports[0];

  // Add this new port to the list of connected ports.
  connectedPorts.push(port);

  /**
   * Receive data from main thread and determine which
   * actions it should take based on the received data.
   */
  port.addEventListener('message', ({ data }) => {
    const { action, value } = data;
    if (action === 'connect') {
      connect(value);
    }
    // Send message to socket.
    if (action === 'send') {
      socket.send(value);

    // Remove port from connected ports list.
    } else if (action === 'unload') {
      const index = connectedPorts.indexOf(port);
      connectedPorts.splice(index, 1);
    }
  });


  // Start the port broadcasting.
  port.start();
});