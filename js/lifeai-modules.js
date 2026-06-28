/* LifeAI Modules — tasks, chat, health, mobile, profile (same brand) */

let taskFilter = 'active';
const PRIO_RANK = { high: 0, medium: 1, low: 2 };

function laEscLocal(s) {
  if (typeof laEsc === 'function') return laEsc(s);
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setTaskFilter(f) {
  taskFilter = f;
  document.querySelectorAll('#task-tabs .fin-tab').forEach(b =>
    b.classList.toggle('on', b.dataset.tf === f)
  );
  renderTasksEnhanced();
}

function sortTasks(list) {
  return list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pr = (PRIO_RANK[a.prio] ?? 1) - (PRIO_RANK[b.prio] ?? 1);
    if (pr !== 0) return pr;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
}

function formatDue(due) {
  if (!due) return '';
  const d = new Date(due + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (diff < 0) return `<span class="t-due soon">Overdue · ${label}</span>`;
  if (diff === 0) return `<span class="t-due soon">Due today</span>`;
  if (diff === 1) return `<span class="t-due soon">Due tomorrow</span>`;
  if (diff <= 7) return `<span class="t-due soon">Due ${label}</span>`;
  return `<span class="t-due">Due ${label}</span>`;
}

function renderTasksEnhanced() {
  const el = document.getElementById('task-list');
  if (!el) return;
  el.innerHTML = '';
  let list = [...S.tasks];
  if (taskFilter === 'active') list = list.filter(t => !t.done);
  else if (taskFilter === 'done') list = list.filter(t => t.done);
  list = sortTasks(list);

  if (!list.length) {
    el.innerHTML = `<div class="empty-state">${taskFilter === 'done' ? 'No completed tasks yet.' : 'No tasks — add one above or press Enter.'}</div>`;
  } else {
    list.forEach(t => {
      const d = document.createElement('div');
      d.className = 't-row p' + (t.prio?.[0] || 'm') + ' ' + (t.done ? 'done' : '');
      d.innerHTML = `<div class="t-chk ${t.done ? 'on' : ''}" onclick="togT(${t.id})">${t.done ? '<svg width="9" height="9"><use href="#i-check"/></svg>' : ''}</div><span class="t-lbl">${laEscLocal(t.name)}</span>${formatDue(t.due)}<span class="t-p ${t.prio}">${t.prio}</span><span class="t-del" onclick="delT(${t.id})" title="Remove">✕</span>`;
      el.appendChild(d);
    });
  }

  const p = S.tasks.filter(t => !t.done).length;
  ['nb-t', 'kv-tasks'].forEach(i => { const e = document.getElementById(i); if (e) e.textContent = p; });
  const done = S.tasks.filter(t => t.done).length, tot = S.tasks.length;
  const sfb = document.getElementById('sf-t'); if (sfb) sfb.style.width = Math.round(done / Math.max(tot, 1) * 100) + '%';
  const sfv = document.getElementById('sf-tv'); if (sfv) sfv.textContent = done + '/' + tot;
  if (typeof refreshDashboardPro === 'function') refreshDashboardPro();
}

function clearDoneTasks() {
  const n = S.tasks.filter(t => t.done).length;
  if (!n) { toast('No completed tasks', 'in'); return; }
  S.tasks = S.tasks.filter(t => !t.done);
  renderTasksEnhanced();
  if (window.saveToFirestore) saveToFirestore();
  toast(`Cleared ${n} completed task${n > 1 ? 's' : ''}`);
}

function delApt(id) {
  S.apts = S.apts.filter(a => a.id !== id);
  renderAptsEnhanced();
  if (window.saveToFirestore) saveToFirestore();
  toast('Appointment removed');
}

function renderAptsEnhanced() {
  const el = document.getElementById('apt-list');
  if (!el) return;
  el.innerHTML = '';
  const sorted = [...S.apts].sort((a, b) => a.dt.localeCompare(b.dt));
  if (!sorted.length) {
    el.innerHTML = '<div class="empty-state">No appointments — book one above.</div>';
  } else {
    sorted.forEach(a => {
      const dt = new Date(a.dt);
      const row = document.createElement('div');
      row.className = 'a-row';
      row.innerHTML = `<div class="a-cal"><div class="a-num">${dt.getDate()}</div><div class="a-mo">${dt.toLocaleString('en-GB', { month: 'short' })}</div></div><div class="a-inf"><div class="a-name">${laEscLocal(a.title)}</div><div class="a-meta"><div class="a-mi"><svg width="11" height="11"><use href="#i-clock"/></svg>${dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>${a.loc ? `<div class="a-mi"><svg width="11" height="11"><use href="#i-pin"/></svg>${laEscLocal(a.loc)}</div>` : ''}</div></div><span class="t-del" onclick="delApt(${a.id})" title="Delete">✕</span>`;
      el.appendChild(row);
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = S.apts.filter(a => a.dt && a.dt.startsWith(today)).length;
  const kv = document.getElementById('kv-apts');
  if (kv) kv.textContent = todayCount || S.apts.length;
  if (typeof refreshDashboardPro === 'function') refreshDashboardPro();
}

function appendMsgSafe(role, text) {
  const c = document.getElementById('chat-msgs');
  if (!c) return;
  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = 'cm ' + (role === 'user' ? 'u' : 'ai');
  const av = document.createElement('div');
  av.className = 'm-av';
  av.textContent = role === 'user' ? 'U' : 'AI';
  const wrap = document.createElement('div');
  const bub = document.createElement('div');
  bub.className = 'm-bub';
  bub.textContent = text;
  const time = document.createElement('div');
  time.className = 'm-time';
  time.textContent = now;
  wrap.appendChild(bub);
  wrap.appendChild(time);
  div.appendChild(av);
  div.appendChild(wrap);
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function restoreChatFromHistory() {
  const c = document.getElementById('chat-msgs');
  if (!c) return;
  c.innerHTML = '';
  if (!S.hist || !S.hist.length) {
    appendMsgSafe('ai', "Hi — I'm LifeAI. Ask about your day, finances, health, or tasks.");
    return;
  }
  S.hist.forEach(m => appendMsgSafe(m.role === 'assistant' ? 'ai' : 'user', m.content));
}

function clearChatHistory() {
  S.hist = [];
  const c = document.getElementById('chat-msgs');
  if (!c) return;
  c.innerHTML = '';
  appendMsgSafe('ai', "Fresh start. I'm LifeAI — ask me about your day, money, health, or anything else.");
  if (window.saveToFirestore) saveToFirestore();
  toast('Chat cleared');
}

function copyEmailDraft() {
  const out = document.getElementById('email-out');
  if (!out || out.style.display === 'none' || !out.textContent.trim()) {
    toast('Generate a draft first', 'er');
    return;
  }
  navigator.clipboard.writeText(out.textContent).then(() => toast('Copied to clipboard ✓')).catch(() => toast('Copy failed', 'er'));
}

function updateProMeter() {
  const el = document.getElementById('pro-meter');
  if (!el || typeof isPro === 'undefined') return;
  if (isPro) {
    el.innerHTML = '<span style="color:var(--gold)">Pro active</span> · Unlimited AI';
    return;
  }
  const chatsLeft = Math.max(0, (FREE_LIMITS?.chats || 5) - (todayChatCount || 0));
  el.innerHTML = `Free plan · <strong>${chatsLeft}</strong> AI chats left today`;
}

function updateUserTopbar(name) {
  const av = document.querySelector('.topbar .av');
  if (!av || !name) return;
  const initial = name.charAt(0).toUpperCase();
  av.innerHTML = initial + '<div class="logout-dropdown" id="logoutDropdown"><div onclick="logout()">Sign Out</div></div>';
}

function setupMobileNav() {
  const btn = document.getElementById('mob-menu');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar) return;
  btn.onclick = () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('on', sidebar.classList.contains('open'));
  };
  if (overlay) overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('on'); };
  document.querySelectorAll('.nav-b').forEach(n => {
    n.addEventListener('click', () => { sidebar.classList.remove('open'); overlay?.classList.remove('on'); });
  });
}

function setupTaskEnterKey() {
  const input = document.getElementById('t-name');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addTask(); }
  });
}

function computeHealthStreak() {
  if (!S.health) return 0;
  const goals = { steps: 10000, water: 2, sleep: 8, mind: 20 };
  let met = 0;
  if ((S.health.steps || 0) >= goals.steps * 0.5) met++;
  if ((S.health.water || 0) >= goals.water * 0.5) met++;
  if ((S.health.sleep || 0) >= goals.sleep * 0.5) met++;
  if ((S.health.mind || 0) >= goals.mind * 0.5) met++;
  return met;
}

function computeDailyHealthScore() {
  const goals = { steps: 10000, water: 2, sleep: 8, mind: 20 };
  const parts = ['steps', 'water', 'sleep', 'mind'].map(k =>
    Math.min((S.health?.[k] || 0) / goals[k], 1)
  );
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

function recordDailyHealthScore() {
  if (!S.fitnessHistory) S.fitnessHistory = [];
  const today = new Date().toISOString().slice(0, 10);
  const score = computeDailyHealthScore();
  const idx = S.fitnessHistory.findIndex(h => h.date === today);
  if (idx >= 0) S.fitnessHistory[idx].score = score;
  else S.fitnessHistory.push({ date: today, score });
  S.fitnessHistory = S.fitnessHistory.slice(-14);
  localStorage.setItem('fitnessHistory', JSON.stringify(S.fitnessHistory));
  renderActBars?.();
}

function getWeeklyActivity() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = (S.fitnessHistory || []).find(h => h.date === key);
    days.push(entry ? entry.score : (i === 0 ? computeDailyHealthScore() : 0));
  }
  return days;
}

function renderHealthStreak() {
  const el = document.getElementById('health-streak');
  if (!el) return;
  const met = computeHealthStreak();
  const pct = Math.round((met / 4) * 100);
  el.innerHTML = `<div class="streak-bar"><div class="streak-fill" style="width:${pct}%"></div></div><span>${met}/4 daily goals logged · ${pct}% complete today</span>`;
}

function showOnboardingIfNew() {
  const banner = document.getElementById('onboard-banner');
  if (!banner) return;
  const isEmpty = !S.tasks.length && !S.apts.length && !(S.subs?.length);
  const dismissed = localStorage.getItem('lifeai_onboard_dismissed');
  banner.classList.toggle('on', isEmpty && !dismissed);
}

function dismissOnboarding() {
  localStorage.setItem('lifeai_onboard_dismissed', '1');
  const banner = document.getElementById('onboard-banner');
  if (banner) banner.classList.remove('on');
}

function showWelcomeOnce() {
  if (localStorage.getItem('lifeai_welcomed')) return;
  localStorage.setItem('lifeai_welcomed', '1');
  setTimeout(() => {
    toast('Welcome to LifeAI — try Finance → Load sample or press ⌘K', 'ok');
  }, 1200);
}

function initLifeAIModules() {
  if (window._modulesInit) return;
  window._modulesInit = true;

  window.renderTasks = renderTasksEnhanced;
  window.renderApts = renderAptsEnhanced;
  window.appendMsg = appendMsgSafe;
  window.restoreChatFromHistory = restoreChatFromHistory;
  window.recordDailyHealthScore = recordDailyHealthScore;
  window.getWeeklyActivity = getWeeklyActivity;
  window.dismissOnboarding = dismissOnboarding;
  window.showOnboardingIfNew = showOnboardingIfNew;

  setupMobileNav();
  setupTaskEnterKey();
  renderTasksEnhanced();
  renderAptsEnhanced();
  renderHealthStreak();
  updateProMeter();
  showWelcomeOnce();
  showOnboardingIfNew();

  const user = JSON.parse(localStorage.getItem('lifeai_user') || 'null');
  if (user?.fullName) updateUserTopbar(user.fullName);

  const origUpdateHealth = updateHealthDisplay;
  window.updateHealthDisplay = function() {
    origUpdateHealth();
    renderHealthStreak();
    recordDailyHealthScore();
  };

  if (typeof LA_COMMANDS !== 'undefined') {
    LA_COMMANDS.push(
      { label: 'Appointments', run: () => nav('appointments', document.querySelector('.nav-b[onclick*="appointments"]')) },
      { label: 'Email drafter', run: () => nav('email', document.querySelector('.nav-b[onclick*="email"]')) },
      { label: 'Clear chat', run: () => clearChatHistory() },
      { label: 'Clear completed tasks', run: () => clearDoneTasks() },
      { label: 'Tasks — active only', run: () => { nav('tasks', document.querySelector('.nav-b[onclick*="tasks"]')); setTaskFilter('active'); } }
    );
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initLifeAIModules, 150));
