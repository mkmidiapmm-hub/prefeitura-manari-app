/* Preserva as marcas originais e usa versões completas quando disponíveis. */
(()=>{
 'use strict';
 if(window.__MANARI_SECRETARIAT_LOGOS__)return;window.__MANARI_SECRETARIAT_LOGOS__=true;
 const full=new Set(["agricultura", "tributos", "saude", "esportes", "assistencia", "administracao", "infraestrutura", "financas", "educacao", "mulher"]);
 const whiteText=new Set(['comunicacao','creas','planejamento','juridico']);
 const base=new URL('./assets/secretarias/',document.currentScript?.src||document.baseURI);
 let queued=false;
 function sync(){
  document.querySelectorAll('#manariSecretariasRail .secretaria-chip[data-dept]').forEach(chip=>{
   const img=chip.querySelector('img');if(!img||img.closest('.msr-logo'))return;
   const dept=chip.dataset.dept,frame=document.createElement('span');frame.className='msr-logo';frame.setAttribute('aria-hidden','true');
   if(whiteText.has(dept))frame.classList.add('msr-logo-contrast');
   if(full.has(dept)){
    frame.classList.add('msr-logo-full');const original=img.src;
    img.addEventListener('error',()=>{img.src=original;frame.classList.remove('msr-logo-full');},{once:true});
    img.src=new URL(dept+'.png',base).href;
   }
   img.before(frame);frame.append(img);
  });
  document.querySelectorAll('.page-wrap[data-swipe-route]').forEach(page=>{
   const dept=page.dataset.swipeRoute;if(!full.has(dept))return;
   page.querySelectorAll('.hero-copy .kicker img,.hero-badge img').forEach(img=>{
    if(img.classList.contains('official-secretariat-logo'))return;
    img.classList.add('official-secretariat-logo');img.src=new URL(dept+'.png',base).href;
   });
  });
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',schedule);sync();
})();
