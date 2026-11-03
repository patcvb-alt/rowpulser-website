import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost as chat} from '../functions/api/sally.js';
import {onRequestPost as escalate} from '../functions/api/sally-escalate.js';
const env={OPENAI_API_KEY:'test-key-not-a-real-credential',SALLY_LOG_SECRET:'test-only',SALLY_LOG_WEBHOOK_URL:'https://example.test/log'};
function request(body,origin='https://rowpulser.com'){return new Request('https://rowpulser.com/api/sally',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});}

test('structured feature response reaches client and routine logs omit the visitor text',async()=>{
 const calls=[];const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return url===env.SALLY_LOG_WEBHOOK_URL ? new Response('OK') : Response.json({choices:[{message:{content:JSON.stringify({reply:'I can pass along your feature request.',escalation:{type:'feature',summary:'Request for an additional device integration.'}})}}],usage:{prompt_tokens:100,completion_tokens:40}});};
 try{const response=await chat({request:request({messages:[{role:'user',content:'Please add a new device!'}],conversationId:'abc'}),env});const data=await response.json();assert.equal(data.escalation.type,'feature');assert.equal(calls[0].body.response_format.type,'json_object');assert.equal(calls[1].body.escalated,'No');assert.ok(!JSON.stringify(calls[1].body).includes('Please add a new device'));}finally{globalThis.fetch=original;}
});

test('escalation rejects absent consent or mismatched email before writing',async()=>{
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Must not write');};
 try{for(const patch of [{consent:false},{confirmEmail:'other@example.com'}]){const response=await escalate({request:request({conversationId:'abc',summary:'A clear issue summary',email:'tester@example.com',confirmEmail:'tester@example.com',consent:true,...patch}),env});assert.equal(response.status,400);}}finally{globalThis.fetch=original;}
});

test('confirmed feature request writes expected follow-up fields',async()=>{
 const original=globalThis.fetch;let row;
 globalThis.fetch=async(url,options)=>{row=JSON.parse(options.body);return new Response('OK');};
 try{const response=await escalate({request:request({conversationId:'abc',summary:'Request for an additional device integration.',email:'tester@example.com',confirmEmail:'tester@example.com',consent:true,type:'feature'}),env});assert.equal(response.status,200);assert.equal(row.escalated,'Yes');assert.equal(row.responded,'No');assert.equal(row.category,'Feature request');assert.equal(row.conversationId,'abc');assert.ok(row.consentTimestamp);assert.equal(row.secret,env.SALLY_LOG_SECRET);}finally{globalThis.fetch=original;}
});

test('logger failure is reported instead of claiming escalation succeeded',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('Unauthorized');
 try{const response=await escalate({request:request({summary:'A clear issue summary',email:'tester@example.com',confirmEmail:'tester@example.com',consent:true}),env});assert.equal(response.status,503);assert.ok(!(await response.json()).ok);}finally{globalThis.fetch=original;}
});

test('foreign origins cannot submit escalation reports',async()=>{
 const response=await escalate({request:request({},'https://unrelated.example'),env});assert.equal(response.status,403);
});
