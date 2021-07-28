ENGINE.SOUND = {
    variable: class {
        audio = [] //audio - volume       
        loop = true
    },

    audiolist: null,

    _configureBaseView: function () {
        ENGINE.clear();
        ENGINE.Physic.debugPhysics = false;
        ENGINE.DIALOG.reset();
        //ENGINE.scene.add(TransformControl.control);    
        ENGINE.renderer.setClearColor('black');
        ENGINE.Physic.skinMaterial.visible = false;
        this.audiolist = new this.variable();
    },

    show: function (noReset, name) {
        if (ENGINE.login == null) {
            ENGINE.DIALOG.login('Login', 'Admin Login', function (login, pass) {
                ENGINE.login = login;
                ENGINE.pass = pass;
                ENGINE.SOUND.show();
            });
            return;
        }
        if (typeof (noReset) == 'undefined' || noReset != true)
            ENGINE.SOUND._configureBaseView();//initial configuration      
        ENGINE.DIALOG.load('sound.html', function (dialog) {
            ENGINE.DIALOG.popup(dialog, 'Sound Editor', true);
            if (typeof (name) !== 'undefined') $('#saveas').val(name);
            $("#tabs").tabs();
            ENGINE.SOUND._tabSelect(1);
            //$('#objSca').off('change').change(function () { ENGINE.EDITORT._textToObjUpd(this); });          
            $('div[aria-describedby="dialog"]').css({ 'left': '0px', 'top': '0px', 'width': '430px' });
        });

    },

    _noload: false,
    _tabSelect: function (num) {

        if (num == 1) {//GET COMPOSER SAVED
            $('#loadas').load(ENGINE.url + 'AUDIONAMES');
        }

        if (num == 2 && this._noload == false) {//GET AUDIO FILES
            //list sounds
            $('#audiolist').load(ENGINE.url + 'AUDIOLIST', (object) => {
                if ($('#audiolist').html().replace('history.back()', '') != $('#audiolist').html()) {
                    $('#audiolist').html('');
                }
                ENGINE.SOUND.autoMouse();
            });
        }
    },

    autoMouse: function () {
        $('#audiolist i').each((i, obj) => {
            $(obj).off('mouseover').on('mouseover', (evt) => {
                let target = $(evt.target);
                let id = parseInt(target.attr('id'));
                $('#' + id + 'A').prop('controls', true);
                //$('#' + id + 'C').show();
                $('#' + id + 'I').hide();
                ENGINE.SOUND.autoMouseOut('#' + id + 'A');
            })
        });
    },

    autoMouseOut: function (obj) {
        $(obj).hover(
            function () { },
            function () {
                let target = $(this);
                let id = parseInt(target.attr('id'));
                $('#' + id + 'A').prop('controls', null);
                //$('#' + id + 'C').hide();
                $('#' + id + 'I').show();
            }
        );
    },

    playAll: function () {
        $('#audiolist i').each((i, obj) => {
            let target = $(obj);
            let id = parseInt(target.attr('id'));
            if ($('#' + id + 'C').prop('checked') == true) {
                $('#' + id + 'A')[0].play();
            }
        });
    },

    stopAll: function () {
        $('#audiolist i').each((i, obj) => {
            let target = $(obj);
            let id = parseInt(target.attr('id'));
            $('#' + id + 'A')[0].pause();
            $('#' + id + 'A')[0].currentTime = 0;
        });
    },

    loop: function () {
        $('#audiolist i').each((i, obj) => {
            let target = $(obj);
            let id = parseInt(target.attr('id'));
            $('#' + id + 'A')[0].loop = $('#loop').prop('checked');
        });
    },

    _saveSound: function (button) {
        var nome = $('#saveas').val();
        if (nome.length < 4) {
            alert('Invalid Name');
            return;
        }
        this.stopAll();
        this.audiolist = new this.variable();
        this.audiolist.loop = $('#loop').prop('checked');
        $('#audiolist i').each((i, obj) => {
            let target = $(obj);
            let id = parseInt(target.attr('id'));
            if ($('#' + id + 'C').prop('checked') == true) {
                let file = $('#' + id + 'A source').attr('data-file');
                let volume = $('#' + id + 'A')[0].volume;
                ENGINE.SOUND.audiolist.audio.push({ file: file, volume: volume });
            }
        });
        jsonv = JSON.stringify({ name: nome, elements: ENGINE.SOUND.audiolist });
        var url = ENGINE.url + ENGINE.conf.dir.upload + '?login=' + ENGINE.login + '&pass=' + ENGINE.pass;
        HELPER.uploadData(url, button, 'AUDIOSAVE', jsonv, function () {
            ENGINE.EDITORT._tabSelect(1);
        });
    },

    _loadSound: async function (button) {
        var name = $('#loadasel option:selected').val();
        if (name == '---') return;
        $('#saveas').val(name);
        this._noload = true;
        $('#tab2').click();
        this._noload = false;
        //download save data        
        var data = await HELPER.simpleDownloadSync(ENGINE.url + 'AUDIOLOAD' + name);
        ENGINE.SOUND.audiolist = data;
        $('#loop').prop('checked', ENGINE.SOUND.audiolist.loop);
        //load all audios
        $('#audiolist').load(ENGINE.url + 'AUDIOLIST', (object) => {
            ENGINE.SOUND.autoMouse();
            $('#audiolist audio').each((i, obj) => { 
                obj.volume = 1; 
                obj=$(obj);
                var nid=parseInt(obj.attr('id'));                
                var file=obj.find('source').attr('data-file');                
                $('#' + nid + 'C').prop('checked', null);
                for(var i=0;i<ENGINE.SOUND.audiolist.audio.length;i++){
                    var audata=ENGINE.SOUND.audiolist.audio[i];
                    if(audata.file==file){
                        $('#' + nid + 'C').prop('checked', true);
                        $('#' + nid + 'A')[0].volume = audata.volume;
                        break;
                    }
                }
            });            
        });

return;
        $('#audiolist i').each((i, obj) => {
            let target = $(obj);
            let id = parseInt(target.attr('id'));
            $('#' + id + 'C').prop('checked', null);
            $('#' + id + 'A')[0].volume = 1;
            var file = $('#' + id + 'A source').attr('data-file');
            for (let index = 0; ENGINE.SOUND.audiolist.audio.length; index++) {
                const element = ENGINE.SOUND.audiolist.audio[index];
                if (element && file && element.file == file) {
                    $('#' + id + 'C').prop('checked', true);
                    $('#' + id + 'A')[0].volume = element.volume;
                    break;
                }

            }
        });


    },

}