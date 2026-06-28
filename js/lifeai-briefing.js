/* LifeAI Daily Briefing — proactive Life OS home */

const PRIO_RANK = { high: 0, medium: 1, low: 2 };

function briefEsc(s) {
  return typeof laEsc === 'function' ? laEsc(s) : String(s ?? '');
}

function briefFmt(n) {
  return typeof finFmt === 'function' ? finFmt(n) : '£' + Number(n || 0).toFixed(0);
}

function getUserFirstName() {
  try {
    const u = JSON.parse(localStorage.getItem('lifeai_user') || 'null');
    return u?.fullName?.split(' ')[0] || 'there';
  } catch { return 'there'; }
}

function getTopPriorityTask() {
  const active = S.tasks.filter(t => !t.done);
  if (!active.length) return null;
  return [...active].sort((a, b) => {
    const pr = (PRIO_RANK[a.prio] ?? 1) - (PRIO_RANK[b.prio] ?? 1);
    if (pr !== 0) return pr;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  })[0];
}

function getTodayAppointments() {
  const today = new Date().toISOString().slice(0, 10);
  return [...S.apts]
    .filter(a => a.dt && a.dt.startsWith(today))
    .sort((a, b) => a.dt.localeCompare(b.dt));
}

function getWeekSpend() {
  return typeof finWeekSpend === 'function'
    ? finWeekSpend()
    : S.exps.filter(e => e.id >= Date.now() - 604800000).reduce((s, e) => s + parseFloat(e.amt), 0);
}

function buildBriefingData() {
  const pending = S.tasks.filter(t => !t.done).length;
  const done = S.tasks.filter(t => t.done).length;
  const todayApts = getTodayAppointments();
  const top = getTopPriorityTask();
  const save = typeof finUnusedSavings === 'function' ? finUnusedSavings() : 0;
  const burn = typeof finMonthlyBurn === 'function' ? finMonthlyBurn() : 0;
  const weekSpend = getWeekSpend();
  const healthScore = typeof computeDailyHealthScore === 'function' ? computeDailyHealthScore() : 0;
  const activeRems = S.rems.filter(r => r.on);

  const hour = new Date().getHours();
  let timePhrase = 'morning';
  if (hour >= 12 && hour < 17) timePhrase = 'afternoon';
  else if (hour >= 17) timePhrase = 'evening';

  let headline = pending
    ? `${pending} thing${pending > 1 ? 's' : ''} need${pending === 1 ? 's' : ''} your attention today`
    : 'Your day is open — time to build momentum';

  if (todayApts.length) {
    headline += ` · ${todayApts.length} appointment${todayApts.length > 1 ? 's' : ''}`;
  }

  let summaryParts = [];
  if (top) summaryParts.push(`Your top priority is "${top.name}"${top.due ? ' (due soon)' : ''}.`);
  else if (!pending) summaryParts.push('No urgent tasks — ideal for deep work or planning ahead.');
  if (save > 0) summaryParts.push(`You could reclaim ${briefFmt(save)}/mo by trimming unused subscriptions.`);
  if (healthScore < 40 && (S.health?.steps || 0) < 4000) summaryParts.push('Movement is low — a short walk would reset your energy.');
  if (!summaryParts.length) summaryParts.push('You\'re in good shape. Ask AI to optimise the rest of your day.');

  return {
    timePhrase,
    headline,
    summary: summaryParts.join(' '),
    top,
    pending,
    done,
    todayApts,
    save,
    burn,
    weekSpend,
    healthScore,
    activeRems,
    drafts: S.drafts?.length || 0
  };
}

function renderBriefHero() {
  const el = document.getElementById('brief-hero');
  if (!el) return;
  const b = buildBriefingData();
  const name = getUserFirstName();

  el.innerHTML = `
    <div class="brief-hero-top">
      <div>
        <div class="brief-kicker">Daily briefing · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h2 class="brief-headline">${briefEsc(name)}, here's your <em>${b.timePhrase}</em></h2>
        <p class="brief-summary">${briefEsc(b.headline)}. ${briefEsc(b.summary)}</p>
      </div>
      <button type="button" class="btn btn-gold" onclick="generateAIBriefing()" id="btn-ai-brief">
        <svg width="13" height="13"><use href="#i-spark"/></svg>AI Briefing
      </button>
    </div>
    <div class="brief-stats">
      <div class="brief-stat" onclick="nav('tasks',document.querySelector('.nav-b[onclick*=tasks]'))" role="button" tabindex="0">
        <span class="brief-stat-val" id="kv-tasks">${b.pending}</span>
        <span class="brief-stat-lbl">Priorities</span>
      </div>
      <div class="brief-stat" onclick="nav('appointments',document.querySelector('.nav-b[onclick*=appointments]'))" role="button" tabindex="0">
        <span class="brief-stat-val" id="kv-apts">${b.todayApts.length || S.apts.length}</span>
        <span class="brief-stat-lbl">Calendar</span>
      </div>
      <div class="brief-stat" onclick="nav('finance',document.getElementById('nav-finance'))" role="button" tabindex="0">
        <span class="brief-stat-val" id="kv-spend">${briefFmt(b.weekSpend)}</span>
        <span class="brief-stat-lbl">This week</span>
      </div>
      <div class="brief-stat" onclick="nav('email',document.querySelector('.nav-b[onclick*=email]'))" role="button" tabindex="0">
        <span class="brief-stat-val" id="kv-mails">${b.drafts}</span>
        <span class="brief-stat-lbl">Drafts</span>
      </div>
    </div>`;

  const greet = document.getElementById('dash-greeting');
  if (greet) {
    const h = new Date().getHours();
    let g = 'Good morning';
    if (h >= 12 && h < 17) g = 'Good afternoon';
    else if (h >= 17) g = 'Good evening';
    greet.innerHTML = g + ', <em>' + briefEsc(name) + '</em>';
  }
}

function renderBriefFocus() {
  const el = document.getElementById('brief-focus');
  if (!el) return;
  const top = getTopPriorityTask();

  if (!top) {
    el.innerHTML = `
      <div class="brief-focus-num">#1 Priority</div>
      <div class="brief-focus-title">Nothing urgent — choose your focus</div>
      <div class="brief-focus-meta">Add a task or let AI plan your day around your goals.</div>
      <div class="brief-focus-actions">
        <button type="button" class="btn btn-gold" onclick="planDay()">Plan my day</button>
        <button type="button" class="btn btn-out" onclick="nav('tasks',document.querySelector('.nav-b[onclick*=tasks]'))">Add task</button>
      </div>`;
    return;
  }

  const dueLabel = top.due
    ? new Date(top.due + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'No due date';

  el.innerHTML = `
    <div class="brief-focus-num">#1 Priority · ${top.prio}</div>
    <div class="brief-focus-title">${briefEsc(top.name)}</div>
    <div class="brief-focus-meta">${briefEsc(dueLabel)} · Completing this moves your day forward most.</div>
    <div class="brief-focus-actions">
      <button type="button" class="btn btn-gold" onclick="togT(${top.id})">Mark complete</button>
      <button type="button" class="btn btn-out" onclick="nav('tasks',document.querySelector('.nav-b[onclick*=tasks]'))">All tasks</button>
    </div>`;
}

function renderBriefPriorities() {
  const el = document.getElementById('brief-priorities');
  if (!el) return;
  const list = S.tasks
    .filter(t => !t.done)
    .sort((a, b) => (PRIO_RANK[a.prio] ?? 1) - (PRIO_RANK[b.prio] ?? 1))
    .slice(0, 5);

  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No active tasks. Add one or use AI to suggest priorities.</div>';
    return;
  }

  el.innerHTML = list.map((t, i) => `
    <div class="prio-item" onclick="nav('tasks',document.querySelector('.nav-b[onclick*=tasks]'))">
      <div class="prio-rank">${i + 1}</div>
      <div class="prio-body">
        <div class="prio-name">${briefEsc(t.name)}</div>
        <div class="prio-sub">${t.prio}${t.due ? ' · due ' + t.due : ''}</div>
      </div>
      <span class="t-p ${t.prio}">${t.prio}</span>
    </div>`).join('');
}

function renderBriefFinanceWidget() {
  const el = document.getElementById('brief-fin');
  if (!el) return;
  const b = buildBriefingData();
  const burnEl = document.getElementById('dash-burn');
  const saveEl = document.getElementById('dash-save');
  if (burnEl) burnEl.textContent = briefFmt(b.burn);
  if (saveEl) saveEl.textContent = briefFmt(b.save);

  el.innerHTML = `
    <div class="c-eye">Money pulse</div>
    <div class="c-title">What matters now</div>
    <div class="widget-row"><span>Subscription burn</span><strong>${briefFmt(b.burn)}/mo</strong></div>
    <div class="widget-row"><span>Potential savings</span><strong style="color:var(--em)">${briefFmt(b.save)}/mo</strong></div>
    <div class="widget-row"><span>Spent this week</span><strong>${briefFmt(b.weekSpend)}</strong></div>
    ${b.save > 0
      ? `<span class="widget-cta" onclick="nav('finance',document.getElementById('nav-finance'));switchFinTab('subs')">Review subscriptions to cancel →</span>`
      : `<span class="widget-cta" onclick="nav('finance',document.getElementById('nav-finance'))">Open finance →</span>`}`;
}

function renderBriefHealthWidget() {
  const el = document.getElementById('brief-health');
  if (!el) return;
  const score = typeof computeDailyHealthScore === 'function' ? computeDailyHealthScore() : 0;
  const steps = S.health?.steps || 0;
  const water = S.health?.water || 0;

  el.innerHTML = `
    <div class="c-eye">Wellbeing</div>
    <div class="c-title">${score}% of daily goals</div>
    <div class="streak-bar"><div class="streak-fill" style="width:${score}%"></div></div>
    <div class="widget-row"><span>Steps</span><strong>${steps.toLocaleString()} / 10k</strong></div>
    <div class="widget-row"><span>Water</span><strong>${water.toFixed(1)}L / 2L</strong></div>
    <span class="widget-cta" onclick="nav('health',document.querySelector('.nav-b[onclick*=health]'))">Log health data →</span>`;
}

function renderBriefReminders() {
  const el = document.getElementById('brief-reminders');
  if (!el) return;
  const rems = S.rems.filter(r => r.on).slice(0, 4);
  if (!rems.length) {
    el.innerHTML = '<div class="c-eye">Reminders</div><div class="empty-state">No active reminders.</div>';
    return;
  }
  el.innerHTML = `
    <div class="c-eye">Reminders</div>
    ${rems.map(r => `<div class="widget-row"><span>${briefEsc(r.txt)}</span><strong>${briefEsc(r.tm)}</strong></div>`).join('')}
    <span class="widget-cta" onclick="nav('health',document.querySelector('.nav-b[onclick*=health]'))">Manage reminders →</span>`;
}

function renderActivityFeed() {
  const el = document.getElementById('brief-activity');
  if (!el) return;
  const items = [];

  [...S.exps].slice(-3).reverse().forEach(e => {
    items.push({ t: Date.now(), text: `Logged ${briefEsc(e.desc)} — ${briefFmt(e.amt)}`, sort: e.id });
  });
  S.tasks.filter(t => t.done).slice(-2).forEach(t => {
    items.push({ t: Date.now(), text: `Completed "${briefEsc(t.name)}"`, sort: t.id });
  });
  if (S.hist?.length) {
    const last = S.hist[S.hist.length - 1];
    if (last.role === 'user') items.push({ t: Date.now(), text: 'Asked AI: ' + briefEsc(last.content.slice(0, 60)) + (last.content.length > 60 ? '…' : ''), sort: Date.now() });
  }

  items.sort((a, b) => b.sort - a.sort);

  if (!items.length) {
    el.innerHTML = '<div class="c-eye">Recent activity</div><div class="empty-state">Activity will appear as you use LifeAI.</div>';
    return;
  }

  el.innerHTML = `
    <div class="c-eye">Recent activity</div>
    <div class="act-feed">${items.slice(0, 5).map(i => `
      <div class="act-item"><div class="act-dot"></div><div>${i.text}</div></div>`).join('')}
    </div>`;
}

function renderQuickActions() {
  const el = document.getElementById('brief-actions');
  if (!el) return;
  el.innerHTML = `
    <button type="button" class="qa-btn primary" onclick="planDay()">✦ Plan my day</button>
    <button type="button" class="qa-btn" onclick="nav('tasks',document.querySelector('.nav-b[onclick*=tasks]'));document.getElementById('t-name')?.focus()">+ Add task</button>
    <button type="button" class="qa-btn" onclick="nav('finance',document.getElementById('nav-finance'));document.getElementById('ex-d')?.focus()">£ Log expense</button>
    <button type="button" class="qa-btn" onclick="nav('chat',document.querySelector('.nav-b[onclick*=chat]'))">Ask AI</button>
    <button type="button" class="qa-btn" onclick="document.getElementById('la-cmd-input')?.focus();document.getElementById('la-cmd')?.classList.add('on')">⌘K Search</button>`;
}

async function generateAIBriefing() {
  const out = document.getElementById('brief-ai-text');
  const btn = document.getElementById('btn-ai-brief');
  if (!out) return;

  const cacheKey = 'lifeai_brief_' + new Date().toISOString().slice(0, 10);
  const cached = localStorage.getItem(cacheKey);
  if (cached && !btn?.dataset.force) {
    out.textContent = cached;
    out.classList.remove('loading');
    return;
  }

  out.classList.add('loading');
  out.textContent = 'LifeAI is reading your day…';
  if (btn) btn.disabled = true;

  const b = buildBriefingData();
  const payload = {
    message: `[DAILY BRIEFING REQUEST]
User: ${getUserFirstName()}
Pending tasks: ${b.pending}
Top priority: ${b.top?.name || 'none'}
Appointments today: ${b.todayApts.length}
Subscription burn: ${briefFmt(b.burn)}/mo
Potential savings: ${briefFmt(b.save)}/mo
Health score: ${b.healthScore}%
Write a warm, concise morning briefing (3-4 sentences). Be specific. End with ONE clear recommended action. Use £.`,
    history: []
  };

  const r = await post('/api/chat', payload);
  const text = r._e
    ? `${getUserFirstName()}, you have ${b.pending} task${b.pending !== 1 ? 's' : ''} and ${b.todayApts.length} appointment${b.todayApts.length !== 1 ? 's' : ''} today.${b.top ? ` Start with "${b.top.name}".` : ' Consider planning your day.'}${b.save > 0 ? ` Review subscriptions to save ${briefFmt(b.save)}/mo.` : ''}`
    : r.reply;

  out.textContent = text;
  out.classList.remove('loading');
  if (btn) btn.disabled = false;
  localStorage.setItem(cacheKey, text);
}

function renderDailyBriefing() {
  renderBriefHero();
  renderQuickActions();
  renderBriefFocus();
  renderBriefPriorities();
  renderBriefFinanceWidget();
  renderBriefHealthWidget();
  renderBriefReminders();
  renderActivityFeed();
  if (typeof renderDashboardTimeline === 'function') renderDashboardTimeline();
  if (typeof renderSmartInsights === 'function') renderSmartInsights();
}

function initDailyBriefing() {
  window.renderDailyBriefing = renderDailyBriefing;
  window.generateAIBriefing = generateAIBriefing;

  const origRefresh = window.refreshDashboardPro;
  window.refreshDashboardPro = function() {
    renderDailyBriefing();
    if (origRefresh && origRefresh !== refreshDashboardPro) {
      /* timeline + insights already called inside renderDailyBriefing */
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      renderDailyBriefing();
      const aiText = document.getElementById('brief-ai-text');
      if (aiText && !aiText.textContent.trim()) generateAIBriefing();
    }, 200);
  });
}

initDailyBriefing();
