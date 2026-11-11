begin;
create temporary table survey_before as select count(*) n from portal_private.satisfaction_votes;
grant select on survey_before to anon;
set local role anon;
select public.manari_portal_satisfaction(5,'portal','c68df2c3-74cd-47b8-b7cf-2259e45ad901');
select public.manari_portal_satisfaction(3,'portal','c68df2c3-74cd-47b8-b7cf-2259e45ad901');
do $$begin
 begin perform * from portal_private.satisfaction_votes;raise exception 'Raw votes exposed';exception when insufficient_privilege then null;end;
 begin perform public.manari_portal_satisfaction(6,'portal',gen_random_uuid());raise exception 'Invalid score accepted';exception when invalid_parameter_value then null;end;
end;$$;
reset role;
do $$begin if (select count(*) from portal_private.satisfaction_votes)<>(select n+1 from survey_before) then raise exception 'Duplicate vote was not replaced';end if;end;$$;
rollback;
