begin;
create table if not exists portal_private.satisfaction_votes(
 period date not null, token uuid not null, service text not null check(service in ('portal','transparencia','esic','ouvidoria','servidor')),
 score smallint not null check(score between 1 and 5), updated_at timestamptz not null default now(),primary key(period,token,service)
);
alter table portal_private.satisfaction_votes enable row level security;
revoke all on portal_private.satisfaction_votes from public,anon,authenticated;
create or replace function portal_private.satisfaction(p_score integer default null,p_service text default 'portal',p_token uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if p_score is not null then
  if p_score not between 1 and 5 or p_service not in ('portal','transparencia','esic','ouvidoria','servidor') or p_token is null then raise exception 'Avaliação inválida.' using errcode='22023';end if;
  insert into portal_private.satisfaction_votes(period,token,service,score)values(date_trunc('month',now() at time zone 'America/Sao_Paulo')::date,p_token,p_service,p_score)
  on conflict(period,token,service)do update set score=excluded.score,updated_at=now();
 end if;
 select coalesce(jsonb_agg(row_to_json(q) order by period desc,service),'[]'::jsonb) into result from
 (select period,service,count(*) as responses,round(avg(score),2) as average, count(*)filter(where score>=4) as positive from portal_private.satisfaction_votes group by period,service)q;
 return jsonb_build_object('methodology','Participação voluntária on-line; escala de 1 a 5. Uma avaliação por navegador, serviço e mês; a nova resposta substitui a anterior. Os resultados não representam amostra probabilística. Não são solicitados nome, CPF ou contato.','results',result);
end;$$;
revoke all on function portal_private.satisfaction(integer,text,uuid) from public;
grant execute on function portal_private.satisfaction(integer,text,uuid) to anon,authenticated;
create or replace function public.manari_portal_satisfaction(p_score integer default null,p_service text default 'portal',p_token uuid default null)
returns jsonb language sql security invoker set search_path='' as $$select portal_private.satisfaction(p_score,p_service,p_token);$$;
revoke all on function public.manari_portal_satisfaction(integer,text,uuid) from public;
grant execute on function public.manari_portal_satisfaction(integer,text,uuid) to anon,authenticated;
notify pgrst,'reload schema';
commit;
