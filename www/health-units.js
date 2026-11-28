/* Diretório público de unidades: dados oficiais serão adicionados em health-units.json. */
(function(root){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const picture='<svg viewBox="0 0 80 62" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="3" y="3" width="74" height="56" rx="8"/><circle cx="57" cy="18" r="6"/><path d="m7 52 21-25 19 21 10-11 16 18"/></svg>';
  const pin='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  function imageUrl(value){if(!value)return '';try{const base=root.location?.origin||'https://www.manari.pe.gov.br';const url=new URL(String(value),base);return url.protocol==='https:'?url.href:''}catch{return ''}}
  function coordinate(value,min,max){if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=min&&n<=max?n:null}
  function directions(unit){
    if(!String(unit.name||'').trim()||!String(unit.address||'').trim())return '';
    const lat=coordinate(unit.latitude,-90,90),lng=coordinate(unit.longitude,-180,180);
    const destination=lat!==null&&lng!==null?`${lat},${lng}`:[unit.name,unit.address,unit.locality,'Manari - PE'].filter(Boolean).join(', ');
    const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('destination',destination);return url.href;
  }
  function normalize(input){
    if(!input||typeof input!=='object')return null;
    const name=String(input.name||'').trim(),address=String(input.address||'').trim();
    if(!name||!address||input.active===false)return null;
    return {...input,name,address,locality:String(input.locality||'').trim(),image_url:imageUrl(input.image_url)};
  }
  const categories=[['ubs','Unidades Básicas de Saúde','✚'],['urgencia','Urgência e Emergência','✚'],['especial','Atendimento Especializado','⚕'],['vigilancia','Vigilância e Imunização','⛨'],['bemestar','Promoção da Saúde e Bem-Estar','♡'],['gestao','Gestão e Regulação','▦']];
  function category(u){const n=u?.name||'';return /^(UBSF|ESF) /.test(n)?'ubs':/^(Unidade Mista|SAMU)/.test(n)?'urgencia':/^(E-Multi|CAPS)/.test(n)?'especial':/Vigilância|Coordenação PNI/.test(n)?'vigilancia':/^Academia/.test(n)?'bemestar':'gestao'}
  const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function card(unit){
    const placeholder=!unit,route=unit?directions(unit):'';
    const photo=unit?.image_url?`<img src="${esc(unit.image_url)}" alt="${esc('Fachada de '+unit.name)}" loading="lazy">`:`<div class="hcu-photo-placeholder">${picture}<span>${placeholder?'Foto da unidade':'Foto a cadastrar'}</span></div>`;
    const name=unit?.name||'Nome da unidade',address=unit?.address||'Endereço a cadastrar',locality=unit?.locality?unit.locality+' • Manari – PE':placeholder?'Localidade • Manari – PE':'Manari – PE';
    return `<article data-category="${category(unit)}" class="hcu-card${placeholder?' hcu-pending':''}"${placeholder?' aria-label="Espaço reservado para cadastro de unidade"':''}><div class="hcu-photo">${photo}</div><div class="hcu-card-body"><span class="hcu-card-kicker">${esc(unit?categories.find(c=>c[0]===category(unit))[1]:"Rede Municipal de Saúde")}</span><h3>${esc(name)}</h3><div class="hcu-card-bottom"><div class="hcu-address">${pin}<p>${esc(address)}<br><span>${esc(locality)}</span></p></div>${route?`<a class="hcu-directions" href="${esc(route)}" target="_blank" rel="noopener noreferrer" aria-label="${esc('Como chegar a '+name)}">${pin}Como chegar</a>`:`<button class="hcu-directions" type="button" disabled title="Disponível após o cadastro do endereço">${pin}Como chegar</button>`}</div></div></article>`;
  }
  function template(department,strip,services){
    services=services.replace(/(<a\b[^>]*href="[^"\s]*#saude-unidades"[^>]*)(>)/, '$1 aria-current="page"$2');
    return `<div class="page-wrap hcu-page" data-swipe-route="saude"><nav class="hcu-breadcrumb" aria-label="Caminho de navegação"><a href="#inicio" data-route="home">Início</a><span>/</span><a href="#saude" data-dept="saude">Saúde</a><span>/</span><span>Rede Municipal de Saúde</span></nav><header class="hcu-heading"><span class="hcu-kicker"><img src="${esc(department.icon)}" alt=""> SECRETARIA MUNICIPAL DE SAÚDE</span><h1>Rede Municipal de Saúde</h1><p>Conheça nossa rede de atendimento, serviços e setores de saúde de Manari.</p></header>${strip}<nav class="hcu-service-tabs" aria-label="Serviços da Saúde">${services}</nav><section class="hcu-directory" aria-labelledby="hcu-directory-title"><div class="hcu-categories" aria-label="Categorias de saúde">${categories.map(([id,label,ico])=>`<button type="button" data-hcu-filter="${id}" aria-pressed="false"><i aria-hidden="true">${ico}</i><strong>${label}</strong><small data-hcu-count="${id}"></small></button>`).join("")}</div><div class="hcu-controls"><label><span>Buscar unidade ou serviço</span><input type="search" id="hcu-search" placeholder="Buscar unidade ou serviço..."></label><button type="button" data-hcu-filter="all" aria-pressed="true">Todas</button></div><h2 id="hcu-directory-title">Todas as unidades e setores</h2><p id="hcu-status" role="status" aria-live="polite">Carregando unidades…</p><div id="hcu-grid" class="hcu-grid">${Array.from({length:4},()=>card(null)).join('')}</div><button id="hcu-retry" type="button" class="hcu-retry" hidden>Tentar novamente</button></section></div>`;
  }
  async function mount(container){
    const page=container.querySelector('.hcu-page');if(!page)return;
    const grid=page.querySelector('#hcu-grid'),status=page.querySelector('#hcu-status'),retry=page.querySelector('#hcu-retry');
    let units=[],selected='all';const search=page.querySelector('#hcu-search'),heading=page.querySelector('#hcu-directory-title');
    function render(){const q=fold(search.value.trim());const visible=units.filter(u=>(selected==='all'||category(u)===selected)&&fold([u.name,u.address,u.locality].join(' ')).includes(q));grid.innerHTML=visible.length?visible.map(card).join(''):'<p>Nenhum estabelecimento encontrado.</p>';heading.textContent=(selected==='all'?'Todas as unidades e setores':categories.find(c=>c[0]===selected)[1])+' ('+visible.length+')';page.querySelectorAll('[data-hcu-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hcuFilter===selected)));page.querySelectorAll('[data-hcu-count]').forEach(b=>b.textContent=units.filter(u=>category(u)===b.dataset.hcuCount).length+' registros');grid.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{image.parentElement.innerHTML='<div class="hcu-photo-placeholder">'+picture+'<span>Foto indisponível</span></div>'},{once:true}));}
    page.querySelectorAll('[data-hcu-filter]').forEach(b=>b.onclick=()=>{selected=b.dataset.hcuFilter;render()});search.oninput=render;
    async function load(){
      retry.hidden=true;retry.disabled=true;status.textContent='Carregando unidades…';
      try{const response=await fetch(new URL('./health-units.json',root.location.href),{cache:'no-store'});if(!response.ok)throw Error('Falha ao consultar unidades');const data=await response.json();if(!Array.isArray(data.units))throw Error('Formato inválido');if(!page.isConnected)return;
        units=data.units.map(normalize).filter(Boolean);render();status.textContent='Consulte os endereços e abra a rota no Google Maps.';
      }catch{if(!page.isConnected)return;status.textContent='Não foi possível carregar as unidades agora. Tente novamente.';grid.replaceChildren();retry.hidden=false}
      finally{retry.disabled=false}
    }
    retry.onclick=load;await load();
  }
  const api={template,mount,directions,normalize,card};root.ManariHealthUnits=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
