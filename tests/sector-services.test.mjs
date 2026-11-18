import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readContext,describeService} from '../www/ouvidoria/service-context.mjs';
import {submission} from '../www/ouvidoria/api.mjs';
const require=createRequire(import.meta.url),sector=require('../www/portal-sector-services.js');
const catalog=[{code:'obras',name:'Infraestrutura e Obras',active:true},{code:'saude',active:true},{code:'controle',active:false}];

test('cinco atalhos de manutenção chegam à Ouvidoria com serviço e secretaria, na raiz e em subpasta',()=>{
 const services=['Obras e Pavimentação','Estradas Vicinais','Iluminação Pública','Saneamento e Drenagem','Praças e Prédios Públicos'];
 for(const base of ['https://portal.example/index.html#infraestrutura','https://portal.example/www/index.html#infraestrutura'])for(const title of services){
  const dest=sector.destination(title,'infraestrutura',base),u=new URL(dest.url),context=readContext(u.search,catalog);
  assert.equal(u.pathname,new URL('./ouvidoria/',base).pathname);assert.equal(u.hash,'#nova-manifestacao');
  assert.equal(context.department,'obras');assert.equal(context.kind,'solicitacao');assert.equal(context.service.title,title);
 }
});
test('contexto inválido não inventa secretaria ou serviço, e manifestação geral mantém escolha do tipo',()=>{
 assert.equal(readContext('?setor=inexistente&servico=iluminacao',catalog),null);
 assert.equal(readContext('?setor=controle',catalog),null);
 assert.equal(readContext('?setor=saude&servico=iluminacao',catalog).service,null);
 assert.equal(readContext('?setor=infraestrutura&servico=__proto__',catalog).service,null);
 assert.equal(readContext('?setor=infraestrutura',catalog).kind,null);
});
test('roteador legado preserva o contexto completo dos atalhos novos',()=>{
 let handler;const redirects=[];const window={document:{},location:{href:'https://portal.example/',assign:u=>redirects.push(u)},addEventListener:(_,fn)=>{handler=fn;}};
 vm.runInNewContext(readFileSync('www/portal-service-directory.js','utf8'),{window,URL});
 handler({target:{closest:()=>({getAttribute:k=>k==='data-sector-request'?'':null})},preventDefault(){throw Error('Não deve interceptar o atalho');}});
 assert.deepEqual(redirects,[]);
});
test('endereço e referência chegam ao RPC existente no mesmo pedido, sem depender de IPTU',()=>{
 const description=describeService('Lâmpada apagada há vários dias.',{title:'Iluminação Pública',problem:'Lâmpada apagada',location:'Comunidade fictícia',number:'Sem número',reference:'Próximo à escola de teste'});
 const payload=submission({kind:'solicitacao',subject:'Iluminação Pública',description,department:'obras'});
 assert.equal(payload.p_department,'obras');assert.match(payload.p_description,/Comunidade fictícia/);assert.match(payload.p_description,/Próximo à escola de teste/);assert(!Object.keys(payload).some(k=>/iptu|protocol/.test(k)));
 assert.throws(()=>describeService('Descrição de teste',{location:'Sítio',problem:'Buraco',number:'Não sei'}),/referência/);
 assert.throws(()=>describeService('a'.repeat(10000),{location:'Rua de teste',problem:'Buraco',number:'10',title:'Pavimentação'}),/Reduza/);
});
