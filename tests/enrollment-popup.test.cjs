const test=require('node:test');const assert=require('node:assert/strict');const {KEY,eligible,create}=require('../www/enrollment-popup.js');
function fixture({hash='',seen=false,storageThrows=false,imageFails=false,native=true,otherModal=false}={}){
 const values=new Map(seen?[[KEY,'1']]:[]),events={},all=[];let hero=true,feed=false,focused=null,observerDisconnected=false;
 class Element{
  constructor(tag){this.tag=tag;this.listeners={};this.children=[];this.attrs={};this.open=false;this.isConnected=true;const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};if(tag==='dialog'&&native){this.showModal=()=>this.open=true;this.close=()=>{this.open=false;this.fire('close')}}}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
  fire(name,event={}){for(const fn of this.listeners[name]||[])fn(event)}
  setAttribute(k,v){this.attrs[k]=v;if(k==='open')this.open=true}
  removeAttribute(k){delete this.attrs[k];if(k==='open')this.open=false}
  append(n){this.children.push(n);all.push(n)}remove(){this.isConnected=false}
  focus(){focused=this;doc.activeElement=this}click(){this.fire('click',{preventDefault(){}})}
  querySelector(selector){return this.nodes?.[selector]||null}
  set innerHTML(value){this.html=value;this.nodes={};for(const selector of ['.m27-logo','.m27-close','.m27-art-scroll','.m27-art','.m27-details'])this.nodes[selector]=new Element(selector)}
  set src(value){this.source=value;if(this.tag==='.m27-art')queueMicrotask(()=>{this.naturalWidth=imageFails?0:1229;this.complete=true;this.fire(imageFails?'error':'load')})}
 }
 const doc={body:new Element('body'),documentElement:new Element('html'),activeElement:new Element('original'),createElement:t=>new Element(t),addEventListener:(n,f)=>{(events[n]??=[]).push(f)},getElementById:()=>main,querySelector(selector){if(selector==='#mainView .home-hero')return hero?{}:null;if(selector==='[data-dept="educacao"]')return education;if(selector.startsWith('dialog[open]'))return otherModal?{}:null;return null}};
 doc.body.classList.contains=x=>x==='manari-feed-home'&&feed;
 const main=new Element('main'),education=new Element('education');education.click=()=>{win.location.hash='#educacao';education.clicked=true};
 const win={location:new URL('https://portal.example/www/'+hash),console:{warn(){}},sessionStorage:{getItem:k=>{if(storageThrows)throw Error('blocked');return values.get(k)||null},setItem:(k,v)=>{if(storageThrows)throw Error('blocked');values.set(k,v)}},requestAnimationFrame:fn=>queueMicrotask(fn),addEventListener:(n,f)=>{(events[n]??=[]).push(f)},MutationObserver:class{constructor(f){this.callback=f}observe(){}disconnect(){observerDisconnected=true}}};
 const api=create(win,doc,'https://portal.example/www/enrollment-popup.js?v=1');
 return{api,doc,win,values,events,education,all,get dialog(){return all.find(n=>n.tag==='dialog')},setHero(v){hero=v},setFeed(v){feed=v},setModal(v){otherModal=v},get observerDisconnected(){return observerDisconnected}};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('opens only on homepage after the official image loads, once per session',async()=>{const f=fixture();assert.equal(f.dialog.open,false);assert.equal(f.values.get(KEY),undefined);await settle();assert.equal(f.dialog.open,true);assert.equal(f.values.get(KEY),'1');assert.equal(f.observerDisconnected,true);assert.equal(f.dialog.querySelector('.m27-art').source,'https://portal.example/www/matriculas-aviso-2027.png');f.dialog.querySelector('.m27-close').click();assert.equal(f.dialog.open,false);assert.equal(f.doc.documentElement.classList.contains('m27-scroll-locked'),false);f.api.check();assert.equal(f.dialog.open,false)});
test('does not reopen after reloading in the same session',async()=>{const f=fixture({seen:true});await settle();assert.equal(f.dialog,undefined)});
test('a fresh visit can see the announcement again',async()=>{const f=fixture();await settle();assert.equal(f.dialog.open,true)});
test('other secretariats and feed do not show the notice; visiting home later does',async()=>{for(const hash of ['#saude','#educacao','#saude-unidades','#feed']){const f=fixture({hash});await settle();assert.equal(f.dialog,undefined);f.win.location.hash='#inicio';f.api.check();await settle();assert.equal(f.dialog.open,true)}});
test('closing with Escape releases the page and remains dismissed',async()=>{const f=fixture();await settle();let prevented=false;f.dialog.fire('cancel',{preventDefault(){prevented=true}});assert.ok(prevented);assert.equal(f.dialog.open,false);f.api.check();assert.equal(f.dialog.open,false)});
test('details targets existing enrollment page and public information, including subdirectories',async()=>{const f=fixture();await settle();assert.equal(f.dialog.querySelector('.m27-details').href,'https://portal.example/www/educacao/?servico=matricula#matriculas-2027');f.dialog.querySelector('.m27-details').click();assert.equal(f.dialog.open,false);assert.equal(f.education.clicked,undefined);assert.equal(f.doc.documentElement.classList.contains('m27-scroll-locked'),false)});
test('navigation away while loading neither opens nor consumes the notice',async()=>{const f=fixture();f.win.location.hash='#saude';await settle();assert.equal(f.dialog.open,false);assert.equal(f.values.get(KEY),undefined);f.win.location.hash='';f.api.check();assert.equal(f.dialog.open,true)});
test('image load failure does not show an empty dialog or interfere with navigation',async()=>{const f=fixture({imageFails:true});await settle();assert.equal(f.dialog.open,false);assert.equal(f.values.get(KEY),undefined);assert.equal(f.doc.documentElement.classList.contains('m27-scroll-locked'),false);assert.doesNotThrow(()=>f.api.check())});
test('blocked sessionStorage does not break the portal or repeat during current document',async()=>{const f=fixture({storageThrows:true});await settle();assert.equal(f.dialog.open,true);f.api.close();assert.doesNotThrow(()=>f.api.check());assert.equal(f.dialog.open,false)});
test('route changes while open close the announcement',async()=>{const f=fixture();await settle();f.win.location.hash='#saude';f.api.check();assert.equal(f.dialog.open,false)});
test('legacy dialog fallback still closes and removes its overlay',async()=>{const f=fixture({native:false});await settle();assert.equal(f.dialog.open,true);assert.ok(f.all.some(n=>n.className==='m27-fallback-backdrop'));f.api.close();assert.equal(f.dialog.open,false);assert.equal(f.all.find(n=>n.className==='m27-fallback-backdrop').isConnected,false)});
test('does not cover another portal modal',async()=>{const f=fixture({otherModal:true});await settle();assert.equal(f.dialog,undefined);f.setModal(false);f.api.check();await settle();assert.equal(f.dialog.open,true)});
test('feed links, account invitations and recovery flows are excluded',()=>{const doc={querySelector:()=>({}),body:{classList:{contains:()=>false}}};for(const href of ['https://x/?post=abc','https://x/?portal_invite=abc','https://x/#access_token=abc','https://x/#feed'])assert.equal(eligible(new URL(href),doc),false);assert.equal(eligible(new URL('https://x/#inicio'),doc),true)});
