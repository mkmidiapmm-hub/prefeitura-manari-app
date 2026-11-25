/* Configuração declarativa: nenhum HTML, CSS ou seletor fornecido pelo usuário é executado. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ManariLayoutModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='!manari-visual-layout-v1',VERSION=1;
 const PAGES={home:'Página inicial',saude:'Saúde',educacao:'Educação e Cultura',assistencia:'Assistência Social',financas:'Finanças',infraestrutura:'Infraestrutura',agricultura:'Agricultura',administracao:'Administração',esportes:'Esportes',mulher:'Mulher',comunicacao:'Comunicação',tributos:'Tributos',rh:'Recursos Humanos',seguranca:'Segurança e Proteção',transportes:'Transportes',controle:'Controle Interno',ouvidoria:'Ouvidoria',planejamento:'Planejamento',juridico:'Assessoria Jurídica'};
 const ZONES={header:'Cabeçalho',footer:'Rodapé',shortcuts:'Atalhos de atendimento',climate:'Alerta climático',weather:'Temperatura',campaign:'Campanha do portal',hero:'Apresentação da página',features:'Notícias e destaques',services:'Serviços',contact:'Atendimento e contatos',feed:'Publicações da secretaria',programs:'Áreas de atuação'};
 const STICKERS={tree:['Árvore de Natal','layout-assets/tree.svg'],star:['Estrela dourada','layout-assets/star.svg'],lights:['Pisca-pisca','layout-assets/lights.svg'],natal:['Logo Divino Natal','divino-natal/logo-oficial.png']};
 const num=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
 const text=(v,n)=>String(v??'').slice(0,n),ids=a=>[...new Set((Array.isArray(a)?a:[]).filter(v=>typeof v==='string'&&/^[a-z][a-z0-9_-]{0,45}$/.test(v)))].slice(0,40);
 function safeURL(value,base='https://www.manari.pe.gov.br/'){try{const raw=String(value||'').trim();if(!raw)return '';const u=new URL(raw,base);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&u.origin===new URL(base).origin))return '';if(u.username||u.password)return '';return u.href;}catch{return '';}}
 function frame(value={}){return {x:num(value.x,0,95,70),y:num(value.y,0,95,5),width:num(value.width,4,100,18),rotation:num(value.rotation,-180,180,0),opacity:num(value.opacity,20,100,100),visible:value.visible!==false};}
 function clean(raw,base){const doc={version:VERSION,pages:{}};if(raw?.version!==VERSION)return doc;
  for(const key of Object.keys(PAGES)){const p=raw.pages?.[key];if(!p)continue;const page={items:[],orders:{}};
   for(const device of ['desktop','tablet','mobile'])page.orders[device]={blocks:ids(p.orders?.[device]?.blocks).filter(k=>Object.hasOwn(ZONES,k)),icons:ids(p.orders?.[device]?.icons)};
   const seen=new Set();for(const item of (Array.isArray(p.items)?p.items:[]).slice(0,60)){
    if(!/^[a-zA-Z0-9_-]{1,60}$/.test(item?.id||'')||seen.has(item.id)||!['sticker','image','text','button'].includes(item.type))continue;
    if(!Object.hasOwn(ZONES,item.zone))continue;seen.add(item.id);
    const src=safeURL(item.src,base),href=safeURL(item.href,base);if(['sticker','image'].includes(item.type)&&!src)continue;
    const start=Date.parse(item.start),end=Date.parse(item.end);
    page.items.push({id:item.id,type:item.type,zone:item.zone,label:text(item.label,100),text:text(item.text,1500),src,href,placement:item.placement==='before'?'before':'after',start:Number.isFinite(start)?new Date(start).toISOString():'',end:Number.isFinite(end)?new Date(end).toISOString():'',desktop:frame(item.desktop),tablet:frame(item.tablet||item.desktop),mobile:frame(item.mobile||item.desktop)});
   }doc.pages[key]=page;
  }return doc;
 }
 function active(item,now=Date.now()){return (!item.start||now>=Date.parse(item.start))&&(!item.end||now<Date.parse(item.end));}
 function device(width){return width<=600?'mobile':width<=1024?'tablet':'desktop';}
 function ordered(nodes,order,key){const ranks=new Map(order.map((v,i)=>[v,i]));return nodes.map((node,i)=>({node,i,rank:ranks.has(key(node))?ranks.get(key(node)):order.length+i})).sort((a,b)=>a.rank-b.rank||a.i-b.i).map(x=>x.node);}
 function validate(doc){for(const p of Object.values(doc.pages))for(const i of p.items){if(i.start&&i.end&&Date.parse(i.end)<=Date.parse(i.start))throw Error('O encerramento precisa ser depois do início da campanha.');if(i.type==='button'&&(!i.text.trim()||!i.href))throw Error('Preencha o texto e o destino do botão.');if(i.type==='text'&&!i.text.trim())throw Error('Preencha o texto do elemento.');}if(JSON.stringify(doc).length>200000)throw Error('O layout excedeu o limite de configuração.');return doc;}
 return {KEY,VERSION,PAGES,ZONES,STICKERS,frame,clean,safeURL,active,device,ordered,validate};
});
