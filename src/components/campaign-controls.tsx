'use client';
import type {Campaign} from '@/lib/domain';
import {localDateTime} from '@/lib/domain';
import {ActionForm} from './ui';
export function CampaignSchedule({campaign:c}:{campaign:Campaign}){
 if(c.status!=='published'||Date.parse(c.starts_at)<=Date.now())return null;
 return <details className="schedule-editor"><summary className="text-link">Đổi lịch / địa điểm</summary><div className="notice">Người đã xác nhận sẽ được yêu cầu xác nhận lại. NOI gửi thông báo về lịch mới cho người đang đăng ký. Chỉ đổi trước khi chiến dịch bắt đầu và chưa có điểm danh.</div><ActionForm action="campaign-schedule" hidden={{id:c.id}} submit="Cập nhật và thông báo" fields={[
  {name:'starts_at',label:'Bắt đầu (giờ Việt Nam)',type:'datetime-local',value:localDateTime(c.starts_at)},
  {name:'ends_at',label:'Kết thúc (giờ Việt Nam)',type:'datetime-local',value:localDateTime(c.ends_at)},
  {name:'address',label:'Địa điểm tập trung',value:c.address},
  {name:'latitude',label:'Vĩ độ điểm danh',type:'number',value:c.latitude},
  {name:'longitude',label:'Kinh độ điểm danh',type:'number',value:c.longitude},
  {name:'instructions',label:'Hướng dẫn mới',type:'textarea',value:c.instructions},
  {name:'reason',label:'Lý do thay đổi',type:'textarea'},
 ]}/></details>;
}
