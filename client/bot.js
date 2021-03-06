var chatin=null,chatbtn=null;

LoadBot();
CreateElements();
LoopChatReader();

var simulateClick = function (elem) { //simulador de click em elemento js vanila	
	var evt = new MouseEvent('click', {
		bubbles: true
	});	
	elem.dispatchEvent(evt);
};

function playaudio(){
  var player=document.getElementById('aaudio');
  player.volume=0.2;
  player.play();
}

function addaudioplayer(){
  var elem = document.createElement("div"); //CRIA BOTAO INICIAL e coloca Na pagina Injetada
    elem.id='divaudio';    
    elem.style.position='absolute';
    elem.style.display='block';                                            
    elem.style.top='100px';    
    elem.innerHTML =`
    <audio controls="" id="aaudio">
  <source src="https://www.w3schools.com/html/horse.ogg" type="audio/ogg">
  <source src="https://www.w3schools.com/html/horse.mp3" type="audio/mpeg">
Your browser does not support the audio element.
</audio>
    `;     
    elem.style.zIndex='1000';           
    document.getElementsByTagName('body')[0].appendChild(elem);
}

function CreateElements(){
    var elem = document.createElement("div"); //CRIA BOTAO INICIAL e coloca Na pagina Injetada
    elem.id='bot_buttom';    
    elem.style.backgroundColor='#ccc'; 
    elem.style.position='fixed';
    elem.style.display='block';                                            
    elem.style.cursor='pointer';
    elem.style.textAlign='center';   
    elem.style.width='50px';
    elem.style.height='50px';
    elem.style.top='0px';    
    elem.style.left='5px'; 
    elem.innerHTML ='BOT';     
    elem.style.zIndex='1000';       
    elem.style.paddingTop='15px';
    document.getElementsByTagName('body')[0].appendChild(elem);
}

function LoadBot(){
    chatin=document.querySelector('[data-a-target="chat-input"]');
    chatbtn=document.querySelector("[data-a-target=chat-send-button]");
    addaudioplayer();        
}


function LoopChatReader(msg){
    //PEGA todas linhas do Chat do Canal e colocar na variavel LINHAS
    var linhas=document.querySelectorAll('[data-a-target="chat-line-message"]');    
    //faz um loop em todas linhas pegas
    linhas.forEach(function(elemento,index){
        if(!elemento.classList.contains('LIDO')){ //s??mente linhas que n??o tem a classe LIDA
            elemento.classList.add('LIDO');//adiciona classe lida para linhas LIDAS
            var from="",msg="";
            var nickname=elemento.querySelector('[data-a-target="chat-message-username"]'); //nickname na linha
            var child_elements=elemento.querySelectorAll('*'); //pega tudo que tem na linha para fazer um loop
            child_elements.forEach(function(elem){
                if(elem.classList.contains('link-fragment')){ //tem um link html
                    msg+=elem.textContent;
                }
                if(elem.classList.contains('text-fragment')){ //tem um texto na linha
                    msg+=elem.textContent;
                }
            })            
            if(typeof nickname!=='undefined'){from=nickname.textContent;} //pega nick            
            if(from!=""&&msg!="")onChatMessage(from,msg);
        }        
    });
    setTimeout(() => {LoopChatReader();}, 400); //LOOP para ficar lendo as linhas sem parar
}

function ChatWrite(msg){        
    let input = chatin; 
    let lastValue = input.value;
    input.value = '/me ???? '+msg;
    let event = new Event('input', { bubbles: true });
    // hack React15
    event.simulated = true;
    // hack React16 ???????????????descriptor??????value?????????????????????
    let tracker = input._valueTracker;
    if (tracker) { tracker.setValue(lastValue);}
    input.dispatchEvent(event); 
    simulateClick(chatbtn);       
    //$jx(chatbtn[0]).click();
}

function onChatMessage(from,msg){//Quando ler uma mensagem Nova
  playaudio();
    //console.log(from,msg);
    //if(msg=='!debug'){
    //    ChatWrite('DEBUG OK 2');
    //}
}