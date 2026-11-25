/* Atualiza somente a instalação existente; preserva sessão, formulários e cadastros. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.start(root,root.document);})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function refreshURL(href,now=Date.now()){const u=new URL(href);u.searchParams.set('versao','6.53');u.searchParams.set('atualizar',String(now));return u.href;}
 function start(window,document){
  const button=document.getElementById('edu-refresh-page');if(button)button.addEventListener('click',()=>window.location.replace(refreshURL(window.location.href)));
  if(!window.navigator?.serviceWorker?.getRegistration)return Promise.resolve();
  const scope=new URL('../',window.location.href).href;
  return window.navigator.serviceWorker.getRegistration(scope).then(registration=>registration?.update?.()).catch(()=>{});
 }
 return {refreshURL,start};
});
