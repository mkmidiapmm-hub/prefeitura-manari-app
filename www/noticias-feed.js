// Leitura pública do mesmo conjunto de publicações exibido no feed do portal.
(() => {
  const list=document.getElementById('news-list'),status=document.getElementById('news-status'),more=document.getElementById('news-more'),refresh=document.getElementById('news-refresh'),sector=document.getElementById('news-sector');
  const labels={feed:'Prefeitura de Manari',administracao:'Administração',comunicacao:'Comunicação',mulher:'Coordenadoria da Mulher',cras:'CRAS',creas:'CREAS',tributos:'Tributos',planejamento:'Planejamento',saude:'Saúde',educacao:'Educação',assistencia:'Assistência Social',infraestrutura:'Infraestrutura',obras:'Infraestrutura e Obras',financas:'Finanças',agricultura:'Agricultura',esportes:'Esporte',transportes:'Transportes',rh:'Recursos Humanos',licitacoes:'Licitações e Contratos'};
  for(const [code,name] of Object.entries(labels)){const option=document.createElement('option');option.value=code;option.textContent=name;sector.append(option)}
  let client,offset=0,busy=false;const pageSize=20;
  function safeUrl(value,instagram=false){try{const u=new URL(value);return u.protocol==='https:'&&(!instagram||['instagram.com','www.instagram.com','m.instagram.com'].includes(u.hostname))?u.href:''}catch{return ''}}
  function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e}
  function publication(n){
    const article=node('article','news-card');article.id='noticia-'+n.id;
    const video=safeUrl(n.video_url),image=safeUrl(n.image_url);
    if(video){const e=node('video','news-media');e.controls=true;e.preload='metadata';e.src=video;article.append(e)}else if(image){const e=node('img','news-media');e.src=image;e.alt=n.title||'Publicação da Prefeitura';e.loading='lazy';article.append(e)}
    const copy=node('div','news-copy'),meta=node('p','news-meta',labels[n.department_id]||'Prefeitura de Manari');
    const d=new Date(n.publish_at);if(!Number.isNaN(d.getTime())){const time=node('time','',d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}));time.dateTime=d.toISOString();meta.append(document.createTextNode(' · '),time)}
    copy.append(meta,node('h2','',n.title||'Notícia'),node('p','news-body',n.body||n.summary||''));
    if(n.event_at||n.event_location){const eventDate=new Date(n.event_at);const details=[n.event_at&&!Number.isNaN(eventDate.getTime())?eventDate.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'',n.event_location].filter(Boolean).join(' · ');copy.append(node('p','news-meta',details))}
    const actions=node('div','news-actions'),full=node('a','','Ver publicação no feed completo');const url=new URL('/',location.origin);url.searchParams.set('post',String(n.id));url.hash='feed';full.href=url.href;actions.append(full);
    const instagram=safeUrl(n.instagram_url,true);if(instagram){const ig=node('a','','Ver no Instagram');ig.href=instagram;ig.target='_blank';ig.rel='noopener noreferrer';actions.append(ig)}
    copy.append(actions);article.append(copy);return article;
  }
  async function load(reset=false){
    if(busy)return;busy=true;more.disabled=refresh.disabled=sector.disabled=true;status.textContent='Carregando notícias…';
    if(reset){offset=0;list.replaceChildren();more.hidden=true}
    try{
      if(!client){const config=window.MANARI_PUBLIC_CONFIG;if(!config?.supabaseUrl||!config?.supabaseAnonKey||!window.supabase?.createClient)throw Error('Conexão indisponível');client=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
      let query=client.from('app_news').select('*').eq('active',true).eq('status','published').lte('publish_at',new Date().toISOString()).order('publish_at',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false});
      if(sector.value)query=query.eq('department_id',sector.value);
      const {data,error}=await query.range(offset,offset+pageSize);if(error)throw error;
      const rows=(data||[]).slice(0,pageSize);for(const row of rows)list.append(publication(row));offset+=rows.length;more.hidden=(data||[]).length<=pageSize;
      status.textContent=offset?offset+' publicações exibidas.':'Ainda não há publicações para exibir neste setor.';
    }catch{more.hidden=true;status.textContent='Não foi possível carregar as notícias agora. Use Atualizar para tentar novamente ou abra o feed completo do portal.'}
    finally{busy=false;more.disabled=refresh.disabled=sector.disabled=false}
  }
  more.addEventListener('click',()=>load());refresh.addEventListener('click',()=>load(true));sector.addEventListener('change',()=>load(true));void load(true);
})();
