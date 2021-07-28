//https://aerotwist.com/tutorials/creating-particles-with-three-js/
var analyser = null;
var analizerdata = null;
var listener = null;
var sound = null;
var audioLoader = null;
var uniforms = null;
var points = null;
var particles = null;
var particlesBase = null;
var fftSize = 256;
var fftsizeCute=180;
var maxBLOOM = 0.4;
var bgstartPos = { x: -15, y: 13.3, z: -10 };


var timebetweenbeat = 0;
var lastbeat = 0;
var mediabeat = null;
var bettime = 0;
var bnum = 0;

function AnalizeFFT(audioFile, videoFile) {
  //video = document.getElementById('player');
  var audiof = audioFile;
  if (listener == null)
    listener = new THREE.AudioListener();
  createParticles();
  //camera.add( listener );
  // create an Audio source
  if (sound == null) {
    sound = new THREE.Audio(listener);
  } else {
    sound.stop();
  }
  // load a sound and set it as the Audio object's buffer
  if (audioLoader == null)
    audioLoader = new THREE.AudioLoader();

  audioLoader.load(audiof, function (buffer) {
    sound.setBuffer(buffer);
    //sound.setLoop(true);
    sound.setVolume(1);
    sound.play();
    //video.play();
  });
  // create an AudioAnalyser, passing in the sound and 
  analyser = new THREE.AudioAnalyser(sound, fftSize);
  // get the average frequency of the sound
  //analizerdata = analyser.getAverageFrequency();    
}

var danceCHANGETIME = null;
var danceGOTOINIAL = null;
var danceSLOWINTRO = null;



function delayedinitial() {
  if (danceGOTOINIAL == null) {
    PosicaoDefinida('inicial');
    danceGOTOINIAL = setTimeout(function () {
      clearTimeout(danceGOTOINIAL);
      danceGOTOINIAL = null;
    }, 10000);
  }
}

function delayedintro() {
  if (danceSLOWINTRO == null) {
    changeAnimation(motionN('intro'), 0.5);
    danceSLOWINTRO = setTimeout(function () {
      clearTimeout(danceSLOWINTRO);
      danceSLOWINTRO = null;
    }, 10000);
  }
}


function clearDelayeds() {
  if (danceCHANGETIME != null) clearTimeout(danceCHANGETIME);
  if (danceGOTOINIAL != null) clearTimeout(danceGOTOINIAL);
  if (danceSLOWINTRO != null) clearTimeout(danceSLOWINTRO);
  danceCHANGETIME = null;
  danceGOTOINIAL = null;
  danceSLOWINTRO = null;
}


function updateAudio() {
  //videoPlaying = sound.isPlaying;  
  if (videoPlaying != true && sound.isPlaying == true) {
    videoPlaying = true;
    clearDelayeds();
    playMovie();
  }
  if (videoPlaying == true && sound.isPlaying != true) {
    videoPlaying = false;
    stopMovie();
    delayedinitial();
  }

  if (videoPlaying == true) {
    var gapn = 30;
    sound.currentTime = sound.context.currentTime - sound._startedAt;

    if (sound.currentTime + gapn > sound.buffer.duration) {//chegnado no final
      delayedintro();
      var calcx = sound.buffer.duration - sound.currentTime;
      var calcy = (calcx / 30);
      lastanimationAction.weight = calcy;
    } else { //nao ta chegando no final
      if (sound.currentTime < 30) {//ainda ta no comeco
        //changeAnimation(motionN('intro'),1);
      } else { //ta no meio da musica
        if (danceCHANGETIME == null) {
          changeAnimation(motionN('dance1'), 1);
          danceCHANGETIME = setTimeout(function () {
            clearTimeout(danceCHANGETIME);
            danceCHANGETIME = null;
          }, 10000);
        }
      }
    }
    if (sound.currentTime + 4 < sound.buffer.duration) {//tocando
    } else {								  //Parou de tocar
    }

  }
}

//sound.buffer.duration =
//position = sound.context.currentTime - sound._startedAt


function updateFFT() {
  if (analyser == null) return;
  updateAudio();  
  analizerdata = analyser.getFrequencyData();
  for (var p = 0; p < fftSize-fftsizeCute; p++) {
    particles[p].position.y = (bgstartPos.y - 6) +
      (analizerdata[p] / 25)

    particlesBase[p].position.y =
      particles[p].position.y - 7.5;
  }
  var freq = analyser.getAverageFrequency();
  var newbloom = (freq / 300);
  if (newbloom > maxBLOOM) newbloom = maxBLOOM;
  //POST.CHANGEBLOON(newbloom);
  LASTBLOON = window.POST.CHANGEBLOON(newbloom);
  ckeckBPM(freq);
}

function ckeckBPM(freq) {
  var minBTime = 20;
  var samPles = 10;
  var mediumbeat = 0;

  if (mediabeat == null) mediabeat = new Array(samPles + 1);
  timebetweenbeat = timebetweenbeat + 1; //counter under beat
  lastbeat = lastbeat - 0.2;
  if (freq > lastbeat) {
    lastbeat = freq;
    if (timebetweenbeat > minBTime) {
      mediabeat[bnum] = timebetweenbeat;
      bnum = bnum + 1;
      if (bnum > samPles) bnum = 0;
    }
    timebetweenbeat = 0;
    mediumbeat = 0
    for (var i = 0; i < samPles - 1; i++) {
      if (isNaN(mediabeat[i]) == false)
        mediumbeat += mediabeat[i];
    }
    mediumbeat = mediumbeat / samPles;
    if (mediumbeat > 10) bettime = mediumbeat;
  }

  //lastbeat=freq;
  $('#test').html(
    '<br>' + freq +
    '<br>' + lastbeat +
    '<br>' + timebetweenbeat +
    '<br>' + bettime);
}



function createParticles() {
  if (particles != null) return;
  particles = [];
  particlesBase = [];

  var planeGeometry =
    new THREE.PlaneBufferGeometry(0.3, 0.3);
  var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x4f4d7, emissive: 0xFFFFFF, side: THREE.DoubleSide });
  //planeMaterial.emissiveMap=texture;
  planeMaterial.transparent = true;
  planeMaterial.opacity = 0.7;

  var planeGeometryGlow =
    new THREE.PlaneBufferGeometry(0.35, 15);
  var planeMaterialGlow = new THREE.MeshStandardMaterial({ color: 0x4f4d7, emissive: 0xFFFFFF, side: THREE.DoubleSide });
  planeMaterialGlow.transparent = true;
  planeMaterialGlow.opacity = 0.9;

  for (var p = 0; p < fftSize-fftsizeCute; p++) {
    var barpoint = new THREE.Mesh(planeGeometry, planeMaterial);
    var planeGlow = new THREE.Mesh(planeGeometryGlow, planeMaterialGlow);


    scene.add(barpoint);
    scene.add(planeGlow);
    barpoint.visible = true;
    barpoint.receiveShadow = false;
    planeGlow.visible = true;
    planeGlow.receiveShadow = false;


    //plane.material.color.setRGB(0, 0.9, 1);
    particles.push(barpoint);
    particlesBase.push(planeGlow);

    var pX = (bgstartPos.x + (p * 0.4)),
      pY = bgstartPos.y,
      pZ = bgstartPos.z;
    barpoint.position.set(pX, pY, pZ);
    planeGlow.position.set(pX, pY, pZ);
  }
}    
