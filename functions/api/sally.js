import { KNOWLEDGE } from '../_lib/knowledge.js';
const allowedOrigin = 'https://rowpulser.com';
const MAX_CHARS = 12000;
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  if (origin && ![allowedOrigin,'https://www.rowpulser.com'].includes(origin) && !origin.endsWith('.pages.dev')) return new Response('Forbidden',{status:403});
  if (!env.OPENAI_API_KEY) return Response.json({error:'Sally is not connected yet. Please try again later.'},{status:503});
  let body; try {body=await request.json()} catch {return Response.json({error:'Invalid request'},{status:400})}
  const messages=Array.isArray(body.messages)?body.messages:[];
  if (!messages.length || messages.length>12 || messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>MAX_CHARS)) return Response.json({error:'Message limit exceeded'},{status:400});
  // Per-request caps; configure Cloudflare rate limiting / Turnstile before public launch.
  const input=messages.slice(-10).map(m=>({role:m.role,content:m.content}));
  const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.SALLY_MODEL||'gpt-4.1-mini',temperature:0.3,max_tokens:450,messages:[{role:'system',content:'You are Sally Ripley, the RowPulser website assistant. Answer using the facts below; when uncertain, say so. Do not claim that an escalation was sent: this version has no escalation submission service. If the user wants a formal report, direct them to Sally@rowpulser.com and ask them not to include unnecessary personal data. The chat may be processed by the AI provider.\n'+KNOWLEDGE},...input]})});
  if(!resp.ok)return Response.json({error:'Sally is temporarily unavailable.'},{status:502});
  const data=await resp.json();return Response.json({reply:data.choices?.[0]?.message?.content||'Sorry, I could not generate a reply.',usage:data.usage||null},{headers:{'Cache-Control':'no-store'}});
}