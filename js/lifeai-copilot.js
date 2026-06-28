/* LifeAI Copilot — contextual AI assistance on every major screen */

function getCopilotAdvice(panelId) {
  const pending = S.tasks.filter(t => !t.done).length;
  const high = S.tasks.filter(t => !t.done && t.prio === 'high').length;
  const save = typeof finUnusedSavings === 'function' ? finUnusedSavings() : 0;
  const burn = typeof finMonthlyBurn === 'function' ? finMonthlyBurn() : 0;
  const unused = (S.subs || []).filter(s => s.status === 'unused').length;
  const score = typeof computeDailyHealthScore === 'function' ? computeDailyHealthScore() : 0;
  const todayApts = (S.apts || []).filter(a => a.dt?.startsWith(new Date().toISOString().slice(0, 10))).length;

  const map = {
    dashboard: () => ({
      title: 'LifeAI Copilot',
      text: pending
        ? `I see ${pending} open task${pending > 1 ? 's' : ''}${todayApts ? ` and ${todayApts} appointment${todayApts > 1 ? 's' : ''}` : ''}. Want me to build an optimised schedule?`
        : 'Your calendar looks light. I can suggest goals for today or help you get ahead on finances.',
      primary: { label: 'Plan my day', run: () => planDay() },
      secondary: { label: 'Ask AI', run: () => nav('chat', document.querySelector('.nav-b[onclick*="chat"]')) }
    }),
    tasks: () => ({
      title: 'Task Copilot',
      text: high
        ? `${high} high-priority task${high > 1 ? 's' : ''} need focus. I recommend tackling the hardest one before noon.`
        : pending
          ? `${pending} tasks active. Add due dates to help me prioritise smarter.`
          : 'Inbox zero on tasks. Add your next commitment or clear completed items.',
      primary: { label: 'Plan my day', run: () => planDay() },
      secondary: { label: 'Clear done', run: () => typeof clearDoneTasks === 'function' && clearDoneTasks() }
    }),
    appointments: () => ({
      title: 'Calendar Copilot',
      text: todayApts
        ? `${todayApts} booking${todayApts > 1 ? 's' : ''} today. Leave buffer time between meetings for transitions.`
        : 'No appointments today — block focus time or schedule what you\'ve been postponing.',
      primary: { label: 'Plan my day', run: () => planDay() },
      secondary: null
    }),
    email: () => ({
      title: 'Email Copilot',
      text: (S.drafts?.length || 0)
        ? `You have ${S.drafts.length} saved draft${S.drafts.length > 1 ? 's' : ''}. I can help polish tone or shorten them.`
        : 'Describe what you need to say — I\'ll draft a professional email in seconds.',
      primary: { label: 'Generate draft', run: () => document.getElementById('e-pts')?.focus() },
      secondary: null
    }),
    chat: () => null,
    finance: () => ({
      title: 'Finance Copilot',
      text: unused
        ? `${unused} subscription${unused > 1 ? 's' : ''} marked unused — cancelling could save ${typeof finFmt === 'function' ? finFmt(save) : '£' + save}/mo.`
        : burn > 0
          ? `You're burning ${typeof finFmt === 'function' ? finFmt(burn) : '£' + burn}/mo on subscriptions. Want an AI summary?`
          : 'Track expenses and subscriptions here — I\'ll surface savings opportunities.',
      primary: { label: 'AI summary', run: () => finSum() },
      secondary: unused ? { label: 'Review subs', run: () => switchFinTab('subs') } : null
    }),
    health: () => ({
      title: 'Health Copilot',
      text: score >= 75
        ? 'Strong day so far. Keep hydration up and protect your evening wind-down.'
        : score >= 40
          ? 'You\'re halfway there. Log steps or water to complete your daily rings.'
          : 'Health data is sparse today. Tap a ring to log — small inputs unlock better insights.',
      primary: { label: 'Log steps', run: () => openHealthLog('steps') },
      secondary: { label: 'Health summary', run: () => { nav('chat', document.querySelector('.nav-b[onclick*="chat"]')); qs('Give me a health summary'); } }
    })
  };

  const fn = map[panelId];
  return fn ? fn() : null;
}

function renderCopilot(panelId) {
  let bar = document.getElementById('la-copilot');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'la-copilot';
    bar.className = 'la-copilot';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'AI Copilot suggestions');
  }

  const advice = getCopilotAdvice(panelId);
  const panel = document.getElementById('panel-' + panelId);
  if (!panel || !advice) {
    bar.classList.remove('on');
    return;
  }

  const ph = panel.querySelector('.ph');
  if (ph && bar.parentElement !== panel) {
    panel.insertBefore(bar, ph.nextSibling);
  } else if (ph && ph.nextElementSibling !== bar) {
    panel.insertBefore(bar, ph.nextSibling);
  }

  bar.classList.add('on');
  bar.innerHTML = `
    <div class="la-copilot-av">AI</div>
    <div class="la-copilot-body">
      <div class="la-copilot-title">${advice.title}</div>
      <div class="la-copilot-text">${advice.text}</div>
    </div>
    <div class="la-copilot-actions">
      ${advice.primary ? `<button type="button" class="btn btn-gold btn-sm" id="copilot-primary">${advice.primary.label}</button>` : ''}
      ${advice.secondary ? `<button type="button" class="btn btn-out btn-sm" id="copilot-secondary">${advice.secondary.label}</button>` : ''}
    </div>`;

  document.getElementById('copilot-primary')?.addEventListener('click', () => advice.primary?.run());
  document.getElementById('copilot-secondary')?.addEventListener('click', () => advice.secondary?.run());
}

function initCopilot() {
  const origNav = window.nav;
  window.nav = function(id, el) {
    origNav(id, el);
    renderCopilot(id);
  };
  renderCopilot('dashboard');
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initCopilot, 250));
