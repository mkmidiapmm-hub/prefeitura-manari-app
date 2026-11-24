const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function accessRoute(href){const u=new URL(href),school=u.searchParams.get('escola')||'',staff=u.hash==='#gestao'||!!school||u.searchParams.get('acesso')==='secretaria';return {workspace:staff?'staff':'public',mode:staff?(u.searchParams.get('acesso')==='secretaria'?'central':'school'):'guardian',school:UUID.test(school)?school.toLowerCase():''};}
export function schoolID(value){const id=String(value||'').trim().toLowerCase();if(!UUID.test(id))throw Error('Informe o ID completo da escola, fornecido pela Secretaria de Educação.');return id;}
export function schoolAccess(context,id){const value=schoolID(id);if(!context?.central&&!context?.schools?.includes(value))throw Error('Esta conta não está vinculada ao ID informado. Solicite o vínculo à Secretaria de Educação.');return value;}
export function schoolAccessURL(id,href){const url=new URL(href);url.search='';url.searchParams.set('servico','matricula');url.searchParams.set('escola',schoolID(id));url.hash='gestao';return url.href;}
export function scopedSchools(schools,context,id=''){return schools.filter(s=>(context.central||context.schools.includes(s.id))&&(!id||s.id===id));}
export async function authenticate(client,{action,email,password='',name='',confirmation='',mode='guardian',school=''},redirect){
 const address=String(email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw Error('Informe um e-mail válido.');
 let response;
 if(action==='resend')response=await client.auth.resend({type:'signup',email:address,options:{emailRedirectTo:redirect}});
 else if(action==='signup'){
  const fullName=String(name).trim();if(fullName.length<3||fullName.length>160)throw Error('Informe seu nome completo.');
  if(password.length<8)throw Error('Crie uma senha com pelo menos 8 caracteres.');
  if(password!==confirmation)throw Error('As senhas não conferem.');
  response=await client.auth.signUp({email:address,password,options:{emailRedirectTo:redirect,data:{full_name:fullName}}});
 }else{
  if(mode==='school')schoolID(school);
  if(!password)throw Error('Informe sua senha.');
  response=await client.auth.signInWithPassword({email:address,password});
 }
 if(response.error)throw response.error;return response;
}
