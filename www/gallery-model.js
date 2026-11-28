/* Shared gallery contract. No credentials, DOM or database mutations. */
(function(root,factory){const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.ManariGalleryModel=model;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const KEY='!manari-gallery-v1';
 const CATEGORIES={cidade:'Cidade de Manari',secretarias:'Secretarias',acoes:'Ações e eventos'};
 const DEPARTMENTS={feed:'Prefeitura de Manari',saude:'Saúde',educacao:'Educação e Cultura',assistencia:'Assistência Social',financas:'Finanças',infraestrutura:'Infraestrutura e Gestão Urbana',agricultura:'Agricultura',administracao:'Administração',esportes:'Esportes',mulher:'Mulher',comunicacao:'Comunicação',tributos:'Tributos',rh:'Recursos Humanos',seguranca:'Segurança e Proteção',transportes:'Transportes',controle:'Controle Interno',cras:'CRAS',creas:'CREAS',ouvidoria:'Ouvidoria',planejamento:'Planejamento',juridico:'Assessoria Jurídica'};
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function text(v,max,required=false){const s=String(v??'').trim();if((required&&!s)||s.length>max)throw Error(required&&!s?'Preencha os campos obrigatórios.':`O texto excede ${max} caracteres.`);return s;}
 function id(v){const s=text(v,100,true);if(!/^[a-zA-Z0-9_-]+$/.test(s))throw Error('Identificador inválido.');return s;}
 function safeUrl(v){const s=String(v??'').trim();if(!s)return '';if(s.startsWith('/')&&!s.startsWith('//')&&!/[\\\s<>]/.test(s))return s;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!/[<>]/.test(s)?u.href:'';}catch{return '';}}
 function date(v){const s=text(v,10);if(!s)return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||(!Number.isFinite(new Date(s+'T12:00:00Z').getTime())||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s))throw Error('Informe uma data válida.');return s;}
 function point(p){const x=Number(p?.x??50),y=Number(p?.y??50);if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>100||y<0||y>100)throw Error('O enquadramento deve ficar entre 0 e 100.');return {x,y};}
 function validate(raw){
  if(!raw||raw.version!==1||!Array.isArray(raw.albums)||!Array.isArray(raw.photos))throw Error('Formato de galeria inválido.');
  if(raw.albums.length>300||raw.photos.length>2000)throw Error('Limite da galeria atingido: 300 álbuns e 2.000 imagens.');
  const albumIds=new Set(),photoIds=new Set();
  const albums=raw.albums.map(a=>{const key=id(a.id);if(albumIds.has(key))throw Error('Há álbuns com o mesmo identificador.');albumIds.add(key);if(!Object.hasOwn(CATEGORIES,a.category))throw Error('Selecione uma categoria válida.');const department=text(a.department,80);if(department&&!Object.hasOwn(DEPARTMENTS,department))throw Error('Selecione uma secretaria válida.');return {id:key,title:text(a.title,160,true),description:text(a.description,600),category:a.category,department,coverId:a.coverId?id(a.coverId):'',visible:a.visible!==false};});
  const photos=raw.photos.map(p=>{const key=id(p.id);if(photoIds.has(key))throw Error('Há fotos com o mesmo identificador.');photoIds.add(key);if(!albumIds.has(p.albumId))throw Error('Selecione um álbum existente.');const src=safeUrl(p.src),source=safeUrl(p.source);if(!src||(p.source&&!source))throw Error('Use uma imagem ou um link HTTPS válido.');if(!['normal','wide','tall'].includes(p.size??'normal'))throw Error('Formato de foto inválido.');if(!['cover','contain'].includes(p.fit??'cover'))throw Error('Enquadramento inválido.');return {id:key,albumId:p.albumId,src,title:text(p.title,160,true),alt:text(p.alt,300,true),caption:text(p.caption,1500),credit:text(p.credit,160),date:date(p.date),source,fit:p.fit??'cover',size:p.size??'normal',desktop:point(p.desktop),mobile:point(p.mobile),visible:p.visible!==false};});
  for(const a of albums)if(a.coverId&&!photos.some(p=>p.id===a.coverId&&p.albumId===a.id))throw Error('A capa precisa ser uma foto do próprio álbum.');
  const heroId=raw.heroId?id(raw.heroId):'';if(heroId&&!photoIds.has(heroId))throw Error('A imagem de destaque não existe.');
  const result={version:1,heroId,albums,photos};if(JSON.stringify(result).length>2*1024*1024)throw Error('A configuração excede o limite de 2 MB.');return result;
 }
 function visible(doc){const albums=doc.albums.filter(a=>a.visible),ids=new Set(albums.map(a=>a.id));return {albums,photos:doc.photos.filter(p=>p.visible&&ids.has(p.albumId))};}
 function filter(doc,options={}){const {albums,photos}=visible(doc),map=new Map(albums.map(a=>[a.id,a])),q=normalize(options.query);return photos.filter(p=>{const a=map.get(p.albumId);return (!options.album||p.albumId===options.album)&&(!options.category||a.category===options.category)&&(!options.department||a.department===options.department)&&(!options.from||(p.date&&p.date>=options.from))&&(!options.to||(p.date&&p.date<=options.to))&&(!q||normalize([p.title,p.caption,p.alt,a.title,a.description,DEPARTMENTS[a.department]].join(' ')).includes(q));});}
 function move(items,key,target){const copy=items.slice(),from=copy.findIndex(x=>x.id===key);if(from<0)return copy;const to=typeof target==='number'?target:copy.findIndex(x=>x.id===target);if(to<0||to>=copy.length||from===to)return copy;copy.splice(to,0,copy.splice(from,1)[0]);return copy;}
 function removePhoto(doc,key){const next=JSON.parse(JSON.stringify(doc));next.photos=next.photos.filter(p=>p.id!==key);next.albums.forEach(a=>{if(a.coverId===key)a.coverId='';});if(next.heroId===key)next.heroId='';return validate(next);}
 function hero(doc){const p=visible(doc).photos;return p.find(p=>p.id===doc.heroId)||p[0]||null;}
 function cover(doc,album){const p=visible(doc).photos.filter(p=>p.albumId===album.id);return p.find(p=>p.id===album.coverId)||p[0]||null;}
 return {KEY,CATEGORIES,DEPARTMENTS,normalize,safeUrl,validate,visible,filter,move,removePhoto,hero,cover};
});
