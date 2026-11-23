/* Aviso independente de matrículas: uma apresentação por sessão na página inicial. */
(function(root){
  'use strict';
  const KEY='manari-matriculas-2027-v1';
  function eligible(location,document){
    const hash=location.hash.toLowerCase(),params=new URLSearchParams(location.search);
    return ['','#','#inicio','#home'].includes(hash)&&!params.has('post')&&!params.has('portal_invite')&&!!document.querySelector('#mainView .home-hero')&&!document.body.classList.contains('manari-feed-home');
  }
  function create(window,document,scriptUrl){
    const base=new URL('./',scriptUrl),education=new URL('educacao/?servico=matricula#matriculas-2027',base);
    let seen=false,preparing=false,ready=false,failed=false,dialog=null,observer=null,previousFocus=null,framePending=false,backdrop=null;
    try{seen=window.sessionStorage.getItem(KEY)==='1'}catch{}
    function consumed(){if(seen)return true;try{return window.sessionStorage.getItem(KEY)==='1'}catch{return false}}
    function cleanup(){document.documentElement.classList.remove('m27-scroll-locked');backdrop?.remove();backdrop=null}
    function close(restoreFocus=true){
      if(!dialog?.open)return;
      if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
      cleanup();if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    }
    function build(){
      dialog=document.createElement('dialog');dialog.id='manari-enrollment-2027';dialog.className='m27-dialog';dialog.setAttribute('aria-label','Matrículas abertas 2027');dialog.setAttribute('aria-modal','true');dialog.setAttribute('data-nosnippet','');
      dialog.innerHTML='<div class="m27-art-scroll"><img class="m27-art" width="1454" height="1536" alt="Prefeitura Municipal de Manari. Matrículas abertas 2027. Secretaria Municipal de Educação e Cultura."><button type="button" class="m27-close" aria-label="Fechar anúncio de matrículas" autofocus></button><a class="m27-details"><span class="m27-sr-only">Ver mais informações</span></a></div>';
      const details=dialog.querySelector('.m27-details');details.href=education.href;
      details.addEventListener('click',()=>close(false));
      dialog.querySelector('.m27-close').addEventListener('click',()=>close());
      dialog.addEventListener('cancel',event=>{event.preventDefault();close()});dialog.addEventListener('close',cleanup);
      dialog.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();close();return}
        if(event.key==='Tab'&&typeof dialog.showModal!=='function'){
          const controls=[dialog.querySelector('.m27-close'),details];const current=controls.indexOf(document.activeElement),next=(current+(event.shiftKey?-1:1)+controls.length)%controls.length;event.preventDefault();controls[next].focus();
        }
      });
      document.body.append(dialog);
      const image=dialog.querySelector('.m27-art');image.addEventListener('load',()=>{ready=true;preparing=false;check()},{once:true});image.addEventListener('error',()=>{failed=true;preparing=false;dialog.remove();dialog=null;window.console?.warn('O anúncio de matrículas não pôde carregar a imagem.')},{once:true});
      image.src=new URL('matriculas-aviso-2027.png',base).href;
      if(image.complete&&image.naturalWidth>0){ready=true;preparing=false}
    }
    function check(){
      const home=eligible(window.location,document);
      if(dialog?.open){if(!home)close(false);return}
      if(consumed()||failed||!home)return;
      if(document.querySelector('dialog[open],.mpa-overlay.open,.mpi-overlay.open,#adminModal:not(.hidden),#simpleModal:not(.hidden)'))return;
      if(!dialog){preparing=true;build()}
      if(preparing||!ready||!eligible(window.location,document))return;
      previousFocus=document.activeElement;
      try{
        if(typeof dialog.showModal==='function')dialog.showModal();else{backdrop=document.createElement('div');backdrop.className='m27-fallback-backdrop';document.body.append(backdrop);dialog.classList.add('m27-fallback');dialog.setAttribute('open','')}
        document.documentElement.classList.add('m27-scroll-locked');seen=true;try{window.sessionStorage.setItem(KEY,'1')}catch{}
        observer?.disconnect();dialog.querySelector('.m27-close').focus({preventScroll:true});
      }catch{cleanup();window.console?.warn('Não foi possível abrir o anúncio de matrículas.')}
    }
    function schedule(){if(framePending)return;framePending=true;window.requestAnimationFrame(()=>{framePending=false;check()})}
    const main=document.getElementById('mainView');if(main){observer=new window.MutationObserver(schedule);observer.observe(main,{childList:true,subtree:true})}
    for(const name of ['hashchange','popstate','pageshow'])window.addEventListener(name,schedule);
    document.addEventListener('click',schedule,true);check();return {check,close};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={KEY,eligible,create};
  if(root.document&&!root.__MANARI_ENROLLMENT_2027__){root.__MANARI_ENROLLMENT_2027__=true;const document=root.document,scriptUrl=document.currentScript?.src||new URL('enrollment-popup.js',document.baseURI).href;const start=()=>create(root,document,scriptUrl);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()}
})(typeof window!=='undefined'?window:globalThis);
