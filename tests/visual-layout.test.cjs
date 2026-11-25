const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../www/visual-layout-model.js');
const item=(extra={})=>({id:'tree-1',type:'sticker',zone:'hero',src:'https://www.manari.pe.gov.br/layout-assets/tree.svg',desktop:{x:60,width:20},mobile:{x:10,width:30},...extra});
const doc=i=>({version:1,pages:{home:{items:i,orders:{desktop:{blocks:['hero','services'],icons:['saude','educacao']}}}}});
test('configuração aceita somente páginas, áreas e tipos conhecidos',()=>{
 const value=M.clean({version:1,pages:{...doc([item(),item({id:'bad',zone:'body'}),item({id:'html',type:'html'}),item({id:'tree-1'})]).pages,evil:{items:[item()]}}});
 assert.deepEqual(Object.keys(value.pages),['home']);assert.equal(value.pages.home.items.length,1);assert.equal(value.pages.home.items[0].html,undefined);
});
test('destinos e imagens rejeitam scripts, dados embutidos e credenciais',()=>{
 for(const url of ['javascript:alert(1)','data:image/svg+xml,<svg/>','https://user:password@example.com','file:///etc/passwd'])assert.equal(M.safeURL(url),'');
 assert.equal(M.safeURL('/divino-natal/festa'),'https://www.manari.pe.gov.br/divino-natal/festa');assert.equal(M.safeURL('http://evil.test'),'');
 assert.equal(M.clean(doc([item({src:'javascript:alert(1)'})])).pages.home.items.length,0);
});
test('posições para celular e computador permanecem independentes e limitadas',()=>{
 const clean=M.clean(doc([item({desktop:{x:900,y:-10,width:0,opacity:5,rotation:400}})])),i=clean.pages.home.items[0];
 assert.deepEqual(i.desktop,{x:95,y:0,width:4,rotation:180,opacity:20,visible:true});assert.equal(i.mobile.x,10);assert.equal(i.mobile.width,30);assert.equal(M.device(344),'mobile');assert.equal(M.device(820),'tablet');assert.equal(M.device(1280),'desktop');
});
test('período encerra a campanha na hora definida e valida a sequência',()=>{
 const i=item({start:'2026-12-01T18:00:00-03:00',end:'2027-01-10T18:00:00-03:00'});assert(!M.active(i,Date.parse('2026-12-01T20:59:59Z')));assert(M.active(i,Date.parse('2026-12-01T21:00:00Z')));assert(!M.active(i,Date.parse('2027-01-10T21:00:00Z')));
 assert.throws(()=>M.validate(M.clean(doc([item({start:'2027-01-10',end:'2026-12-01'})]))),/encerramento/);
});
test('ordenação não elimina elementos nem duplica opções',()=>{
 const nodes=[{id:'hero'},{id:'services'},{id:'contact'}];assert.deepEqual(M.ordered(nodes,['services'],n=>n.id).map(n=>n.id),['services','hero','contact']);assert.equal(nodes[0].id,'hero');
 const p=M.clean({version:1,pages:{home:{items:[],orders:{desktop:{blocks:['services','services','body'],icons:['saude','saude']}}}}}).pages.home;assert.deepEqual(p.orders.desktop.blocks,['services']);assert.deepEqual(p.orders.desktop.icons,['saude']);
});
test('textos e botões exigem conteúdo e configuração tem limite',()=>{
 assert.throws(()=>M.validate(M.clean(doc([item({type:'button',href:'javascript:bad',text:'Saiba mais'})]))),/destino/);
 assert.throws(()=>M.validate(M.clean(doc([item({type:'text',text:' '})]))),/texto/);
 assert.equal(M.clean(doc(Array.from({length:90},(_,n)=>item({id:'id-'+n})))).pages.home.items.length,60);
});
