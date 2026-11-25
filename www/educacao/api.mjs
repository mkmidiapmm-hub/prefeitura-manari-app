import {validate,validatePhoto} from './domain.mjs?v=6.53';
const ok=({data,error})=>{if(error)throw error;return data;};
export function api(client){
 const call=async(name,args={})=>ok(await client.rpc(name,args));
 async function user(){const r=await client.auth.getUser();if(r.error)throw r.error;if(!r.data?.user?.id)throw Error('Entre na sua conta para continuar.');return r.data.user;}
 return {
  client,call,user,
  async catalog(){let r=await client.from('edu_schools').select('*').order('name');if(r.error&&(r.status===429||r.status>=500||/fetch|network/i.test(r.error.message||''))){await new Promise(resolve=>setTimeout(resolve,350));r=await client.from('edu_schools').select('*').order('name');}return ok(r);},
  async context(){await user();return call('edu_context');},
  async slots(school){return ok(await client.from('edu_slots').select('*').eq('school_id',school).eq('active',true).gt('starts_at',new Date().toISOString()).order('starts_at'));},
  async notices(kind,admin=false){let q=client.from('edu_notices').select('*').eq('kind',kind).order('created_at',{ascending:false});if(!admin)q=q.eq('published',true);return ok(await q.limit(100));},
  async news(){return ok(await client.from('app_news').select('id,title,body,summary,image_url,video_url,instagram_url,publish_at').eq('department_id','educacao').eq('active',true).eq('status','published').lte('publish_at',new Date().toISOString()).order('publish_at',{ascending:false}).limit(30));},
  async submit(input){await user();return call('edu_submit',{p_payload:validate(input)});},
  async mine(protocol=''){const u=await user();let q=client.from('edu_requests').select('*').eq('user_id',u.id).order('created_at',{ascending:false});if(protocol)q=q.eq('protocol',protocol.trim().toUpperCase());return ok(await q.limit(100));},
  async queue({school='',status='',service='',protocol='',archive=false,page=0}={}){await user();let q=client.from('edu_requests').select('*',{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false});if(school)q=q.eq('school_id',school);if(status)q=q.eq('status',status);if(service)q=q.eq('service',service);if(protocol)q=q.eq('protocol',protocol.trim().toUpperCase());if(archive)q=q.in('status',['confirmado','resolvido','cancelado']);const r=await q.range(page*25,page*25+24);if(r.error)throw r.error;return {rows:r.data||[],count:r.count||0};},
  async statistics(school=''){await user();const count=async status=>{let q=client.from('edu_requests').select('id',{count:'exact',head:true});if(school)q=q.eq('school_id',school);if(status)q=q.eq('status',status);const r=await q;if(r.error)throw r.error;if(!Number.isInteger(r.count))throw Error('Não foi possível carregar os totais.');return r.count;};const [requests,pending,scheduled]=await Promise.all([count(''),count('documentos_pendentes'),count('agendado')]);return {requests,pending,scheduled};},
  async history(id){await user();return ok(await client.from('edu_request_events').select('status,note,created_at').eq('request_id',id).order('created_at'));},
  act(id,status,note,slot=null){return call('edu_act',{p_id:id,p_status:status,p_note:note,p_slot:slot||null});},
  async upload(request,file){validatePhoto(file);const u=await user();if(request.user_id!==u.id||request.service!=='infraestrutura')throw Error('Anexo não autorizado.');const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=`${u.id}/${request.id}/${crypto.randomUUID()}.${ext}`;ok(await client.storage.from('education-attachments').upload(path,file,{contentType:file.type,upsert:false}));},
  async attachments(request){await user();const prefix=`${request.user_id}/${request.id}`;const list=ok(await client.storage.from('education-attachments').list(prefix));return Promise.all((list||[]).filter(f=>f.id).map(async f=>({name:f.name,url:ok(await client.storage.from('education-attachments').createSignedUrl(prefix+'/'+f.name,120)).signedUrl})));}
 };
}
