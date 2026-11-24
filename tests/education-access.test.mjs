import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolID,schoolAccess,scopedSchools,schoolAccessURL,authenticate,accessRoute} from '../www/educacao/access.mjs';
const one='11111111-1111-4111-8111-111111111111',two='22222222-2222-4222-8222-222222222222';
test('retorno da confirmação mantém a área da escola ou da Secretaria',()=>{
 assert.equal(accessRoute('https://portal.example/educacao/?escola='+one+'#access_token=teste').workspace,'staff');
 assert.equal(accessRoute('https://portal.example/educacao/?acesso=secretaria#access_token=teste').mode,'central');
 assert.equal(accessRoute('https://portal.example/educacao/').mode,'guardian');
 assert.equal(accessRoute('https://portal.example/educacao/?escola=id-incorreto').school,'');
});
test('ID de escola não autentica uma conta sem vínculo',()=>{
 assert.throws(()=>schoolID('escola inventada'),/ID completo/);
 assert.throws(()=>schoolAccess({central:false,schools:[]},one),/vinculada/);
 assert.throws(()=>schoolAccess({central:false,schools:[one]},two),/vinculada/);
 assert.equal(schoolAccess({central:false,schools:[one]},one),one);
 assert.equal(schoolAccess({central:true,schools:[]},two),two);
});
test('equipe e filtros se restringem à unidade selecionada',()=>{
 const list=[{id:one},{id:two}];
 assert.deepEqual(scopedSchools(list,{central:false,schools:[one]},two),[]);
 assert.deepEqual(scopedSchools(list,{central:false,schools:[one,two]},one),[{id:one}]);
 assert.equal(scopedSchools(list,{central:true,schools:[]}).length,2);
});
test('link da escola usa a página existente e remove parâmetros antigos',()=>{
 const url=new URL(schoolAccessURL(one,'https://portal.example/www/educacao/?outro=valor#velho'));
 assert.equal(url.pathname,'/www/educacao/');assert.equal(url.searchParams.get('servico'),'matricula');assert.equal(url.searchParams.get('escola'),one);assert.equal(url.hash,'#gestao');assert(!url.searchParams.has('outro'));
});
const stub=()=>{const calls=[];const auth=Object.fromEntries(['signUp','signInWithPassword','resend'].map(name=>[name,async args=>{calls.push({name,args});return {data:{session:null},error:null};}]));return {client:{auth},calls};};
test('cadastro de responsável confirma senha e envia somente nome como metadado',async()=>{
 const {client,calls}=stub(),data={action:'signup',email:'pai@example.invalid',password:'senha-ficticia-123',confirmation:'senha-ficticia-123',name:'Responsável fictício',mode:'central'};
 await assert.rejects(()=>authenticate(client,{...data,confirmation:'outra'},'https://portal.example/educacao/'),/não conferem/);assert.equal(calls.length,0);
 await authenticate(client,data,'https://portal.example/educacao/');
 assert.equal(calls[0].name,'signUp');assert.deepEqual(calls[0].args.options.data,{full_name:'Responsável fictício'});assert(!('role' in calls[0].args.options.data));
});
test('equipe precisa informar ID antes do login; responsáveis usam sua própria conta',async()=>{
 const {client,calls}=stub();
 await assert.rejects(()=>authenticate(client,{action:'login',mode:'school',email:'escola@example.invalid',password:'senha-ficticia'},''),/ID completo/);assert.equal(calls.length,0);
 await authenticate(client,{action:'login',mode:'school',school:one,email:'escola@example.invalid',password:'senha-ficticia'},'');assert.deepEqual(calls[0].args,{email:'escola@example.invalid',password:'senha-ficticia'});
 await authenticate(client,{action:'login',mode:'guardian',email:'pai@example.invalid',password:'senha-ficticia'},'');assert.equal(calls.length,2);
});
test('reenvio de confirmação dispensa senha e preserva erros do servidor',async()=>{
 const {client,calls}=stub();await authenticate(client,{action:'resend',email:'pai@example.invalid'},'https://portal.example/educacao/');assert.equal(calls[0].name,'resend');assert.equal(calls[0].args.type,'signup');
 client.auth.signInWithPassword=async()=>({error:Error('Email not confirmed')});await assert.rejects(()=>authenticate(client,{action:'login',email:'pai@example.invalid',password:'senha-ficticia'},''),/Email not confirmed/);
});
