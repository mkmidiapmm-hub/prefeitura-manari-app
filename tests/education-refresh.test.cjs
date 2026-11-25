const {test}=require('node:test'),assert=require('node:assert/strict');
const {refreshURL,start}=require('../www/educacao/update.js');
test('atualização cria endereço novo e conserva escola, serviço e retorno de autenticação',()=>{
 const value=new URL(refreshURL('https://manari.pe.gov.br/educacao/?servico=matricula&acesso=secretaria&escola=unidade#gestao',123));
 assert.equal(value.searchParams.get('versao'),'6.53');assert.equal(value.searchParams.get('atualizar'),'123');assert.equal(value.searchParams.get('acesso'),'secretaria');assert.equal(value.searchParams.get('escola'),'unidade');assert.equal(value.hash,'#gestao');
 assert.equal(new URL(refreshURL('https://manari.pe.gov.br/educacao/#access_token=teste',456)).hash,'#access_token=teste');
});
test('somente atualiza instalação existente e não apaga sessão nem recarrega formulário automaticamente',async()=>{
 let updates=0,reloads=0,scope='',handler;const window={location:{href:'https://manari.pe.gov.br/educacao/?acesso=secretaria#gestao',replace:()=>reloads++},navigator:{serviceWorker:{getRegistration:async url=>{scope=url;return {update:async()=>updates++}}}}};
 await start(window,{getElementById:()=>({addEventListener:(event,fn)=>handler=fn})});assert.equal(updates,1);assert.equal(scope,'https://manari.pe.gov.br/');assert.equal(reloads,0);handler();assert.equal(reloads,1);
 window.navigator.serviceWorker.getRegistration=async()=>undefined;await start(window,{getElementById:()=>null});assert.equal(updates,1);
 window.navigator.serviceWorker.getRegistration=async()=>{throw Error('offline')};await assert.doesNotReject(start(window,{getElementById:()=>null}));
});
