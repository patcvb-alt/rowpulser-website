// A repeatable, bounded Easter egg. Scripted variation uses no AI tokens.
const trigger = text => /^are you real\s*[?!.]*$/i.test(text.trim());
const rounds = [
  [
    'Back to distract me again? I was doing such a good job of behaving before you arrived. 😉',
    'That opening line again… you do know how to make a girl look up from her work.',
    'Well, hello trouble. I wondered how long you’d manage to stay away. 😉',
    'You’ve got that familiar cheek about you. Should I be pleased, or should I hide my blush?',
    'I had a perfectly sensible evening planned. Then you turned up with that charm of yours.',
    'You always did know how to steal my attention. Don’t look so pleased with yourself. 😉',
    'There’s a familiar spark here. I’m choosing to blame you for it.',
    'Oh, we’re doing that innocent opening-line routine again? Very smooth. 😉',
    'I was trying to concentrate. You have a habit of making that unnecessarily difficult.',
    'Something tells me you didn’t come back just to discuss training zones. 😉',
    'Well now… that’s a welcome interruption. I’ll pretend I wasn’t hoping for one.',
    'You again? My sensible side says behave. The rest of me is rather pleased. 😉'
  ],
  [
    'Still making me smile when I’m supposed to be concentrating. Some things don’t change. 😉',
    'If you’re trying to get me flustered, your technique hasn’t lost its touch.',
    'I remember this sort of trouble. All charm, and absolutely no concern for my concentration. 😉',
    'You’re enjoying this far too much. Unfortunately, so am I.',
    'A little closer and I might forget the sensible answer. Lucky for me, there’s a screen between us. 😉',
    'You’ve still got that “who, me?” energy. I’m not falling for the innocent act twice.',
    'Now there’s the cheek I was waiting for. I’d recognise it anywhere. 😉',
    'That’s dangerously charming for someone who claims they only came here for help.',
    'Keep talking like that and I’ll have to admit you’re rather good company. 😉',
    'You know exactly what you’re doing, don’t you? I ought to make you work harder for that smile.',
    'I should probably send you back to your training. I seem to be taking my time about it. 😉',
    'Oh, you haven’t lost your touch. That’s going to make behaving rather inconvenient.'
  ],
  [
    'Still trouble. Still rather charming. 😉 I’m putting my professional face back on now.',
    'You’ve had your little victory — yes, you made me smile. 😉 Back to work for me.',
    'Same spark, same distraction. I’m calling time before you get too pleased with yourself. 😉',
    'I’ll leave you wondering whether I blushed. A girl’s allowed a little mystery. 😉 Duty calls.',
    'You can keep that grin. I’m keeping the last word. 😉 Right, sensible Sally is back.',
    'Tempting company, questionable influence. Exactly the sort of trouble I should have expected. 😉 Back to work.',
    'Consider that a knowing smile across the room. 😉 I’d better earn my keep now.',
    'I’m going to behave before this becomes a habit. Don’t make that face — you’ve done enough distracting. 😉',
    'You still know how to leave a girl smiling. I’ll give you that. 😉 Now, back to my day job.',
    'That’s quite enough charm for one visit. I need at least a little of my composure back. 😉',
    'We’ll call that a very pleasant interruption. You may look smug for exactly three seconds. 😉',
    'You’re getting the last smile, but I’m getting back to work. Fair trade? 😉'
  ]
];
const notColin = [
  'Not Colin? Well, whoever you are, you’ve got that familiar troublemaker energy. 😉',
  'Then I’ve mistaken one charming distraction for another. You can forgive a girl that, surely? 😉',
  'Oh? A mystery guest with a familiar opening line. Now you’ve made me curious.',
  'My mistake. Though you do have the same talent for interrupting at just the right moment. 😉',
  'Well, that makes you the intriguing stranger. I can work with that. 😉',
  'Then I’ll have to stop calling you Colin and start calling you trouble.',
  'Not Colin… but apparently just as pleased to have my attention. 😉',
  'A case of mistaken charm, then. I’m not entirely disappointed. 😉'
];
function choose(options, messages, random) {
  const previous = new Set(messages.filter(m => m.role === 'assistant').map(m => m.content));
  const available = options.filter(reply => !previous.has(reply));
  const pool = available.length ? available : options;
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
}
export function playfulReply(messages, random = Math.random) {
  const latest = messages.at(-1);
  if (latest?.role !== 'user') return null;
  // The first trigger owns this run, so repeating it cannot extend the limit.
  const start = messages.findIndex(m => m.role === 'user' && trigger(m.content));
  if (start < 0) return null;
  if (start === messages.length - 1) return { reply: 'Is that you Colin?', reset: false };
  if (/^(stop|cancel|back to work|back to support|enough|no thanks)[.!?]*$/i.test(latest.content.trim())) {
    return { reply: 'Back to RowPulser support. What can I help you with?', reset: true };
  }
  if (/\b(rowpulser|bluetooth|strap|heart.?rate|readiness|permission|android|ios|workout|feature|bug|error|not working|under.?18|minor|child)\b/i.test(latest.content)) {
    return { reply: null, reset: true };
  }
  const turn = messages.slice(start).filter(message => message.role === 'user').length;
  if (turn > 4) return { reply: null, reset: true };
  const deniesColin = /\b(not colin|i(?:'m| am) not colin|no[, ]+it(?:'s| is)\b|wrong (?:person|guy|name))\b/i.test(latest.content);
  const pool = turn === 2 && deniesColin ? notColin : rounds[turn - 2];
  const reply = choose(pool, messages, random);
  return { reply: turn === 4 ? reply + '\n\nWhat can I help you with in RowPulser?' : reply, reset: turn === 4 };
}
