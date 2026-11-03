import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function chatHarness({escalation=null,failReport=false,resetPersonality=false}={}) {
  class Element {
    constructor(){this.handlers={};this.children=[];this.style={};this.value='';this.hidden=false;this.scrollHeight=48;this.attributes={};}
    addEventListener(type,fn){this.handlers[type]=fn;}
    setAttribute(k,v){this.attributes[k]=v;}
    removeAttribute(k){delete this.attributes[k];}
    append(child){this.children.push(child);}
    focus(){document.activeElement=this;}
    emit(type,event={}){return this.handlers[type]?.({preventDefault(){},...event});}
  }
  const elements=new Map();
  const document={body:new Element(),activeElement:null,getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();}};
  const requests=[];
  const sandbox={document,crypto:{randomUUID:()=> 'test-conversation'},fetch:async(url,options)=>{
    requests.push({url,body:JSON.parse(options.body)});
    if(url==='/api/sally-escalate')return {ok:!failReport,json:async()=>({ok:!failReport})};
    return {ok:true,json:async()=>({reply:'I can help with that.',escalation,resetPersonality})};
  },SyntaxError};
  vm.runInNewContext(fs.readFileSync(new URL('../assets/sally-chat.js',import.meta.url),'utf8'),sandbox);
  const el=id=>document.getElementById(id);
  el('sallyForm').requestSubmit=()=>{el('sallyForm').submitted=el('sallyForm').emit('submit');};
  async function send(message){el('sallyInput').value=message;el('sallyInput').emit('input');await el('sallyForm').emit('submit');}
  const text=()=>el('sallyMessages').children.map(x=>x.textContent).join('\n');
  return {el,send,text,requests,document};
}

test('Enter sends once; Shift+Enter and composition preserve typing',async()=>{
 const h=chatHarness();h.el('sallyLaunch').emit('click');
 const input=h.el('sallyInput');input.value='RowPulser help';input.emit('input');
 input.emit('keydown',{key:'Enter',shiftKey:true});assert.equal(h.requests.length,0);
 input.emit('keydown',{key:'Enter',isComposing:true});assert.equal(h.requests.length,0);
 input.emit('keydown',{key:'Enter'});await h.el('sallyForm').submitted;
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].body.messages[0].content,'RowPulser help');assert.equal(h.document.activeElement,input);
 assert.equal(input.value,'');assert.equal(h.el('sallySend').disabled,true);
});

test('feature escalation validates email and requires final consent; contact details never go to model',async()=>{
 const h=chatHarness({escalation:{type:'feature',summary:'Please add support for another rowing device.'}});
 await h.send('Can you add a new device?');assert.match(h.text(),/Suggested summary/);
 await h.send('use summary');await h.send('invalid');assert.match(h.text(),/complete email/);assert.equal(h.requests.length,1);
 await h.send('tester@example.com');assert.match(h.text(),/Are you okay sharing/);assert.equal(h.requests.length,1);
 await h.send('maybe');assert.equal(h.requests.length,1);
 await h.send('send');assert.equal(h.requests.length,2);
 const report=h.requests[1];assert.equal(report.url,'/api/sally-escalate');assert.equal(report.body.consent,true);assert.equal(report.body.email,report.body.confirmEmail);assert.equal(report.body.type,'feature');
 assert.match(h.text(),/have been sent/);
 await h.send('Thanks');const modelCall=h.requests.at(-1);assert.equal(modelCall.body.messages.length,1);assert.equal(modelCall.body.messages[0].content,'Thanks');
 assert.ok(!JSON.stringify(modelCall.body).includes('tester@example.com'));
});

test('cancellation never submits an escalation',async()=>{
 const h=chatHarness({escalation:{type:'issue',summary:'Bluetooth remains disconnected after troubleshooting.'}});
 await h.send('Still not working');await h.send('use summary');await h.send('cancel');assert.equal(h.requests.length,1);assert.match(h.text(),/Cancelled/);
});

test('failed logging never claims success and permits explicit retry',async()=>{
 const h=chatHarness({escalation:{type:'issue',summary:'Bluetooth remains disconnected after troubleshooting.'},failReport:true});
 await h.send('Still not working');await h.send('use summary');await h.send('tester@example.com');await h.send('send');
 assert.match(h.text(),/couldn’t confirm/);assert.ok(!h.text().includes('have been sent'));await h.send('send');assert.equal(h.requests.length,3);
});


test('reset clears the playful conversation before the next support request',async()=>{
 const h=chatHarness({resetPersonality:true});
 await h.send('A playful message');
 await h.send('Help with my strap');
 assert.equal(h.requests[1].body.messages.length,1);
 assert.equal(h.requests[1].body.messages[0].content,'Help with my strap');
});
