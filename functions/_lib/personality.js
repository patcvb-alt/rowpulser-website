// A repeatable, bounded Easter egg. These replies never invoke the AI model.
const trigger = text => /^are you real\s*[?!.]*$/i.test(text.trim());
const replies = [
  'Well, you’ve certainly got my attention. Is that your usual opening line? 😉',
  'A little charm and good timing? You’re making a strong start. Don’t let it go to your head.',
  'Careful now — keep that up and I’ll start looking forward to your questions. 😉',
  'Four rounds of charm — I’ll give you that. 😉 Right, back to my sensible polo-shirt personality. What can I help you with in RowPulser?'
];
export function playfulReply(messages) {
  const latest = messages.at(-1);
  if (latest?.role !== 'user') return null;
  if (trigger(latest.content)) return { reply: 'Is that you Colin?', reset: false };
  let start = -1;
  for (let i = messages.length - 2; i >= 0; i--) {
    if (messages[i].role === 'user' && trigger(messages[i].content)) { start = i; break; }
  }
  if (start < 0) return null;
  // Let visitors return to real support or stop the joke immediately.
  if (/^(stop|cancel|back to work|back to support|enough|no thanks)[.!?]*$/i.test(latest.content.trim())) {
    return { reply: 'Back to RowPulser support. What can I help you with?', reset: true };
  }
  if (/\b(rowpulser|bluetooth|strap|heart.?rate|readiness|permission|android|ios|workout|feature|bug|error|not working|under.?18|minor|child)\b/i.test(latest.content)) {
    return { reply: null, reset: true };
  }
  const turn = messages.slice(start + 1).filter(message => message.role === 'user').length;
  return turn >= 1 && turn <= replies.length ? { reply: replies[turn - 1], reset: turn === replies.length } : { reply: null, reset: true };
}
