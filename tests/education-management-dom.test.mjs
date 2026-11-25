import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);let JSDOM;try{({JSDOM}=require('jsdom'))}catch{}
const root=new URL('../www/educacao/',import.meta.url),tick=()=>new Promise(r=>setTimeout(r,30));
const id='11111111-1111-4111-8111-111111111111';
async function fixture(context,href='https://portal.example/educacao/?servico=matricula'){
 const html=readFileSync(new URL('index.html',root),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 const dom=new JSDOM(html,{url:href,runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.matchMedia=()=>({matches:false});
 let source=readFileSync(new URL('app.mjs',root),'utf8');
 for(const match of [...source.matchAll(/^import \{([^}]+)\} from '([^']+)';/gm)]){const exports=await import(new URL(match[2],root));for(const name of match[1].split(',').map(s=>s.trim()))w[name]=exports[name];}
 source=source.replace(/^import .*;\n/gm,'');source=source.slice(0,source.indexOf('authUI();navigation();try{const {createClient}='));
 w.fixtureClient={auth:{getUser:async()=>({data:{user:{id:'fixture-user',email:'admin@example.invalid',user_metadata:{}}}})}};
 w.fixtureService={catalog:async()=>[{id,name:'Escola de teste',address:'Rua de teste, 1',school_year:2026,stages:[],active:true,enrollment_open:false}],context:async()=>context,statistics:async()=>({requests:0,pending:0,scheduled:0}),mine:async()=>[],call:async()=>[],queue:async()=>({rows:[],count:0})};
 await w.eval('(async()=>{'+source+'\nclient=window.fixtureClient;svc=window.fixtureService;authUI();navigation();await identity();})()');await tick();return dom;
}
const skip=!JSDOM?'Instale jsdom@26.1.0 para executar a integração DOM':false;
test('administrador abre o painel completo sem ID e encontra o ID no cadastro',{skip},async()=>{
 const d=await fixture({central:true,admin:true,schools:[]}),w=d.window,doc=w.document;
 assert.equal(doc.getElementById('edu-open-management').hidden,false);assert.equal(doc.getElementById('staff-tab').hidden,false);
 doc.getElementById('edu-open-management').click();await tick();assert.equal(new URL(w.location.href).searchParams.get('acesso'),'secretaria');assert.match(doc.querySelector('#edu-system-hero h1').textContent,/Painel da Secretaria/);assert(doc.querySelector('[data-staff-tab="schools"]'));
 doc.querySelector('[data-staff-tab="schools"]').click();await tick();assert.match(doc.getElementById('staff-body').textContent,/Escola de teste/);assert(doc.getElementById('school-form'));assert.equal(doc.querySelector('#login [name="school_id"]').disabled,true);
 doc.querySelector('[data-edit-school]').click();assert.equal(doc.getElementById('school-access-id').value,id);assert.equal(new URL(doc.getElementById('school-access-url').value).searchParams.get('escola'),id);w.close();
});
test('responsável não recebe atalho administrativo nem acesso pela URL da Secretaria',{skip},async()=>{
 const d=await fixture({central:false,admin:false,schools:[]},'https://portal.example/educacao/?acesso=secretaria#gestao'),doc=d.window.document;
 assert.equal(doc.getElementById('edu-open-management').hidden,true);assert.match(doc.getElementById('staff-content').textContent,/não possui acesso/);assert.equal(doc.getElementById('school-form'),null);d.window.close();
});
test('equipe escolar mantém acesso somente à unidade vinculada',{skip},async()=>{
 const d=await fixture({central:false,admin:false,schools:[id]},'https://portal.example/educacao/?escola='+id+'#gestao'),doc=d.window.document;
 assert.equal(doc.getElementById('edu-open-management').hidden,false);assert.equal(doc.querySelector('[data-staff-tab="schools"]'),null);assert.equal(doc.querySelector('[data-staff-tab="members"]'),null);assert.equal(doc.getElementById('staff-unit').value,id);d.window.close();
});
