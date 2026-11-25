/* Uma visita compartilhada entre as páginas; o servidor controla a sessão. */
(()=>{
 'use strict';
 if(window.__MANARI_VISIT_COUNTER__)return;window.__MANARI_VISIT_COUNTER__=true;
 const counter=document.createElement('aside');counter.id='manariVisitCounter';counter.className='mvc-counter';counter.setAttribute('aria-label','Contador de visitas ao portal');
 counter.innerHTML='<span class="mvc-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>Visitas ao portal</span><strong class="mvc-value" aria-live="polite">Carregando…</strong>';
 counter.title='Contagem de visitas desde a ativação do contador. Uma nova visita é registrada após 30 minutos sem abrir outra página do portal.';
 const header=document.querySelector('#app>.topbar,body>header');
 if(header)header.after(counter);else{const main=document.querySelector('main');if(main)main.before(counter);else document.body.prepend(counter);}
 const value=counter.querySelector('.mvc-value');
 const official=['manari.pe.gov.br','www.manari.pe.gov.br'].includes(location.hostname);
 if(!official){value.textContent='Disponível no portal oficial';return;}
 let busy=false,registered=false,retryAt=0;
 async function update(){
  if(busy||document.visibilityState==='hidden'||Date.now()<retryAt)return;
  busy=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const method=registered?'GET':'POST';
   const res=await fetch('/api/visits',{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,...(method==='POST'?{headers:{'Content-Type':'application/json'},body:'{}'}:{})});
   if(!res.ok)throw new Error('Counter unavailable');const data=await res.json();
   if(!Number.isSafeInteger(data.total)||data.total<0)throw new Error('Invalid count');
   registered=true;value.textContent=new Intl.NumberFormat('pt-BR').format(data.total);counter.classList.remove('mvc-unavailable');
  }catch{value.textContent='Temporariamente indisponível';counter.classList.add('mvc-unavailable');retryAt=Date.now()+30000;}
  finally{clearTimeout(timer);busy=false;}
 }
 update();setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')update();});
})();
