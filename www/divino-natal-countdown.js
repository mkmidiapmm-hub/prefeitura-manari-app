/* Contagem regressiva do acendimento; data e horário informados pela Prefeitura. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.create(root,root.document);})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const EVENT_AT='2026-11-29T19:00:00-03:00',TARGET=Date.parse(EVENT_AT);
 function remaining(now=Date.now()){
  if(!Number.isFinite(now))throw Error('Horário inválido.');
  const total=Math.max(0,Math.ceil((TARGET-now)/1000));
  return {days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60,ended:now>=TARGET};
 }
 function eligible(window,document){return !!document.querySelector('#mainView .home-hero')&&!document.body.classList.contains('manari-feed-home')&&!new URLSearchParams(window.location.search).has('post');}
 function create(window,document){
  if(window.ManariNatalCountdown)return window.ManariNatalCountdown;
  let timer=null,queued=false;
  const stop=()=>{if(timer!==null){window.clearInterval(timer);timer=null;}};
  function tick(){
   const card=document.getElementById('manariNatalCountdown');if(!card)return;
   const left=remaining(window.Date.now());
   const clock=card.querySelector('[data-natal-clock]'),ended=card.querySelector('[data-natal-ended]');
   clock.hidden=left.ended;ended.hidden=!left.ended;
   if(left.ended){stop();return;}
   clock.setAttribute('aria-label',`${left.days} dias, ${left.hours} horas, ${left.minutes} minutos e ${left.seconds} segundos para o acendimento do Divino Natal.`);
   for(const key of ['days','hours','minutes','seconds']){const value=String(left[key]).padStart(2,'0'),node=card.querySelector(`[data-natal-${key}]`);if(node.textContent!==value)node.textContent=value;}
  }
  function sync(){
   queued=false;
   if(!eligible(window,document)){document.getElementById('manariNatalCountdown')?.remove();stop();return;}
   const copy=document.querySelector('#manariDivinoNatal .dn-banner-copy');if(!copy){stop();return;}
   let card=document.getElementById('manariNatalCountdown');
   if(!card){
    card=document.createElement('section');card.id='manariNatalCountdown';card.className='dn-countdown';card.setAttribute('aria-labelledby','natalCountdownTitle');
    card.innerHTML='<h3 id="natalCountdownTitle">Contagem regressiva para o acendimento</h3><p class="dn-countdown-when"><time datetime="'+EVENT_AT+'">Domingo, 29 de novembro, às 19h</time><span>Praça de Manari · Horário de Pernambuco</span></p><div class="dn-countdown-clock" data-natal-clock role="timer" aria-live="off">'+[['days','Dias'],['hours','Horas'],['minutes','Minutos'],['seconds','Segundos']].map(([key,label])=>'<div class="dn-countdown-unit"><strong data-natal-'+key+'>—</strong><span>'+label+'</span></div>').join('')+'</div><p class="dn-countdown-ended" data-natal-ended role="status" hidden>Chegou o horário previsto para o acendimento das luzes do Divino Natal!</p>';
    const link=copy.querySelector('.dn-cta');if(link)copy.insertBefore(card,link);else copy.append(card);
   }
   tick();if(timer===null&&!remaining(window.Date.now()).ended)timer=window.setInterval(tick,1000);
  }
  const observer=new window.MutationObserver(records=>{if(records.every(r=>r.target.closest?.('#manariNatalCountdown')))return;if(!queued){queued=true;window.requestAnimationFrame(sync);}});
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('hashchange',sync);window.addEventListener('pageshow',sync);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  const api={sync,tick,destroy(){stop();observer.disconnect();document.getElementById('manariNatalCountdown')?.remove();}};window.ManariNatalCountdown=api;sync();return api;
 }
 return {EVENT_AT,TARGET,remaining,eligible,create};
});
