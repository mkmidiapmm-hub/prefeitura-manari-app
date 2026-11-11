-- Isolated fixtures, rolled back. No accounts or public records persist.
begin;
create temporary table tp_fixture as select
 (select s.user_id from public.portal_staff_members s where s.active and s.role='admin' limit 1) admin_id,
 (select u.id from auth.users u where u.email_confirmed_at is not null and not exists(select 1 from public.portal_staff_members s where s.user_id=u.id and s.role='admin') order by u.id limit 1) manager_id,
 (select u.id from auth.users u where u.email_confirmed_at is not null and not exists(select 1 from public.portal_staff_members s where s.user_id=u.id and s.role='admin') order by u.id limit 1 offset 1) supervisor_id,
 gen_random_uuid() draft_id,gen_random_uuid() public_id;
create temporary table tp_checks(name text,ok boolean);
grant all on tp_fixture,tp_checks to authenticated,anon;
insert into public.portal_staff_members(user_id,department,role,modules,can_manage_documents,active)
 select manager_id,'saude','manager',array['saude_estoques'],true,true from tp_fixture
 union all select supervisor_id,'saude','staff',array['saude_estoques'],true,true from tp_fixture
 on conflict(user_id) do update set department=excluded.department,role=excluded.role,modules=excluded.modules,can_manage_documents=true,active=true;
select set_config('request.jwt.claim.sub',(select manager_id::text from tp_fixture),true);
set local role authenticated;
do $$begin
 insert into public.portal_records(id,module,department,title,status,data) select draft_id,'saude_estoques','saude','Teste transacional — rascunho','draft','{}' from tp_fixture;
 insert into tp_checks values('Secretário salva rascunho incompleto',true);
 begin insert into public.portal_records(module,department,title,status,data)values('saude_estoques','saude','Incompleto','published','{}');insert into tp_checks values('Publicação incompleta bloqueada',false);exception when others then insert into tp_checks values('Publicação incompleta bloqueada',sqlerrm like 'Preencha%');end;
 insert into public.portal_records(id,module,department,title,status,data) select public_id,'saude_estoques','saude','Teste transacional — estoque','published','{"name":"Medicamento fictício","presentation":"Teste","unit":"Unidade fictícia","quantity":0,"reference_date":"2026-11-11"}' from tp_fixture;
 insert into tp_checks values('Secretário publica registro completo inclusive quantidade zero',true);
 begin insert into public.portal_records(module,department,title,status,data)values('receitas','financas','Outro setor','draft','{}');insert into tp_checks values('Outro setor bloqueado',false);exception when insufficient_privilege then insert into tp_checks values('Outro setor bloqueado',true);end;
 begin update public.portal_records set data=data||'{"reference_date":"2026-02-30"}' where id=(select public_id from tp_fixture);insert into tp_checks values('Data impossível bloqueada',false);exception when others then insert into tp_checks values('Data impossível bloqueada',true);end;
 begin insert into public.portal_pntp_reviews(criterion_id,status)values('18.5','checked');insert into tp_checks values('Conferência sem evidência bloqueada',false);exception when check_violation then insert into tp_checks values('Conferência sem evidência bloqueada',true);end;
 insert into public.portal_pntp_reviews(criterion_id,status,evidence_url)values('18.5','checked','https://example.invalid/evidencia') on conflict(criterion_id)do update set status=excluded.status,evidence_url=excluded.evidence_url;
 insert into tp_checks values('Responsável confere critério do próprio módulo',true);
 begin insert into public.portal_pntp_reviews(criterion_id,status,evidence_url)values('3.1','checked','https://example.invalid/outra');insert into tp_checks values('Conferência de outro setor bloqueada',false);exception when insufficient_privilege then insert into tp_checks values('Conferência de outro setor bloqueada',true);end;
end;$$;
reset role;
select set_config('request.jwt.claim.sub',(select supervisor_id::text from tp_fixture),true);
set local role authenticated;
do $$begin
 insert into public.portal_records(module,department,title,status,data)values('saude_estoques','saude','Rascunho do supervisor','draft','{}');
 insert into tp_checks values('Supervisor salva rascunho',true);
 begin update public.portal_records set status='published',data='{"name":"Teste","presentation":"Teste","unit":"Teste","quantity":0,"reference_date":"2026-11-11"}' where id=(select draft_id from tp_fixture);insert into tp_checks values('Supervisor não publica',not found);exception when insufficient_privilege then insert into tp_checks values('Supervisor não publica',true);end;
 begin insert into public.portal_pntp_reviews(criterion_id,status,evidence_url)values('18.5','checked','https://example.invalid/supervisor') on conflict(criterion_id)do update set evidence_url=excluded.evidence_url;insert into tp_checks values('Supervisor não conclui conferência',false);exception when insufficient_privilege then insert into tp_checks values('Supervisor não conclui conferência',true);end;
end;$$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
insert into tp_checks select 'Cidadão acessa só publicações',(select count(*) from public.portal_records where id in(select draft_id from tp_fixture union all select public_id from tp_fixture))=1;
insert into tp_checks select 'Matriz completa é pública',(select count(*) from public.portal_pntp_criteria)=96;
do $$begin
 begin perform * from public.portal_pntp_reviews;insert into tp_checks values('Conferências internas não são públicas',false);exception when insufficient_privilege then insert into tp_checks values('Conferências internas não são públicas',true);end;
end;$$;
reset role;
do $$begin if exists(select 1 from tp_checks where not ok)then raise exception 'Falhou: %',(select string_agg(name,', ') from tp_checks where not ok);end if;end;$$;
select * from tp_checks;
rollback;
