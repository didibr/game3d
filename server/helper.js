
const fs = require('fs');
const ZIP = require('../client/zip');


module.exports = {
  GetMinutes: function (time) {
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;
    var ret = "";
    if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }
    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return 'Length ' + ret;
  },

  movefile: function (oldPath, newPath) {
    fs.rename(oldPath, newPath, function (err) {
      if (err) {
        console.log('Error on moving "' + oldPath + '" to "' + newPath + '"');
        return;
      } //throw err
      console.log('File moved to: ' + newPath);
    })
  },

  listFiles: function (directory, callback) {
    try {
      fs.readdir(directory, (err, files) => {
        if (typeof (callback) == 'function') callback(files);
      });
    } catch (e) {
      console.log('Error listFiles:' + e);
    }
  },

  writeFileForce: function (path, data) {
    fs.writeFile(path, data, { flag: 'w' }, function (err) {
      if (err) console.log('Error Helper writeFile', err);
    });
  },

  writeFile: function (path, data) {
    fs.writeFile(path, data, 'utf8', function (err) {
      if (err) console.log('Error Helper writeFile', err);
    });
  },

  readFile: function (path, callback) {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error Helper readFile', err);
      } else {
        if (typeof (callback) !== 'undefined') callback(data);
      }
    });
  },

  getUrlVariable: function (req, name) {
    var vars = [];
    var parts = [];
    var url = req.url;
    var urlfile = url.split('?');
    for (var i = 0; i < urlfile.length; i++) {
      parts.push(urlfile[i]);
    }
    for (var i = 0; i < parts.length; i++) {
      var findval = parts[i].split('&');
      for (var e = 0; e < findval.length; e++) {
        vars.push(findval[e]);
      }
    }
    for (var i = 0; i < vars.length; i++) {
      var preresp = vars[i].split('=');
      if (preresp.length == 2 && preresp[0] == name) {
        return preresp[1];
      }
    }
    return null;
  },

  reqStart: function (req, find) {
    if (req.url.startsWith(find) == true) {
      return true;
    } else {
      return false;
    }
  },

  compress: function (data) {
    return ZIP.compress(data);
  }

}




