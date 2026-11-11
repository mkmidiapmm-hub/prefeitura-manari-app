"""Build reproducible catalogue and SQL from the official PNTP 2026 matrix.
Source: TCE-PE linked workbook (see docs/FINALIZACAO-PORTAL.md).
"""
import json,re
from pathlib import Path
base=Path(__file__).resolve().parents[1]
modules={s['module']:s for s in json.loads((base/'scripts/transparency-base.json').read_text())}
def F(key,label,typ='text',required=False,options=None):
 d=dict(key=key,label=label,type=typ,required=required)
 if options:d['options']=options
 return d
def fields(spec):
 out=[]
 for item in spec.split('|'):
  key,label,*opts=item.split(':');typ=opts[0] if opts else 'text';required=label.endswith('*');out.append(F(key,label.rstrip('*'),typ,required))
 return out
def M(key,title,dept,spec,group):
 modules[key]=dict(module=key,title=title,department_code=dept,description='Informações oficiais de '+title.lower()+'.',fields=fields(spec),sort_order=100+len(modules),group=group)
def E(key,spec):
 old={f['key']:f for f in modules[key]['fields']}
 for f in fields(spec):old[f['key']]=f
 modules[key]['fields']=list(old.values())
# Preserve existing keys and add the missing disclosure dimensions.
E('receitas','exercise:Exercício*:number|forecast:Previsão atualizada*:currency|amount:Valor arrecadado*:currency|category:Categoria econômica*|origin:Origem*|species:Espécie*|breakdown:Desdobramento*|reference_date:Data de referência*:date')
E('despesas','exercise:Exercício*:number|reference_date:Data de referência*:date|stage:Fase (empenhada / liquidada / paga)*|unit:Unidade orçamentária*|function:Função*|subfunction:Subfunção*|program:Programa / ação*|economic_category:Categoria econômica*|funding_source:Fonte de recursos*|amount:Valor*:currency')
E('empenhos','exercise:Exercício*:number|supplier:Credor / beneficiário*|document:Identificação pública do credor|object:Bem ou serviço*:textarea|process_number:Processo licitatório ou fundamento da contratação*|amount:Valor*:currency')
E('pagamentos','exercise:Exercício*:number|supplier:Favorecido*|commitment:Empenho relacionado*')
E('transferencias','exercise:Exercício*:number|instrument:Número / ano do instrumento*|direction:Recebida ou concedida*|origin:Órgão de origem ou beneficiário*|object:Objeto*:textarea|forecast:Valor previsto*:currency|amount:Valor realizado*:currency|start_date:Início da vigência*:date|end_date:Fim da vigência*:date')
E('convenios','exercise:Exercício*:number|number:Número / ano*|partner:Partes envolvidas*|object:Objeto*:textarea|kind:Recebido / concedido / sem repasse*|forecast:Valor previsto:currency|amount:Valor realizado:currency|obligations:Obrigações ajustadas:textarea')
E('servidores_remuneracoes','name:Nome do servidor*|position:Cargo / função*|department:Lotação*|competence:Competência*:month|gross:Remuneração bruta*:currency|net:Remuneração líquida*:currency|employment_type:Tipo de vínculo*|admission:Admissão*:date|exit_date:Exoneração / inativação:date|hours:Carga horária*:number')
E('diarias','beneficiary:Beneficiário*|position:Cargo / função*|destination:Destino*|purpose:Motivo*:textarea|start_date:Saída*:date|end_date:Retorno*:date|quantity:Número de diárias*:number|amount:Valor total*:currency')
E('licitacoes','exercise:Exercício*:number|modality:Modalidade*|estimated_value:Valor estimado*:currency|homologated_value:Valor homologado:currency|opening_date:Data*:date|status_detail:Situação*|documents:Documentos e respectivas etapas (links públicos):textarea')
E('contratos','exercise:Exercício*:number|amount:Valor contratado*:currency|start_date:Início da vigência*:date|end_date:Fim da vigência*:date|amendments:Termos aditivos (números e links):textarea')
E('dispensas_inexigibilidades','exercise:Exercício*:number|process_number:Número do processo*|supplier:Contratado*|object:Objeto*:textarea|amount:Valor*:currency|legal_basis:Fundamento legal*|documents:Documentos do processo (links):textarea')
E('obras_publicas','name:Nome / objeto da obra*|location:Local*|contractor:Empresa executora*|amount:Valor contratado*:currency|start_date:Início*:date|end_date:Previsão de conclusão*:date|actual_end_date:Conclusão efetiva:date|progress:Percentual executado*:number|status_detail:Situação*|contract_number:Contrato relacionado*')
E('emendas','exercise:Exercício*:number|author:Autor*|number:Identificação*|origin:Origem federal / estadual / municipal*|transfer_type:Forma de repasse*|type:Tipo da emenda*|object:Objeto*:textarea|function:Função de governo*|forecast:Valor previsto*:currency|amount:Valor recebido*:currency|committed:Valor empenhado:currency|liquidated:Valor liquidado:currency|paid:Valor pago:currency|status_detail:Situação*')
E('concursos_selecoes','stages:Etapas e atos (links):textarea|approved:Resultados e classificações (links):textarea|appointments:Nomeações (links):textarea')
E('lgpd','topic:Assunto*|content:Política / informações oficiais*:textarea|officer:Nome do encarregado*|contact:Canal do encarregado*|appointment:Norma de designação')
E('dados_abertos','dataset:Conjunto de dados*|format:Formato*|periodicity:Periodicidade*|description:Descrição e regras de utilização*:textarea')
M('estrutura','Estrutura e responsáveis','administracao','unit:Unidade*|parent:Unidade superior|manager:Responsável*|competencies:Competências*:textarea|address:Endereço*|phone:Telefone*|email:E-mail institucional*:email|hours:Horário*|legal_basis:Norma da estrutura*','Institucional')
M('perguntas_frequentes','Perguntas frequentes','administracao','question:Pergunta*|answer:Resposta*:textarea','Institucional')
M('divida_ativa','Dívida ativa','financas','exercise:Exercício*:number|debtor:Nome do inscrito*|amount:Valor total*:currency|reference_date:Data de referência*:date','Finanças')
M('tabela_remuneratoria','Tabela remuneratória','rh','position:Cargo / função*|base_amount:Valor*:currency|hours:Carga horária:number|legal_basis:Fundamento legal*|reference_date:Vigência*:date','Pessoal')
M('estagiarios','Estagiários','rh','name:Nome*|unit:Setor*|start_date:Contratação*:date|end_date:Término*:date','Pessoal')
M('terceirizados','Terceirizados','rh','name:Nome*|activity:Função / atividade*|employer:Empresa empregadora*|reference_date:Data de referência*:date','Pessoal')
M('tabela_diarias','Tabela de diárias','rh','position:Cargo / função*|destination:Destino / abrangência*|amount:Valor*:currency|legal_basis:Norma*','Pessoal')
M('atas_srp','Atas de adesão e registro de preços','licitacoes','number:Número / ano*|object:Objeto*:textarea|agency:Órgão gerenciador*|supplier:Fornecedor*|amount:Valor:currency|start_date:Início:date|end_date:Fim:date','Compras')
M('plano_contratacoes','Plano anual de contratações','licitacoes','exercise:Exercício*:number|description:Descrição*:textarea|approval_date:Aprovação*:date','Compras')
M('sancionados','Fornecedores sancionados','licitacoes','supplier:Fornecedor*|document:Identificação pública*|penalty:Sanção*|legal_basis:Fundamento*|start_date:Início*:date|end_date:Fim:date','Compras')
M('fiscais_contratos','Fiscais de contratos','licitacoes','contract_number:Contrato*|name:Nome do fiscal*|appointment:Ato de designação*|start_date:Início*:date|end_date:Fim:date','Compras')
M('ordem_pagamentos','Ordem cronológica de pagamentos','financas','exercise:Exercício*:number|date:Data*:date|sequence:Ordem*:number|supplier:Favorecido*|contract_number:Contrato|amount:Valor*:currency|source:Fonte*|change_reason:Justificativa de alteração da ordem:textarea','Finanças')
M('obras_medicoes','Medições e preços das obras','obras','work:Obra*|contract_number:Contrato*|item:Item / serviço*|unit:Unidade de medida*|contracted_quantity:Quantidade contratada*:number|unit_price:Preço unitário contratado*:currency|total:Preço total contratado*:currency|executed_quantity:Quantidade executada*:number|paid:Valor efetivamente pago*:currency|reference_date:Data da medição*:date','Obras')
M('obras_paralisadas','Obras paralisadas','obras','work:Obra*|reason:Motivo*:textarea|responsible:Responsável pela paralisação*|restart:Previsão de reinício / justificativa*|reference_date:Data de referência*:date','Obras')
M('relatorio_gestao','Relatórios de gestão','controle_interno','exercise:Exercício*:number|unit:Unidade*|description:Relatório*:textarea','Planejamento')
M('julgamento_contas','Apreciação e julgamento das contas','controle_interno','exercise:Exercício*:number|authority:Tribunal / Câmara*|process_number:Processo*|decision:Resultado*:textarea|date:Data*:date','Planejamento')
M('planejamento_estrategico','Planejamento estratégico','administracao','period:Período*|objectives:Objetivos*:textarea|indicators:Indicadores e metas*:textarea','Planejamento')
M('sic_atendimento','Atendimento do SIC','ouvidoria','unit:Unidade responsável*|manager:Responsável*|address:Endereço*|phone:Telefone*|email:E-mail*:email|hours:Horário*|procedure:Como pedir e recorrer*:textarea|deadlines:Prazos e autoridades recursais*:textarea','Cidadão')
M('lai_normas','Regulamentação da LAI','juridico','number:Norma*|date:Data*:date|description:Descrição*:textarea','Cidadão')
M('esic_relatorios','Estatísticas anuais do e-SIC','ouvidoria','exercise:Exercício*:number|received:Pedidos recebidos*:number|answered:Atendidos*:number|denied:Indeferidos*:number|profile:Perfil agregado dos solicitantes*:textarea','Cidadão')
M('esic_sigilo','Informações classificadas','ouvidoria','subject:Assunto*|level:Grau de sigilo*|legal_basis:Fundamento legal*|deadline:Prazo de classificação*|reference_date:Data*:date','Cidadão')
M('esic_desclassificadas','Informações desclassificadas','ouvidoria','subject:Assunto*|date:Data de desclassificação*:date|description:Descrição*:textarea','Cidadão')
M('ouvidoria_atendimento','Atendimento da Ouvidoria','ouvidoria','unit:Unidade*|manager:Responsável*|address:Endereço*|phone:Telefone*|email:E-mail*:email|hours:Horário*','Cidadão')
M('governo_digital','Governo digital','juridico','number:Norma*|date:Data*:date|description:Regulamentação*:textarea','Cidadão')
M('satisfacao','Pesquisas de satisfação','ouvidoria','period:Período*|method:Metodologia*:textarea|participants:Participantes*:number|results:Resultados*:textarea|date:Publicação*:date','Cidadão')
M('renuncias_receitas','Renúncias de receitas','financas','exercise:Exercício*:number|type:Tipo de benefício*|legal_basis:Fundamento legal individualizado*|beneficiary:Beneficiário|forecast:Valor previsto*:currency|amount:Valor realizado*:currency','Finanças')
M('projetos_incentivados','Projetos culturais e esportivos incentivados','financas','exercise:Exercício*:number|project:Projeto*|beneficiary:Beneficiário*|amount:Valor aprovado*:currency|legal_basis:Fundamento legal*','Finanças')
M('saude_planos','Planos e relatórios da Saúde','saude','period:Período*|type:Plano / programação / relatório*|description:Descrição*:textarea','Saúde')
M('saude_servicos','Unidades e serviços de Saúde','saude','unit:Unidade*|address:Endereço*|hours:Horários*|professionals:Profissionais*:textarea|specialties:Especialidades*:textarea|contact:Contato*','Saúde')
M('saude_filas','Filas de regulação','saude','anonymous_code:Código público não identificável*|service:Consulta / exame / serviço*|position:Posição*:number|criteria:Critérios de prioridade*:textarea|reference_date:Atualização*:date','Saúde')
M('saude_medicamentos','Medicamentos e como obter','saude','name:Medicamento*|presentation:Apresentação*|how_to:Como obter*:textarea|unit:Unidade dispensadora*|high_cost:Orientações para alto custo:textarea','Saúde')
M('saude_estoques','Estoques de medicamentos','saude','name:Medicamento*|presentation:Apresentação*|unit:Farmácia / unidade*|quantity:Quantidade*:number|reference_date:Atualização*:date','Saúde')
M('conselho_saude','Conselho de Saúde','saude','composition:Composição*:textarea|operation:Funcionamento*:textarea|contact:Contato*|legal_basis:Norma*|reference_date:Atualização*:date','Saúde')
M('educacao_planos','Plano e resultados da Educação','educacao','period:Período*|type:Plano / resultados*|description:Conteúdo*:textarea','Educação')
M('creches','Vagas e espera em creches','educacao','anonymous_code:Código público não identificável*|unit:Creche*|position:Posição*:number|criteria:Critérios de prioridade*:textarea|reference_date:Atualização*:date','Educação')
M('conselho_fundeb','Conselho do Fundeb','educacao','composition:Composição*:textarea|operation:Funcionamento*:textarea|contact:Contato*|legal_basis:Norma*|reference_date:Atualização*:date','Educação')
M('conselho_assistencia','Conselho de Assistência Social','assistencia','composition:Composição*:textarea|operation:Funcionamento*:textarea|contact:Contato*|legal_basis:Norma*|reference_date:Atualização*:date','Assistência')
# Fix historical department aliases, without changing existing record ownership.
aliases={'patrimonio_frota':'patrimonio','convenios_emendas':'convenios','ouvidoria_lai':'ouvidoria'}
groups={'financas':'Finanças','rh':'Pessoal','licitacoes':'Compras','obras':'Obras','controle_interno':'Controle e contas','juridico':'Atos e legislação','administracao':'Institucional','ouvidoria':'Cidadão','saude':'Saúde','educacao':'Educação','assistencia':'Assistência'}
for m in modules.values():
 m['department_code']=aliases.get(m['department_code'],m['department_code']);m.setdefault('group',groups.get(m['department_code'],'Outros setores'))
 m['allows_statement']=m['module'] in ['divida_ativa','estagiarios','terceirizados','diarias','transferencias','convenios','sancionados','obras_paralisadas','esic_sigilo','esic_desclassificadas','renuncias_receitas','projetos_incentivados','creches','saude_filas']
 m['requires_file']=m['module'] in ['ppa','ldo','loa','rreo','rgf','prestacao_contas','licitacoes','contratos','dispensas_inexigibilidades','atas_srp','plano_contratacoes','relatorio_gestao','julgamento_contas','lai_normas','governo_digital','saude_planos','educacao_planos','planejamento_estrategico']
# All public disclosures support explicit, dated non-occurrence statements; none is inserted automatically.
source_rows=json.loads((base/'scripts/pntp-2026-executivo.json').read_text())
criteria=[]
map_by_dimension={1:'portal',2:'estrutura',3:'receitas',4:'despesas',5:'convenios',6:'servidores_remuneracoes',7:'diarias',8:'licitacoes',9:'contratos',10:'obras_publicas',11:'prestacao_contas',12:'sic_atendimento',13:'acessibilidade',14:'ouvidoria_atendimento',15:'lgpd',16:'renuncias_receitas',17:'emendas',18:'saude_planos',19:'educacao_planos'}
exact={'2.6':'leis','2.7':'perguntas_frequentes','3.3':'divida_ativa','4.3':'empenhos','5.1':'transferencias','5.2':'transferencias','6.3':'tabela_remuneratoria','6.4':'estagiarios','6.5':'terceirizados','6.6':'concursos_selecoes','6.7':'concursos_selecoes','7.2':'tabela_diarias','8.4':'dispensas_inexigibilidades','8.5':'atas_srp','8.6':'plano_contratacoes','8.7':'sancionados','9.3':'fiscais_contratos','9.4':'ordem_pagamentos','10.2':'obras_medicoes','10.3':'obras_medicoes','10.4':'obras_paralisadas','11.2':'relatorio_gestao','11.3':'julgamento_contas','11.4':'julgamento_contas','11.5':'rgf','11.6':'rreo','11.7':'planejamento_estrategico','11.8':'ppa','11.9':'ldo','11.10':'loa','12.3':'esic','12.4':'esic','12.5':'lai_normas','12.7':'esic_relatorios','12.8':'esic_sigilo','12.9':'esic_desclassificadas','14.2':'ouvidoria','14.3':'carta_servicos','15.3':'carta_servicos','15.4':'dados_abertos','15.5':'governo_digital','15.6':'satisfacao','16.4':'projetos_incentivados','18.2':'saude_servicos','18.3':'saude_filas','18.4':'saude_medicamentos','18.5':'saude_estoques','18.6':'conselho_saude','19.2':'creches','19.3':'conselho_fundeb','19.4':'conselho_assistencia'}
for r in source_rows:
 typ=str(r[0] or '').strip();id=str(r[2] or '').strip().rstrip('.')
 if not re.fullmatch(r'\d+\.\d+',id) or not ('COMUM' in typ or 'EXECUTIVO' in typ):continue
 mod=exact.get(id,map_by_dimension.get(int(id.split('.')[0]),'portal'))
 criteria.append(dict(id=id,dimension=str(r[1]).strip(),question=' '.join(str(r[3]).split()),classification=str(r[4]).strip(),module=mod,department=modules.get(mod,{}).get('department_code','administracao'),aspects={k:str(v or '').strip() for k,v in zip(['availability','current','history','export','filters'],r[5:10])}))
assert len(criteria)==96,(len(criteria),[x['id'] for x in criteria])
for m in modules.values():m['criteria']=[c['id'] for c in criteria if c['module']==m['module']]
catalog=dict(cycle=2026,source='https://www.tcepe.tc.br/internet/index.php/levantamento-nacional-transparencia-publica-lntp-cidadao',modules=list(modules.values()),criteria=criteria)
(base/'www/transparency-catalog.js').write_text('/* Catálogo de publicação e matriz PNTP 2026. A presença de dados não certifica atendimento. */\n(function(root){const catalog='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=catalog;else root.ManariTransparencyCatalog=catalog;})(typeof window!=="undefined"?window:globalThis);\n')
# The migration is intentionally generated from the same catalogue as the forms.
def q(s):return "'"+str(s).replace("'","''")+"'"
sql=['begin;', 'alter table public.portal_module_schemas add column if not exists requires_file boolean not null default false, add column if not exists allows_statement boolean not null default false, add column if not exists group_name text;']
for m in modules.values():
 sql.append('insert into public.portal_module_schemas(module,title,department_code,description,fields,sort_order,requires_file,allows_statement,group_name,active) values('+','.join([q(m['module']),q(m['title']),q(m['department_code']),q(m['description']),q(json.dumps(m['fields'],ensure_ascii=False))+'::jsonb',str(m['sort_order']),str(m['requires_file']).lower(),str(m['allows_statement']).lower(),q(m['group']),'true'])+') on conflict(module) do update set title=excluded.title,department_code=excluded.department_code,fields=excluded.fields,description=excluded.description,requires_file=excluded.requires_file,allows_statement=excluded.allows_statement,group_name=excluded.group_name,active=true,updated_at=now();')
# Only append new modules to their owning departments and existing members of that same department.
new=[m for m in modules.values() if m['module'] not in {s['module'] for s in json.loads((base/'scripts/transparency-base.json').read_text())}]
for m in new:
 sql.append(f"update public.portal_departments set modules=array(select distinct x from unnest(modules||array[{q(m['module'])}]) x) where code={q(m['department_code'])};")
 sql.append(f"update public.portal_staff_members s set modules=array(select distinct x from unnest(s.modules||array[{q(m['module'])}]) x) from public.portal_departments d where d.code={q(m['department_code'])} and s.active and s.can_manage_documents and (s.department=d.code or s.department=d.name);")
(base/'database/transparency-catalog.sql').write_text('\n'.join(sql)+'\ncommit;\n')
print(len(modules),'modules;',len(criteria),'criteria;',sum(c['classification']=='Essencial' for c in criteria),'essential')

a=['begin;']
for c in criteria:
 a.append('insert into public.portal_pntp_criteria(id,dimension,question,classification,module,department,cycle,aspects) values('+','.join(q(c[k]) for k in ['id','dimension','question','classification','module','department'])+',2026,'+q(json.dumps(c['aspects'],ensure_ascii=False))+'::jsonb) on conflict(id) do update set dimension=excluded.dimension,question=excluded.question,classification=excluded.classification,module=excluded.module,department=excluded.department,aspects=excluded.aspects;')
a.append('commit;');(base/'database/transparency-criteria.sql').write_text('\n'.join(a)+'\n')
