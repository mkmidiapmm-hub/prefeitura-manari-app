import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function harness(){
 const queries=[],pending=[],clicks=[],scrolls=[];
 function root(department){
  const list={html:'',replaceChildren(...els){this.html=els.map(e=>e.textContent||'').join('');},insertAdjacentHTML(_,html){this.html+=html;},set innerHTML(s){this.html=s;},get innerHTML(){return this.html;}};
  const more={hidden:true},refresh={};
  return {dataset:{sectorFeed:department},isConnected:true,list,more,refresh,querySelector(s){return s==='.sector-feed-list'?list:s==='[data-sector-more]'?more:refresh;}};
 }
 let current=root('infraestrutura');
 const client={from(table){const ops=[['from',table]],q={};for(const key of ['select','in','eq','lte','order'])q[key]=(...args)=>{ops.push([key,...args]);return q;};q.range=(...args)=>{ops.push(['range',...args]);queries.push(ops);return new Promise(resolve=>pending.push(resolve));};return q;}};
 const document={body:{classList:{toggle(){},contains(){return false;}}},querySelector(s){if(s==='#manariFeed')return {};if(s==='[data-sector-feed]')return current;return null;},addEventListener(type,handler,capture){if(type==='click'&&!capture)clicks.push(handler);}};
 const window={scrollTo(options){scrolls.push(options);},ManariPortalAuth:{getClient:async()=>client},addEventListener(){}};
 vm.runInNewContext(readFileSync('www/portal-feed.js','utf8'),{window,document,URL,URLSearchParams,Map,Date,setTimeout});
 return {window,queries,pending,scrolls,clickRail(kind){const button={matches(selector){return selector==='.secretaria-chip[data-dept]'&&kind==='chip';},hasAttribute(){return false;},closest(selector){return ['button,a','button'].includes(selector)?button:selector==='#manariSecretariasRail'?{}:null;}};for(const handler of clicks)handler({target:button});},get current(){return current;},switchTo(code){current.isConnected=false;return current=root(code);}};
}
const post=(id,department='obras')=>({id,title:'Publicação '+id,department_id:department,body:'Atualização oficial',publish_at:'2026-11-18T09:00:00Z'});
test('feed consulta somente a secretaria atual e conteúdo publicado, com paginação e ordem estável',async()=>{
 const h=harness(),promise=h.window.ManariFeed.renderSector();await new Promise(setImmediate);
 const ops=h.queries[0];assert(ops.some(x=>x[0]==='in'&&Array.from(x[2]).join(',')==='infraestrutura,obras'));
 for(const pair of [['active',true],['status','published']])assert(ops.some(x=>x[0]==='eq'&&x[1]===pair[0]&&x[2]===pair[1]));
 assert(ops.some(x=>x[0]==='lte'&&x[1]==='publish_at'));assert.deepEqual(Array.from(ops.find(x=>x[0]==='range').slice(1)),[0,10]);
 h.pending.shift()({data:Array.from({length:11},(_,i)=>post(String(i))),error:null});await promise;
 assert.equal(h.current.more.hidden,false);assert(h.current.list.html.includes('Publicação 9'));assert(!h.current.list.html.includes('Publicação 10'));
 const more=h.current.more.onclick();await new Promise(setImmediate);
 assert.deepEqual(Array.from(h.queries[1].find(x=>x[0]==='range').slice(1)),[10,20]);
 h.pending.shift()({data:[post('10')],error:null});await more;assert.equal(h.current.more.hidden,true);assert(h.current.list.html.includes('Publicação 10'));
});
test('troca rápida de secretaria ignora a resposta atrasada do setor anterior',async()=>{
 const h=harness(),old=h.current,first=h.window.ManariFeed.renderSector();await new Promise(setImmediate);
 h.switchTo('saude');const second=h.window.ManariFeed.renderSector();await new Promise(setImmediate);
 h.pending[1]({data:[post('saude','saude')],error:null});await second;
 h.pending[0]({data:[post('obras')],error:null});await first;
 assert(h.current.list.html.includes('Publicação saude'));assert(!h.current.list.html.includes('Publicação obras'));assert(!old.list.html.includes('Publicação obras'));
});

test('setas da faixa não acionam a navegação do feed nem rolam a página para o topo',()=>{
 const h=harness();
 h.clickRail('next');h.clickRail('previous');h.clickRail('next');
 assert.equal(h.scrolls.length,0);
});
test('selecionar uma secretaria mantém o tratamento de navegação existente',()=>{
 const h=harness();h.clickRail('chip');
 assert.equal(h.scrolls.length,1);assert.equal(h.scrolls[0].top,0);
});
