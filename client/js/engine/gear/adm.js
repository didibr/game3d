
ENGINE.ADM = {

  show: function () {
    function showdlg() {
      ENGINE.DIALOG.load('adm.html', function (dialog) {
        ENGINE.DIALOG.popup(dialog, 'ADMIN Tools', true);
        $("#tabs").tabs();
        $('#loadmaps').load(ENGINE.url + 'GETMAPS', function () {
          $('#loadmpsel').off('change').change(function () { ENGINE.ADM._mapchange(this); });
        });
        ENGINE.ADM._tabSelect(1);
        $('div[aria-describedby="dialog"]').css({ 'left': '0px', 'top': '0px' });
      });
    }


    ENGINE.DIALOG.login('Login', 'Admin Login', function (login, pass) {
      ENGINE.login = login;
      ENGINE.pass = pass;
      showdlg();
    });

  },

  _tabSelect: function (num) {

  },

  _mapchange: function (selector) {
    var map = $(selector).val();
    var url = ENGINE.url + 'MAPSTATUS' + map;
    HELPER.simpleDownload(url, function (data) {
      if (data.resp == true) {
        $('#btact').val('Deactivate');
      } else {
        $('#btact').val('Activate');
      }
    });
  },

  _active: function (button) {
    var action = $('#btact').val() == 'Activate' ? true : false;
    ENGINE.ADM._sendAdmCmd({CMD:'MapOnOff',VAL:action},function(){
      ENGINE.ADM._mapchange($('#loadmpsel'));   
    })
  },

  _sendAdmCmd:function(comand,callback){
    var map = $('#loadmpsel').val();
    var url = ENGINE.url + ENGINE.conf.dir.upload +
      '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
    var jsonv = JSON.stringify({name: map,elements: comand});
    HELPER.simpleuploadData(url, 'MAPCHANGESTATUS', jsonv, function (resp) {
      if(typeof(callback)=='function')callback(resp);   
    });
  }


}