/* Acesso às fontes oficiais; não presume que exista um alerta vigente para Manari. */
(function(root){
  'use strict';
  const ID='manariClimateNotice';
  const SOURCES=Object.freeze({
    health:'https://portalcievs.saude.pe.gov.br/noticias/INFORMES/clima-e-sa-de',
    weather:'https://avisos.inmet.gov.br/'
  });
  function eligible(location,document){
    const params=new URLSearchParams(location.search);
    return ['','#','#inicio','#home'].includes(location.hash.toLowerCase())
      &&!params.has('post')&&!params.has('portal_invite')
      &&!document.body.classList.contains('manari-feed-home');
  }
  function template(){
    return `<aside id="${ID}" class="climate-notice" aria-labelledby="climateNoticeTitle">
      <div class="climate-notice-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M18 27.5V12a6 6 0 0 1 12 0v15.5a11 11 0 1 1-12 0Z" stroke="currentColor" stroke-width="3"/><path d="M24 18v15" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="36" r="4" fill="currentColor"/><path d="M35 12h5M35 19h5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div>
      <div class="climate-notice-copy"><span class="climate-notice-label">INFORMAÇÃO OFICIAL · CLIMA E SAÚDE</span>
        <h2 id="climateNoticeTitle">Calor e baixa umidade: acompanhe os alertas</h2>
        <p>Consulte os comunicados da Secretaria Estadual de Saúde de Pernambuco e os avisos meteorológicos do INMET.</p>
        <p class="climate-notice-validity">Confira a validade e os municípios abrangidos em cada publicação.</p>
      </div>
      <div class="climate-notice-actions">
        <a class="climate-notice-primary" href="${SOURCES.health}" target="_blank" rel="noopener noreferrer">Ver comunicados da SES-PE <svg class="climate-notice-external" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3h7v7M21 3 10 14M10 3H4v17h17v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="climate-notice-sr"> (abre em nova aba)</span></a>
        <a class="climate-notice-secondary" href="${SOURCES.weather}" target="_blank" rel="noopener noreferrer">Consultar avisos do INMET <svg class="climate-notice-external" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3h7v7M21 3 10 14M10 3H4v17h17v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="climate-notice-sr"> (abre em nova aba)</span></a>
      </div>
    </aside>`;
  }
  function create(window,document){
    const main=document.getElementById('mainView');if(!main)return null;
    let queued=false;
    function sync(){
      const current=document.getElementById(ID),hero=main.querySelector('.home-hero');
      if(!hero||!eligible(window.location,document)){current?.remove();return;}
      if(current)return;
      const holder=document.createElement('div');holder.innerHTML=template();hero.before(holder.firstElementChild);
    }
    function schedule(){if(queued)return;queued=true;window.requestAnimationFrame(()=>{queued=false;sync();});}
    const observer=new window.MutationObserver(schedule);observer.observe(main,{childList:true,subtree:true});
    for(const event of ['hashchange','popstate','pageshow'])window.addEventListener(event,schedule);
    sync();return {sync,disconnect:()=>observer.disconnect()};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={ID,SOURCES,eligible,template,create};
  if(root.document&&!root.__MANARI_CLIMATE_NOTICE__){root.__MANARI_CLIMATE_NOTICE__=true;const d=root.document,start=()=>create(root,d);if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window!=='undefined'?window:globalThis);
