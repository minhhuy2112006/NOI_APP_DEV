-- NOI initial schema. Apply once to a new Supabase project.
-- Money is integer VND. Points are an append-only ledger, not a cash balance.
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 3 and 150),
 slug text unique not null, description text not null, contact text not null, evidence text,
 status text not null default 'pending' check(status in ('pending','verified','changes','rejected')),
 scope text not null default 'Chưa được xác minh', created_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, name text not null check(length(name) between 2 and 100),
 email text not null, phone text not null default '' check(length(phone)<=20), interests text not null default '' check(length(interests)<=300),
 role text not null default 'volunteer' check(role in ('volunteer','organizer','admin')),
 organization_id uuid references public.organizations(id), created_at timestamptz not null default now()
);
create table public.campaigns (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 slug text unique not null, title text not null check(length(title) between 10 and 150), summary text not null check(length(summary) between 20 and 300),
 description text not null check(length(description) between 30 and 10000), category text not null check(category in ('Giáo dục','Cộng đồng','Môi trường','Sức khỏe')),
 location text not null, address text not null, starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at),
 capacity integer not null check(capacity between 1 and 10000), goal bigint not null default 0 check(goal between 0 and 1000000000),
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 radius integer not null default 500 check(radius=500), instructions text not null,
 image text not null default '/images/community.webp',
 status text not null default 'draft' check(status in ('draft','pending','published','active','closed','changes','rejected')),
 created_at timestamptz not null default now()
);
create table public.applications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), campaign_id uuid not null references public.campaigns(id),
 motivation text not null check(length(motivation) between 10 and 1500),
 status text not null default 'submitted' check(status in ('submitted','selected','waitlisted','rejected','confirmed','cancelled','completed')),
 created_at timestamptz not null default now(), unique(user_id,campaign_id)
);
create table public.attendance (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), campaign_id uuid not null references public.campaigns(id),
 kind text not null check(kind in ('in','out')), latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180), accuracy double precision not null check(accuracy between 0 and 100),
 photo_path text not null, created_at timestamptz not null default now(), unique(user_id,campaign_id,kind)
);
create table public.results (
 id uuid primary key default gen_random_uuid(), application_id uuid unique not null references public.applications(id),
 user_id uuid not null references public.profiles(id), campaign_id uuid not null references public.campaigns(id),
 hours numeric not null check(hours between .25 and 24), reason text not null check(length(reason) between 5 and 2000), created_at timestamptz not null default now()
);
create table public.points (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), amount integer not null,
 source text unique not null, note text not null, created_at timestamptz not null default now()
);
create table public.gifts (
 id uuid primary key default gen_random_uuid(), name text not null, description text not null default '', cost integer not null check(cost>0),
 stock integer not null check(stock>=0), image text not null default 'plant'
);
create table public.redemptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), gift_id uuid not null references public.gifts(id),
 gift_name text not null, cost integer not null check(cost>0), status text not null default 'pending' check(status in ('pending','fulfilled','cancelled')),
 created_at timestamptz not null default now()
);
create table public.donations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), campaign_id uuid references public.campaigns(id),
 purpose text not null check(purpose in ('campaign','operations','emergency')), amount bigint not null check(amount between 1000 and 1000000000),
 status text not null default 'pending' check(status in ('pending','success','failed')), reference text unique not null,
 is_demo boolean not null default false, provider_reference text unique, created_at timestamptz not null default now(),
 check((purpose='campaign' and campaign_id is not null) or (purpose<>'campaign' and campaign_id is null))
);
create table public.expenses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), campaign_id uuid not null references public.campaigns(id),
 title text not null, amount bigint not null check(amount between 1000 and 1000000000), evidence text not null check(evidence like 'https://%'),
 status text not null default 'pending' check(status in ('pending','published','rejected')), created_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id), title text not null,
 body text not null check(length(body) between 30 and 15000), beneficiaries integer not null check(beneficiaries between 0 and 1000000),
 status text not null default 'pending' check(status in ('pending','published','rejected')), created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), title text not null, body text not null,
 href text not null default '/ca-nhan', read boolean not null default false, created_at timestamptz not null default now()
);
create table public.tickets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), campaign_id uuid references public.campaigns(id),
 title text not null check(length(title) between 5 and 150), body text not null check(length(body) between 10 and 4000),
 status text not null default 'open' check(status in ('open','resolved')), reply text not null default '', created_at timestamptz not null default now()
);
create table public.audit (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), action text not null, target text not null,
 before jsonb, after jsonb, reason text not null default '', created_at timestamptz not null default now()
);
create table public.content (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9-]{1,100}$'), title text not null,
 body text not null check(length(body) between 20 and 15000), status text not null default 'draft' check(status in ('draft','published','rejected')),
 created_at timestamptz not null default now()
);
create table public.leads (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), company text not null check(length(company) between 2 and 200),
 email text not null, message text not null check(length(message) between 10 and 2000), type text not null check(type in ('business','priority','advertising')),
 status text not null default 'pending', created_at timestamptz not null default now()
);
create index campaign_org_idx on public.campaigns(organization_id,status);
create index application_campaign_idx on public.applications(campaign_id,status);
create index donation_campaign_idx on public.donations(campaign_id,status);
create index point_user_idx on public.points(user_id);
create index notification_user_idx on public.notifications(user_id,created_at desc);
create index attendance_campaign_idx on public.attendance(campaign_id);

-- Auth metadata never sets role or organization. Admin is provisioned by a project owner.
create function public.noi_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,name,email) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Thành viên NOI'),100),coalesce(new.email,''));
 return new;
end $$;
create trigger noi_user_created after insert on auth.users for each row execute function public.noi_new_user();

create function public.noi_is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create function public.noi_owns_campaign(cid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles p join public.campaigns c on c.organization_id=p.organization_id where p.id=auth.uid() and p.role='organizer' and c.id=cid);
$$;
create function public.noi_public_campaign(cid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.campaigns where id=cid and status in ('published','active','closed'));
$$;

-- Browser clients cannot write tables, even if they bypass Next.js. All mutations use RPC.
do $$ declare t text; begin
 foreach t in array array['profiles','organizations','campaigns','applications','attendance','results','points','gifts','redemptions','donations','expenses','reports','notifications','tickets','audit','content','leads'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
grant select on public.profiles, public.attendance to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy attendance_photo_read on public.attendance for select to authenticated using(user_id=auth.uid() or public.noi_owns_campaign(campaign_id));

create function public.noi_snapshot() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare u uuid:=auth.uid(); adm boolean:=public.noi_is_admin(); result jsonb; begin
select jsonb_build_object(
 'campaigns',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object(
  'organization',o.name,'confirmed',(select count(*) from applications a where a.campaign_id=c.id and a.status in ('confirmed','completed')),
  'applied',(select count(*) from applications a where a.campaign_id=c.id and a.status<>'cancelled'),
  'received',(select coalesce(sum(amount),0) from donations d where d.campaign_id=c.id and d.status='success'),
  'spent',(select coalesce(sum(amount),0) from expenses e where e.campaign_id=c.id and e.status='published')) order by c.created_at desc)
  from campaigns c join organizations o on o.id=c.organization_id where c.status in ('published','active','closed') or adm or noi_owns_campaign(c.id)),'[]'),
 'organizations',coalesce((select jsonb_agg(case when adm or o.id=(select organization_id from profiles where id=u) then to_jsonb(o) else to_jsonb(o)-'evidence'-'contact' end) from organizations o where o.status='verified' or adm or o.id=(select organization_id from profiles where id=u)),'[]'),
 'applications',coalesce((select jsonb_agg(to_jsonb(a)||jsonb_build_object('user_name',p.name,'campaign_title',c.title)) from applications a join profiles p on p.id=a.user_id join campaigns c on c.id=a.campaign_id where a.user_id=u or adm or noi_owns_campaign(a.campaign_id)),'[]'),
 'attendance',coalesce((select jsonb_agg(to_jsonb(a)-'photo_path') from attendance a where a.user_id=u or adm or noi_owns_campaign(a.campaign_id)),'[]'),
 'results',coalesce((select jsonb_agg(to_jsonb(r)) from results r where r.user_id=u or adm or noi_owns_campaign(r.campaign_id)),'[]'),
 'donations',coalesce((select jsonb_agg(to_jsonb(d)) from donations d where d.user_id=u or adm or noi_owns_campaign(d.campaign_id)),'[]'),
 'expenses',coalesce((select jsonb_agg(to_jsonb(e)) from expenses e where e.status='published' and noi_public_campaign(e.campaign_id) or adm or noi_owns_campaign(e.campaign_id)),'[]'),
 'reports',coalesce((select jsonb_agg(to_jsonb(r)) from reports r where r.status='published' and noi_public_campaign(r.campaign_id) or adm or noi_owns_campaign(r.campaign_id)),'[]'),
 'points',coalesce((select jsonb_agg(to_jsonb(p)) from points p where p.user_id=u),'[]'),
 'gifts',coalesce((select jsonb_agg(to_jsonb(g)) from gifts g where g.stock>0 or adm),'[]'),
 'redemptions',coalesce((select jsonb_agg(to_jsonb(r)) from redemptions r where r.user_id=u or adm),'[]'),
 'notifications',coalesce((select jsonb_agg(to_jsonb(n) order by created_at desc) from notifications n where n.user_id=u),'[]'),
 'tickets',coalesce((select jsonb_agg(to_jsonb(t)) from tickets t where t.user_id=u or adm or noi_owns_campaign(t.campaign_id)),'[]'),
 'audit',coalesce((select jsonb_agg(to_jsonb(a)) from (select * from audit where adm order by created_at desc limit 100) a),'[]'),
 'content',coalesce((select jsonb_agg(to_jsonb(c)) from content c where c.status='published' or adm),'[]'),
 'leads',coalesce((select jsonb_agg(to_jsonb(l)) from leads l where adm),'[]')) into result;
return result;
end $$;

-- Serializes mutations for initial pilot correctness (capacity, ledger, stock).
-- Replace with per-resource row locking when measured concurrency warrants it.
create function public.noi_action(action_name text,payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 me profiles%rowtype; c campaigns%rowtype; a applications%rowtype; g gifts%rowtype; r redemptions%rowtype; o organizations%rowtype;
 ident uuid:=gen_random_uuid(); target_id uuid; cid uuid; desired text:=payload->>'status'; why text:=coalesce(payload->>'reason','');
 output jsonb; old_row jsonb; tbl text; available bigint; hours_value numeric; distance_value double precision; photo text;
begin
 if auth.uid() is null then raise exception 'Vui lòng đăng nhập.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>100000 then raise exception 'Dữ liệu không hợp lệ.'; end if;
 perform pg_advisory_xact_lock(7472026);
 select * into me from profiles where id=auth.uid(); if me.id is null then raise exception 'Không có hồ sơ người dùng.'; end if;
 target_id:=nullif(payload->>'id','')::uuid; cid:=nullif(payload->>'campaign_id','')::uuid;
 if action_name in ('campaign-review','organization-review','publish','content','ticket-resolve') and action_name<>'ticket-resolve' and me.role<>'admin' then raise exception 'Bạn không có quyền quản trị.'; end if;
 if action_name in ('campaign-review','organization-review','publish','complete') and length(trim(why)) not between 5 and 2000 then raise exception 'Cần lý do hoặc căn cứ xử lý.'; end if;
 if cid is not null then select * into c from campaigns where id=cid; if c.id is null then raise exception 'Không tìm thấy chiến dịch.'; end if; end if;

 if action_name='apply' then
  if c.id is null or c.status not in ('published','active') or now()>c.starts_at then raise exception 'Chiến dịch đã đóng đăng ký.'; end if;
  insert into applications(user_id,campaign_id,motivation) values(me.id,c.id,trim(payload->>'motivation')) returning to_jsonb(applications.*) into output;
  insert into notifications(user_id,title,body,href) select id,'Có đăng ký mới',me.name||' đăng ký '||c.title,'/to-chuc/quan-ly/ung-vien' from profiles where organization_id=c.organization_id;
 elsif action_name='application' then
  select * into a from applications where id=target_id; if a.id is null then raise exception 'Không tìm thấy đăng ký.'; end if;
  select * into c from campaigns where id=a.campaign_id; old_row:=to_jsonb(a);
  if desired in ('confirmed','cancelled') then
   if a.user_id<>me.id then raise exception 'Không được sửa đăng ký của người khác.'; end if;
   if desired='confirmed' then
    if a.status<>'selected' or c.status not in ('published','active') or now()>c.ends_at then raise exception 'Không thể xác nhận tham gia.'; end if;
    if (select count(*) from applications where campaign_id=c.id and status in ('confirmed','completed'))>=c.capacity then raise exception 'Chiến dịch đã đủ người xác nhận.'; end if;
   elsif a.status not in ('submitted','selected','waitlisted','confirmed') then raise exception 'Không thể hủy đăng ký.'; end if;
  elsif not noi_owns_campaign(c.id) or desired not in ('selected','waitlisted','rejected') or a.status not in ('submitted','waitlisted') then raise exception 'Chuyển trạng thái không hợp lệ.'; end if;
  if desired is null then raise exception 'Thiếu trạng thái.'; end if;
  update applications set status=desired where id=a.id returning to_jsonb(applications.*) into output;
  insert into notifications(user_id,title,body,href) values(a.user_id,'Cập nhật đăng ký',c.title||': hồ sơ đã được cập nhật.','/ca-nhan/dang-ky');
 elsif action_name='campaign' then
  if me.role<>'organizer' or me.organization_id is null or desired is null or desired not in ('draft','pending') then raise exception 'Không được tạo chiến dịch.'; end if;
  if desired='pending' and not exists(select 1 from organizations where id=me.organization_id and status='verified') then raise exception 'Tổ chức cần được xác minh.'; end if;
  if target_id is not null then
   select * into c from campaigns where id=target_id;
   if c.id is null or not noi_owns_campaign(c.id) or c.status not in ('draft','changes') then raise exception 'Không được sửa chiến dịch này.'; end if;
   old_row:=to_jsonb(c); ident:=c.id;
  end if;
  insert into campaigns(id,organization_id,slug,title,summary,description,category,location,address,starts_at,ends_at,capacity,goal,latitude,longitude,instructions,status)
  values(ident,me.organization_id,coalesce(c.slug,'chien-dich-'||ident::text),trim(payload->>'title'),trim(payload->>'summary'),trim(payload->>'description'),payload->>'category',payload->>'location',payload->>'address',(payload->>'starts_at')::timestamptz,(payload->>'ends_at')::timestamptz,(payload->>'capacity')::integer,(payload->>'goal')::bigint,(payload->>'latitude')::float8,(payload->>'longitude')::float8,payload->>'instructions',desired)
  on conflict(id) do update set title=excluded.title,summary=excluded.summary,description=excluded.description,category=excluded.category,location=excluded.location,address=excluded.address,starts_at=excluded.starts_at,ends_at=excluded.ends_at,capacity=excluded.capacity,goal=excluded.goal,latitude=excluded.latitude,longitude=excluded.longitude,instructions=excluded.instructions,status=excluded.status
  returning to_jsonb(campaigns.*) into output;
 elsif action_name='campaign-review' then
  select * into c from campaigns where id=target_id;
  if c.id is null or c.status<>'pending' or desired is null or desired not in ('published','changes','rejected') then raise exception 'Không thể duyệt chiến dịch.'; end if;
  if desired='published' and not exists(select 1 from organizations where id=c.organization_id and status='verified') then raise exception 'Tổ chức chưa được xác minh.'; end if;
  old_row:=to_jsonb(c); update campaigns set status=desired where id=c.id returning to_jsonb(campaigns.*) into output;
 elsif action_name='organization' then
  if me.organization_id is not null or me.role='admin' then raise exception 'Tài khoản không thể tạo thêm tổ chức.'; end if;
  if coalesce(payload->>'evidence','') not like 'https://%' then raise exception 'Cần liên kết minh chứng HTTPS.'; end if;
  insert into organizations(id,name,slug,description,contact,evidence) values(ident,trim(payload->>'name'),'to-chuc-'||ident::text,payload->>'description',payload->>'contact',payload->>'evidence') returning to_jsonb(organizations.*) into output;
  update profiles set role='organizer',organization_id=ident where id=me.id;
 elsif action_name='organization-review' then
  select * into o from organizations where id=target_id;
  if o.id is null or o.status not in ('pending','changes') or desired is null or desired not in ('verified','changes','rejected') then raise exception 'Không thể duyệt tổ chức.'; end if;
  old_row:=to_jsonb(o); update organizations set status=desired,scope=why where id=o.id returning to_jsonb(organizations.*) into output;
 elsif action_name='attendance' then
  if c.id is null or c.status not in ('published','active') or not exists(select 1 from applications where user_id=me.id and campaign_id=c.id and status='confirmed') then raise exception 'Chưa xác nhận tham gia chiến dịch.'; end if;
  if now()<c.starts_at-interval '1 hour' or now()>c.ends_at+interval '2 hours' then raise exception 'Ngoài khung giờ điểm danh.'; end if;
  distance_value:=6371000*2*asin(sqrt(least(1,power(sin(radians((payload->>'latitude')::float8-c.latitude)/2),2)+cos(radians(c.latitude))*cos(radians((payload->>'latitude')::float8))*power(sin(radians((payload->>'longitude')::float8-c.longitude)/2),2))));
  if distance_value>c.radius then raise exception 'Ngoài phạm vi điểm danh 500 m.'; end if;
  if payload->>'kind'='out' and not exists(select 1 from attendance where campaign_id=c.id and user_id=me.id and kind='in') then raise exception 'Cần check-in trước check-out.'; end if;
  photo:=payload->>'photo_path';
  if photo is null or split_part(photo,'/',1)<>me.id::text or not exists(select 1 from storage.objects where bucket_id='attendance-private' and name=photo) then raise exception 'Không có ảnh điểm danh hợp lệ.'; end if;
  insert into attendance(user_id,campaign_id,kind,latitude,longitude,accuracy,photo_path) values(me.id,c.id,payload->>'kind',(payload->>'latitude')::float8,(payload->>'longitude')::float8,(payload->>'accuracy')::float8,photo) returning to_jsonb(attendance.*)-'photo_path' into output;
 elsif action_name='complete' then
  select * into a from applications where id=target_id; select * into c from campaigns where id=a.campaign_id;
  if a.id is null or a.status<>'confirmed' or not noi_owns_campaign(c.id) then raise exception 'Không thể xác nhận đóng góp.'; end if;
  hours_value:=(payload->>'hours')::numeric;
  if now()<c.starts_at or hours_value>extract(epoch from(c.ends_at-c.starts_at))/3600 then raise exception 'Thời lượng hoặc thời điểm chưa hợp lệ.'; end if;
  insert into results(id,application_id,user_id,campaign_id,hours,reason) values(ident,a.id,a.user_id,c.id,hours_value,why) returning to_jsonb(results.*) into output;
  update applications set status='completed' where id=a.id;
  insert into points(user_id,amount,source,note) values(a.user_id,floor(hours_value*10)::integer,'result:'||ident,'Đóng góp tại '||c.title);
  insert into notifications(user_id,title,body,href) values(a.user_id,'Đóng góp được ghi nhận',c.title||' · '||hours_value||' giờ.','/ca-nhan/diem-phuoc');
 elsif action_name in ('donate','donation-confirm') then
  -- Provider adapter, verified webhooks and bank reconciliation are intentionally required first.
  raise exception 'Thanh toán thật chưa được kết nối. Hãy dùng môi trường thử nghiệm.';
 elsif action_name='expense' then
  if not noi_owns_campaign(c.id) then raise exception 'Không có quyền quản lý chiến dịch.'; end if;
  select (select coalesce(sum(amount),0) from donations where campaign_id=c.id and status='success')-(select coalesce(sum(amount),0) from expenses where campaign_id=c.id and status in ('pending','published')) into available;
  if (payload->>'amount')::bigint>available then raise exception 'Khoản chi vượt số tiền còn lại.'; end if;
  insert into expenses(user_id,campaign_id,title,amount,evidence) values(me.id,c.id,payload->>'title',(payload->>'amount')::bigint,payload->>'evidence') returning to_jsonb(expenses.*) into output;
 elsif action_name='report' then
  if not noi_owns_campaign(c.id) then raise exception 'Không có quyền quản lý chiến dịch.'; end if;
  insert into reports(campaign_id,title,body,beneficiaries) values(c.id,payload->>'title',payload->>'body',(payload->>'beneficiaries')::integer) returning to_jsonb(reports.*) into output;
 elsif action_name='publish' then
  tbl:=payload->>'table'; if tbl is null or tbl not in ('reports','expenses','content') or desired is null or desired not in ('published','rejected') then raise exception 'Nội dung không hợp lệ.'; end if;
  execute format('select to_jsonb(t) from %I t where id=$1 and status in (''pending'',''draft'')',tbl) into old_row using target_id;
  if old_row is null then raise exception 'Nội dung không ở trạng thái chờ duyệt.'; end if;
  execute format('update %I set status=$1 where id=$2 returning to_jsonb(%I.*)',tbl,tbl) into output using desired,target_id;
 elsif action_name='redeem' then
  select * into g from gifts where id=target_id;
  select coalesce(sum(amount),0) into available from points where user_id=me.id;
  if g.id is null or g.stock<1 or available<g.cost then raise exception 'Quà đã hết hoặc bạn chưa đủ điểm Phước.'; end if;
  insert into redemptions(id,user_id,gift_id,gift_name,cost) values(ident,me.id,g.id,g.name,g.cost) returning to_jsonb(redemptions.*) into output;
  update gifts set stock=stock-1 where id=g.id;
  insert into points(user_id,amount,source,note) values(me.id,-g.cost,'redeem:'||ident,'Đổi '||g.name);
 elsif action_name='redemption' then
  select * into r from redemptions where id=target_id;
  if r.id is null or r.status<>'pending' or desired is null or desired not in ('fulfilled','cancelled') then raise exception 'Yêu cầu đã xử lý hoặc không hợp lệ.'; end if;
  if desired='fulfilled' and me.role<>'admin' or desired='cancelled' and me.role<>'admin' and r.user_id<>me.id then raise exception 'Không có quyền xử lý.'; end if;
  old_row:=to_jsonb(r); update redemptions set status=desired where id=r.id returning to_jsonb(redemptions.*) into output;
  if desired='cancelled' then
   update gifts set stock=stock+1 where id=r.gift_id;
   insert into points(user_id,amount,source,note) values(r.user_id,r.cost,'refund:'||r.id,'Hoàn điểm yêu cầu đổi quà');
  end if;
 elsif action_name='ticket' then
  if cid is not null and not exists(select 1 from applications where user_id=me.id and campaign_id=cid) then raise exception 'Bạn chưa đăng ký chiến dịch.'; end if;
  insert into tickets(user_id,campaign_id,title,body) values(me.id,cid,trim(payload->>'title'),trim(payload->>'body')) returning to_jsonb(tickets.*) into output;
 elsif action_name='ticket-resolve' then
  select to_jsonb(t) into old_row from tickets t where id=target_id;
  if old_row is null or me.role<>'admin' and not noi_owns_campaign((old_row->>'campaign_id')::uuid) then raise exception 'Không có quyền xử lý.'; end if;
  if coalesce(length(trim(payload->>'reply')),0) not between 5 and 2000 then raise exception 'Cần nội dung phản hồi.'; end if;
  update tickets set status='resolved',reply=payload->>'reply' where id=target_id returning to_jsonb(tickets.*) into output;
  insert into notifications(user_id,title,body,href) values((output->>'user_id')::uuid,'Phản ánh đã có phản hồi',payload->>'reply','/ca-nhan/ho-tro');
 elsif action_name='profile' then
  update profiles set name=trim(payload->>'name'),phone=coalesce(payload->>'phone',''),interests=coalesce(payload->>'interests','') where id=me.id returning to_jsonb(profiles.*) into output;
 elsif action_name='notification' then
  update notifications set read=true where id=target_id and user_id=me.id returning to_jsonb(notifications.*) into output;
  if output is null then raise exception 'Không có quyền truy cập.'; end if;
 elsif action_name='content' then
  if payload->>'slug' in ('chien-dich','to-chuc','ca-nhan','quan-tri','dang-nhap','api','minh-bach','diem-phuoc','bao-cao-tac-dong','noi-for-business','thung-dong-hanh','ho-tro-khan-cap','tro-giup','lien-he','chinh-sach','doi-tac') then raise exception 'Đường dẫn dành cho chức năng hệ thống.'; end if;
  insert into content(id,slug,title,body) values(coalesce(target_id,ident),payload->>'slug',payload->>'title',payload->>'body') on conflict(id) do update set slug=excluded.slug,title=excluded.title,body=excluded.body,status='draft' returning to_jsonb(content.*) into output;
 elsif action_name='lead' then
  insert into leads(user_id,company,email,message,type) values(me.id,payload->>'company',payload->>'email',payload->>'message',payload->>'type') returning to_jsonb(leads.*) into output;
 else raise exception 'Thao tác không được hỗ trợ.';
 end if;
 if action_name not in ('notification','profile','ticket','lead','apply') then
  insert into audit(user_id,action,target,before,after,reason) values(me.id,action_name,coalesce(output->>'id',ident::text),old_row,case when action_name='attendance' then jsonb_build_object('campaign_id',cid,'kind',payload->>'kind') else output end,why);
 end if;
 return output;
end $$;

revoke all on function public.noi_new_user() from public;
revoke all on function public.noi_is_admin(), public.noi_owns_campaign(uuid), public.noi_public_campaign(uuid), public.noi_snapshot(), public.noi_action(text,jsonb) from public;
grant execute on function public.noi_is_admin(), public.noi_owns_campaign(uuid), public.noi_public_campaign(uuid) to authenticated;
grant execute on function public.noi_snapshot() to anon,authenticated;
grant execute on function public.noi_action(text,jsonb) to authenticated;
