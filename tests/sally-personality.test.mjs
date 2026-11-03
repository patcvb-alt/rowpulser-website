import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playfulReply} from '../functions/_lib/personality.js';
const user=content=>({role:'user',content}),assistant=content=>({role:'assistant',content});
test('trigger is case insensitive and keeps the Colin opener',()=>{
 assert.equal(playfulReply([user('Are you real?')]).reply,'Is that you Colin?');
 assert.equal(playfulReply([user('  ARE YOU REAL??  ')]).reply,'Is that you Colin?');
 assert.equal(playfulReply([user('This log says are you real?')]),null);
});
test('four replies total including opener, then reset; fresh run can repeat',()=>{
 const history=[user('are you real?')];
 const opener=playfulReply(history);history.push(assistant(opener.reply));
 for(let turn=2;turn<=4;turn++){
  history.push(user('Tell me more'));
  const answer=playfulReply(history);
  assert.ok(answer.reply);assert.equal(answer.reset,turn===4);
  if(turn===4)assert.match(answer.reply,/What can I help you with in RowPulser/);
  history.push(assistant(answer.reply));
 }
 history.push(user('Keep going'));assert.equal(playfulReply(history).reply,null);
 assert.equal(playfulReply([user('are you real?')]).reply,'Is that you Colin?');
});
test('different random choices produce distinct replies in all three rounds',()=>{
 const history=[user('are you real?'),assistant('Is that you Colin?')];
 for(let turn=2;turn<=4;turn++){
  history.push(user('Go on'));
  const choices=new Set(Array.from({length:12},(_,i)=>playfulReply(history,()=>i/12).reply));
  assert.equal(choices.size,12);
  history.push(assistant([...choices][0]));
 }
});
test('denying Colin gets a relevant playful response',()=>{
 const reply=playfulReply([user('are you real?'),assistant('Is that you Colin?'),user('I am not Colin')],()=>0).reply;
 assert.match(reply,/Not Colin/);
});
test('repeating the trigger during a run does not restart the four-reply budget',()=>{
 const history=[];
 for(let turn=1;turn<=4;turn++){
  history.push(user('are you real?'));const answer=playfulReply(history);
  assert.equal(answer.reset,turn===4);history.push(assistant(answer.reply));
 }
 history.push(user('are you real?'));assert.equal(playfulReply(history).reply,null);
});
test('work requests and stop take priority over playful replies',()=>{
 const history=[user('are you real?'),assistant('Is that you Colin?')];
 assert.deepEqual(playfulReply([...history,user('My Bluetooth strap is not working')]),{reply:null,reset:true});
 assert.equal(playfulReply([...history,user('stop')]).reset,true);
});
