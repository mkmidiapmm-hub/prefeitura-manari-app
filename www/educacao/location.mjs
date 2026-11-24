import {esc} from './domain.mjs';

const MAPS_ERROR='Cole um link HTTPS do Google Maps ou deixe o campo vazio para usar o endereço.';
export function mapsURL(value){
 const raw=String(value??'').trim();if(!raw)return '';
 if(raw.length>2048||/[\u0000-\u0020\u007f]/.test(raw))throw Error(MAPS_ERROR);
 let url;try{url=new URL(raw);}catch{throw Error(MAPS_ERROR);}
 const {hostname:host,pathname:path}=url;
 const allowed=(['google.com','www.google.com','google.com.br','www.google.com.br'].includes(host)&&/^\/maps(?:\/|$)/.test(path))
   ||(host==='maps.google.com'&&path.startsWith('/'))
   ||(host==='maps.app.goo.gl'&&/^\/[A-Za-z0-9]+\/?$/.test(path))
   ||(host==='goo.gl'&&/^\/maps\/[A-Za-z0-9]+\/?$/.test(path));
 if(url.protocol!=='https:'||url.username||url.password||url.port||!allowed)throw Error(MAPS_ERROR);
 return url.href;
}
export function directionsURL(school){
 if(!school)return '';
 try{const link=mapsURL(school.maps_url);if(link)return link;}catch{}
 const address=String(school.address??'').trim();if(address.length<5)return '';
 const destination=[String(school.name??'').trim(),address,'Manari - PE, Brasil'].filter(Boolean).join(', ');
 const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('destination',destination);return url.href;
}
export function directionsLink(school,label='Como chegar'){
 const url=directionsURL(school);return url?`<a class="button secondary edu-school-directions" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>${esc(label)}<span class="edu-location-sr"> (Google Maps, abre em nova aba)</span></a>`:'';
}
export function schoolSummary(school){
 if(!school)return '';
 return `<div class="edu-school-address"><strong>${esc(school.name)}</strong> · Ano letivo ${esc(school.school_year)}<p>${esc(school.address||'Endereço não informado.')}</p>${school.contact?`<p>Contato: ${esc(school.contact)}</p>`:''}${school.instructions?`<p>Orientações: ${esc(school.instructions)}</p>`:''}</div>${directionsLink(school)}`;
}
export function locationFields(){return `<fieldset class="edu-school-location"><legend>Localização da escola</legend><label>Link da localização no Google Maps (opcional)<input name="maps_url" type="url" inputmode="url" maxlength="2048" placeholder="Cole o link compartilhado pelo Google Maps" aria-describedby="school-map-help" autocomplete="off"></label><p id="school-map-help" class="hint">No Google Maps, encontre a escola, toque em Compartilhar e copie o link. Sem esse link, a rota usará o endereço cadastrado acima.</p><div id="school-map-preview" class="edu-map-preview" aria-live="polite"></div><p class="hint">Confira no mapa se o local está correto antes de salvar. Em escolas rurais, prefira o link do ponto exato.</p></fieldset>`;}
export function refreshLocationPreview(form){
 const field=form.elements.maps_url,preview=form.querySelector('#school-map-preview');if(!field||!preview)return;
 try{
  const maps_url=mapsURL(field.value);field.setCustomValidity('');
  const school={maps_url,name:form.elements.name.value,address:form.elements.address.value};
  preview.innerHTML=directionsLink(school,'Conferir localização no mapa')||'<p class="hint">Preencha o endereço ou cole o link da escola para conferir o mapa.</p>';
 }catch(error){field.setCustomValidity(error.message);preview.textContent=error.message;}
}
export function bindLocationPreview(form){
 const refresh=()=>refreshLocationPreview(form);
 form.addEventListener('input',event=>{if(['maps_url','name','address'].includes(event.target.name))refresh();});
 form.addEventListener('reset',()=>queueMicrotask(refresh));refresh();
}
