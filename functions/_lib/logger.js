export async function writeSallyLog(env, data) {
  if (!env.SALLY_LOG_WEBHOOK_URL || !env.SALLY_LOG_SECRET) { console.error('Sally logging: missing Cloudflare configuration'); return false; }
  const payload = {...data, timestamp:new Date().toISOString(), secret:env.SALLY_LOG_SECRET};
  try {
    const res = await fetch(env.SALLY_LOG_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(5000)});
    const body=(await res.text()).trim();
    const status=body==='OK'?'OK':body==='Unauthorized'?'Unauthorized':body==='Sheet missing'?'Sheet missing':body.startsWith('ERROR:')||body==='Error'?'Apps Script error':'Unexpected response';
    console.log('Sally logging result:', status, 'HTTP:', res.status);
    return res.ok && status==='OK';
  } catch (err) {console.error('Sally logging request failed:',err?.name||'Network error');return false;}
}
