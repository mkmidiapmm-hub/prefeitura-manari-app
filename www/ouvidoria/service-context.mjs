/* Contexto público dos atalhos: não concede permissões nem gera protocolos no navegador. */
export const SERVICES = {
  pavimentacao: {title:'Obras e Pavimentação', problems:['Buraco ou cratera na via','Pavimentação danificada','Outro problema na via']},
  estradas: {title:'Estradas Vicinais', problems:['Estrada danificada','Dificuldade de acesso','Outro problema na estrada']},
  iluminacao: {title:'Iluminação Pública', problems:['Lâmpada apagada','Lâmpada piscando','Lâmpada acesa durante o dia','Outro problema de iluminação']},
  drenagem: {title:'Saneamento e Drenagem', problems:['Bueiro entupido','Alagamento','Esgoto aparente','Outro problema de drenagem']},
  'espacos-publicos': {title:'Praças e Prédios Públicos', problems:['Reparo em praça','Reparo em prédio público','Outro reparo em espaço público']}
};
const aliases = {infraestrutura:['infraestrutura','obras']};
export function readContext(search, catalog) {
  const p = new URLSearchParams(search), sector = p.get('setor');
  const codes = aliases[sector] || [sector];
  const department = catalog.find(d => d.active !== false && codes.includes(d.code));
  if (!department) return null;
  const key = p.get('servico');
  const service = sector === 'infraestrutura' && Object.hasOwn(SERVICES, key) ? SERVICES[key] : null;
  return {department:department.code, service, kind:service?'solicitacao':null};
}
export function describeService(description, data) {
  if (String(description).trim().length < 10) throw Error('Descreva o problema com pelo menos 10 caracteres.');
  const location = String(data.location || '').trim(), problem = String(data.problem || '').trim();
  const number = String(data.number || '').trim(), reference = String(data.reference || '').trim();
  if (!location || !problem) throw Error('Informe o tipo de problema e o local do atendimento.');
  if ((!number || /^(s\/?n|sem n[uú]mero|n[aã]o sei)$/i.test(number)) && !reference) throw Error('Informe um ponto de referência para localizar o problema.');
  const text = `${String(description).trim()}\n\nServiço: ${data.title}\nTipo de problema: ${problem}\nLocal do problema: ${location}${number?'\nNúmero próximo: '+number:''}${reference?'\nPonto de referência: '+reference:''}`;
  if (text.length > 10000) throw Error('Reduza o relato para incluir os dados do local.');
  return text;
}
