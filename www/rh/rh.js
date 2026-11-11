(() => {
  'use strict';
  // Páginas do RH não usam o bootstrap clássico: remove eventual bloqueio antigo do PWA.
  document.getElementById('manari-first-paint-gate')?.remove();
  document.getElementById('manari-classic-gate')?.remove();
  const cfg=window.MANARI_CONFIG||{}, el=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=s=>{try{const u=new URL(String(s),location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
  let db=null,staff=null,tab='hero';
  const client=()=>{if(!db){if(!window.supabase||!cfg.supabaseUrl||!cfg.supabaseAnonKey)throw Error('Conexão indisponível. Atualize a página.');db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}})}return db};
  const status=(message)=>{const x=el('rhStatus');if(x)x.textContent=message};
  const isRhManager=p=>!!p&&(p.role==='admin'||(p.role==='manager'&&['rh','recursos humanos'].includes(String(p.department||'').toLowerCase())));
  async function loadPublic(){
    try{
      const c=client();
      const [hero,news,docs]=await Promise.all([
        c.from('app_portal_content').select('title,body,value').eq('content_key','rh.hero').eq('active',true).maybeSingle(),
        c.from('app_news').select('id,title,summary,body,image_url,publish_at').eq('department_id','rh').eq('active',true).eq('status','published').lte('publish_at',new Date().toISOString()).order('publish_at',{ascending:false}).limit(12),
        c.from('portal_documents').select('id,title,description,file_url,published_at').eq('module','rh').eq('department','rh').eq('active',true).order('published_at',{ascending:false}).limit(40)
      ]);
      if(hero.error)throw hero.error;
      if(news.error)throw news.error;
      if(docs.error)throw docs.error;
      if(hero.data){
        el('rhHeroTitle').textContent=hero.data.title||'Recursos Humanos';
        el('rhHeroBody').textContent=hero.data.body||'Atendimento aos servidores de Manari.';
        const u=safeUrl(hero.data.value?.image_url);
        if(u){const img=document.createElement('img');img.src=u;img.alt='Imagem institucional do Recursos Humanos';el('rhHeroMedia').replaceChildren(img)}
      }
      const n=el('rhNews');n.replaceChildren();
      if(!news.data?.length)n.innerHTML='<p class="empty">Ainda não há notícias publicadas pelo Recursos Humanos.</p>';
      for(const row of news.data||[]){
        const a=document.createElement('article');a.className='news-card';
        const im=safeUrl(row.image_url);
        a.innerHTML=(im?'<img alt="" loading="lazy" src="'+esc(im)+'">':'')+'<h3>'+esc(row.title)+'</h3><time>'+esc(new Date(row.publish_at).toLocaleDateString('pt-BR'))+'</time><p>'+esc(row.body||row.summary)+'</p>';
        n.append(a);
      }
      const d=el('rhDocs');d.replaceChildren();
      if(!docs.data?.length)d.innerHTML='<p class="empty">Ainda não há documentos públicos publicados pelo RH.</p>';
      for(const row of docs.data||[]){
        const a=document.createElement('article');a.className='doc-item';
        const u=safeUrl(row.file_url);
        a.innerHTML='<div><h3>'+esc(row.title)+'</h3><p>'+esc(row.description||'Documento público')+'</p></div>'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Visualizar documento ↗</a>':'');
        d.append(a);
      }
    }catch(e){el('rhNews').textContent='Não foi possível carregar as notícias: '+e.message;el('rhDocs').textContent='Não foi possível carregar os documentos.'}
  }
  const close=()=>{el('rhAdmin').hidden=true;document.body.style.overflow=''};
  el('rhAdminClose').onclick=close;
  el('rhAdmin').addEventListener('click',e=>{if(e.target===el('rhAdmin'))close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!el('rhAdmin').hidden)close()});
  el('rhAdminOpen').onclick=async()=>{el('rhAdmin').hidden=false;document.body.style.overflow='hidden';await adminOpen()};
  async function adminOpen(){
    const root=el('rhAdminContent');root.textContent='Verificando seu acesso…';
    try{
      const c=client(),{data:{session}}=await c.auth.getSession();
      if(!session){showLogin();return}
      const {data,error}=await c.from('portal_staff_members').select('role,department,active,full_name').eq('user_id',session.user.id).eq('active',true).maybeSingle();
      if(error)throw error;
      staff=data;
      if(!isRhManager(staff)){root.innerHTML='<p>Esta conta não tem permissão para administrar o Recursos Humanos. Solicite ao administrador principal um convite para o setor RH, com perfil de Secretário/Coordenador.</p><button type="button" id="rhLogout">Trocar conta</button>';el('rhLogout').onclick=async()=>{await c.auth.signOut();showLogin()};return}
      renderAdmin();
    }catch(e){root.textContent='Não foi possível verificar o acesso: '+e.message}
  }
  function showLogin(){
    const r=el('rhAdminContent');
    r.innerHTML='<p class="help">Entre com a conta criada pelo administrador principal da Prefeitura para administrar apenas os conteúdos do RH.</p><form id="rhLogin"><label>E-mail<input name="email" type="email" autocomplete="username" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" required></label><button type="submit" class="save">Entrar</button><p class="status" id="rhStatus"></p></form>';
    el('rhLogin').onsubmit=async e=>{e.preventDefault();try{status('Entrando…');const f=new FormData(e.currentTarget);const {error}=await client().auth.signInWithPassword({email:String(f.get('email')).trim(),password:String(f.get('password'))});if(error)throw error;await adminOpen()}catch(x){status('Erro no login: '+x.message)}};
  }
  function renderAdmin(){
    const root=el('rhAdminContent');
    root.innerHTML='<p class="help">Responsável: <strong>'+esc(staff.full_name||'Equipe do RH')+'</strong>. Publique apenas materiais autorizados para acesso público.</p><div class="tabs"><button type="button" data-tab="hero">Imagem e apresentação</button><button type="button" data-tab="news">Notícias</button><button type="button" data-tab="docs">Documentos públicos</button></div><div id="rhAdminPane"></div><p class="status" role="status" id="rhStatus"></p>';
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderTab()});
    renderTab();
  }
  function renderTab(){
    el('rhAdminContent').querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='hero')heroEditor();else if(tab==='news')newsEditor();else docsEditor();
  }
  async function upload(file,folder){
    if(!file?.size)return '';
    const ext=(file.name.split('.').pop()||'bin').toLowerCase();
    const path=folder+'/'+crypto.randomUUID()+'.'+ext;
    const res=await client().storage.from(folder.startsWith('feed/')?'manari-media':'portal-documentos').upload(path,file,{upsert:false,contentType:file.type});
    if(res.error)throw res.error;
    const bucket=folder.startsWith('feed/')?'manari-media':'portal-documentos';
    return client().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  async function heroEditor(){
    const pane=el('rhAdminPane');pane.textContent='Carregando…';
    const {data,error}=await client().from('app_portal_content').select('title,body,value').eq('content_key','rh.hero').maybeSingle();
    if(error){pane.textContent=error.message;return}
    pane.innerHTML='<form id="rhHeroForm"><label>Título principal<input name="title" maxlength="160" required value="'+esc(data?.title||'Recursos Humanos')+'"></label><label>Apresentação do setor<textarea name="body" maxlength="1500" required>'+esc(data?.body||'')+'</textarea></label><label>Alterar imagem principal<input name="file" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="help">A imagem selecionada substituirá a imagem institucional exibida nesta página. Deixe em branco para manter a atual.</p><button class="save">Salvar apresentação e imagem</button></form>';
    el('rhHeroForm').onsubmit=async e=>{
      e.preventDefault();status('Salvando…');const f=new FormData(e.currentTarget);
      try{
        const file=f.get('file');if(file?.size&&(!file.type.startsWith('image/')||file.size>8*1024*1024))throw Error('Use imagem JPG, PNG ou WebP com até 8 MB.');
        const value={...(data?.value||{})};
        if(file?.size)value.image_url=await upload(file,'feed/rh');
        const payload={title:String(f.get('title')).trim(),body:String(f.get('body')).trim(),value,updated_at:new Date().toISOString()};
        const {error}=await client().from('app_portal_content').update(payload).eq('content_key','rh.hero');
        if(error)throw error;status('Apresentação atualizada.');await loadPublic();
      }catch(x){status('Não foi possível salvar: '+x.message)}
    };
  }
  async function newsEditor(){
    const pane=el('rhAdminPane');
    pane.innerHTML='<form id="rhNewsForm"><label>Título da notícia<input name="title" required maxlength="150"></label><label>Resumo<input name="summary" required maxlength="400"></label><label>Notícia ou comunicado<textarea name="body" required maxlength="10000"></textarea></label><label>Imagem opcional<input name="file" type="file" accept="image/png,image/jpeg,image/webp"></label><button class="save">Publicar notícia</button></form><div id="rhNewsAdminList" class="admin-list"></div>';
    el('rhNewsForm').onsubmit=async e=>{
      e.preventDefault();status('Publicando…');const f=new FormData(e.currentTarget);
      try{
        const file=f.get('file');if(file?.size&&(!file.type.startsWith('image/')||file.size>8*1024*1024))throw Error('Imagem inválida ou acima de 8 MB.');
        const image_url=file?.size?await upload(file,'feed/rh'):'';
        const {error}=await client().from('app_news').insert({title:String(f.get('title')).trim(),summary:String(f.get('summary')).trim(),body:String(f.get('body')).trim(),department_id:'rh',instagram_url:'',image_url,status:'published',active:true,featured:false,publish_at:new Date().toISOString()});
        if(error)throw error;
        e.currentTarget.reset();status('Notícia publicada no RH e no feed da Prefeitura.');await Promise.all([loadPublic(),loadNewsAdmin()]);
      }catch(x){status('Erro ao publicar: '+x.message)}
    };await loadNewsAdmin();
  }
  async function loadNewsAdmin(){
    const pane=el('rhNewsAdminList');if(!pane)return;
    const {data,error}=await client().from('app_news').select('id,title,status').eq('department_id','rh').order('created_at',{ascending:false}).limit(25);
    if(error){pane.textContent=error.message;return}
    pane.innerHTML='<h3>Publicações do RH</h3>'+(data||[]).map(x=>'<article><strong>'+esc(x.title)+'</strong> · '+esc(x.status)+' <button type="button" data-archive="'+esc(x.id)+'">Arquivar</button></article>').join('');
    pane.querySelectorAll('[data-archive]').forEach(b=>b.onclick=async()=>{if(!confirm('Arquivar esta publicação?'))return;const {error}=await client().from('app_news').update({status:'archived'}).eq('id',b.dataset.archive).eq('department_id','rh');status(error?error.message:'Publicação arquivada');await loadNewsAdmin();await loadPublic()});
  }
  async function docsEditor(){
    const pane=el('rhAdminPane');
    pane.innerHTML='<form id="rhDocForm"><label>Nome do documento<input name="title" maxlength="180" required></label><label>Descrição pública<textarea name="description" maxlength="1500"></textarea></label><label>Arquivo PDF público<input name="file" type="file" accept="application/pdf" required></label><p class="help"><strong>Atenção:</strong> não publique contracheques individuais, CPF, documentos pessoais, informações médicas ou arquivos confidenciais. Estes documentos ficam disponíveis publicamente.</p><button class="save">Publicar documento público</button></form><div id="rhDocAdminList" class="admin-list"></div>';
    el('rhDocForm').onsubmit=async e=>{
      e.preventDefault();status('Enviando documento…');const f=new FormData(e.currentTarget),file=f.get('file');
      try{
        if(!file?.size||file.type!=='application/pdf'||file.size>15*1024*1024)throw Error('Selecione um PDF de até 15 MB.');
        const file_url=await upload(file,'rh');
        const {error}=await client().from('portal_documents').insert({module:'rh',department:'rh',title:String(f.get('title')).trim(),description:String(f.get('description')).trim(),file_url,active:true});
        if(error)throw error;e.currentTarget.reset();status('Documento público publicado.');await Promise.all([loadDocsAdmin(),loadPublic()]);
      }catch(x){status('Erro ao publicar documento: '+x.message)}
    };await loadDocsAdmin();
  }
  async function loadDocsAdmin(){
    const pane=el('rhDocAdminList');if(!pane)return;
    const {data,error}=await client().from('portal_documents').select('id,title,active').eq('module','rh').eq('department','rh').order('created_at',{ascending:false}).limit(30);
    if(error){pane.textContent=error.message;return}
    pane.innerHTML='<h3>Documentos cadastrados</h3>'+(data||[]).map(x=>'<article><strong>'+esc(x.title)+'</strong> · '+(x.active?'Publicado':'Oculto')+' <button type="button" data-toggle="'+esc(x.id)+'" data-active="'+String(x.active)+'">'+(x.active?'Ocultar':'Publicar')+'</button></article>').join('');
    pane.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{const {error}=await client().from('portal_documents').update({active:b.dataset.active!=='true'}).eq('id',b.dataset.toggle).eq('module','rh').eq('department','rh');status(error?error.message:'Documento atualizado');await loadDocsAdmin();await loadPublic()});
  }
  loadPublic();
  // Convites e a gestão de usuários continuam exclusivos do administrador principal.
})();