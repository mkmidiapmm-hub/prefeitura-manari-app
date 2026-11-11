// ESIC_ROUTING_BEGIN
(() => {
  if(window.__MANARI_ESIC_ROUTING__)return;
  window.__MANARI_ESIC_ROUTING__=true;
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-service],[data-service-url],[data-nav="esic"],[data-nav="ouvidoria"],[data-nav="contracheque"],[data-nav="servidor"],.sm-quick-card[data-url]');
    if(!target)return;
    const label=String(target.getAttribute('data-service')||target.querySelector('b')?.textContent||target.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const nav=target.getAttribute('data-nav');
    const module=nav==='ouvidoria'||/^ouvidoria(?:$|[\s/])/.test(label)?'ouvidoria':nav==='esic'||/^(?:e[\s-]?sic|lai\s*\/\s*e[\s-]?sic)(?:$|[\s/])/.test(label)?'esic':null;
    if(!module)return;
    event.preventDefault();event.stopImmediatePropagation();
    window.location.assign(new URL('./'+module+'/',window.location.href).href);
  },true);
})();
// ESIC_ROUTING_END

// Prefeitura de Manari — modo clássico V6.0
(() => {
  if(window.__MANARI_CLASSIC_BOOTSTRAP__)return;window.__MANARI_CLASSIC_BOOTSTRAP__=true;const VERSION='6.23';
  const gate=document.createElement('style');gate.id='manari-classic-gate';gate.textContent='.app-shell,.main-view,main{visibility:hidden!important}';document.head.appendChild(gate);
  const reveal=()=>{document.getElementById('manari-classic-gate')?.remove();document.getElementById('manari-first-paint-gate')?.remove()};setTimeout(reveal,5000);
  document.getElementById('manariSocialApp')?.remove();document.body?.classList.remove('manari-social-v2');document.querySelectorAll('#app,.app-shell,.site-shell,main').forEach(el=>el.removeAttribute('aria-hidden'));document.getElementById('manari-v4-boot-gate')?.remove();document.getElementById('manari-preboot')?.remove();
  function addCss(attr,href){if(document.querySelector(`link[${attr}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=`${href}?v=${VERSION}`;l.setAttribute(attr,'true');document.head.appendChild(l)}
  function loadScriptOnce(attr,src,ready,next){if(ready?.()){next?.();return}const old=document.querySelector(`script[${attr}]`);if(old){old.addEventListener('load',()=>next?.(),{once:true});return}const s=document.createElement('script');s.src=`${src}?v=${VERSION}`;s.async=false;s.setAttribute(attr,'true');s.onload=()=>next?.();s.onerror=()=>next?.();document.body.appendChild(s)}
  function addAdminButton(){if(document.getElementById('manariClassicAdmin'))return;const style=document.createElement('style');style.id='manari-classic-admin-style';style.textContent=`#manariClassicAdmin{position:fixed;right:18px;bottom:20px;z-index:2147482000;border:0;border-radius:999px;background:#0b7d46;color:#fff;padding:12px 17px;font:700 14px/1.2 inherit;box-shadow:0 8px 24px rgba(0,0,0,.22);cursor:pointer}#manariClassicAdmin:active{transform:scale(.98)}@media(max-width:700px){#manariClassicAdmin{right:12px;bottom:14px;padding:11px 14px;font-size:13px}}`;document.head.appendChild(style);const b=document.createElement('button');b.id='manariClassicAdmin';b.className='manari-admin-entry';b.type='button';b.innerHTML='⚙ Administrativo';b.onclick=()=>window.ManariPortalAuth?.open?.();document.body.appendChild(b)}
  function loadRest(){loadScriptOnce('data-service-directory','portal-service-directory.js',()=>window.ManariServiceDirectory,()=>loadPublicRest())}
  function loadPublicRest(){loadScriptOnce('data-public-tools','portal-public-tools.js',()=>window.__MANARI_PUBLIC_TOOLS__,()=>{});loadScriptOnce('data-accessibility','portal-accessibility.js',()=>window.__MANARI_ACCESSIBILITY__,()=>{});loadScriptOnce('data-transparency-catalog','transparency-catalog.js',()=>window.ManariTransparencyCatalog,()=>loadScriptOnce('data-transparency-utils','transparency-utils.js',()=>window.ManariTransparencyUtils,()=>loadScriptOnce('data-pntp-review','portal-pntp-review.js',()=>window.ManariPntpReview,startRest)))}
  function startRest(){loadScriptOnce('data-novembro-azul','novembro-azul.js',()=>window.__MANARI_NOVEMBRO_AZUL__,()=>{});loadScriptOnce('data-manari-headings','portal-headings.js',()=>window.__MANARI_HEADINGS__,()=>{});loadScriptOnce('data-manari-nav-fix','nav-fix.js',()=>window.__MANARI_VERTICAL_SECRETARIAS__,()=>{});loadScriptOnce('data-manari-portal-internal','portal-internal.js',()=>window.ManariPortalInternal,()=>loadScriptOnce('data-manari-portal-auth','portal-auth.js',()=>window.ManariPortalAuth,()=>loadScriptOnce('data-manari-portal-cms','portal-cms.js',()=>window.ManariSectorCMS,()=>loadScriptOnce('data-manari-portal-cms-bridge','portal-cms-bridge.js',()=>window.__MANARI_CMS_BRIDGE__,()=>loadScriptOnce('data-manari-feed','portal-feed.js',()=>window.ManariFeed,()=>loadScriptOnce('data-access-requests','portal-access-requests.js',()=>window.ManariAccessRequests,addAdminButton))))))}
  function imageLockReady(){Promise.resolve(window.ManariHomeImageLock?.ready).catch(()=>{}).finally(()=>{requestAnimationFrame(()=>requestAnimationFrame(reveal));loadRest()})}
  function editorReady(){Promise.resolve(window.ManariPortalEditor?.ready).catch(()=>{}).finally(()=>loadScriptOnce('data-manari-home-image-lock','portal-image-lock.js',()=>window.ManariHomeImageLock,imageLockReady))}
  function boot(){addCss('data-accessibility','portal-accessibility.css');addCss('data-novembro-azul','novembro-azul.css');addCss('data-manari-feed','portal-feed.css');addCss('data-manari-responsive-classic','classic-responsive.css');addCss('data-manari-portal-auth','portal-auth.css');addCss('data-manari-portal-cms','portal-cms.css');addCss('data-manari-portal-internal','portal-internal.css');addCss('data-manari-transparency','transparency-center.css');addCss('data-manari-portal-editor','portal-editor.css');loadScriptOnce('data-manari-portal-editor','portal-editor.js',()=>window.ManariPortalEditor,editorReady)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
