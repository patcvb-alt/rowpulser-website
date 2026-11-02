export async function writeSallyLog(env, data) {
  if (!env.SALLY_LOG_WEBHOOK_URL || !env.SALLY_LOG_SECRET) { console.error('Sally logging: missing Cloudflare configuration'); return false; }
  const payload = {...data, timestamp:new Date().toISOString(), secret:env.SALLY_LOG_SECRET};
  try {
    const res = await fetch(env.SALLY_LOG_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(5000)});
    const body=(await res.text()).trim();
    const status=body==='OK'?'OK':body==='Unauthorized'?'Unauthorized':body==='Sheet missing'?'Sheet missing':body.startsWith('ERROR:')||body==='Error'?'Apps Script error':'Unexpected response';
    console.log('Sally logging result:', status, 'HTTP:', res.status);
    if (status==='Apps Script error' && body.startsWith('ERROR:')) {
      // Temporary diagnostic: avoid logging request payload, tokens or webhook URL.
      const detail=body.slice(6,300).replace(/https?:\/\/\S+/g,'[URL]').replace(/[A-Za-z0-9_-]{32,}/g,'[REDACTED]');
      console.error('Sally Apps Script error detail:',detail);
    }
    return res.ok && status==='OK';
  } catch (err) {console.error('Sally logging request failed:',err?.name||'Network error');return false;}
}
