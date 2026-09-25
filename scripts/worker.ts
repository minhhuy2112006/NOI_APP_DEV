import {runMaintenance} from '../src/lib/maintenance';
if(process.env.NOI_MODE!=='demo')throw Error('Worker này chỉ dùng local. Supabase dùng pg_cron theo README.');
function tick(){try{const result=runMaintenance();if(result.reminders||result.transitions)console.log(new Date().toISOString(),result);}catch(error){console.error('NOI maintenance failed',error);}}
tick();const timer=setInterval(tick,60000);
for(const event of ['SIGINT','SIGTERM'] as const)process.on(event,()=>{clearInterval(timer);process.exit(0);});
