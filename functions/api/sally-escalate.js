import {writeSallyLog} from '../_lib/logger.js';
export async function onRequestPost({request,env}){
 let d;try{d=await request.json()}catch{return Response.json({error:'Invalid request'},{status:400})}
 const email=String(d.email||'').trim(),confirmation=String(d.confirmEmail||'').trim(),summary=String(d.summary||'').trim();
 if(d.consent!==true||!email.includes('@')||email!==confirmation||summary.length<10||summary.length>1500)return Response.json({error:'A summary, matching email addresses and explicit consent are required.'},{status:400});
 const ok=await writeSallyLog(env,{conversationId:String(d.conversationId||''),category:'Escalated issue',summary,escalated:'Yes',email,responded:'No',consentTimestamp:new Date().toISOString()});
 return ok?Response.json({ok:true}):Response.json({error:'Unable to submit. Please email Sally@rowpulser.com.'},{status:503});
}
