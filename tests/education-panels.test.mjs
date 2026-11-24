import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../www/educacao/api.mjs';
import {banner,metrics,queueItems,recentRequests,unavailableState} from '../www/educacao/panels.mjs';
test('painéis distinguem responsável, gestão e atendimento sem inventar indicadores',()=>{
 assert.match(banner('guardian'),/Área dos pais e responsáveis/);assert.match(banner('central'),/Painel da Secretaria/);assert.match(banner('staff'),/Atendimento de solicitações/);
 assert(!banner('central',false).includes('Gestão autorizada'));assert(!banner('staff',false).includes('Atendente autorizado'));
 assert.equal((metrics().match(/>—</g)||[]).length,4);assert.match(metrics({schools:0,requests:23}),/data-metric="schools">0</);assert.match(metrics({schools:0,requests:23}),/data-metric="requests">23</);
});
test('nomes, protocolos e escolas em cartões não injetam HTML',()=>{
 const malicious='<img src=x onerror=alert(1)>',row={id:'id',protocol:malicious,student_name:malicious,school_id:'school',status:'recebido'};
 for(const html of [queueItems([row],'id',[{id:'school',name:malicious}]),recentRequests([row],[{id:'school',name:malicious}])]){assert(!html.includes(malicious));assert(html.includes('&lt;img'));}
 assert.match(queueItems([row],'id',[]),/aria-pressed="true"/);
});
test('erro de conexão não é confundido com nenhuma escola ou matrícula fechada',()=>{
 assert.match(unavailableState(false),/data-retry-schools/);assert(!unavailableState(false).includes('Aguardando cadastro'));
 assert.match(unavailableState(true,[]),/Aguardando cadastro/);assert.match(unavailableState(true,[{id:'one'}]),/ainda não foram abertas/);
});
function queryClient(response){const operations=[];const client={auth:{getUser:async()=>({data:{user:{id:'own'}}})},from(table){operations.push(['from',table]);const q={};for(const method of ['select','order','eq','in'])q[method]=(...args)=>{operations.push([method,...args]);return q;};q.range=async(...args)=>{operations.push(['range',...args]);return response;};q.then=(resolve,reject)=>Promise.resolve(response).then(resolve,reject);return q;}};return {client,operations};}
test('filtros da fila usam igualdade do protocolo e conservam escopo da escola e paginação',async()=>{
 const {client,operations}=queryClient({data:[],count:0,error:null});await api(client).queue({school:'unit',protocol:' edu-exemplo ',archive:true,page:2});
 assert(operations.some(([m,k,v])=>m==='eq'&&k==='school_id'&&v==='unit'));assert(operations.some(([m,k,v])=>m==='eq'&&k==='protocol'&&v==='EDU-EXEMPLO'));
 assert(operations.some(([m,k,v])=>m==='in'&&k==='status'&&v.join(',')==='confirmado,resolvido,cancelado'));assert(operations.some(([m,a,b])=>m==='range'&&a===50&&b===74));
});
test('indicadores consultam apenas contagens e respeitam o filtro da unidade',async()=>{
 const {client,operations}=queryClient({data:null,count:4,error:null});assert.deepEqual(await api(client).statistics('unit'),{requests:4,pending:4,scheduled:4});
 assert.equal(operations.filter(([m,k,v])=>m==='eq'&&k==='school_id'&&v==='unit').length,3);
 assert(operations.filter(([m])=>m==='select').every(([,columns,options])=>columns==='id'&&options.head&&options.count==='exact'));
});
test('consulta de indicadores exige conta e erro do banco não vira zero',async()=>{
 const {client,operations}=queryClient({data:null,count:null,error:Error('Falha no servidor')});await assert.rejects(()=>api(client).statistics(),/Falha no servidor/);
 client.auth.getUser=async()=>({data:{user:null}});operations.length=0;await assert.rejects(()=>api(client).statistics(),/Entre/);assert.equal(operations.length,0);
});
test('catálogo repete uma vez somente falhas transitórias',async()=>{
 let calls=0;const client={from:()=>({select:()=>({order:async()=>++calls===1?{error:{message:'network'},status:503}:{data:[],error:null,status:200}})})};
 assert.deepEqual(await api(client).catalog(),[]);assert.equal(calls,2);
 calls=0;client.from=()=>({select:()=>({order:async()=>{calls++;return {error:Error('permission denied'),status:403};}})});
 await assert.rejects(()=>api(client).catalog(),/permission denied/);assert.equal(calls,1);
});
