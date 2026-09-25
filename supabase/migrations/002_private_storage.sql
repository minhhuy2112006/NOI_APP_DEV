insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('attendance-private','attendance-private',false,4000000,array['image/jpeg'])
on conflict(id) do nothing;
create policy noi_photo_upload on storage.objects for insert to authenticated with check(
 bucket_id='attendance-private' and (storage.foldername(name))[1]=auth.uid()::text
);
create policy noi_photo_read on storage.objects for select to authenticated using(
 bucket_id='attendance-private' and (
 (storage.foldername(name))[1]=auth.uid()::text or exists(
 select 1 from public.attendance a where a.photo_path=name and public.noi_owns_campaign(a.campaign_id)))
);
-- Allow cleanup only for uploads that were never accepted as attendance evidence.
create policy noi_photo_cleanup on storage.objects for delete to authenticated using(
 bucket_id='attendance-private' and (storage.foldername(name))[1]=auth.uid()::text
 and not exists(select 1 from public.attendance a where a.photo_path=name)
);
