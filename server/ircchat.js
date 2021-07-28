//const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

var owner="mariodevelop";   //repl.it nickname
var streamchannel='mariodevelop';
var irclogin='mariodevelop';
var ircOauth="em11rx2p54kcy95r1r60uvlvxu8066";


//#############################################
//#####          IRC Controll
//#############################################
var connection,mylogin,myauth,mychannel
async function Iconnect(login,auth,channel){ //conecta
console.log(ircOauth);
	mylogin=login; myauth=auth;
  if(typeof(channel)=="undefined" || channel==''){
  mychannel=mylogin}else{mychannel=channel}
	if(typeof(connection)=='undefined' || connection==null)
  connection = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
  connection.onopen = function () {
    connection.send('CAP REQ :twitch.tv/commands');
    connection.send('CAP REQ :twitch.tv/membership');
    connection.send('CAP REQ :twitch.tv/tags');
    connection.send('PASS oauth:'+myauth);
    connection.send('NICK '+mylogin);
    connection.send('JOIN #'+mychannel);
    connection.send('USER #'+mylogin);
  };connection.onerror = function (error) {
    console.log('IRC Error: ' + error);
  };connection.onmessage = async function (e) {
		var message=e.data.trim();    
    if(message=="PING :tmi.twitch.tv"){//PING PONG
      connection.send('PONG');
    }
    if(message.startsWith(':tmi.twitch.tv 001 '+mylogin+' :Welcome, GLHF!') && message.endsWith(':tmi.twitch.tv GLOBALUSERSTATE')){
			console.log('Conectado ao Chat: '+mychannel);
		}
    try{await trataMsg(message);}catch(e){
        console.log('erorx '+e);}
  };
}

async function trataMsg(message){
  if(message==null || typeof(message)=='undefined' || message.trim()=="")return;
	var msgsplit=message.split(';');
	for(var i=0;i<msgsplit.length;i++){
			if(msgsplit[i].startsWith('user-type=') && msgsplit[i].includes('PRIVMSG')){
        try{
				  await actMessage(message);
        }catch(e){
          console.log('erory '+e);
        }
			}
	}
}

async function FALAR(pessoa,msg){
  connection.send(
       'PRIVMSG #'+mychannel+' : @'+
       pessoa+' '+msg
      ); 
}

async function actMessage(msg){ //mensagem Recebida do chat
	var msgsplit=msg.split(';');
	var msgs={};
	for(var i=0;i<msgsplit.length;i++){
		var keym=msgsplit[i].split('=');
		msgs[keym[0]]=msgsplit[i].substr(keym[0].length);
	}
	msgs['nick']=msgs['user-type'].split('!')[0].substr(3);
	msgs['channel']=msgs['user-type'].split('PRIVMSG #')[1].split(' :')[0];
	msgs['texto']=msgs['user-type'].split('PRIVMSG #')[1].substr(msgs['channel'].length+2);
	console.log(
    msgs['channel'],
    msgs['nick'],
    msgs['texto']
  );
  var barray=msgs['texto'].toUpperCase().split(' ');

  //APPEND(msgs['nick'],msgs['texto'])
  if(typeof(module.exports.ONCHAT)!=="undefined")
  module.exports.ONCHAT(msgs['nick'],msgs['texto']);
}

function APPEND(from,msg){  
}

//#############################################
//#####          IRC Controll END
//#############################################

module.exports = {
    CONNECT:function(){
      Iconnect(irclogin,ircOauth,irclogin);
      return connection;
    },
    ONCHAT:APPEND
}