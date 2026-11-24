import test from 'node:test';
import assert from 'node:assert/strict';
import {mapsURL,directionsURL,directionsLink,schoolSummary,refreshLocationPreview} from '../www/educacao/location.mjs';
import {schoolTable} from '../www/educacao/panels.mjs';
test('localização aceita somente links HTTPS dos formatos do Google Maps',()=>{
 for(const value of ['https://maps.app.goo.gl/Exemplo123','https://goo.gl/maps/Exemplo123','https://www.google.com/maps/place/Escola/','https://maps.google.com/?q=-8,-37','https://www.google.com.br/maps?q=Escola'])assert(mapsURL(value));
 assert.equal(mapsURL('  '),'');
 for(const value of ['javascript:alert(1)','http://maps.google.com/?q=a','https://google.com.evil.test/maps/a','https://evil.test/maps','https://www.google.com/url?q=evil','https://evil.test@google.com/maps/','https://maps.app.goo.gl:444/Abc','https://maps.app.goo.gl/Abc/extra','https://maps.app.goo.gl/A\nB','https://www.google.com/maps/'+ 'x'.repeat(2048)])assert.throws(()=>mapsURL(value));
});
test('rota prefere a localização cadastrada e usa endereço em Manari como alternativa',()=>{
 const school={name:'Escola de teste & Ensino',address:'Sítio de teste, s/n'};
 const url=new URL(directionsURL(school));assert.equal(url.origin,'https://www.google.com');assert.equal(url.pathname,'/maps/dir/');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('destination'),'Escola de teste & Ensino, Sítio de teste, s/n, Manari - PE, Brasil');assert(!url.searchParams.has('origin'));
 assert.equal(directionsURL({...school,maps_url:'https://maps.app.goo.gl/Exemplo123'}),'https://maps.app.goo.gl/Exemplo123');
 assert.equal(directionsURL({...school,maps_url:'javascript:bad'}),directionsURL(school));
 assert.equal(directionsURL({name:'Escola sem endereço'}),'');assert.equal(directionsURL(null),'');
});
test('botão de rota e resumo escapam conteúdo e não expõem dados do responsável',()=>{
 const attack='<img src=x onerror=alert(1)>',school={name:attack,address:attack,contact:attack,instructions:attack,school_year:2027};
 for(const html of [schoolSummary(school),schoolTable([{...school,id:'unit'}]),directionsLink(school,attack)]){assert(!html.includes(attack));assert.match(html,/target="_blank" rel="noopener noreferrer"/);}
 assert.match(schoolSummary(school),/&lt;img/);assert.equal(directionsLink({}),'');
 const html=directionsLink({...school,guardian_name:'SEGREDO',phone:'SEGREDO',user_id:'SEGREDO'});assert(!html.includes('SEGREDO'));
});
test('prévia acompanha a digitação, rejeita links inválidos e limpa a mensagem ao corrigir',()=>{
 let message='';const preview={innerHTML:'',textContent:''};const elements={maps_url:{value:'https://evil.test',setCustomValidity:value=>message=value},name:{value:'Escola de teste'},address:{value:'Rua de teste, 50'}};
 const form={elements,querySelector:()=>preview};refreshLocationPreview(form);assert.match(message,/Google Maps/);assert.match(preview.textContent,/Google Maps/);
 elements.maps_url.value='https://maps.app.goo.gl/Exemplo123';refreshLocationPreview(form);assert.equal(message,'');assert.match(preview.innerHTML,/Exemplo123/);
 elements.maps_url.value='';refreshLocationPreview(form);assert.match(preview.innerHTML,/destination=/);assert(!preview.innerHTML.includes('Exemplo123'));
 elements.address.value='';refreshLocationPreview(form);assert(!preview.innerHTML.includes('href='));
});
