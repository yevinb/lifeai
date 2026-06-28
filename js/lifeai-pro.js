/* LifeAI Pro polish — same look, billion-dollar feel */

function laEsc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

function renderDashboardTimeline() {
  const el = document.getElementById('tl');
  if (!el) return;
  const today = new Date().toISOString().slice(0, 10);
  const items = [];

  [...S.apts]
    .filter(a => a.dt && a.dt.slice(0, 10) >= today)
    .sort((a, b) => a.dt.localeCompare(b.dt))
    .slice(0, 4)
    .forEach(a => {
      const dt = new Date(a.dt);
      items.push({
        sort: a.dt,
        time: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        name: a.title,
        meta: a.loc || 'Appointment',
        dot: 'go'
      });
    });

  S.tasks.filter(t => !t.done).slice(0, 3).forEach(t => {
    items.push({
      sort: 'z' + t.prio,
      time: '—',
      name: t.name,
      meta: t.prio + ' priority task',
      dot: t.prio === 'high' ? 'rd' : t.prio === 'medium' ? 'go' : 'bl'
    });
  });

  if (!items.length) {
    el.innerHTML = '<div style="font-size:.8rem;color:var(--text-3);padding:12px 0;">No agenda yet — add a task or book an appointment.</div>';
    return;
  }

  el.innerHTML = items.slice(0, 5).map(i => `
    <div class="tl-i">
      <div class="tl-t">${i.time}</div>
      <div class="tl-dw"><div class="tl-d ${i.dot}"></div></div>
      <div class="tl-b">
        <div class="tl-name">${laEsc(i.name)}</div>
        <div class="tl-meta">${laEsc(i.meta)}</div>
      </div>
    </div>`).join('');
}

function renderSmartInsights() {
  const el = document.getElementById('dash-insights');
  if (!el) return;
  const insights = [];
  const pending = S.tasks.filter(t => !t.done).length;
  const save = typeof finUnusedSavings === 'function' ? finUnusedSavings() : 0;
  const burn = typeof finMonthlyBurn === 'function' ? finMonthlyBurn() : 0;

  if (save > 0) insights.push({ tag: 'SAVE', text: `Cancel unused subs → ${typeof finFmt === 'function' ? finFmt(save) : '£' + save.toFixed(0)}/mo back`, action: 'finance' });
  if (pending > 0) insights.push({ tag: 'TASK', text: `${pending} task${pending > 1 ? 's' : ''} waiting — plan your day`, action: 'tasks' });
  if (burn > 50) insights.push({ tag: 'BURN', text: `${typeof finFmt === 'function' ? finFmt(burn) : '£' + burn.toFixed(0)}/mo on subscriptions`, action: 'finance' });
  if (S.health.steps < 3000) insights.push({ tag: 'MOVE', text: 'Steps low today — log a walk in Health', action: 'health' });
  if (!insights.length) insights.push({ tag: 'OK', text: 'You\'re on track. Ask AI Chat anything.', action: 'chat' });

  window._dashInsightActions = insights.slice(0, 3);
  el.innerHTML = window._dashInsightActions.map((i, idx) => `
    <div class="insight-chip" data-insight="${idx}">
      <span class="insight-tag">${i.tag}</span>
      <span>${laEsc(i.text)}</span>
    </div>`).join('');

  el.querySelectorAll('[data-insight]').forEach(chip => {
    chip.onclick = () => {
      const a = window._dashInsightActions[parseInt(chip.dataset.insight, 10)];
      if (!a) return;
      const navMap = {
        finance: () => nav('finance', document.getElementById('nav-finance')),
        tasks: () => nav('tasks', document.querySelector('.nav-b[onclick*="tasks"]')),
        health: () => nav('health', document.querySelector('.nav-b[onclick*="health"]')),
        chat: () => nav('chat', document.querySelector('.nav-b[onclick*="chat"]'))
      };
      (navMap[a.action] || navMap.chat)();
    };
  });
}

function delExp(id) {
  S.exps = S.exps.filter(e => e.id !== id);
  renderExps();
  if (typeof renderFinanceAll === 'function') renderFinanceAll();
  if (window.saveToFirestore) saveToFirestore();
  toast('Expense removed');
}

function renderExpsPro() {
  const orig = window._renderExpsOrig;
  if (!orig) return;
  orig();
  document.querySelectorAll('#exp-list .ex-r').forEach((row, i) => {
    const e = [...S.exps].reverse().slice(0, 6)[i];
    if (!e) return;
    if (!row.querySelector('.ex-del')) {
      const btn = document.createElement('span');
      btn.className = 't-del';
      btn.textContent = '✕';
      btn.title = 'Remove';
      btn.onclick = () => delExp(e.id);
      row.appendChild(btn);
    }
  });
}

const LA_COMMANDS = [
  { label: 'Today', run: () => nav('dashboard', document.querySelector('.nav-b[onclick*="dashboard"]')) },
  { label: 'Tasks', run: () => nav('tasks', document.querySelector('.nav-b[onclick*="tasks"]')) },
  { label: 'Finance', run: () => nav('finance', document.getElementById('nav-finance')) },
  { label: 'AI Chat', run: () => nav('chat', document.querySelector('.nav-b[onclick*="chat"]')) },
  { label: 'Health', run: () => nav('health', document.querySelector('.nav-b[onclick*="health"]')) },
  { label: 'Settings', run: () => openSettings?.() || nav('settings', document.getElementById('nav-settings')) },
  { label: 'AI briefing', run: () => { nav('dashboard', document.querySelector('.nav-b[onclick*="dashboard"]')); generateAIBriefing?.(); } },
  { label: 'Plan my day', run: () => planDay() },
  { label: 'Log expense', run: () => { nav('finance', document.getElementById('nav-finance')); switchFinTab('overview'); document.getElementById('ex-d')?.focus(); } }
];

function setupCommandPalette() {
  const palette = document.getElementById('la-cmd');
  const input = document.getElementById('la-cmd-input');
  const list = document.getElementById('la-cmd-list');
  if (!palette || !input) return;

  function open() {
    palette.classList.add('on');
    input.value = '';
    renderList('');
    input.focus();
  }
  function close() { palette.classList.remove('on'); }

  function renderList(q) {
    const query = q.toLowerCase();
    const items = LA_COMMANDS.filter(c => c.label.toLowerCase().includes(query));
    list.innerHTML = items.map((c, i) =>
      `<div class="la-cmd-item${i === 0 ? ' on' : ''}" data-i="${i}">${c.label}<kbd>↵</kbd></div>`
    ).join('') || '<div class="la-cmd-item">No results</div>';
    list.querySelectorAll('.la-cmd-item[data-i]').forEach(el => {
      el.onclick = () => { close(); items[parseInt(el.dataset.i, 10)].run(); };
    });
  }

  input.oninput = () => renderList(input.value);
  input.onkeydown = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const first = list.querySelector('.la-cmd-item[data-i="0"]');
      if (first) first.click();
    }
  };
  palette.onclick = (e) => { if (e.target === palette) close(); };

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      palette.classList.contains('on') ? close() : open();
    }
  });
  document.getElementById('la-cmd-btn')?.addEventListener('click', open);
}

function renderActBarsFromHealth() {
  const el = document.getElementById('act-bars');
  const ll = document.getElementById('act-lbls');
  if (!el || !ll) return;
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const base = S.health?.steps || 0;
  const data = days.map((_, i) => {
    if (i === todayIdx) return Math.min(100, Math.round((base / 10000) * 100));
    return Math.max(20, Math.min(95, 40 + Math.round(Math.random() * 40)));
  });
  el.innerHTML = '';
  ll.innerHTML = '';
  data.forEach((v, i) => {
    const b = document.createElement('div');
    b.className = 'act-bar' + (i === todayIdx ? ' today' : '');
    b.style.height = '3px';
    el.appendChild(b);
    setTimeout(() => { b.style.height = Math.round(v / 100 * 56) + 'px'; }, 280 + i * 55);
    const l = document.createElement('span');
    l.className = 'act-lbl';
    l.textContent = days[i];
    ll.appendChild(l);
  });
}

function refreshDashboardPro() {
  if (typeof renderDailyBriefing === 'function') {
    renderDailyBriefing();
    return;
  }
  renderDashboardTimeline();
  renderSmartInsights();
  if (typeof updateFinanceCardsPro === 'function') updateFinanceCardsPro();
}

function initLifeAIPro() {
  if (!window._renderExpsOrig) {
    window._renderExpsOrig = renderExps;
    renderExps = renderExpsPro;
  }
  setupCommandPalette();
  refreshDashboardPro();
  const origRenderTasks = renderTasks;
  window.renderTasks = function() {
    origRenderTasks();
    refreshDashboardPro();
  };
  const origRenderApts = renderApts;
  window.renderApts = function() {
    origRenderApts();
    refreshDashboardPro();
  };
  const origRenderActBars = renderActBars;
  window.renderActBars = function() {
    origRenderActBars();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initLifeAIPro, 100);
});
