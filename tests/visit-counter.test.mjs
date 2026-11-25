import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { onRequest } from '../functions/api/visits.js';
const schema=readFileSync(new URL('../cloudflare/visits/schema.sql',import.meta.url),'utf8');
function database(){
 const sql=new DatabaseSync(':memory:');sql.exec(schema);
 const wrap=(query,args=[])=>({bind(...params){return wrap(query,params)},async first(){return sql.prepare(query).get(...args)},query,args});
 return {sql,prepare:wrap,async batch(stmts){sql.exec('BEGIN');try{const result=stmts.map(s=>{const stmt=sql.prepare(s.query);return /^\s*SELECT/i.test(s.query)?{results:stmt.all(...s.args)}:{results:[],meta:stmt.run(...s.args)}});sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}},close(){sql.close()}};
}
function request(method='GET',{cookie,origin='https://manari.pe.gov.br',host='manari.pe.gov.br',userAgent='Mozilla/5.0',contentType='application/json',site='same-origin'}={}){
 const headers={'User-Agent':userAgent,'Sec-Fetch-Site':site};if(method==='POST'){headers.Origin=origin;headers['Content-Type']=contentType}if(cookie)headers.Cookie=cookie;
 return new Request(`https://${host}/api/visits`,{method,headers,...(method==='POST'?{body:'{}'}:{})});
}
const send=(db,req)=>onRequest({request:req,env:{VISITS_DB:db}});
test('starts at zero; reading does not create a visitor',async()=>{const db=database();try{const r=await send(db,request());assert.equal((await r.json()).total,0);assert.equal(db.sql.prepare('SELECT count(*) n FROM visit_sessions').get().n,0);assert.equal(r.headers.get('cache-control'),'no-store, max-age=0')}finally{db.close()}});
test('one visit across reloads, pages and www/root with the same cookie',async()=>{const db=database();try{const first=await send(db,request('POST'));assert.equal((await first.json()).total,1);const set=first.headers.get('set-cookie');assert.match(set,/Domain=manari.pe.gov.br/);assert.match(set,/Max-Age=1800/);assert.match(set,/HttpOnly; Secure; SameSite=Lax/);const cookie=set.split(';')[0];for(let i=0;i<8;i++){const r=await send(db,request('POST',{cookie,host:'www.manari.pe.gov.br',origin:'https://www.manari.pe.gov.br'}));assert.equal((await r.json()).total,1)}assert.equal((await (await send(db,request('POST'))).json()).total,2)}finally{db.close()}});
test('simultaneous new visits increment the shared total without lost updates',async()=>{const db=database();try{const rs=await Promise.all(Array.from({length:30},()=>send(db,request('POST'))));for(const r of rs)assert.equal(r.status,200);assert.equal((await (await send(db,request())).json()).total,30)}finally{db.close()}});
test('cross-site, foreign hosts, forms and unsupported methods cannot increment',async()=>{const db=database();try{for(const args of [{origin:'https://example.com'},{site:'cross-site'},{contentType:'application/x-www-form-urlencoded'},{host:'preview.pages.dev',origin:'https://preview.pages.dev'}])assert.equal((await send(db,request('POST',args))).status,403);assert.equal((await send(db,request('DELETE'))).status,405);assert.equal((await (await send(db,request())).json()).total,0)}finally{db.close()}});
test('known crawlers read the total without registering a visit',async()=>{const db=database();try{const r=await send(db,request('POST',{userAgent:'Googlebot/2.1'}));assert.equal((await r.json()).total,0);assert.equal(r.headers.get('set-cookie'),null)}finally{db.close()}});
test('cleanup expires anonymous sessions without subtracting from the lifetime total',async()=>{const db=database();try{db.sql.prepare("INSERT INTO visit_sessions(id,created_at) VALUES ('old-test-session',unixepoch()-90000)").run();const r=await send(db,request('POST'));assert.equal((await r.json()).total,2);assert.equal(db.sql.prepare("SELECT count(*) n FROM visit_sessions WHERE id='old-test-session'").get().n,0)}finally{db.close()}});
test('an unavailable database yields an error, never a fabricated zero',async()=>{const r=await onRequest({request:request(),env:{}});assert.equal(r.status,503);assert.equal(Object.hasOwn(await r.json(),'total'),false)});
