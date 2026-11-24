/* Atalhos setoriais: preserva os serviços existentes e identifica pedidos de manutenção. */
(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const maintenance = {
    'Obras e Pavimentação': ['pavimentacao', 'Informar problema', 'road'],
    'Estradas Vicinais': ['estradas', 'Solicitar manutenção', 'route'],
    'Iluminação Pública': ['iluminacao', 'Informar problema', 'lamp'],
    'Saneamento e Drenagem': ['drenagem', 'Informar problema', 'drain'],
    'Praças e Prédios Públicos': ['espacos-publicos', 'Solicitar reparo', 'building']
  };
  const paths = {
    road: '<path d="m7 3-4 18M17 3l4 18M12 3v3m0 4v4m0 4v3"/>',
    route: '<path d="M5 21c0-9 14-9 14-18M11 21c0-7 8-7 8-12M4 7V3m-2 2h4M4 15v-4m-2 2h4"/>',
    lamp: '<path d="M5 21V7a4 4 0 0 1 4-4h7M3 21h5M13 3h6v4h-6zM16 10v3m-5-4-2 2m12-2 2 2"/>',
    drain: '<path d="M12 2s-4 5-4 7a4 4 0 0 0 8 0c0-2-4-7-4-7ZM4 16h16l2 6H2l2-6Zm3 2v2m5-2v2m5-2v2"/>',
    building: '<path d="M3 21V4h12v17M7 8h1m3 0h1M7 12h1m3 0h1M8 21v-5h3v5m8 0v-4m0 0c-5 0-4-7 0-7s5 7 0 7ZM1 21h22"/>',
    chat: '<path d="M4 12a8 8 0 0 1 16 0v5a3 3 0 0 1-3 3h-4M4 11H2v6h4v-6H4Zm16 0h2v6h-4v-6h2Z"/>',
    health: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
    education: '<path d="m2 8 10-5 10 5-10 5L2 8Zm4 3v6c4 3 8 3 12 0v-6m4-3v9"/>',
    document: '<path d="M6 2h8l5 5v15H6V2Zm8 0v6h5M9 12h7m-7 4h7"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 5a5 5 0 0 1 3 4v2"/>',
    leaf: '<path d="M20 3C7 2 2 8 6 16c8 4 14-1 14-13ZM4 21 16 9"/>',
    service: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7m-3-3v7"/>'
  };
  function icon(title, fallback) {
    const name = fallback || (/ouvidoria|atendimento/i.test(title) ? 'chat' : /saúde|vacina|medic|consulta/i.test(title) ? 'health' : /escola|educa|matrícula/i.test(title) ? 'education' : /document|certid|licita|contas/i.test(title) ? 'document' : /social|cadastro|família/i.test(title) ? 'people' : /rural|agric|ambiente/i.test(title) ? 'leaf' : 'service');
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  }
  function destination(title, department, base) {
    if(department==='assistencia' && ['cras','creas'].includes(norm(title))){const url=new URL('./',base);url.hash=norm(title);return {url:url.href,action:'Conhecer atendimento',symbol:'people'};}
    if(department==='saude' && norm(title)==='e-sus') return {url:'https://esus.manari.pe.gov.br/',action:'Acessar e-SUS',symbol:'health'};
    if(department==='saude' && norm(title)==='unidades de saude (ubs)'){const url=new URL('./',base);url.hash='saude-unidades';return {url:url.href,action:'Ver unidades',symbol:'health'};}
    const education = {'Matrícula Escolar':['matricula','Solicitar pré-matrícula','education'],'Transporte Escolar':['transporte','Solicitar transporte','route'],'Merenda e Alimentação':['alimentacao','Cardápio e atendimento','service'],'Infraestrutura Escolar':['infraestrutura','Informar problema','building'],'Eventos Culturais':['eventos','Ver agenda e inscrições','people'],'Notícias da Prefeitura':['noticias','Acompanhar Educação','document']};
    if(department === 'educacao' && education[title]){const [service,action,symbol]=education[title],url=new URL('./educacao/',base);url.searchParams.set('servico',service);return {url:url.href,action,symbol};}
    const match = department === 'infraestrutura' && maintenance[title];
    if (!match && norm(title) !== 'ouvidoria' && norm(title) !== 'ouvidoria municipal') return null;
    const u = new URL('./ouvidoria/', base);
    u.searchParams.set('setor', department);
    if (match) { u.searchParams.set('servico', match[0]); u.searchParams.set('tipo', 'solicitacao'); }
    u.hash = 'nova-manifestacao';
    return {url:u.href, action:match ? match[1] : 'Registrar manifestação', symbol:match ? match[2] : 'chat'};
  }
  function cards(items, department, base) {
    if(department==='saude' && !items.some(([title])=>norm(title)==='e-sus')) items=[...items,['e-SUS','Sistema e-SUS da Secretaria Municipal de Saúde']];
    return `<div class="service-grid sector-service-grid">${items.map(([title, description]) => {
      const dest = destination(title, department, base);
      const attributes = dest ? `href="${esc(dest.url)}" data-sector-request` : `type="button" data-service="${esc(title)}"`;
      const tag = dest ? 'a' : 'button';
      return `<${tag} class="sector-service-tile" ${attributes} title="${esc(description)}"><span class="sector-service-icon">${icon(title, dest?.symbol)}</span><span class="sector-service-title">${esc(title)}</span><span class="sector-service-action">${esc(dest?.action || 'Consultar serviço')} <span aria-hidden="true">›</span></span></${tag}>`;
    }).join('')}</div>`;
  }
  function feed(department, name) {
    return `<section class="section sector-feed" data-sector-feed="${esc(department)}" data-sector-name="${esc(name)}" aria-label="Publicações de ${esc(name)}"><div class="sector-feed-heading"><div><h2>Acompanhe as novidades da secretaria</h2><p>Publicações mais recentes primeiro.</p></div><button type="button" class="mf-secondary" data-sector-refresh>Atualizar</button></div><div class="sector-feed-list" aria-live="polite"><p class="mf-empty" role="status">Carregando publicações…</p></div><button type="button" class="mf-secondary sector-feed-more" data-sector-more hidden>Carregar mais publicações</button></section>`;
  }
  const api = {cards, destination, feed};
  root.ManariSectorServices = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
