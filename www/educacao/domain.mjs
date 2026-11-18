export const SERVICES={matricula:'Pré-matrícula e agendamento',transporte:'Transporte escolar',alimentacao:'Merenda e alimentação',infraestrutura:'Infraestrutura escolar',eventos:'Eventos culturais',noticias:'Notícias da Educação'};
export const STAGES={creche:'Creche',pre_escola:'Pré-escola',fundamental:'Ensino fundamental',eja:'EJA'};
export const GRADES={creche:['Creche'],pre_escola:['Pré I','Pré II'],fundamental:Array.from({length:9},(_,i)=>`${i+1}º ano`),eja:['EJA — anos iniciais','EJA — anos finais']};
export const STATUS={recebido:'Recebido',agendado:'Agendado',documentos_pendentes:'Documentação pendente',confirmado:'Matrícula confirmada',aguardando_vaga:'Aguardando vaga',em_analise:'Em análise',resolvido:'Concluído',cancelado:'Cancelado'};
export const SHIFTS={manha:'Manhã',tarde:'Tarde',noite:'Noite',integral:'Integral'};
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const date=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'A definir';
export function safeURL(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:''}catch{return ''}}
export function localDate(v=new Date()){return v.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});}
export function schoolTime(v){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v))throw Error('Informe a data e o horário.');const d=new Date(v+':00-03:00');if(Number.isNaN(+d))throw Error('Horário inválido.');return d.toISOString();}
export function validate(input,today=localDate()){
 const p=Object.fromEntries(Object.entries(input).map(([k,v])=>[k,typeof v==='string'?v.trim():v]));
 const text=(key,min,max,label)=>{const v=String(p[key]??'').trim();if(v.length<min||v.length>max)throw Error(`${label}: use de ${min} a ${max} caracteres.`);return v;};
 if(!['matricula','transporte','alimentacao','infraestrutura','evento'].includes(p.service))throw Error('Selecione um serviço válido.');
 if(!/^[0-9a-f-]{36}$/i.test(p.school_id||''))throw Error('Selecione a escola.');
 text('guardian_name',3,160,'Nome do responsável');p.phone=String(p.phone||'').replace(/\D/g,'');if(!/^\d{10,11}$/.test(p.phone))throw Error('Informe telefone com DDD.');
 if(['matricula','transporte'].includes(p.service)){text('student_name',3,160,'Nome do aluno');text('address',5,500,'Endereço');}
 if(p.service==='matricula'){
  if(!GRADES[p.stage]?.includes(p.grade))throw Error('Selecione a etapa e o ano/série.');
  const b=String(p.birth_date||'');const d=new Date(b+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(b)||Number.isNaN(+d)||d.toISOString().slice(0,10)!==b||b>today||Number(today.slice(0,4))-Number(b.slice(0,4))>110)throw Error('Confira a data de nascimento.');
 }
 if(p.service==='transporte'){text('pickup_point',5,500,'Ponto de embarque');if(!Object.hasOwn(SHIFTS,p.shift))throw Error('Selecione o turno.');}
 if(['alimentacao','infraestrutura'].includes(p.service))text('details',10,6000,'Descrição');
 if(String(p.details||'').length>6000)throw Error('A descrição deve ter até 6000 caracteres.');
 if(p.service==='evento'&&!/^[0-9a-f-]{36}$/i.test(p.notice_id||''))throw Error('Selecione o evento.');
 return p;
}
export function validatePhoto(file){if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)throw Error('A foto deve ser JPG, PNG ou WebP com até 5 MB.');}
export function friendly(error){const m=String(error?.message||error||'Não foi possível concluir.');if(/PGRST20[25]|42P01/.test(error?.code||'')||/Could not find.*edu_|relation.*edu_.*does not exist/i.test(m))return 'O atendimento online da Educação está em preparação. Consulte a Secretaria de Educação.';if(/Invalid login credentials/i.test(m))return 'E-mail ou senha incorretos.';if(/Email not confirmed/i.test(m))return 'Confirme seu e-mail antes de entrar.';if(/Failed to fetch|network/i.test(m))return 'Não foi possível conectar. Confira a internet e tente novamente.';return m;}
