// Faixa horizontal: mantém os elementos e os eventos originais de cada secretaria.
(() => {
 'use strict';
 if(window.__MANARI_VERTICAL_SECRETARIAS__)return;
 window.__MANARI_VERTICAL_SECRETARIAS__=true;
 const main=document.getElementById('mainView');if(!main)return;
 let queued=false;
 function mount(){
  let rail=document.getElementById('manariSecretariasRail');
  const sources=[...main.querySelectorAll('.secretaria-strip')].filter(el=>!el.closest('#manariSecretariasRail'));
  if(!rail){
   rail=document.createElement('nav');rail.id='manariSecretariasRail';rail.setAttribute('aria-label','Secretarias e áreas');
   rail.innerHTML='<div class="msr-head">Secretarias e áreas</div><div class="msr-frame" id="secretarias"><button type="button" class="msr-scroll" data-direction="-1" aria-label="Secretarias anteriores">‹</button><button type="button" class="msr-scroll" data-direction="1" aria-label="Próximas secretarias">›</button></div>';
   rail.addEventListener('click',event=>{
    const button=event.target.closest('.msr-scroll');if(!button)return;
    const strip=rail.querySelector('.secretaria-strip');
    strip?.scrollBy({left:Number(button.dataset.direction)*strip.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   });
  }
  const newest=sources.at(-1);
  if(newest){
   const previous=rail.querySelector('.secretaria-strip');const left=previous?.scrollLeft||newest.scrollLeft;
   const source=newest.parentElement;source.classList.add('manari-sector-source-hidden');if(source.id==='secretarias')source.removeAttribute('id');
   previous?.remove();rail.querySelector('.msr-frame').insertBefore(newest,rail.querySelector('[data-direction="1"]'));
   newest.scrollLeft=left;
  }
  if(!rail.querySelector('.secretaria-strip'))return;
  rail.querySelectorAll('[data-dept="cras"],[data-dept="creas"]').forEach(el=>el.remove());
  const route=main.querySelector('[data-swipe-route]')?.dataset.swipeRoute;
  if(route==='cras'||route==='creas')rail.querySelector('[data-dept="assistencia"]')?.classList.add('active');
  const banner=main.querySelector(':scope>.dn-banner');
  if(rail.parentElement!==main||(banner&&banner.nextElementSibling!==rail)){
   if(banner)banner.after(rail);else main.prepend(rail);
  }
  document.body.classList.remove('manari-sector-rail-active');
 }
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}).observe(main,{childList:true,subtree:true});
 window.addEventListener('pageshow',mount);mount();
})();
