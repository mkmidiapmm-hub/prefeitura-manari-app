// Prefeitura de Manari — serviços, documentos e alimentação setorial V3.2
(() => {
  if (window.ManariPortalInternal) return;
  const CFG = window.MANARI_CONFIG || {};
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  const aliases = {'diario_oficial':'diario_oficial','leis_municipais':'leis','emendas_parlamentares':'emendas','licitacoes_e_contratos':'licitacoes','portal_da_transparencia':'transparencia','ouvidoria_municipal':'ouvidoria','e_sic_pedido_de_informacao':'esic','e_sic_acesso_a_informacao':'esic','e_sic':'esic','lai_e_sic':'esic','carta_de_servicos':'carta_servicos','contracheque_online':'contracheque','folha_de_pagamento':'folha_pagamento','servidores_e_remuneracoes':'servidores_remuneracoes'};
  const moduleFor = title => aliases[slug(title)] || slug(title);
  let client = null, active = null, staff = null;

  async function getClient(){
    if(client) return client;
    if(!CFG.supabaseUrl || !CFG.supabaseAnonKey) return null;
    for(let i=0;i<60;i++){
      if(window.supabase?.createClient){client=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client;}
      await new Promise(r=>setTimeout(r,100));
    }
    return null;
  }
  async function getSession(){const c=await getClient();if(!c)return null;const {data}=await c.auth.getSession();return data?.session||null}
  async function getStaff(){
    if(staff!==null)return staff;
    const c=await getClient(), session=await getSession(); if(!c||!session){staff=false;return false}
    const {data}=await c.from('portal_staff_members').select('*').eq('user_id',session.user.id).eq('active',true).maybeSingle();
    staff=data||false;return staff;
  }
  function canManage(module){if(!staff||!staff.can_manage_documents)return false;return staff.role==='admin'||(staff.role==='manager'&&(staff.modules||[]).includes(module))}
  async function restDocs(module){try{const r=await fetch(`${CFG.supabaseUrl}/rest/v1/portal_documents?select=*&module=eq.${encodeURIComponent(module)}&active=eq.true&order=published_at.desc`,{headers:{apikey:CFG.supabaseAnonKey,Authorization:`Bearer ${CFG.supabaseAnonKey}`},cache:'no-store'});return r.ok?await r.json():[]}catch{return []}}
  async function loadDocs(module){const c=await getClient();if(c){const {data}=await c.from('portal_documents').select('*').eq('module',module).eq('active',true).order('published_at',{ascending:false});return data||[]}return restDocs(module)}

  function ensure(){
    if(document.querySelector('.mpi-overlay'))return;
    const el=document.createElement('div');el.className='mpi-overlay';el.innerHTML='<section class="mpi-panel" role="dialog" aria-modal="true"><header class="mpi-head"><button class="mpi-back" aria-label="Voltar">←</button><div><h1></h1><p></p></div><button class="mpi-close" aria-label="Fechar">×</button></header><div class="mpi-search"><input type="search" placeholder="Buscar por título, número, ano ou setor..."></div><div class="mpi-body"></div></section>';
    document.body.appendChild(el);el.querySelector('.mpi-close').addEventListener('click',close);el.querySelector('.mpi-back').addEventListener('click',close);el.addEventListener('click',e=>{if(e.target===el)close()});el.querySelector('.mpi-search input').addEventListener('input',()=>renderRows());
  }
  function fmtDate(v){if(!v)return '';try{return new Date(v).toLocaleDateString('pt-BR')}catch{return ''}}
  function documentCard(d){const meta=[d.reference_number,d.reference_date?fmtDate(d.reference_date):'',d.year,d.department].filter(Boolean).join(' • ');const action=d.file_url?`<a class="mpi-open" href="${esc(d.file_url)}" target="_blank" rel="noopener">Visualizar / baixar</a>`:'';return `<article class="mpi-card"><div class="mpi-card-icon">▤</div><div class="mpi-card-main"><h3>${esc(d.title)}</h3>${meta?`<div class="mpi-meta">${esc(meta)}</div>`:''}${d.description?`<p>${esc(d.description)}</p>`:''}<div class="mpi-actions">${action}</div></div></article>`}

  function staffBar(){return canManage(active?.module)?'<div class="mpi-staffbar"><span>Área do setor</span><button class="mpi-open mpi-add-doc" type="button">+ Publicar documento</button></div>':''}
  function bindStaffButton(){document.querySelector('.mpi-add-doc')?.addEventListener('click',showDocumentForm)}
  async function renderRows(){
    const body=document.querySelector('.mpi-body');if(!body||!active)return;const q=norm(document.querySelector('.mpi-search input')?.value);
    if(active.module==='contracheque')return renderPayslips(q);
    if(active.module==='ouvidoria'||active.module==='esic')return renderCitizenRequest(active.module);
    const docs=active.docs||[];const rows=docs.filter(d=>!q||norm([d.title,d.description,d.reference_number,d.year,d.department,d.category].join(' ')).includes(q));
    body.innerHTML=`${staffBar()}${rows.length?`<div class="mpi-count">${rows.length} ${rows.length===1?'publicação encontrada':'publicações encontradas'}</div><div class="mpi-list">${rows.map(documentCard).join('')}</div>`:'<div class="mpi-empty"><strong>Nenhum documento publicado ainda.</strong><span>O módulo já está pronto. O setor responsável pode publicar diretamente por esta área quando estiver autorizado.</span></div>'}`;bindStaffButton();
  }

  async function renderCitizenRequest(type){
    const body=document.querySelector('.mpi-body');if(!body)return;
    const isOuvidoria=type==='ouvidoria';
    const session=await getSession();
    body.innerHTML=`<form class="mpi-form mpi-citizen-form"><h2>${isOuvidoria?'Registrar manifestação':'Solicitar informação'}</h2><p class="mpi-form-help">${isOuvidoria?'Envie elogio, sugestão, reclamação, denúncia ou solicitação diretamente à Prefeitura.':'Faça seu pedido de acesso à informação diretamente pelo aplicativo.'}</p>${isOuvidoria?'<label class="mpi-check"><input type="checkbox" name="anonymous"> Enviar de forma anônima</label>':''}<div class="mpi-identification"><label>Nome<input name="requester_name" autocomplete="name" ${isOuvidoria?'':'required'}></label><label>E-mail<input type="email" name="requester_email" autocomplete="email" ${isOuvidoria?'':'required'}></label><label>Telefone<input name="requester_phone" autocomplete="tel"></label></div><label>Assunto<input name="subject" required maxlength="180"></label><label>Mensagem<textarea name="message" required minlength="10"></textarea></label><div class="mpi-actions"><button class="mpi-open" type="submit">Enviar para a Prefeitura</button></div><div class="mpi-form-status"></div>${session?'<p class="mpi-form-help">Seu protocolo ficará vinculado à sua conta para consulta futura.</p>':''}</form>`;
    const form=body.querySelector('.mpi-citizen-form');
    const anon=form.querySelector('[name="anonymous"]');
    anon?.addEventListener('change',()=>{form.querySelector('.mpi-identification').style.display=anon.checked?'none':'grid';});
    form.addEventListener('submit',submitCitizenRequest);
  }

  async function submitCitizenRequest(e){
    e.preventDefault();
    const form=e.currentTarget,status=form.querySelector('.mpi-form-status'),c=await getClient();if(!c)return;
    const fd=new FormData(form), anonymous=fd.get('anonymous')==='on', session=await getSession();
    const payload={request_type:active.module,subject:String(fd.get('subject')||'').trim(),message:String(fd.get('message')||'').trim(),anonymous,requester_name:anonymous?null:String(fd.get('requester_name')||'').trim()||null,requester_email:anonymous?null:String(fd.get('requester_email')||'').trim()||null,requester_phone:anonymous?null:String(fd.get('requester_phone')||'').trim()||null,user_id:session?.user?.id||null};
    status.textContent='Enviando...';
    const {data,error}=await c.from('citizen_requests').insert(payload).select('protocol').single();
    if(error){status.textContent='Não foi possível enviar agora. Verifique os campos e tente novamente.';return}
    form.innerHTML=`<div class="mpi-empty"><strong>Solicitação enviada com sucesso.</strong><span>Protocolo: ${esc(data.protocol)}</span><span>Guarde este número para acompanhamento.</span><button class="mpi-open mpi-new-request" type="button">Fazer outra solicitação</button></div>`;
    form.querySelector('.mpi-new-request')?.addEventListener('click',()=>renderCitizenRequest(active.module));
  }

  function showDocumentForm(){
    const body=document.querySelector('.mpi-body');if(!body||!canManage(active.module))return;
    body.innerHTML=`<form class="mpi-form"><h2>Publicar em ${esc(active.title)}</h2><label>Título<input name="title" required></label><label>Descrição<textarea name="description"></textarea></label><div class="mpi-form-grid"><label>Número / referência<input name="reference_number"></label><label>Data<input type="date" name="reference_date"></label><label>Ano<input type="number" name="year" min="1900" max="2100"></label><label>Setor<input name="department" value="${esc(staff.department||'')}"></label></div><label>Arquivo oficial<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp" required></label><div class="mpi-actions"><button class="mpi-open" type="submit">Publicar</button><button class="mpi-cancel" type="button">Cancelar</button></div><div class="mpi-form-status"></div></form>`;
    body.querySelector('.mpi-cancel').addEventListener('click',renderRows);body.querySelector('.mpi-form').addEventListener('submit',publishDocument);
  }
  async function publishDocument(e){
    e.preventDefault();const form=e.currentTarget,status=form.querySelector('.mpi-form-status'),c=await getClient();if(!c||!canManage(active.module))return;
    const fd=new FormData(form), file=fd.get('file'); if(!(file instanceof File)||!file.size)return;
    status.textContent='Enviando arquivo…';const safe=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-');const path=`${active.module}/${Date.now()}-${safe}`;
    const up=await c.storage.from('portal-documentos').upload(path,file,{upsert:false});if(up.error){status.textContent='Falha no envio: '+up.error.message;return}
    const {data:pub}=c.storage.from('portal-documentos').getPublicUrl(path);
    const payload={module:active.module,title:String(fd.get('title')||'').trim(),description:String(fd.get('description')||'').trim()||null,reference_number:String(fd.get('reference_number')||'').trim()||null,reference_date:fd.get('reference_date')||null,year:fd.get('year')?Number(fd.get('year')):null,department:String(fd.get('department')||'').trim()||staff.department||null,file_url:pub?.publicUrl||null,active:true,published_at:new Date().toISOString()};
    const ins=await c.from('portal_documents').insert(payload);if(ins.error){status.textContent='Arquivo enviado, mas o cadastro falhou: '+ins.error.message;return}
    active.docs=await loadDocs(active.module);renderRows();
  }

  async function signedPayslip(path){if(!path)return '';if(/^https?:/i.test(path))return path;const c=await getClient();const {data}=await c.storage.from('contracheques').createSignedUrl(path,900);return data?.signedUrl||''}
  async function renderPayslips(q=''){
    const body=document.querySelector('.mpi-body');if(!body)return;const c=await getClient(),session=await getSession();if(!c){body.innerHTML='<div class="mpi-empty"><strong>Não foi possível iniciar o acesso seguro.</strong></div>';return}
    if(!session){body.innerHTML='<div class="mpi-empty"><strong>Área privada do servidor.</strong><span>Entre na sua conta para visualizar somente os seus contracheques.</span><button class="mpi-login mpi-open" type="button">Entrar na conta</button></div>';body.querySelector('.mpi-login')?.addEventListener('click',()=>document.querySelector('#manariSocialApp .sm-circle-btn[title="Conta"]')?.click());return}
    await getStaff();
    const {data,error}=await c.from('employee_payslips').select('*').eq('user_id',session.user.id).order('competence',{ascending:false});if(error){body.innerHTML='<div class="mpi-empty"><strong>Não foi possível carregar os contracheques.</strong></div>';return}
    const rows=(data||[]).filter(x=>!q||norm([x.description,x.competence].join(' ')).includes(q));const cards=[];for(const p of rows){const url=await signedPayslip(p.file_url);cards.push(`<article class="mpi-card"><div class="mpi-card-icon">💳</div><div class="mpi-card-main"><h3>${esc(p.description||'Contracheque')}</h3><div class="mpi-meta">Competência: ${esc(p.competence?new Date(p.competence+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'')}</div><div class="mpi-actions">${url?`<a class="mpi-open" href="${esc(url)}" target="_blank" rel="noopener">Visualizar / baixar</a>`:''}</div></div></article>`)}
    const rh=staff&&(staff.can_manage_payslips||staff.role==='admin')?'<div class="mpi-staffbar"><span>Área do RH</span><button class="mpi-open mpi-add-pay" type="button">+ Publicar contracheque</button></div>':'';
    body.innerHTML=`${rh}${cards.length?`<div class="mpi-count">${cards.length} contracheque(s)</div><div class="mpi-list">${cards.join('')}</div>`:'<div class="mpi-empty"><strong>Nenhum contracheque disponível.</strong><span>Quando o RH publicar a competência, ela aparecerá aqui.</span></div>'}`;body.querySelector('.mpi-add-pay')?.addEventListener('click',showPayslipForm);
  }
  function showPayslipForm(){
    if(!(staff&&(staff.can_manage_payslips||staff.role==='admin')))return;const body=document.querySelector('.mpi-body');
    body.innerHTML='<form class="mpi-form"><h2>Publicar contracheque</h2><label>Matrícula do servidor<input name="registration" required></label><label>Competência<input type="month" name="competence" required></label><label>Descrição<input name="description" placeholder="Ex.: Contracheque mensal"></label><label>Arquivo PDF<input type="file" name="file" accept="application/pdf" required></label><div class="mpi-actions"><button class="mpi-open" type="submit">Publicar</button><button class="mpi-cancel" type="button">Cancelar</button></div><div class="mpi-form-status"></div></form>';
    body.querySelector('.mpi-cancel').addEventListener('click',()=>renderPayslips());body.querySelector('.mpi-form').addEventListener('submit',publishPayslip);
  }
  async function publishPayslip(e){
    e.preventDefault();const form=e.currentTarget,status=form.querySelector('.mpi-form-status'),c=await getClient(),fd=new FormData(form);status.textContent='Localizando servidor…';
    const reg=String(fd.get('registration')||'').trim();const {data:profile,error:pe}=await c.from('employee_profiles').select('user_id,registration,full_name').eq('registration',reg).maybeSingle();if(pe||!profile){status.textContent='Matrícula não encontrada no cadastro de servidores.';return}
    const file=fd.get('file');if(!(file instanceof File)||!file.size)return;const comp=String(fd.get('competence')||'');const path=`${profile.user_id}/${comp}-${Date.now()}.pdf`;status.textContent='Enviando PDF…';const up=await c.storage.from('contracheques').upload(path,file,{upsert:false});if(up.error){status.textContent='Falha no envio: '+up.error.message;return}
    const competence=comp+'-01';const ins=await c.from('employee_payslips').upsert({user_id:profile.user_id,competence,file_url:path,description:String(fd.get('description')||'').trim()||`Contracheque ${comp}`},{onConflict:'user_id,competence'});if(ins.error){status.textContent='Falha ao registrar contracheque: '+ins.error.message;return}status.textContent=`Publicado para ${profile.full_name||reg}.`;setTimeout(()=>renderPayslips(),700);
  }

  async function open(title,moduleOverride){const module=moduleOverride||moduleFor(title);if(window.ManariServiceDirectory){window.location.assign(window.ManariServiceDirectory.resolve(module,window.location.href).url);return}if(module==='esic'||module==='ouvidoria'){window.location.assign(new URL('./'+module+'/',window.location.href).href);return}const destination=new URL('./transparencia/',window.location.href);if(module!=='transparencia')destination.searchParams.set('mod',module);window.location.assign(destination.href);return}

  function close(){document.querySelector('.mpi-overlay')?.classList.remove('open');document.body.style.overflow='';active=null}
  function intercept(){document.addEventListener('click',e=>{const service=e.target.closest('[data-service-url],.sm-quick-card[data-url]');if(service){const title=service.querySelector('b')?.textContent?.trim()||service.textContent.trim();if(title){e.preventDefault();e.stopImmediatePropagation();open(title);return}}const nav=e.target.closest('#manariSocialApp [data-nav]');if(!nav)return;const map={diario:['Diário Oficial','diario_oficial'],ouvidoria:['Ouvidoria','ouvidoria'],esic:['e-SIC / Pedido de Informação','esic'],programas:['Carta de Serviços','carta_servicos']};const m=map[nav.dataset.nav];if(m){e.preventDefault();e.stopImmediatePropagation();open(m[0],m[1])}},true)}
  window.ManariPortalInternal={open,close,moduleFor};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',intercept,{once:true});else intercept();
})();