
const http = require('http');
const formidable = require('formidable');
var path = require('path');
const fs = require('fs');
const HELPER = require('./helper');

var server = null;
var Port = 80;
var waitClose = false;

var serverdir = __dirname;
var clientdir = serverdir.replace('/server', '/client');

var allowtransfer = {};
var allowupload = {};
var headers = {};
// IE8 does not allow domains to be specified, just the *
// headers["Access-Control-Allow-Origin"] = req.headers.origin;
headers["Access-Control-Allow-Origin"] = "*";
headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
headers["Access-Control-Allow-Credentials"] = false;
headers["Access-Control-Max-Age"] = '0'; // 24 hours
headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";

function uploadfile(req, res, uploadDir, moveDir) {
  //console.log('upload',req.data);
  var form = new formidable.IncomingForm(),
    files = [],
    fields = [];
  form.uploadDir = uploadDir;

  form.on('field', function (field, value) {
    fields.push([field, value]);
  }).
    on('file', function (field, file) {
      files.push([field, file]);
      var extension = path.extname(file.path + file.name);
      var filename = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      //console.log(file.name, file.size, file.type, file.path);
      //console.log(allowupload[extension]);
      //console.log(file.type,allowupload[extension].type);
      try {
        if (
          //check if filename and extension is permited
          typeof (allowupload[extension]) != "undefined" &&
          file.type === allowupload[extension].type
        ) {
          //console.log('passou',allowupload[file.type]);
          var local = allowupload[extension].location;
          //var ext = extension;
          var call = allowupload[extension].call;
          //if (!fs.existsSync(local + filename)) {
            res.writeHead(200, headers);
            res.end('File Transfered');
            HELPER.movefile(file.path, local + filename);
            if (typeof (call) == 'function') call(file.path, local, filename);
          /*} else {
            res.writeHead(200, headers);
            res.end('File already Exist');
            console.log('File already Exist:' + filename);
            console.log('on '+file.path);
            fs.unlinkSync(file.path);
          }*/
        } else {
          console.log('Upload not Allowed');
          console.log(filename + ' - ' + file.type);
          fs.unlinkSync(file.path);
          waitClose = false;
          //res.writeHead(404, headers);
          res.end();//invalid 
        }
      } catch (e) {
        console.log('Error Upload ' + e);
      }
    })
    .on('end', function () {
      console.log('Post data End');
    });

  form.parse(req, (err, fields, files) => {
    if (typeof (allowupload['ONDATA']) == 'undefined') return;
    for (var i = 0; i < allowupload['ONDATA'].length; i++) {
      var fname = allowupload['ONDATA'][i].name;
      if (typeof (fields[fname]) !== 'undefined') {
        if (typeof (allowupload['ONDATA'][i].callback) != 'undefined') {
          allowupload['ONDATA'][i].callback(fields[fname]);
        }
      }
    }
    res.end();
  });
}

function fileLoad(url, res, content, isServer) {
  var newdir = clientdir;
  if (isServer == true)
    newdir = serverdir;
  var file = path.join(newdir, url);
  var filename = path.basename(file);
  var extension = path.extname(file);
  try {
    //locate on upload location for files missed
    if (!fs.existsSync(file) && typeof (allowupload[extension]) != "undefined"){ 
      if(fs.existsSync(allowupload[extension].location+'/'+filename)){
        file=allowupload[extension].location+'/'+filename;
      }      
    }
    if(filename=='dummy.fbx')file=clientdir+'/dummy.fbx';
    var fileToLoad = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': content });
    res.end(fileToLoad);
    //console.log('Transfered:'+file);
  } catch (e) {
    console.log('\x1b[31m', 'File not found - ' + file);//red
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('File not found - ' + file);
  }
}

module.exports = {
  ClientDIR: clientdir,
  ServerDIR: serverdir,
  AllowTransfer: {
    add: function (extension, location, minetype, callback) {
      allowtransfer[extension] = { 'location': location, 'type': minetype, call: callback }
    },
    remove: function (extension) {
      delete (allowtransfer[extension]);
    },
    clear: function () {
      allowtransfer = {};
    }
  },
  AllowUpload: {
    config: function (tempDir, urlPost) {
      allowupload['CONFIG'] = { 'temp': tempDir, 'urlpost': urlPost };
    },
    passwordprotect: function (login, pass) {
      allowupload['PASSP'] = { 'login': login, 'pass': pass }; //null null = no passw
    },
    add: function (extension, location, minetype, callback) {
      allowupload[extension] = { 'location': location, 'type': minetype, 'call': callback }
    },
    remove: function (extension) {
      delete (allowupload[extension]);
    },
    onData: function (data, callback, administrator, passowrd) {
      if (typeof (allowupload['ONDATA']) == "undefined") allowupload['ONDATA'] = [];
      if (typeof (administrator) == 'undefined') administrator = null;
      if (typeof (passowrd) == 'undefined') passowrd = null;
      allowupload['ONDATA'].push
        ({ 'name': data, 'callback': callback, login: administrator, pass: passowrd });
    },
    clear: function () {
      allowupload = {};
    }
  },
  WaiToCLOSE: function (wait) {
    waitClose = wait;
  },
  START: function (REQUEST, port) {
    if (typeof (port) != 'undefined') { Port = port; }
    server = http.createServer(function (req, res) {
      res.writeHead(200, headers);

      //Default Response for File Uploads
      if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        res.end();
      }
      var paa = path.extname(req.url);
      //Check for File Uploads
      if (typeof (allowupload['CONFIG']) != 'undefined' &&
        allowupload['CONFIG'].temp != null &&
        allowupload['CONFIG'].urlpost != null
      ) {
        if (req.method === 'POST' && req.url.startsWith(allowupload['CONFIG'].urlpost)) {
          try {
            var login = HELPER.getUrlVariable(req, 'login');
            var pass = HELPER.getUrlVariable(req, 'pass');
            if (typeof (allowupload['PASSP']) != 'undefined' &&
              allowupload['PASSP'].login != null &&
              allowupload['PASSP'].pass != null) {
              //passowrd protected              
              if (allowupload['PASSP'].login == login &&
                allowupload['PASSP'].pass == pass) { //Acept password                
                console.log('Upload with Login');
                waitClose = true;
                uploadfile(req, res, allowupload['CONFIG'].temp);//server/upload/
                return;
              } else { //password not acepted
                console.log('Wrong Login to Upload');
                waitClose = false;
                res.end();//invalid                                 
                return;
              }
            } else {
              console.log('Upload without Login');
              waitClose = true;
              uploadfile(req, res, allowupload['CONFIG'].temp);//server/upload/
              return;
            }

          } catch (e) {
            console.log('Error Upload ', e);
          }
        }
      }
      //Check for File Transfers     
      if (typeof (allowtransfer[paa]) != "undefined") {
        var deffile = allowtransfer[paa].location;
        if (deffile == null) deffile = decodeURI(req.url);
        fileLoad(deffile, res, allowtransfer[paa].type);
      } else {
        res.writeHead(301, { Location: '/404.html' });
        if (typeof (REQUEST) != 'undefined') REQUEST(req, res);
        if (waitClose == false) res.end();
      }
    }).listen(Port, function () {
      console.log('Http Created on Port: ' + Port);
    });
    return server;
  },
  LOADFILE: function (FILE, res, Type, isServer) {
    fileLoad(FILE, res, Type, isServer);
  },
  UPLOADFILE: function (req, res, uploadDir, moveDir) {
    uploadfile(req, res, uploadDir, moveDir);
  }
}