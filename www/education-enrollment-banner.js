/* Banner de matrícula na página da Educação, integrado ao editor visual existente. */
(function(root){
 'use strict';
 const IMAGE_ID='manariEducationEnrollmentBanner';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function template(base){const image=new URL('educacao/assets/matriculas-hero-2027.webp',base).href,details=new URL('educacao/?servico=matricula',base).href;
  return `<section id="manariEducationEnrollmentCampaign" class="education-enrollment-banner" aria-label="Matrículas escolares"><a class="education-enrollment-art" href="${esc(details)}" aria-label="Ver informações da matrícula"><img id="${IMAGE_ID}" src="${esc(image)}" width="2172" height="724" alt="Campanha de matrículas abertas 2027" decoding="async"><div class="education-enrollment-copy" aria-hidden="true"><h2>Matrículas<br>abertas 2027</h2><p>Prepare os documentos e dê o próximo passo.</p></div></a><div class="education-enrollment-actions"><strong>Matrículas escolares</strong><a class="education-enrollment-details" href="${esc(details)}">Ver mais informações <span aria-hidden="true">↗</span></a><button type="button" class="education-enrollment-edit" data-mve-image-target="${IMAGE_ID}">Trocar imagem do banner</button></div><p class="education-enrollment-edit-note">Envie uma arte completa em PNG, JPG, WebP ou GIF de até 10 MB. A imagem será substituída e o acesso às informações da matrícula será mantido.</p></section>`;
 }
 function create(window,document,scriptUrl){
  const main=document.getElementById('mainView');if(!main)return null;
  const base=new URL('./',scriptUrl),defaultImage=new URL('educacao/assets/matriculas-hero-2027.webp',base).href;let queued=false;
  function sync(){const page=main.querySelector('.page-wrap[data-swipe-route="educacao"]');if(!page)return;
   let section=page.querySelector('#manariEducationEnrollmentCampaign');
   if(!section){const services=page.querySelector('.dept-services');if(!services)return;const box=document.createElement('div');box.innerHTML=template(base);section=box.firstElementChild;services.before(section);const img=section.querySelector('img');img.addEventListener('error',()=>section.classList.add('education-enrollment-image-error'));img.addEventListener('load',()=>section.classList.remove('education-enrollment-image-error'));}
   const image=section.querySelector('#'+IMAGE_ID);section.classList.toggle('education-enrollment-custom-image',image.src!==defaultImage);
  }
  function schedule(){if(queued)return;queued=true;window.requestAnimationFrame(()=>{queued=false;sync()});}
  const observer=new window.MutationObserver(schedule);observer.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);sync();return {sync,disconnect:()=>observer.disconnect()};
 }
 const api={IMAGE_ID,template,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.document&&!root.__MANARI_EDUCATION_ENROLLMENT_BANNER__){root.__MANARI_EDUCATION_ENROLLMENT_BANNER__=true;const d=root.document,url=d.currentScript?.src||new URL('education-enrollment-banner.js',d.baseURI).href;const start=()=>create(root,d,url);if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window!=='undefined'?window:globalThis);
