-- Fonte: ESCOLAS ATIVAS.docx, relação de 2026 fornecida pela Prefeitura.
-- Atualiza somente nome/endereço das escolas existentes; preserva IDs e configurações.
-- Novas escolas: ativas no catálogo de 2026, etapas não informadas, pré-matrícula fechada.
begin;
set local lock_timeout = '5s';
lock table public.edu_schools in share row exclusive mode;
-- Etapas desconhecidas são permitidas apenas enquanto a pré-matrícula estiver fechada.
alter table public.edu_schools drop constraint edu_schools_stages_check;
alter table public.edu_schools add constraint edu_schools_stages_check check (
 stages <@ array['creche','pre_escola','fundamental','eja']::text[]
 and array_position(stages,null) is null
 and (cardinality(stages)>0 or not enrollment_open)
);
create temporary table import_schools_source(name text primary key,address text not null) on commit drop;
insert into import_schools_source(name,address) values
('ESCOLA MUNICIPAL 15 DE NOVEMBRO','SITIO SERRA DO EXU'),
('ESCOLA MUNICIPAL AFONSO JOSE DE ARAUJO','RUA DO PEDRO I, 05, CENTRO'),
('ESCOLA MUNICIPAL ANTONIO MANOEL DE ARAUJO','SITIO UMBUZEIRO DOCE'),
('ESCOLA MUNICIPAL CELINA ANA','SITIO ALTO VERMELHO'),
('ESCOLA MUNICIPAL CLARINDO ALEXANDRE DO NASCIMENTO','SITIO ESTIVA'),
('ESCOLA MUNICIPAL DOMINGOS DANTAS','SITIO UMBURANA BRAVA'),
('ESCOLA MUNICIPAL JOSE DANTAS ROCHA','SITIO SERRINHA'),
('ESCOLA MUNICIPAL JOSE MARIA','SITIO LAGOA DO TEIXEIRA'),
('ESCOLA MUNICIPAL JOSE MARIANO DE ARAUJO','SITIO LAGOINHA'),
('ESCOLA MUNICIPAL MACHADO DE ASSIS','SITIO CARUA'),
('ESCOLA MUNICIPAL MANOEL LACERDA','SITIO MINADOR'),
('ESCOLA MUNICIPAL MARIA ALZIRA OLIVEIRA JORGE','RODOVIA PE 300 S/N, BAIRRO NOVO'),
('ESCOLA MUNICIPAL NILO COELHO','DISTRITO SANTA LUZIA'),
('ESCOLA MUNICIPAL PAULO VI','SITIO LAJEIRO VERMELHO'),
('ESCOLA MUNICIPAL PRESIDENTE MEDICI','SITIO GARROTE'),
('ESCOLA MUNICIPAL RITA DE SOUZA','SITIO FURNINHA'),
('ESCOLA MUNICIPAL SAO TIAGO','SITIO LAGOA DA VACA');
create temporary table import_schools_before on commit drop as select * from public.edu_schools;
create temporary table import_schools_matches on commit drop as
 select src.name,src.address,s.id from import_schools_source src
 join public.edu_schools s on upper(trim(s.name))=src.name
 or (src.name='ESCOLA MUNICIPAL MARIA ALZIRA OLIVEIRA JORGE'
     and s.id='fce66836-d868-4a51-bd78-6a91fb233b0a'::uuid);
do $validate$
begin
 if (select count(*) from import_schools_source)<>17 then raise exception 'A fonte deve conter 17 escolas'; end if;
 if exists(select name from import_schools_matches group by name having count(*)>1)
 or exists(select id from import_schools_matches group by id having count(*)>1)
 then raise exception 'Correspondência ambígua; nenhuma escola foi importada'; end if;
end $validate$;
update public.edu_schools s set name=m.name,address=m.address
from import_schools_matches m where s.id=m.id and (s.name,s.address) is distinct from (m.name,m.address);
insert into public.edu_schools(name,address,stages,school_year,active,enrollment_open)
 select src.name,src.address,array[]::text[],2026,true,false from import_schools_source src
 where not exists(select 1 from import_schools_matches m where m.name=src.name);
do $verify$
begin
 if (select count(*) from import_schools_source src join public.edu_schools s on s.name=src.name and s.address=src.address)<>17
 then raise exception 'A conferência dos 17 nomes e endereços falhou'; end if;
 if exists(select 1 from import_schools_before b left join public.edu_schools s on s.id=b.id
  where s.id is null or (to_jsonb(s)-'name'-'address') is distinct from (to_jsonb(b)-'name'-'address'))
 then raise exception 'ID ou configuração preexistente alterado'; end if;
 if exists(select 1 from public.edu_schools s where not exists(select 1 from import_schools_before b where b.id=s.id)
  and (s.school_year<>2026 or not s.active or s.enrollment_open or cardinality(s.stages)<>0))
 then raise exception 'Configuração incorreta de nova escola'; end if;
end $verify$;
select (select count(*) from import_schools_source) as escolas_conferidas,
 (select count(*) from public.edu_schools s where not exists(select 1 from import_schools_before b where b.id=s.id)) as adicionadas,
 (select count(*) from import_schools_matches m join import_schools_before b on b.id=m.id where (b.name,b.address) is distinct from (m.name,m.address)) as atualizadas,
 (select count(*) from public.edu_schools) as total_cadastrado;
commit;
