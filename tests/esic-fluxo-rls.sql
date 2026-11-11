-- Standalone transaction: never persist fixture users, settings or notifications.
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
 ('76c046c7-78dd-4b73-8d53-c93f4c4da001','authenticated','authenticated','esic-flow-owner@example.invalid',now(),'{}','{}'),
 ('76c046c7-78dd-4b73-8d53-c93f4c4da002','authenticated','authenticated','esic-flow-other@example.invalid',now(),'{}','{}'),
 ('76c046c7-78dd-4b73-8d53-c93f4c4da003','authenticated','authenticated','esic-flow-admin@example.invalid',now(),'{}','{}'),
 ('76c046c7-78dd-4b73-8d53-c93f4c4da004','authenticated','authenticated','esic-flow-reviewer@example.invalid',now(),'{}','{}');
insert into public.portal_staff_members(user_id,role,active) values ('76c046c7-78dd-4b73-8d53-c93f4c4da003','admin',true),('76c046c7-78dd-4b73-8d53-c93f4c4da004','admin',true);
set local role authenticated;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da001","role":"authenticated"}';
insert into public.manari_digital_requests(citizen_id,module,subject,description,requested_department_code) values(auth.uid(),'esic','FLUXO COMPLETO TESTE','Pedido inteiramente fictício para validação do fluxo.','educacao');
do $test$ declare rid uuid;d jsonb;begin
 select id into strict rid from public.manari_digital_requests where subject='FLUXO COMPLETO TESTE';
 if (select due_date from public.manari_digital_requests where id=rid) is null then raise exception 'FAIL: initial deadline missing';end if;
 if not exists(select 1 from public.manari_digital_mail_queue where request_id=rid and event='criado') then raise exception 'FAIL: registration mail not queued';end if;
 if exists(select 1 from public.manari_digital_mail_queue where request_id=rid and event='respondido') then raise exception 'FAIL: false response mail';end if;
 begin perform public.manari_esic_extend(rid,'Justificativa de teste suficiente.');raise exception 'FAIL: citizen extension';exception when insufficient_privilege then null;end;
 begin perform public.manari_esic_mail_claim();raise exception 'FAIL: citizen worker access';exception when insufficient_privilege then null;end;
 begin perform public.manari_esic_mail_configure('fictitious-password-only','a@smtp-brevo.com','a@example.invalid');raise exception 'FAIL: citizen SMTP access';exception when insufficient_privilege then null;end;
 begin perform public.manari_esic_appeal(rid,'Motivo de teste antes da resposta.',1,now());raise exception 'FAIL: appeal before response';exception when invalid_parameter_value then null;end;
 begin insert into public.manari_digital_appeals(request_id,citizen_id,source_response_at,level,reason,due_date) values(rid,auth.uid(),now(),1,'Tentativa de inserção direta.',current_date);raise exception 'FAIL: direct appeal insertion';exception when insufficient_privilege then null;end;
 perform public.manari_esic_email_preference(false);
 d:=public.manari_esic_snapshot(array[rid]);if (d->>'email_enabled')::boolean then raise exception 'FAIL: mail preference';end if;
 perform public.manari_esic_email_preference(true);
end $test$;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da003","role":"authenticated"}';
do $test$ declare rid uuid;begin
 select id into strict rid from public.manari_digital_requests where subject='FLUXO COMPLETO TESTE';
 perform public.manari_esic_extend(rid,'Necessidade fictícia de consulta para validar o teste.');
 if not exists(select 1 from public.manari_esic_events where request_id=rid and event_type='prorrogado') then raise exception 'FAIL: extension audit';end if;
 begin perform public.manari_esic_extend(rid,'Tentativa fictícia de segunda prorrogação.');raise exception 'FAIL: duplicate extension';exception when invalid_parameter_value then null;end;
 perform public.manari_digital_admin_action(rid,'responder',null,'Resposta inteiramente fictícia para validar o fluxo.');
 if (select response_by from public.manari_digital_requests where id=rid)<>auth.uid() then raise exception 'FAIL: response author missing';end if;
end $test$;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da002","role":"authenticated"}';
do $test$ declare d jsonb;rid uuid;begin
 -- Use fixture ID from the owner via a transaction setting; unauthorized snapshot must remain empty.
 d:=public.manari_esic_snapshot(array(select id from public.manari_digital_requests where subject='FLUXO COMPLETO TESTE'));
 if jsonb_array_length(d->'requests')<>0 then raise exception 'FAIL: foreign workflow visible';end if;
end $test$;
reset role;
select set_config('test.esic_request',(select id::text from public.manari_digital_requests where subject='FLUXO COMPLETO TESTE'),true);
set local role authenticated;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da002","role":"authenticated"}';
do $test$ declare rid uuid:=current_setting('test.esic_request')::uuid;d jsonb;begin
 d:=public.manari_esic_snapshot(array[rid]);if jsonb_array_length(d->'requests')<>0 then raise exception 'FAIL: explicit foreign ID visible';end if;
 begin perform public.manari_esic_acknowledge(rid,now());raise exception 'FAIL: foreign acknowledgement';exception when insufficient_privilege then null;end;
end $test$;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da001","role":"authenticated"}';
do $test$ declare rid uuid:=current_setting('test.esic_request')::uuid;t timestamptz;ack1 jsonb;ack2 jsonb;begin
 select responded_at into t from public.manari_digital_requests where id=rid;
 ack1:=public.manari_esic_acknowledge(rid,t);ack2:=public.manari_esic_acknowledge(rid,t);
 if ack1->>'read_at'<>ack2->>'read_at' then raise exception 'FAIL: repeated reading resets appeal clock';end if;
 begin perform public.manari_esic_appeal(rid,'Motivo de teste com versão incorreta.',1,t-interval '1 second');raise exception 'FAIL: stale response accepted';exception when invalid_parameter_value then null;end;
 perform public.manari_esic_appeal(rid,'Solicito revisão fictícia para validar o recurso do cidadão.',1,t);
 begin perform public.manari_esic_appeal(rid,'Nova tentativa fictícia para o mesmo recurso.',1,t);raise exception 'FAIL: duplicate appeal';exception when invalid_parameter_value then null;end;
end $test$;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da003","role":"authenticated"}';
do $test$ declare rid uuid:=current_setting('test.esic_request')::uuid;aid uuid;begin
 select id into aid from public.manari_digital_appeals where request_id=rid;
 begin perform public.manari_esic_decide(aid,'Decisão fictícia sem autoridade designada.','mantida');raise exception 'FAIL: undesignated reviewer';exception when insufficient_privilege then null;end;
 begin perform public.manari_digital_admin_action(rid,'reabrir');raise exception 'FAIL: pending appeal invalidated by reopening';exception when invalid_parameter_value then null;end;
end $test$;
reset role;
update manari_esic_private.settings set reviewers=array['76c046c7-78dd-4b73-8d53-c93f4c4da003'::uuid],appeal_levels=2;
set local role authenticated;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da003","role":"authenticated"}';
do $test$ declare aid uuid;begin
 select id into aid from public.manari_digital_appeals where request_id=current_setting('test.esic_request')::uuid;
 begin perform public.manari_esic_decide(aid,'Decisão fictícia pelo próprio autor da resposta.','mantida');raise exception 'FAIL: self-review';exception when insufficient_privilege then null;end;
end $test$;
reset role;
update manari_esic_private.settings set reviewers=array['76c046c7-78dd-4b73-8d53-c93f4c4da004'::uuid,'76c046c7-78dd-4b73-8d53-c93f4c4da003'::uuid];
set local role authenticated;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da004","role":"authenticated"}';
do $test$ declare aid uuid;begin
 select id into aid from public.manari_digital_appeals where request_id=current_setting('test.esic_request')::uuid;
 perform public.manari_esic_decide(aid,'Decisão fictícia fundamentada que revisa a resposta inicial.','revisada');
 if not exists(select 1 from public.manari_esic_events where request_id=current_setting('test.esic_request')::uuid and event_type='recurso_decidido') then raise exception 'FAIL: decision audit';end if;
end $test$;
set local request.jwt.claims='{"sub":"76c046c7-78dd-4b73-8d53-c93f4c4da001","role":"authenticated"}';
do $test$ declare rid uuid:=current_setting('test.esic_request')::uuid;a public.manari_digital_appeals%rowtype;t timestamptz;begin
 select * into a from public.manari_digital_appeals where request_id=rid;select responded_at into t from public.manari_digital_requests where id=rid;
 begin perform public.manari_esic_appeal(rid,'Recurso fictício sem consultar a decisão anterior.',2,t);raise exception 'FAIL: appeal without decision acknowledgement';exception when invalid_parameter_value then null;end;
 perform public.manari_esic_acknowledge(rid,a.decided_at,a.id);
 perform public.manari_esic_appeal(rid,'Recurso fictício para validar a segunda instância.',2,t);
end $test$;
reset role;
do $test$ declare q jsonb;job jsonb;before integer;rid uuid:=current_setting('test.esic_request')::uuid;begin
 if public.manari_esic_add_days('2030-01-04',1)<>'2030-01-07' then raise exception 'FAIL: weekend rollover';end if;
 if has_column_privilege('authenticated','public.manari_digital_requests','due_date','UPDATE') then raise exception 'FAIL: deadline editable directly';end if;
 if has_column_privilege('authenticated','public.manari_digital_mail_queue','lease_token','SELECT') then raise exception 'FAIL: worker token readable by citizen';end if;
 if exists(select 1 from public.manari_digital_mail_queue where request_id=rid group by dedupe_key having count(*)>1) then raise exception 'FAIL: duplicated notification';end if;
 q:=public.manari_esic_mail_claim();if jsonb_array_length(q)=0 then raise exception 'FAIL: no mail claimed';end if;
 job:=q->0;
 if public.manari_esic_mail_finish((job->>'id')::uuid,gen_random_uuid(),true) then raise exception 'FAIL: wrong lease accepted';end if;
 if not public.manari_esic_mail_finish((job->>'id')::uuid,(job->>'token')::uuid,false,'network') then raise exception 'FAIL: retry not recorded';end if;
 if not exists(select 1 from public.manari_digital_mail_queue where id=(job->>'id')::uuid and state='pendente' and attempts=1 and next_attempt_at>now()) then raise exception 'FAIL: retry backoff';end if;
 begin perform public.manari_esic_mail_runtime('bad-token');raise exception 'FAIL: worker without token';exception when insufficient_privilege then null;end;
end $test$;

rollback;
