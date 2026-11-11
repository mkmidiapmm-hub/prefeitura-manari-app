/* Shared pure functions for public consultation and validation. */
(function(root){
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
 function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s}
 function recordDate(r){const d=r.data||{};return d.reference_date||d.date||d.competence||d.start_date||d.opening_date||r.published_at?.slice(0,10)||''}
 function recordYear(r){const d=r.data||{};return String(d.exercise||d.year||d.competence?.slice(0,4)||d.period?.match(/\b(?:19|20|21)\d{2}\b/)?.[0]||recordDate(r).slice(0,4)||'')}
 function validate(schema,record){
  const errors=[],data=record.data||{};
  if(!String(record.title||'').trim())errors.push('Informe o título.');
  if(!data||typeof data!=='object'||Array.isArray(data))return ['Informações do módulo inválidas.'];
  if(data._statement===true){
   if(!schema.allows_statement)errors.push('Este módulo exige registros detalhados.');
   if(String(data._justification||'').trim().length<20)errors.push('Explique a ausência de ocorrência (mínimo 20 caracteres).');
   if(!String(data._period||'').trim())errors.push('Informe o período da declaração.');
   if(!String(data._authority||'').trim())errors.push('Informe a autoridade responsável pela declaração.');
   if(!validDate(data._reference_date))errors.push('Informe a data da declaração.');
  }else for(const f of schema.fields||[]){
   const v=data[f.key],empty=v==null||String(v).trim()==='';
   if(f.required&&empty){errors.push('Preencha '+f.label+'.');continue}if(empty)continue;
   if(['currency','number'].includes(f.type)&&(!Number.isFinite(Number(v))||Number(v)<0))errors.push(f.label+': use um número maior ou igual a zero.');
   if(f.key==='progress'&&Number(v)>100)errors.push('Percentual executado deve ser de 0 a 100.');
   if(f.type==='date'&&!validDate(v))errors.push(f.label+': data inválida.');
   if(f.type==='month'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v)))errors.push(f.label+': competência inválida.');
   if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))errors.push(f.label+': e-mail inválido.');
  }
  if(schema.requires_file&&!safeUrl(record.file_url)&&!safeUrl(record.source_url))errors.push('Anexe o documento completo ou informe o link público direto.');
  for(const key of ['file_url','source_url'])if(record[key]&&!safeUrl(record[key]))errors.push('Use um link público HTTP ou HTTPS.');
  if(data.start_date&&data.end_date&&data.end_date<data.start_date)errors.push('O fim do período não pode ser anterior ao início.');
  return errors;
 }
 function filterRows(rows,{q='',year='',from='',to='',department='',situation=''}={}){
  const n=norm(q);return rows.filter(r=>{const date=recordDate(r);return (!year||recordYear(r)===String(year))&&(!department||r.department===department)&&(!from||date.slice(0,10)>=from)&&(!to||date.slice(0,10)<=to+'\uffff')&&(!situation||norm(r.data?.status_detail)===norm(situation))&&(!n||norm([r.title,r.summary,...Object.values(r.data||{})].join(' ')).includes(n))});
 }
 function publicRecord(r){return {id:r.id,module:r.module,department:r.department,title:r.title,summary:r.summary,data:r.data,file_url:safeUrl(r.file_url),source_url:safeUrl(r.source_url),published_at:r.published_at,updated_at:r.updated_at}}
 function csv(rows,schema){const fields=[...(schema.fields||[]).map(f=>({key:f.key,label:f.label,type:f.type})),{key:'_statement',label:'Declaração de não ocorrência'},{key:'_period',label:'Período da declaração'},{key:'_justification',label:'Justificativa'},{key:'_authority',label:'Autoridade responsável'},{key:'_reference_date',label:'Data da declaração'}];
  function cell(v,numeric=false){let s=String(v??'');if(!numeric&&/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
  const head=['id','Título','Resumo','Setor',...fields.map(f=>f.label),'Documento','Fonte','Publicado','Atualizado'];
  const lines=rows.map(r=>[r.id,r.title,r.summary,r.department,...fields.map(f=>r.data?.[f.key]),safeUrl(r.file_url),safeUrl(r.source_url),r.published_at,r.updated_at].map((v,i)=>cell(v,i>=4&&['currency','number'].includes(fields[i-4]?.type)&&Number.isFinite(Number(v)))).join(';'));
  return '\ufeff'+[head.map(v=>cell(v)).join(';'),...lines].join('\r\n');
 }
 function parseCsv(text){
  const rows=[];let row=[],cell='',quoted=false,delimiter=(text.split(/\r?\n/)[0].match(/;/g)||[]).length>=(text.split(/\r?\n/)[0].match(/,/g)||[]).length?';':',';
  text=String(text).replace(/^\ufeff/,'');for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===delimiter&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('CSV com aspas não encerradas.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
 }
 const api={norm,safeUrl,validDate,recordDate,recordYear,validate,filterRows,publicRecord,csv,parseCsv};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ManariTransparencyUtils=api;
})(typeof window!=='undefined'?window:globalThis);
