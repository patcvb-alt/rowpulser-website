import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playfulReply} from '../functions/_lib/personality.js';
const user=content=>({role:'user',content}),assistant=content=>({role:'assistant',content});
test('trigger is case insensitive and gives the requested line',()=>{
 assert.equal(playfulReply([user('Are you real?')]).reply,'Is that you Colin?');
 assert.equal(playfulReply([user('  ARE YOU REAL??  ')]).reply,'Is that you Colin?');
 assert.equal(playfulReply([user('This log says are you real?')]),null);
});
test('exactly four follow-up replies then reset; trigger can repeat',()=>{
 const history=[user('are you real?'),assistant('Is that you Colin?')];
 for(let turn=1;turn<=4;turn++){
  history.push(user('Tell me more'));
  const answer=playfulReply(history);
  assert.ok(answer.reply);assert.equal(answer.reset,turn===4);
  history.push(assistant(answer.reply));
 }
 history.push(user('Keep going'));assert.equal(playfulReply(history).reply,null);
 history.push(user('are you real?'));assert.equal(playfulReply(history).reply,'Is that you Colin?');
});
test('work requests and stop take priority over playful replies',()=>{
 const history=[user('are you real?'),assistant('Is that you Colin?')];
 assert.deepEqual(playfulReply([...history,user('My Bluetooth strap is not working')]),{reply:null,reset:true});
 assert.equal(playfulReply([...history,user('stop')]).reset,true);
});
