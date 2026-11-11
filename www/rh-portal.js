// Complementos do RH dentro da mesma página institucional das secretarias.
(() => {
  if (window.__MANARI_RH_INTEGRATED__) return; window.__MANARI_RH_INTEGRATED__=true;
  const root=document.getElementById('mainView'), cfg=window.MANARI_CONFIG||{};
  if(!root)return;
  let client=null,serial=0,scheduled=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const url=s=>{try{const u=new URL(String(s||''),location.href);return u.protocol==='https:'?u.href:''}catch{return ''}};
  const db=()=>{if(!client&&window.supabase?.createClient&&cfg.supabaseUrl&&cfg.supabaseAnonKey)client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);return client};
  const isRH=()=>!!root.querySelector('.page-wrap[data-swipe-route="rh"]');
  function mount(){
    if(!isRH()||root.querySelector('#rhIntegratedContent'))return;
    const shell=root.querySelector('.page-wrap[data-swipe-route="rh"]');if(!shell)return;
    const section=document.createElement('section');section.className='section';section.id='rhIntegratedContent';
    section.innerHTML='<div class="section-head"><div><h2>Notícias e comunicados do RH</h2><p>Informações e ações do setor para os servidores</p></div></div><div id="rhIntegratedNews" class="service-grid"><p>Carregando notícias…</p></div><div class="section-head" style="margin-top:30px"><div><h2>Documentos e orientações</h2><p>Arquivos públicos de interesse dos servidores</p></div></div><div id="rhIntegratedDocs" class="service-grid"><p>Carregando documentos…</p></div><p style="margin:22px 0;color:#587074;font-size:13px">Contracheques individuais são consultados com CPF e senha exclusivamente no Município Online. Não publique dados pessoais nesta área pública.</p><a href="./rh/" class="primary-btn" style="display:inline-block;text-decoration:none">⚙ Gestão do RH</a>';
    shell.appendChild(section);load();
  }
  async function load(){
    const seq=++serial,c=db();if(!c)return;
    try{
      const [hero,news,docs]=await Promise.all([
        c.from('app_portal_content').select('title,body,value').eq('content_key','rh.hero').eq('active',true).maybeSingle(),
        c.from('app_news').select('title,summary,body,image_url,publish_at').eq('department_id','rh').eq('status','published').eq('active',true).lte('publish_at',new Date().toISOString()).order('publish_at',{ascending:false}).limit(9),
        c.from('portal_documents').select('title,description,file_url').eq('module','rh').eq('department','rh').eq('active',true).order('published_at',{ascending:false}).limit(25)
      ]);
      if(seq!==serial||!isRH())return;
      if(hero.data){
        const p=root.querySelector('.hero-copy>p');if(p&&hero.data.body)p.textContent=hero.data.body;
        const h=root.querySelector('.hero-copy h1');if(h&&hero.data.title)h.textContent=hero.data.title;
        const img=root.querySelector('img[data-media-slot="rh-hero"]');const source=url(hero.data.value?.image_url);
        if(img&&source){img.src=source;img.dataset.fallback=source}
      }
      const n=document.getElementById('rhIntegratedNews'),d=document.getElementById('rhIntegratedDocs');if(!n||!d)return;
      const newsItems=news.data||[],docItems=docs.data||[];
      n.innerHTML=newsItems.length?newsItems.map(x=>'<article class="service-card">'+(url(x.image_url)?'<img src="'+esc(url(x.image_url))+'" loading="lazy" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:15px">':'')+'<h3>'+esc(x.title)+'</h3><p>'+esc(x.body||x.summary)+'</p></article>').join(''):'<article class="service-card"><p>Ainda não há notícias publicadas pelo Recursos Humanos.</p></article>';
      d.innerHTML=docItems.length?docItems.map(x=>'<article class="service-card"><h3>'+esc(x.title)+'</h3><p>'+esc(x.description||'Documento institucional')+'</p>'+(url(x.file_url)?'<a href="'+esc(url(x.file_url))+'" target="_blank" rel="noopener noreferrer">Consultar PDF ↗</a>':'')+'</article>').join(''):'<article class="service-card"><p>Não há documentos públicos cadastrados neste momento.</p></article>';
    }catch(err){const n=document.getElementById('rhIntegratedNews');if(n)n.textContent='Não foi possível carregar as publicações do RH.';}
  }
  document.addEventListener('click',event=>{
    if(!isRH())return;
    const btn=event.target.closest('button[data-service]');if(!btn)return;
    const name=btn.getAttribute('data-service');
    if(!['Meu Contracheque','Notícias e Comunicados','Documentos do RH','Atendimento ao Servidor','Gestão do RH'].includes(name))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(name==='Meu Contracheque')window.open('https://www.municipioonline.com.br/pe/prefeitura/manari/servidor/login','_blank','noopener,noreferrer');
    else if(name==='Gestão do RH')location.assign(new URL('./rh/',location.href).href);
    else if(name==='Notícias e Comunicados')document.getElementById('rhIntegratedNews')?.scrollIntoView({behavior:'smooth',block:'center'});
    else document.getElementById(name==='Documentos do RH'?'rhIntegratedDocs':'rhIntegratedContent')?.scrollIntoView({behavior:'smooth',block:'center'});
  },true);
  new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}).observe(root,{childList:true});
  mount();
})();