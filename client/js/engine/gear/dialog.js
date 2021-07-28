ENGINE.DIALOG = {
  width:320,
  _mbYcallback: null,
  _mbNcallback: null,
  reset:function(){
    try{
    $("#dialog").dialog('close');
    }catch(e){}
    $('.ui-dialog').remove();
    $('#dialogholder').html(
    `<div id="dialog" title="Basic dialog" style="display:none">
	  </div>`);
  },
  load: function (dialogname, callback) {
    $.ajax('./js/dialog/' + dialogname).done(function (data) {
      if (typeof (callback) == 'function'){        
        callback(data);
      }        
    });
  },  
  check: function () {
    if (!window.jQuery) { console.error("Error on Load Jquery"); return false; }
    return true;
  },
  popup: function (msg, title, noreplace) {
    if (!this.check) return;
    if (noreplace != true) msg = msg.replace(/\n/g, "<br />");
    msg = '<div align=center>' + msg + '<div><br>';
    $("#dialog").attr('title', title);
    $("#dialog").html(msg).dialog();    
    $("#dialog").dialog('option','width',ENGINE.DIALOG.width);
  },
  fileupload: function (callback) {  
    window.FILEUPLOADED=callback;  
    $("#dialog2").dialog();
  },
  prompt: function (msg, title, callbackYes, callbackNo) {
    if (!this.check) return;
    msg = msg.replace(/\n/g, "<br />") + '<br><br>';
    msg = msg + '<input type="button" onClick="ENGINE.DIALOG._mbY()" value="YES">';
    msg = msg + '<input type="button" onClick="ENGINE.DIALOG._mbN()" value="NO">';
    msg = '<div align=center>' + msg + '<div>';
    ENGINE.DIALOG._mbNcallback = callbackNo;
    ENGINE.DIALOG._mbYcallback = callbackYes;
    $("#dialog").attr('title', title);
    $("#dialog").html(msg).dialog();
    $("#dialog").dialog('option','width',ENGINE.DIALOG.width);
  },
  request: function (msg, title, normal, callback) {
    if (!this.check) return;
    msg = msg.replace(/\n/g, "<br />") + '<br><br>';
    msg = msg + '<input type="text" id="DIALOGTXT" value="' + normal + '"><br><br>';
    msg = msg + '<input type="button" onClick="ENGINE.DIALOG._mbY()" value="OK">';
    msg = msg + '<input type="button" onClick="ENGINE.DIALOG._mbN()" value="CANCEL">';
    msg = '<div align=center>' + msg + '<div>';
    ENGINE.DIALOG._mbNcallback = callback;
    ENGINE.DIALOG._mbYcallback = callback;
    $("#dialog").attr('title', title);
    $("#dialog").html(msg).dialog();
    $("#dialog").dialog();
    $("#dialog").dialog('option','width',ENGINE.DIALOG.width);
    $('#DIALOGTXT').focus();
  },
  login: function (msg, title, callback) {
    if (!this.check) return;
    msg = msg.replace(/\n/g, "<br />") + '<br><br>';
    msg = msg + '<input type="text" id="DIALOGLOGIN" placeholder="LOGIN" value="'+ENGINE.login+'"><br>';
    msg = msg + 
    '<input type="password" id="DIALOGPASS" placeholder="PASSWORD" value="'+ENGINE.pass+'"><br><br>';
    msg = msg + '<input type="button" onClick="ENGINE.DIALOG._mbL()" value="OK" style="width: 80px;">';
    msg = msg + '<input type="button" onClick="ENGINE.DIALOG._mbN()" value="Create" style="width: 80px;">';
    msg = '<div align=center>' + msg + '<div>';
    ENGINE.DIALOG._mbNcallback = ENGINE.GAME.createLogin;
    ENGINE.DIALOG._mbYcallback = callback;
    $("#dialog").attr('title', title);
    $("#dialog").html(msg).dialog();
    $("#dialog").dialog('option','width',ENGINE.DIALOG.width);
    $('#DIALOGTXT').focus();
  },
  _mbL: function () {
    var txtLOGIN = $('#DIALOGLOGIN');
    if (typeof (txtLOGIN) != "undefined") { txtLOGIN = txtLOGIN.val(); }
    else { txtLOGIN = null; }
    var txtPASS = $('#DIALOGPASS');
    if (typeof (txtPASS) != "undefined") { txtPASS = txtPASS.val(); }
    else { txtPASS = null; }
    ENGINE.DIALOG.reset();
    if (typeof (ENGINE.DIALOG._mbYcallback) == 'function') {
      ENGINE.DIALOG._mbYcallback(txtLOGIN, txtPASS);
    }
    ENGINE.DIALOG._mbYcallback = null;
    ENGINE.DIALOG._mbNcallback = null;
  },
  _mbY: function () {
    var txtDIAG = $('#DIALOGTXT');
    if (typeof (txtDIAG) != "undefined") { txtDIAG = txtDIAG.val(); }
    else { txtDIAG = null; }
    ENGINE.DIALOG.reset();
    if (typeof (ENGINE.DIALOG._mbYcallback) == 'function') {
      ENGINE.DIALOG._mbYcallback(txtDIAG, null);
    }
    ENGINE.DIALOG._mbYcallback = null;
    ENGINE.DIALOG._mbNcallback = null;
  },
  _mbN: function () {
    ENGINE.DIALOG.reset();
    if (typeof (ENGINE.DIALOG._mbNcallback) == 'function') {
      ENGINE.DIALOG._mbNcallback(null, null);
    }
    ENGINE.DIALOG._mbNcallback = null;
    ENGINE.DIALOG._mbYcallback = null;
  }
}