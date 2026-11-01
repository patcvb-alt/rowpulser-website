export async function writeSallyLog(env, data) {
  if (!env.SALLY_LOG_WEBHOOK_URL || !env.SALLY_LOG_SECRET) return false;
  const payload = {...data, timestamp:new Date().toISOString(), secret:env.SALLY_LOG_SECRET};
  try {
    const res = await fetch(env.SALLY_LOG_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'});
    return res.ok && (await res.text()).trim()==='OK';
  } catch {return false;}
}
