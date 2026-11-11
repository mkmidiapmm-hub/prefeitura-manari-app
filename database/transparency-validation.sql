begin;
create index if not exists portal_records_public_module_idx on public.portal_records(module,status,published_at desc);
create or replace function portal_private.validate_publication()
returns trigger language plpgsql security invoker set search_path='' as $$
declare s public.portal_module_schemas; f jsonb; v text; k text; vtype text;
begin
 if new.status <> 'published' then return new; end if;
 select * into s from public.portal_module_schemas where module=new.module and active;
 if not found then raise exception 'Módulo de publicação não encontrado.';end if;
 if nullif(btrim(new.title),'') is null then raise exception 'Informe o título.';end if;
 if jsonb_typeof(new.data) is distinct from 'object' then raise exception 'Os dados devem ser um objeto.';end if;
 for k in select jsonb_object_keys(new.data) loop
  if k not in ('_statement','_period','_justification','_authority','_reference_date') and not exists(select 1 from jsonb_array_elements(s.fields) ff where ff->>'key'=k) then raise exception 'Campo não previsto no módulo: %',k;end if;
 end loop;
 if new.data->>'_statement'='true' then
  if not s.allows_statement then raise exception 'Este módulo exige registros detalhados.';end if;
  if length(btrim(coalesce(new.data->>'_justification','')))<20 or nullif(btrim(new.data->>'_period'),'') is null or nullif(btrim(new.data->>'_authority'),'') is null then raise exception 'A declaração exige período, autoridade e justificativa.';end if;
  v:=new.data->>'_reference_date';
  if v is null or v !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data da declaração inválida.';end if;
  perform v::date;
 else
  for f in select * from jsonb_array_elements(s.fields) loop
   v:=nullif(btrim(new.data->>(f->>'key')),'');vtype:=f->>'type';
   if coalesce((f->>'required')::boolean,false) and v is null then raise exception 'Preencha %.',f->>'label';end if;
   if v is not null then
    if vtype in ('number','currency') and (v !~ '^\d+(\.\d+)?$' or length(v)>30) then raise exception 'Valor numérico inválido: %',f->>'label';end if;
    if f->>'key'='progress' and v::numeric>100 then raise exception 'Percentual executado deve ser de 0 a 100.';end if;
    if vtype='date' then
     if v !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida: %',f->>'label';end if;perform v::date;
    end if;
    if vtype='month' and v !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Competência inválida.';end if;
    if vtype='email' and v !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'E-mail inválido.';end if;
   end if;
  end loop;
 end if;
 if s.requires_file and nullif(btrim(new.file_url),'') is null and nullif(btrim(new.source_url),'') is null then raise exception 'Anexe o documento completo ou informe o link público direto.';end if;
 if (new.file_url is not null and new.file_url !~ '^https?://[^/?#@[:space:]]+([/?#][^[:space:]]*)?$') or (new.source_url is not null and new.source_url !~ '^https?://[^/?#@[:space:]]+([/?#][^[:space:]]*)?$') then raise exception 'Link público inválido.';end if;
 if nullif(new.data->>'start_date','') is not null and nullif(new.data->>'end_date','') is not null and new.data->>'end_date'<new.data->>'start_date' then raise exception 'Período invertido.';end if;
 return new;
end;$$;
revoke all on function portal_private.validate_publication() from public;
do $create$ begin if not exists(select 1 from pg_trigger where tgname='portal_record_validation' and tgrelid='public.portal_records'::regclass) then create trigger portal_record_validation before insert or update on public.portal_records for each row execute function portal_private.validate_publication(); end if;end;$create$;
create table if not exists public.portal_pntp_criteria(
 id text primary key, dimension text not null, question text not null, classification text not null,
 module text not null, department text not null, cycle int not null default 2026,
 aspects jsonb not null default '{}'::jsonb
);
alter table public.portal_pntp_criteria enable row level security;
create table if not exists public.portal_pntp_reviews(
 criterion_id text primary key references public.portal_pntp_criteria(id),
 status text not null default 'pending' check(status in ('pending','checked','not_applicable')),
 evidence_url text, notes text, reviewed_by uuid, updated_at timestamptz not null default now(),
 constraint review_evidence check(status<>'checked' or coalesce(evidence_url,'') ~ '^https://[^/?#@[:space:]]+([/?#][^[:space:]]*)?$'),
 constraint review_justification check(status<>'not_applicable' or length(btrim(coalesce(notes,'')))>=20)
);
alter table public.portal_pntp_reviews enable row level security;
create or replace function portal_private.can_review_criterion(p_id text,p_write boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.portal_pntp_criteria c where c.id=p_id and
 (portal_private.can_access(c.module,c.department,p_write) or portal_private.can_access('controle_interno','controle_interno',p_write)));
$$;
revoke all on function portal_private.can_review_criterion(text,boolean) from public,anon;
grant execute on function portal_private.can_review_criterion(text,boolean) to authenticated;
create or replace function portal_private.stamp_review() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.reviewed_by:=auth.uid();new.updated_at:=now();return new;end;$$;
revoke all on function portal_private.stamp_review() from public;
do $create$ begin if not exists(select 1 from pg_trigger where tgname='stamp_review' and tgrelid='public.portal_pntp_reviews'::regclass) then create trigger stamp_review before insert or update on public.portal_pntp_reviews for each row execute function portal_private.stamp_review(); end if;end;$create$;
do $create$ begin if not exists(select 1 from pg_policies where policyname='pntp_criteria_public' and schemaname='public' and tablename='portal_pntp_criteria') then create policy pntp_criteria_public on public.portal_pntp_criteria for select to anon,authenticated using(true); end if;end;$create$;
do $create$ begin if not exists(select 1 from pg_policies where policyname='pntp_review_read' and schemaname='public' and tablename='portal_pntp_reviews') then create policy pntp_review_read on public.portal_pntp_reviews for select to authenticated using(portal_private.can_review_criterion(criterion_id)); end if;end;$create$;
do $create$ begin if not exists(select 1 from pg_policies where policyname='pntp_review_insert' and schemaname='public' and tablename='portal_pntp_reviews') then create policy pntp_review_insert on public.portal_pntp_reviews for insert to authenticated with check(portal_private.can_review_criterion(criterion_id,true)); end if;end;$create$;
do $create$ begin if not exists(select 1 from pg_policies where policyname='pntp_review_update' and schemaname='public' and tablename='portal_pntp_reviews') then create policy pntp_review_update on public.portal_pntp_reviews for update to authenticated using(portal_private.can_review_criterion(criterion_id,true)) with check(portal_private.can_review_criterion(criterion_id,true)); end if;end;$create$;
revoke all on public.portal_pntp_reviews from anon,authenticated;
grant select,insert,update on public.portal_pntp_reviews to authenticated;
grant select on public.portal_pntp_criteria to anon,authenticated;
update storage.buckets set allowed_mime_types=array['application/pdf','image/jpeg','image/png','image/webp','text/csv','application/json','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] where id='portal-documentos';
notify pgrst,'reload schema';
commit;
