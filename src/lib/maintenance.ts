import {all,put,remove,transaction} from './demo-db';
import type {Campaign} from './domain';
// Idempotent, also safe when the worker and a web request run at the same time.
export function runMaintenance(at=Date.now()){
 return transaction(()=>{
  let reminders=0,transitions=0;
  for(const c of all<Campaign>('campaigns')){
   if(!['published','active'].includes(c.status))continue;
   const start=Date.parse(c.starts_at),end=Date.parse(c.ends_at);
   const status=at>end+7200000?'closed':at>=start?'active':c.status;
   if(status!==c.status){put('campaigns',{...c,status});transitions++;}
   if(start<=at||start>at+86400000)continue;
   for(const a of all('applications').filter(a=>a.campaign_id===c.id&&a.status==='confirmed')){
    const key=`reminder:${a.id}:${c.starts_at}`;
    if(all('notifications').some(n=>n.id===key))continue;
    put('notifications',{id:key,user_id:a.user_id,title:'Chiến dịch sắp bắt đầu',body:c.title+' bắt đầu lúc '+new Date(c.starts_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})+'. Hãy xem lại hướng dẫn trước khi đến.',href:'/chien-dich/'+c.slug,read:false,created_at:new Date(at).toISOString()});reminders++;
   }
  }
  for(const session of all('sessions'))if(Date.parse(session.expires_at)<at||session.version!==2)remove('sessions',session.id);
  return {reminders,transitions};
 });
}
