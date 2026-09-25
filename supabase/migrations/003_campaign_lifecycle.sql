-- Extend the initial RPC without allowing direct access to its internal implementation.
alter function public.noi_action(text,jsonb) rename to noi_action_v1;
revoke all on function public.noi_action_v1(text,jsonb) from public,anon,authenticated;
create function public.noi_action(action_name text,payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare me profiles%rowtype; c campaigns%rowtype; o organizations%rowtype; output jsonb; new_start timestamptz; new_end timestamptz; why text;
begin
 if auth.uid() is null then raise exception 'Vui lòng đăng nhập.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>100000 then raise exception 'Dữ liệu không hợp lệ.'; end if;
 perform pg_advisory_xact_lock(7472026);
 select * into me from profiles where id=auth.uid();if me.id is null then raise exception 'Không có hồ sơ người dùng.'; end if;
 if action_name='content' and payload->>'slug' in ('auth','co-hoi-tinh-nguyen') then raise exception 'Đường dẫn dành cho chức năng hệ thống.'; end if;
 if action_name='campaign-schedule' then
  select * into c from campaigns where id=(payload->>'id')::uuid;
  if c.id is null or not noi_owns_campaign(c.id) or c.status<>'published' or now()>=c.starts_at then raise exception 'Chỉ đổi lịch chiến dịch chưa bắt đầu của tổ chức.'; end if;
  if exists(select 1 from attendance where campaign_id=c.id) then raise exception 'Chiến dịch đã có điểm danh, cần xử lý riêng.'; end if;
  new_start:=(payload->>'starts_at')::timestamptz;new_end:=(payload->>'ends_at')::timestamptz;why:=trim(payload->>'reason');
  if new_start is null or new_end is null or new_start<=now() or new_end<=new_start or coalesce(length(why),0) not between 5 and 2000 then raise exception 'Lịch mới và lý do thay đổi không hợp lệ.'; end if;
  update campaigns set starts_at=new_start,ends_at=new_end,address=payload->>'address',latitude=(payload->>'latitude')::float8,longitude=(payload->>'longitude')::float8,instructions=payload->>'instructions' where id=c.id returning to_jsonb(campaigns.*) into output;
  update applications set status='selected' where campaign_id=c.id and status='confirmed';
  insert into notifications(user_id,title,body,href)
   select user_id,'Chiến dịch thay đổi lịch',c.title||': '||why||'. Vui lòng xem lịch mới và xác nhận lại nếu đã được lựa chọn.','/ca-nhan/dang-ky'
   from applications where campaign_id=c.id and status in ('submitted','selected','waitlisted');
  insert into audit(user_id,action,target,before,after,reason) values(me.id,action_name,c.id::text,to_jsonb(c),output,why);
  return output;
 elsif action_name='organization' and me.organization_id is not null then
  select * into o from organizations where id=me.organization_id;
  if me.role<>'organizer' or o.status not in ('changes','rejected') then raise exception 'Hồ sơ tổ chức hiện tại không thể gửi lại.'; end if;
  if coalesce(payload->>'evidence','') not like 'https://%' then raise exception 'Cần liên kết minh chứng HTTPS.'; end if;
  update organizations set name=trim(payload->>'name'),description=payload->>'description',contact=payload->>'contact',evidence=payload->>'evidence',status='pending',scope='Đang kiểm tra hồ sơ bổ sung' where id=o.id returning to_jsonb(organizations.*) into output;
  insert into audit(user_id,action,target,before,after,reason) values(me.id,action_name,o.id::text,to_jsonb(o),output,'Gửi lại hồ sơ');
  return output;
 end if;
 return public.noi_action_v1(action_name,payload);
end $$;
revoke all on function public.noi_action(text,jsonb) from public;
grant execute on function public.noi_action(text,jsonb) to authenticated;

alter table public.notifications add column delivery_key text unique;
create function public.noi_run_maintenance() returns jsonb language plpgsql security definer set search_path=public as $$
declare reminders integer; transitions integer; begin
 perform pg_advisory_xact_lock(7472026);
 update campaigns set status=case when now()>ends_at+interval '2 hours' then 'closed' else 'active' end
 where status in ('published','active') and now()>=starts_at and status<>case when now()>ends_at+interval '2 hours' then 'closed' else 'active' end;
 get diagnostics transitions=row_count;
 insert into notifications(user_id,title,body,href,delivery_key)
 select a.user_id,'Chiến dịch sắp bắt đầu',c.title||' bắt đầu lúc '||to_char(c.starts_at at time zone 'Asia/Ho_Chi_Minh','HH24:MI DD/MM/YYYY')||'. Hãy xem lại hướng dẫn trước khi đến.','/chien-dich/'||c.slug,'reminder:'||a.id||':'||c.starts_at
 from applications a join campaigns c on c.id=a.campaign_id
 where a.status='confirmed' and c.status='published' and c.starts_at>now() and c.starts_at<=now()+interval '24 hours'
 on conflict(delivery_key) do nothing;
 get diagnostics reminders=row_count;
 return jsonb_build_object('reminders',reminders,'transitions',transitions);
end $$;
-- Only the DB owner / scheduler can run this function, not a browser client.
revoke all on function public.noi_run_maintenance() from public,anon,authenticated;
