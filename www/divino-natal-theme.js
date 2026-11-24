/* Identidade sazonal, sem substituir o conteúdo ou as marcas dos setores. */
(()=>{
 'use strict';
 if(window.__MANARI_DIVINO_NATAL__)return;window.__MANARI_DIVINO_NATAL__=true;
 const base=new URL('./',document.currentScript.src),url=new URL('divino-natal/festa.html',base).href;
 document.body.classList.remove('manari-novembro-azul');document.body.classList.add('manari-divino-natal');
 const bulbs=()=>'<span class="dn-lights" aria-hidden="true">'+Array.from({length:18},()=>'<i></i>').join('')+'</span>';
 const tree='<svg class="dn-tree" viewBox="0 0 100 140" fill="none" aria-hidden="true"><path d="m50 8 7 15 17 2-13 12 4 17-15-9-15 9 4-17-13-12 17-2Z" fill="#f4d27c"/><path d="M50 46 21 80h15L12 108h29v20h18v-20h29L64 80h15L50 46Z" fill="#236846" stroke="#d7b35c" stroke-width="2"/><path d="m33 76 35 12-42 10" stroke="#f7df9e" stroke-width="2" stroke-dasharray="2 6"/></svg>';
 function mount(){
  document.getElementById('manariNovembroAzul')?.remove();
  const main=document.getElementById('mainView');if(!main)return;
  if(!document.getElementById('manariDivinoNatal')){
   const banner=document.createElement('aside');banner.id='manariDivinoNatal';banner.className='dn-banner';banner.setAttribute('aria-label','Divino Natal em Manari');
   banner.innerHTML=bulbs()+tree+'<img class="dn-banner-logo" src="'+new URL('divino-natal/logo-oficial.png',base).href+'" alt="Divino Natal"><div class="dn-banner-copy"><span class="dn-eyebrow">PREFEITURA DE MANARI · DIVINO NATAL</span><h2>Manari vai se iluminar outra vez.</h2><p>Um convite para celebrar, encontrar e brincar na praça.</p><a class="dn-cta" href="'+url+'">Conheça o Divino Natal</a></div>'+tree;
   main.prepend(banner);
  }
  const top=document.querySelector('.topbar');if(top&&!top.querySelector('.dn-lights'))top.insertAdjacentHTML('beforeend',bulbs());
  const nav=document.querySelector('.desktop-menu');if(nav&&!nav.querySelector('.dn-nav-link')){const a=document.createElement('a');a.className='menu-link dn-nav-link';a.href=url;a.textContent='Divino Natal';nav.append(a);}
  const footer=document.querySelector('.citizen-shortcuts');if(footer&&!footer.querySelector('.dn-nav-link')){const a=document.createElement('a');a.className='dn-nav-link';a.href=url;a.textContent='Divino Natal';footer.append(a);}
 }
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',mount);mount();
})();
