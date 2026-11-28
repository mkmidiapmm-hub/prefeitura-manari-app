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
  const categoryIcons={"ubs":"<path fill=\"currentColor\" d=\"M3 11 16 2l13 9-2 3-11-8-11 8zM6 13l10-7 10 7v16H6z\"/><path fill=\"white\" d=\"M14 14h4v4h4v4h-4v4h-4v-4h-4v-4h4z\"/>","urgencia":"<path fill=\"currentColor\" d=\"M2 10a3 3 0 0 1 3-3h14l10 10v8H2z\"/><path fill=\"white\" d=\"M10 10h3v4h4v3h-4v4h-3v-4H6v-3h4zM21 12v6h6z\"/><circle cx=\"8\" cy=\"25\" r=\"4\" fill=\"currentColor\" stroke=\"white\"/><circle cx=\"24\" cy=\"25\" r=\"4\" fill=\"currentColor\" stroke=\"white\"/><path stroke=\"currentColor\" stroke-width=\"2\" d=\"M12 1v4M7 2l2 3m8-3-2 3\"/>","especial":"<g fill=\"currentColor\"><circle cx=\"16\" cy=\"7\" r=\"5\"/><circle cx=\"5\" cy=\"12\" r=\"4\"/><circle cx=\"27\" cy=\"12\" r=\"4\"/><path d=\"M1 27v-7q4-7 9-2v9zm21 0v-9q5-5 9 2v7zM8 29V19q8-10 16 0v10z\"/></g><path d=\"M12 16v6a4 4 0 0 0 8 0v-6m-4 10v2\" stroke=\"white\" stroke-width=\"1.8\" fill=\"none\"/>","vigilancia":"<path fill=\"currentColor\" d=\"M16 1 29 6v9c0 8-6 13-13 16C9 28 3 23 3 15V6z\"/><path fill=\"white\" d=\"M13 8h6v6h6v6h-6v6h-6v-6H7v-6h6z\"/>","bemestar":"<circle cx=\"12\" cy=\"5\" r=\"4\" fill=\"currentColor\"/><path d=\"m3 9 9 7 9-7M12 15v7m0-1-6 9m6-9 6 9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\"/><path fill=\"#bd2637\" d=\"M25 9c-5-5-10 2 0 10 10-8 5-15 0-10z\"/><path d=\"M20 13h3l2-3 2 5 2-2h2\" stroke=\"white\" fill=\"none\"/>","gestao":"<rect x=\"4\" y=\"5\" width=\"21\" height=\"25\" rx=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"/><rect x=\"10\" y=\"2\" width=\"10\" height=\"6\" rx=\"2\" fill=\"currentColor\"/><path d=\"M9 13h11M9 18h8M9 23h6\" stroke=\"currentColor\" stroke-width=\"2.5\"/><path fill=\"currentColor\" stroke=\"white\" d=\"m24 17 2 3 4 0 1 4-3 2v4l-4 1-2-3-4 0-1-4 3-2v-4z\"/><circle cx=\"24\" cy=\"24\" r=\"2.5\" fill=\"white\"/>"};
  function categoryIcon(id){return `<svg viewBox="0 0 32 32" width="48" height="48" aria-hidden="true">${categoryIcons[id]}</svg>`;}
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
    return `<div class="page-wrap hcu-page" data-swipe-route="saude"><nav class="hcu-breadcrumb" aria-label="Caminho de navegação"><a href="#inicio" data-route="home">Início</a><span>/</span><a href="#saude" data-dept="saude">Saúde</a><span>/</span><span>Rede Municipal de Saúde</span></nav><header class="hcu-heading"><span class="hcu-kicker"><img src="${esc(department.icon)}" alt=""> SECRETARIA MUNICIPAL DE SAÚDE</span><h1>Rede Municipal de Saúde</h1><p>Conheça nossa rede de atendimento, serviços e setores de saúde de Manari.</p></header>${strip}<nav class="hcu-service-tabs" aria-label="Serviços da Saúde">${services}</nav><section class="hcu-directory" aria-labelledby="hcu-directory-title"><div class="hcu-categories" aria-label="Categorias de saúde">${categories.map(([id,label,ico])=>`<button type="button" data-hcu-filter="${id}" aria-pressed="false"><i aria-hidden="true">${categoryIcon(id)}</i><strong>${label}</strong><small data-hcu-count="${id}"></small></button>`).join("")}</div><div class="hcu-controls"><label><span>Buscar unidade ou serviço</span><input type="search" id="hcu-search" placeholder="Buscar unidade ou serviço..."></label><button type="button" data-hcu-filter="all" aria-pressed="true">Todas</button></div><h2 id="hcu-directory-title">Todas as unidades e setores</h2><p id="hcu-status" role="status" aria-live="polite">Carregando unidades…</p><div id="hcu-grid" class="hcu-grid">${Array.from({length:4},()=>card(null)).join('')}</div><button id="hcu-retry" type="button" class="hcu-retry" hidden>Tentar novamente</button></section></div>`;
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
