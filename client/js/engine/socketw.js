
const webSocketWorker = new SharedWorker('js/engine/socket.js');
const WSsend = (key,message) => {
    console.log(key,message);
  webSocketWorker.port.postMessage({ 
    action: 'send', 
    value: JSON.stringify({ KEY: key, DATA: message }),
  });
};
const WSconnect = message => {
    webSocketWorker.port.postMessage({ 
      action: 'connect', 
      value: message,
    });
  };
// Event to listen for incoming data from the worker and update the DOM.
/*
webSocketWorker.port.addEventListener('message', ( tudo ) => {
  requestAnimationFrame(() => {    
    console.log(tudo.data);
  });
});
*/
// Initialize the port connection.
webSocketWorker.port.start();
// Remove the current worker port from the connected ports list.
// This way your connectedPorts list stays true to the actual connected ports, 
// as they array won't get automatically updated when a port is disconnected.
window.addEventListener('beforeunload', () => {
  webSocketWorker.port.postMessage({ 
    action: 'unload', 
    value: null,
  });
  webSocketWorker.port.close();
});
