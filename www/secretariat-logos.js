/* Preserva as marcas originais e usa versões completas quando disponíveis. */
(()=>{
 'use strict';
 if(window.__MANARI_SECRETARIAT_LOGOS__)return;window.__MANARI_SECRETARIAT_LOGOS__=true;
 const full=new Set(['agricultura','infraestrutura']);
 const whiteText=new Set(['mulher','comunicacao','tributos','creas','planejamento','juridico']);
 const base=new URL('./assets/secretarias/',document.currentScript?.src||document.baseURI);
 let queued=false;
 function sync(){
  document.querySelectorAll('#manariSecretariasRail .secretaria-chip[data-dept]').forEach(chip=>{
   const img=chip.querySelector('img');if(!img||img.closest('.msr-logo'))return;
   const dept=chip.dataset.dept,frame=document.createElement('span');frame.className='msr-logo';frame.setAttribute('aria-hidden','true');
   if(full.has(dept)||whiteText.has(dept))frame.classList.add('msr-logo-dark');
   if(full.has(dept)){
    frame.classList.add('msr-logo-full');const original=img.src;
    img.addEventListener('error',()=>{img.src=original;frame.classList.remove('msr-logo-full');},{once:true});
    img.src=new URL(dept+'.png',base).href;
   }
   img.before(frame);frame.append(img);
  });
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',schedule);sync();
})();
