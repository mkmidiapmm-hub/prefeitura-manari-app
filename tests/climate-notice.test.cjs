const test=require('node:test');
const assert=require('node:assert/strict');
const {ID,SOURCES,eligible,template,create}=require('../www/climate-notice.js');
test('aviso é exclusivo da página inicial e não aparece em posts ou convites',()=>{
 const document={body:{classList:{contains:()=>false}}};
 for(const hash of ['','#','#inicio','#home'])assert(eligible({hash,search:''},document));
 for(const hash of ['#saude','#educacao','#ouvidoria'])assert(!eligible({hash,search:''},document));
 for(const search of ['?post=123','?portal_invite=abc'])assert(!eligible({hash:'',search},document));
 assert(!eligible({hash:'',search:''},{body:{classList:{contains:()=>true}}}));
});
test('links apontam a órgãos oficiais e não anunciam uma vigência não confirmada',()=>{
 const html=template();
 assert.equal(new URL(SOURCES.health).hostname,'portalcievs.saude.pe.gov.br');
 assert.equal(new URL(SOURCES.weather).hostname,'avisos.inmet.gov.br');
 for(const url of Object.values(SOURCES))assert(html.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
 assert.match(html,/Confira a validade e os municípios/);
 assert.doesNotMatch(html,/alerta vigente|41\s*°|2026|2027|role="alert"/);
});
test('aviso não se duplica nas atualizações e acompanha a navegação de ida e volta',()=>{
 let current=null,inserts=0,hasHero=true;const frames=[];
 const node={remove(){current=null;}},hero={before(n){current=n;inserts++;}};
 const main={querySelector:()=>hasHero?hero:null};
 const document={body:{classList:{contains:()=>false}},getElementById:id=>id==='mainView'?main:id===ID?current:null,createElement:()=>({set innerHTML(_){},firstElementChild:node})};
 const window={location:{hash:'',search:''},requestAnimationFrame:f=>frames.push(f),MutationObserver:class{observe(){}disconnect(){}},addEventListener(){}};
 const api=create(window,document);assert.equal(inserts,1);api.sync();assert.equal(inserts,1);
 window.location.hash='#saude';api.sync();assert.equal(current,null);
 window.location.hash='';hasHero=false;api.sync();assert.equal(current,null);
 hasHero=true;api.sync();assert.equal(inserts,2);assert.equal(current,node);
});
