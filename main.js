/*Rquerid Packages
formidable - websocket - sharp - ws
*/

const HELPER = require('./server/helper');
const HTTP = require('./server/webserver');
const IRC = require('./server/ircchat');
const SOCKET = require('./server/socket');
const AI = require('./server/ai');
const fs = require('fs');
const sharp = require('sharp');

//ADMIN LOGIN TO EDITING CREATING
const ADMIN = 'didi';
const PASS = '1234';
const WebPort= 8080;

const dir = {
  audio: 'audio/',
  models: 'models/obj/',
  modelsFbx: 'models/fbx/',
  texturesThub: 'textures/thumbnail/',
  textures: 'textures/extra/',
  upload: 'upload/',
  dummy:'dummy'
}
AI.audiosDir = HTTP.ServerDIR + '/data/audio/';
AI.tilesDir = HTTP.ServerDIR + '/data/tiles/';
AI.mapsDir = HTTP.ServerDIR + '/data/maps/';
AI.itemsDir = HTTP.ServerDIR + '/data/items/';
AI.entitysDir = HTTP.ServerDIR + '/data/entitys/';
AI.playerCFG = HTTP.ServerDIR + '/data/players/';
AI.THREE=require(HTTP.ClientDIR +'/js/build/three.min');


async function CreateTumb(temp, local, file) {
  var copytumb = HTTP.ClientDIR + '/' + dir.texturesThub;
  sharp(local + file).resize({ height: 100, width: 100 }).toFile(copytumb + file);
}

async function SaveMapJson(data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Error on SaveMapJson', e);
    return;
  }
  if (typeof (data.name) == "undefined") return;
  if (typeof (data.elements) == "undefined") return;
  var tilename = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var tilearray = data.elements;
  AI.createNewMap(tilename, tilearray);
  //console.log('New Tile',tilename,tilearray);
}


async function SaveEntityJson(data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Error on SaveEntityJson', e);
    return;
  }
  if (typeof (data.name) == "undefined") return;
  if (typeof (data.elements) == "undefined") return;
  var itemname = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var itemarray = data.elements;
  AI.createNewEntity(itemname, itemarray);
  //console.log('New Tile',tilename,tilearray);
}



async function MapChangeSta(data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Error on MapChangeSta', e);
    return;
  }
  if (typeof (data.name) == "undefined") return;
  if (typeof (data.elements) == "undefined") return;
  var mapname = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");  
  var comandarray = data.elements;

  if(comandarray.CMD=='MapOnOff'){    
      if(mapname=='default')return;
      HELPER.readFile(HTTP.ServerDIR+'/aconf', function (data) {
        data = JSON.parse(data);
        data.maps[mapname]=comandarray.VAL;        
        //console.log(data);
        HELPER.writeFile(HTTP.ServerDIR+'/aconf',JSON.stringify(data));
      });
  }
  if(comandarray.CMD=='AIActivate'){
    AI.control('ACTIVATE',comandarray.VAL);
  }

}





async function SaveItemJson(data) {
  console.log('rcv');
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Error on SaveItemJson', e);
    return;
  }
  if (typeof (data.name) == "undefined") return;
  if (typeof (data.elements) == "undefined") return;
  var itemname = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  console.log('saving');
  var itemarray = data.elements;
  AI.createNewItem(itemname, itemarray);
  //console.log('New Tile',tilename,tilearray);
}

async function SaveTileJson(data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Error on SaveTileJson', e);
    return;
  }
  if (typeof (data.name) == "undefined") return;
  if (typeof (data.elements) == "undefined") return;
  var tilename = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var tilearray = data.elements;
  AI.createNewTile(tilename, tilearray);
  //console.log('New Tile',tilename,tilearray);
}

async function SaveAudioJson(data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Error on SaveAudioJson', e);
    return;
  }
  if (typeof (data.name) == "undefined") return;
  if (typeof (data.elements) == "undefined") return;
  var tilename = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var tilearray = data.elements;
  AI.createNewAudio(tilename, tilearray);
  //console.log('New Tile',tilename,tilearray);
}


async function LoadAudioJson(res, name) {
  HTTP.WaiToCLOSE(true);
  //console.log('loadtile', name);
  HELPER.readFile(AI.audiosDir + name, function (data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    HTTP.WaiToCLOSE(false);
  });
}

async function LoadTileJson(res, name) {
  HTTP.WaiToCLOSE(true);
  //console.log('loadtile', name);
  HELPER.readFile(AI.tilesDir + name, function (data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    HTTP.WaiToCLOSE(false);
  });
}

async function LoadItemJson(res, name) {
  HTTP.WaiToCLOSE(true);
  //console.log('loadtile', name);
  HELPER.readFile(AI.itemsDir + name, function (data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    HTTP.WaiToCLOSE(false);
  });
}

async function LoadMapJson(res, name) {
  HTTP.WaiToCLOSE(true);
  console.log('loadmap', name);
  HELPER.readFile(AI.mapsDir + name, function (data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    HTTP.WaiToCLOSE(false);
  });
}

async function LoadEntityJson(res, name) {
  HTTP.WaiToCLOSE(true);
  console.log('loadentity', name);
  HELPER.readFile(AI.entitysDir + name, function (data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    HTTP.WaiToCLOSE(false);
  });
}





async function GetModels(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(HTTP.ClientDIR + '/' + dir.models, function (files) {
    var html = '<select id="addobj" style="width:80%">';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<option value="' + file + '">' + file + '</option>';
    });
    html += '</select>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}

async function GetFbxNames(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(HTTP.ClientDIR + '/' + dir.modelsFbx, function (files) {
    var html = '<select id="addobj" style="width:160px">';
    html += '<option value="---" disabled="disabled" selected>---</option>';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<option value="' + file + '" local="' + dir.modelsFbx + '">' + file + '</option>';
    });
    html += '</select>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}


async function GetAudios(res) {
  HTTP.WaiToCLOSE(true);  
  var local = '/' + dir.audio;
  HELPER.listFiles(HTTP.ClientDIR + local, function (files) {
    var ordened = [];
    var html = '';
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    var autoid=0;
    ordened.forEach(file => {
      /*html += '<img src=".' + local + file + '" title="' + file +
        '" data-file="' + file + '" path="textures/extra/"' +
        'onClick="ENGINE.EDITORT._textureSel(this);">';
        */
        html += 
        '<audio id="'+autoid+'A" preload="auto">'+
        '<source  src=".' + local + file + '" data-file="' + file + '"></audio>'+
        '<i id="'+autoid+'I">'+file+'</i><input type="checkbox" id="'+autoid+'C">';
        autoid+=1;
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}

async function GetTextures(res) {
  HTTP.WaiToCLOSE(true);
  var local = '/' + dir.texturesThub;
  HELPER.listFiles(HTTP.ClientDIR + local, function (files) {
    var ordened = [];
    var html = '';
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<img src=".' + local + file + '" title="' + file +
        '" data-file="' + file + '" path="textures/extra/"' +
        'onClick="ENGINE.EDITORT._textureSel(this);">';
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}


async function GetEntityNames(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(AI.entitysDir, function (files) {
    var html = '<select  id="loadent" style="width:160px">';
    html += '<option value="---" disabled="disabled" selected>---</option>';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<option value="' + file + '">' + file + '</option>';
    });
    html += '</select>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}


async function GetMapsNames(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(AI.mapsDir, function (files) {
    var html = '<select  id="loadmpsel" style="width:160px">';
    html += '<option value="---" disabled="disabled" selected>---</option>';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<option value="' + file + '">' + file + '</option>';
    });
    html += '</select>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}




async function GetItemNames(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(AI.itemsDir, function (files) {
    var html =
      '<select  id="loadisel" style="width:160px" onchange="ENGINE.ITEM._iconcharge()">';
    html += '<option value="---" disabled="disabled" selected>---</option>';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    var filecount = ordened.length;
    ordened.forEach(file => {
      HELPER.readFile(AI.itemsDir + file, function (data) {
        var jsdta = JSON.parse(data);
        if (jsdta.item) {
          var itemicon = 'images/defaulticon.png';
          if (jsdta.item.extra.icon !== null) itemicon = jsdta.item.extra.icon;
          html += '<option value="' + file + '" item="' + itemicon + '">' + file + '</option>';
        } else {
          html += '<option value="' + file + '">' + file + '</option>';
        }
        filecount--;
        if (filecount <= 0) {
          html += '</select>';
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          HTTP.WaiToCLOSE(false);
        }
      });

    });
  });
}


async function GetAudioNames(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(AI.audiosDir, function (files) {
    var html = '<select  id="loadasel" style="width:160px">';
    html += '<option value="---" disabled="disabled" selected>---</option>';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<option value="' + file + '">' + file + '</option>';
    });
    html += '</select>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}

async function GetTileNames(res) {
  HTTP.WaiToCLOSE(true);
  HELPER.listFiles(AI.tilesDir, function (files) {
    var html = '<select  id="loadasel" style="width:160px">';
    html += '<option value="---" disabled="disabled" selected>---</option>';
    var ordened = [];
    files.forEach(file => {
      ordened.push(file);
    });
    ordened.sort();
    ordened.forEach(file => {
      html += '<option value="' + file + '">' + file + '</option>';
    });
    html += '</select>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    HTTP.WaiToCLOSE(false);
  });
}

//Receive Browser Websocket Requeriment
function OnWebsocketMessage(message) {
  //console.log('msg',message);
  if (typeof (message.KEY) == 'undefined') return;
  AI.receiveMsg(message);
  //console.log('OnWebsocketMessage', message.KEY);
}

//Receive Browser URL Requeriment
function OnHttpRequest(req, res) {
  //console.log(req.url);

  var valor = '';
  if (HELPER.reqStart(req, '/GETENTITYS') == true) {
    GetEntityNames(res);
    return;
  }
  if (HELPER.reqStart(req, '/GETMAPS') == true) {
    GetMapsNames(res);
    return;
  }
  if (HELPER.reqStart(req, '/GETMODELS') == true) {
    GetModels(res);
    return;
  }
  if (HELPER.reqStart(req, '/GETFBXNAMES') == true) {
    GetFbxNames(res);
    return;
  }
  if (HELPER.reqStart(req, '/GETTEXTURES') == true) {
    GetTextures(res);
    return;
  }  
  if (HELPER.reqStart(req, '/AUDIOLIST') == true) {
    GetAudios(res);    
    return;
  }
  if (HELPER.reqStart(req, '/AUDIONAMES') == true) {
    GetAudioNames(res);
    return;
  }
  if (HELPER.reqStart(req, '/GETTILENAMES') == true) {
    GetTileNames(res);
    return;
  }
  if (HELPER.reqStart(req, '/GETITEMNAMES') == true) {
    GetItemNames(res);
    return;
  }
  if (HELPER.reqStart(req, '/AUDIOLOAD') == true) {
    var name = decodeURI(req.url).replace('/AUDIOLOAD', '').trim();
    LoadAudioJson(res, name);
    return;
  }
  if (HELPER.reqStart(req, '/LOADTILE') == true) {
    var name = decodeURI(req.url).replace('/LOADTILE', '').trim();
    LoadTileJson(res, name);
    return;
  }
  if (HELPER.reqStart(req, '/LOADITEM') == true) {
    var name = decodeURI(req.url).replace('/LOADITEM', '').trim();
    LoadItemJson(res, name);
    return;
  }
  if (HELPER.reqStart(req, '/LOADMAPS') == true) {
    var name = decodeURI(req.url).replace('/LOADMAPS', '').trim();
    LoadMapJson(res, name);
    return;
  }
  if (HELPER.reqStart(req, '/LAOADENT') == true) {
    var name = decodeURI(req.url).replace('/LAOADENT', '').trim();
    LoadEntityJson(res, name);
    return;
  }
  if (HELPER.reqStart(req, '/CONFIG') == true) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dir: dir }));
    HTTP.WaiToCLOSE(false);
    return;
  }



  if (HELPER.reqStart(req, '/MAPSTATUS') == true) {
    HTTP.WaiToCLOSE(true);
    var name = decodeURI(req.url).replace('/MAPSTATUS', '').trim();
    HELPER.readFile(HTTP.ServerDIR+'/aconf', function (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      var datmap=JSON.parse(data);
      if(datmap.maps[name]){
        res.end(JSON.stringify({ resp: true }));
      }else{
        res.end(JSON.stringify({ resp: false }));
      }
      HTTP.WaiToCLOSE(false);
    });
    return;
  }

  if (req.url == '/') {
    res.writeHead(301, { Location: '/index.html' });
    return;
  }
  console.log('Request', decodeURI(req.url));
}

//BROWSER -> SERVER
HTTP.AllowUpload.config(HTTP.ServerDIR + '/upload/', '/' + dir.upload);//physical temp - URL
HTTP.AllowUpload.passwordprotect(ADMIN, PASS); //post url /upload?login=x&pass=y
//permited extension - physical destination - mine type
HTTP.AllowUpload.add('.png', HTTP.ClientDIR + '/' + dir.textures, 'image/png', CreateTumb);
HTTP.AllowUpload.add('.jpg', HTTP.ClientDIR + '/' + dir.textures, 'image/jpeg', CreateTumb);
HTTP.AllowUpload.add('.bmp', HTTP.ClientDIR + '/' + dir.textures, 'image/bitmap', CreateTumb);
HTTP.AllowUpload.add('.obj', HTTP.ClientDIR + '/' + dir.models, 'application/octet-stream');
HTTP.AllowUpload.add('.fbx', HTTP.ClientDIR + '/' + dir.modelsFbx, 'application/octet-stream');
HTTP.AllowUpload.add('.mp3', HTTP.ClientDIR + '/' + dir.audio, 'audio/mpeg');
HTTP.AllowUpload.add('.ogg', HTTP.ClientDIR + '/' + dir.audio, 'application/ogg');
HTTP.AllowUpload.add('.mid', HTTP.ClientDIR + '/' + dir.audio, 'audio/midi');



//on rcv expecific post data
HTTP.AllowUpload.onData('AUDIOSAVE', SaveAudioJson, ADMIN, PASS);
HTTP.AllowUpload.onData('SAVETILE', SaveTileJson, ADMIN, PASS);
HTTP.AllowUpload.onData('SAVEMAP', SaveMapJson, ADMIN, PASS);
HTTP.AllowUpload.onData('SAVEITEM', SaveItemJson, ADMIN, PASS);
HTTP.AllowUpload.onData('SAVENTITY', SaveEntityJson, ADMIN, PASS);
HTTP.AllowUpload.onData('MAPCHANGESTATUS', MapChangeSta, ADMIN, PASS);








//SERVER -> BROWSER
HTTP.AllowTransfer.add(".mid", null, "audio/midi");
HTTP.AllowTransfer.add(".ogg", null, "application/ogg");
HTTP.AllowTransfer.add(".mp3", null, "audio/mpeg3");
HTTP.AllowTransfer.add(".png", null, "image/png");
HTTP.AllowTransfer.add(".bmp", null, "image/bitmap");
HTTP.AllowTransfer.add(".jpg", null, "image/jpeg");
HTTP.AllowTransfer.add(".gif", null, "image/gif");
HTTP.AllowTransfer.add(".ico", null, "image/ico");
HTTP.AllowTransfer.add(".js", null, "text/javascript");
HTTP.AllowTransfer.add(".css", null, "text/css");
HTTP.AllowTransfer.add(".pmx", null, "application/octet-stream");
HTTP.AllowTransfer.add(".vmd", null, "application/octet-stream");
HTTP.AllowTransfer.add(".obj", null, "application/octet-stream");
HTTP.AllowTransfer.add(".fbx", null, "application/octet-stream");
HTTP.AllowTransfer.add(".html", null, "text/html");
HTTP.AllowTransfer.add(".json", null, "application/json");

//extension - default location(null=same as request) - mine type

//Create WebServer
var HTTPSERVER = HTTP.START(OnHttpRequest, WebPort);

//create Websocket
SOCKET.protocolName = "game1";
SOCKET.START(HTTPSERVER, OnWebsocketMessage);

//Create AI game Inteligence and comunication
AI.HELPER = HELPER;
AI.SOCKET = SOCKET;
AI.control('ACTIVATE',true);

/*IRC.CONNECT();
disabled chat reader duo create sockets to send message to page
IRC.ONCHAT = function (from, msg) {
  fs.appendFile('chat.html',
    "<p><b>" + from + "</b>:" + msg + "</p>\r\n",
    function (err) {
      if (err) throw err;
    });
}
*/
//HELPER.writeFileForce('/home/didi/game/server/data/players/xx','aaa');