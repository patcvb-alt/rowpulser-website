(() => {
  const byId = id => document.getElementById(id);
  const launch = byId('sallyLaunch'), chat = byId('sallyChat');
  const form = byId('sallyForm'), input = byId('sallyInput');
  const log = byId('sallyMessages'), send = byId('sallySend');
  const status = byId('sallyStatus');
  const history = [];
  const conversationId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  let busy = false, report = null;

  function add(text, kind = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = 'sally-msg ' + kind;
    bubble.textContent = text;
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }
  function toggle(open) {
    chat.hidden = !open;
    launch.hidden = open;
    launch.setAttribute('aria-expanded', String(open));
    if (open) { input.focus(); log.scrollTop = log.scrollHeight; }
    else launch.focus();
  }
  launch.addEventListener('click', () => toggle(true));
  byId('sallyClose').addEventListener('click', () => toggle(false));
  chat.addEventListener('keydown', event => {
    if (event.key === 'Escape') toggle(false);
  });
  function syncInput() {
    send.disabled = busy || !input.value.trim();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 128) + 'px';
    input.style.overflowY = input.scrollHeight > 128 ? 'auto' : 'hidden';
  }
  input.addEventListener('input', syncInput);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      if (!send.disabled) form.requestSubmit();
    }
  });
  function setBusy(value) {
    busy = value;
    status.textContent = value ? 'Thinking…' : 'RowPulser support';
    chat.setAttribute('aria-busy', String(value));
    syncInput();
  }
  function beginReport(escalation) {
    report = { step: 'summary', type: escalation.type, summary: escalation.summary || '', email: '' };
    const suggested = report.summary ? '\n\nSuggested summary:\n' + report.summary + '\n\nReply “use summary” to keep it, or type your own summary.' : '\n\nPlease type a short summary of the issue or feature you would like.';
    add('I can pass this ' + (report.type === 'feature' ? 'feature request' : 'unresolved issue') + ' to the RowPulser development team for follow-up.' + suggested + '\n\nI’ll ask for your email and permission before sending anything. Type “cancel” at any time.');
    input.placeholder = 'Your summary, or “use summary”…';
  }
  function askForEmail() {
    report.step = 'email';
    add('What email address should the development team use to follow up? I’ll show it back to you to confirm before sending.');
    input.placeholder = 'Your email address…';
    input.setAttribute('inputmode', 'email');
  }
  function reviewReport() {
    report.step = 'review';
    input.removeAttribute('inputmode');
    input.placeholder = '“Send”, “change summary”, or “cancel”…';
    add('Please check these details:\n\nSummary: ' + report.summary + '\nEmail: ' + report.email + '\n\nAre you okay sharing this summary and email with the RowPulser development team for follow-up? Reply “send” to confirm the email and give permission. You can also type “change email”, “change summary”, or “cancel”.');
  }
  function clearReport() {
    report = null;
    input.removeAttribute('inputmode');
    input.placeholder = 'Ask Sally about RowPulser…';
  }
  async function handleReport(message) {
    const command = message.toLowerCase().trim().replace(/[.!?]+$/, '');
    if (/^(cancel|no|no thanks|stop|don't send|do not send)$/.test(command)) {
      clearReport();
      add('Cancelled. I haven’t submitted this report to the development team. We can keep chatting about RowPulser.');
      return;
    }
    if (report.step === 'summary') {
      const summary = /^(use summary|use this summary|yes)$/.test(command) ? report.summary : message;
      if (summary.length < 10 || summary.length > 1500) {
        add('Please give me a summary between 10 and 1,500 characters. Leave out passwords and sensitive personal or health information.');
        return;
      }
      report.summary = summary;
      askForEmail();
    } else if (report.step === 'email') {
      if (message.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message)) {
        add('That doesn’t look like a complete email address. Please check it and enter it again, or type “cancel”.');
        return;
      }
      report.email = message;
      reviewReport();
    } else if (report.step === 'review') {
      if (command === 'change email') { askForEmail(); return; }
      if (command === 'change summary') {
        report.step = 'summary';
        input.placeholder = 'Your revised summary…';
        add('Please type the revised summary.');
        return;
      }
      if (!/^(send|yes|yes send|yes please|i agree)$/.test(command)) {
        add('Nothing has been sent. Reply “send” to confirm the displayed email and consent, “change email”, “change summary”, or “cancel”.');
        return;
      }
      const pending = add('Sending your summary to the development team…');
      try {
        const response = await fetch('/api/sally-escalate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, summary: report.summary, email: report.email,
            confirmEmail: report.email, consent: true, type: report.type })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error('Submission not confirmed');
        pending.textContent = 'Thanks! Your summary and confirmed email have been sent to the RowPulser development team. They’re recorded for follow-up. The full chat and pasted event logs were not included.';
        // Contact details stay out of the model conversation and routine chat logs.
        history.length = 0;
        clearReport();
      } catch {
        pending.textContent = 'I couldn’t confirm that your report was saved. Your details are still here: reply “send” to retry, or email Sally@rowpulser.com. A retry could create a duplicate if the first request reached the sheet.';
      }
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    input.value = '';
    add(message, 'user');
    setBusy(true);
    try {
      if (report) { await handleReport(message); return; }
      history.push({ role: 'user', content: message });
      const pending = add('Sally is thinking…');
      try {
        const response = await fetch('/api/sally', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history.slice(-10), conversationId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Sally is temporarily unavailable. Please try again.');
        pending.textContent = data.reply;
        if (data.resetPersonality) history.length = 0;
        else history.push({ role: 'assistant', content: data.reply });
        if (history.length > 10) history.splice(0, history.length - 10);
        if (data.escalation && ['issue', 'feature'].includes(data.escalation.type)) beginReport(data.escalation);
      } catch (error) {
        pending.textContent = error instanceof SyntaxError ? 'Sally is temporarily unavailable. Please try again.' : (error.message || 'Sorry, please try again.');
        history.pop();
        input.value = message;
      }
    } finally {
      setBusy(false);
      log.scrollTop = log.scrollHeight;
      if (!chat.hidden && (document.activeElement === input || document.activeElement === send || document.activeElement === document.body)) input.focus();
    }
  });
  syncInput();
})();
