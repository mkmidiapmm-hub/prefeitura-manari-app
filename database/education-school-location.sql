-- Campo opcional de localização; mantém os vínculos, RLS e validações existentes.
begin;
set local lock_timeout = '5s';
alter table public.edu_schools add column if not exists maps_url text;
do $check$
begin
 if not exists(select 1 from pg_constraint where conrelid='public.edu_schools'::regclass and conname='edu_schools_maps_url_check') then
  alter table public.edu_schools add constraint edu_schools_maps_url_check check (
   maps_url is null or (
    length(maps_url) between 1 and 2048 and maps_url !~ '[[:space:][:cntrl:]]'
    and maps_url ~ '^https://((www\.)?google\.com(\.br)?/maps(/|\?|#|$)|maps\.google\.com/|maps\.app\.goo\.gl/[A-Za-z0-9]+/?(\?|#|$)|goo\.gl/maps/[A-Za-z0-9]+/?(\?|#|$))'
   )
  );
 end if;
end $check$;
comment on column public.edu_schools.maps_url is 'Link público opcional da localização da escola no Google Maps.';

create or replace function education_private.save_school(p jsonb)
returns public.edu_schools
language plpgsql security definer set search_path = ''
as $function$
declare r public.edu_schools; sid uuid:=nullif(p->>'id','')::uuid;
begin
 if not education_private.central() then raise exception 'Apenas a Secretaria de Educação pode cadastrar escolas'; end if;
 if sid is null then
  insert into public.edu_schools(name,address,contact,stages,school_year,instructions,active,enrollment_open,maps_url)
  values(trim(p->>'name'),trim(p->>'address'),trim(coalesce(p->>'contact','')),array(select jsonb_array_elements_text(p->'stages')),(p->>'school_year')::integer,trim(coalesce(p->>'instructions','')),coalesce((p->>'active')::boolean,false),coalesce((p->>'enrollment_open')::boolean,false),nullif(trim(p->>'maps_url'),'')) returning * into r;
 else
  update public.edu_schools set name=trim(p->>'name'),address=trim(p->>'address'),contact=trim(coalesce(p->>'contact','')),stages=array(select jsonb_array_elements_text(p->'stages')),school_year=(p->>'school_year')::integer,instructions=trim(coalesce(p->>'instructions','')),active=coalesce((p->>'active')::boolean,false),enrollment_open=coalesce((p->>'enrollment_open')::boolean,false),maps_url=case when p ? 'maps_url' then nullif(trim(p->>'maps_url'),'') else maps_url end where id=sid returning * into r;
  if not found then raise exception 'Escola não encontrada'; end if;
 end if;
 insert into education_private.audit(actor,action,entity) values(auth.uid(),'save_school',r.id);
 return r;
end $function$;
notify pgrst, 'reload schema';
commit;
