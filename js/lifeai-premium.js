/* LifeAI Premium v2 — unmistakable upgrade on every screen */

const LA_VERSION = '2.1';

function laEscP(s) {
  return typeof laEsc === 'function' ? laEsc(s) : String(s ?? '');
}

function initPremiumV2() {
  document.body.classList.add('la-v2');
  injectVersionBadge();
  injectGlobalSearch();
  injectUpdateBanner();
  patchTaskRendering();
  patchAptRendering();
  injectPanelHeroes();
  showV2Welcome();

  const origRefresh = window.refreshDashboardPro;
  window.refreshDashboardPro = function() {
    if (origRefresh) origRefresh();
    injectPanelHeroes();
  };
}

function injectVersionBadge() {
  const pills = document.querySelector('.top-pills');
  if (!pills || document.getElementById('la-version')) return;
  const badge = document.createElement('div');
  badge.id = 'la-version';
  badge.className = 'la-version';
  badge.title = 'Life OS 2.0 — Premium upgrade';
  badge.innerHTML = '✦ Life OS 2.0';
  pills.appendChild(badge);
}

function injectGlobalSearch() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.getElementById('la-search')) return;
  const search = document.createElement('button');
  search.type = 'button';
  search.id = 'la-search';
  search.className = 'la-search';
  search.setAttribute('aria-label', 'Open command palette');
  search.innerHTML = '<span>Search or jump anywhere…</span><kbd>⌘K</kbd>';
  search.onclick = () => {
    document.getElementById('la-cmd')?.classList.add('on');
    document.getElementById('la-cmd-input')?.focus();
  };
  const logo = topbar.querySelector('.logo-g');
  if (logo) logo.after(search);
}

function injectUpdateBanner() {
  if (document.getElementById('la-update-banner')) return;
  const b = document.createElement('div');
  b.id = 'la-update-banner';
  b.innerHTML = '<strong>Life OS 2.0</strong> is active — briefing, copilot & premium UI<span style="margin-left:8px;opacity:.6">· Today tab in sidebar</span>';
  document.body.appendChild(b);
  requestAnimationFrame(() => b.classList.add('show'));
  setTimeout(() => b.classList.remove('show'), 8000);
}

function showV2Welcome() {
  if (sessionStorage.getItem('la_v2_welcomed')) return;
  sessionStorage.setItem('la_v2_welcomed', '1');
  setTimeout(() => {
    if (typeof toast === 'function') {
      toast('Life OS 2.0 loaded — open Today for your briefing', 'ok');
    }
  }, 1500);
}

function injectPanelHeroes() {
  injectFinanceHero();
  injectHealthHero();
}

function injectFinanceHero() {
  const panel = document.getElementById('panel-finance');
  if (!panel) return;
  let hero = document.getElementById('fin-premium-hero');
  if (!hero) {
    hero = document.createElement('div');
    hero.id = 'fin-premium-hero';
    const ph = panel.querySelector('.ph');
    const aiInline = panel.querySelector('.ai-inline');
    panel.insertBefore(hero, aiInline || ph?.nextSibling);
  }

  const burn = typeof finMonthlyBurn === 'function' ? finMonthlyBurn() : 0;
  const save = typeof finUnusedSavings === 'function' ? finUnusedSavings() : 0;
  const week = typeof finWeekSpend === 'function' ? finWeekSpend() : 0;
  const fmt = typeof finFmt === 'function' ? finFmt : n => '£' + Number(n || 0).toFixed(0);

  hero.innerHTML = `
    <div class="premium-hero">
      <div>
        <h3>Your money, <em>decisions first</em></h3>
        <p>${save > 0 ? `You could reclaim ${fmt(save)}/mo by trimming unused subscriptions.` : 'Track spend, subscriptions, and goals — AI surfaces what to do next.'}</p>
      </div>
      <div class="premium-hero-actions">
        <button type="button" class="btn btn-gold btn-sm" onclick="finSum()">AI summary</button>
        <button type="button" class="btn btn-out btn-sm" onclick="switchFinTab('subs')">Subscriptions</button>
      </div>
    </div>
    <div class="premium-metrics">
      <div class="premium-metric"><div class="premium-metric-label">Monthly burn</div><div class="premium-metric-val gold">${fmt(burn)}</div></div>
      <div class="premium-metric"><div class="premium-metric-label">Potential save</div><div class="premium-metric-val em">${fmt(save)}</div></div>
      <div class="premium-metric"><div class="premium-metric-label">This week</div><div class="premium-metric-val">${fmt(week)}</div></div>
    </div>`;
}

function injectHealthHero() {
  const panel = document.getElementById('panel-health');
  if (!panel) return;
  let hero = document.getElementById('health-premium-hero');
  if (!hero) {
    hero = document.createElement('div');
    hero.id = 'health-premium-hero';
    const streak = document.getElementById('health-streak');
    panel.insertBefore(hero, streak || panel.querySelector('.g4'));
  }

  const score = typeof computeDailyHealthScore === 'function' ? computeDailyHealthScore() : 0;
  const steps = S.health?.steps || 0;

  hero.innerHTML = `
    <div class="premium-hero">
      <div>
        <h3>Wellness <em>${score}%</em> today</h3>
        <p>${score >= 60 ? 'Strong momentum — protect your evening routine.' : 'Log steps, water, or sleep to unlock smarter AI insights.'}</p>
      </div>
      <div class="premium-hero-actions">
        <button type="button" class="btn btn-gold btn-sm" onclick="openHealthLog('steps')">Log steps</button>
        <button type="button" class="btn btn-out btn-sm" onclick="qs('Give me a personalised health plan for today')">AI plan</button>
      </div>
    </div>
    <div class="premium-metrics">
      <div class="premium-metric"><div class="premium-metric-label">Steps</div><div class="premium-metric-val gold">${steps.toLocaleString()}</div></div>
      <div class="premium-metric"><div class="premium-metric-label">Water</div><div class="premium-metric-val">${(S.health?.water || 0).toFixed(1)}L</div></div>
      <div class="premium-metric"><div class="premium-metric-label">Daily score</div><div class="premium-metric-val em">${score}%</div></div>
    </div>`;
}

function renderTaskBoard() {
  const list = document.getElementById('task-list');
  if (!list || !document.body.classList.contains('la-v2')) return;

  let board = document.getElementById('task-board');
  if (!board) {
    board = document.createElement('div');
    board.id = 'task-board';
    board.className = 'task-board';
    list.parentElement.appendChild(board);
    list.style.display = 'none';
  }

  const filter = typeof taskFilter !== 'undefined' ? taskFilter : 'active';
  let tasks = [...S.tasks];
  if (filter === 'active') tasks = tasks.filter(t => !t.done);
  else if (filter === 'done') tasks = tasks.filter(t => t.done);

  if (filter === 'done') {
    board.innerHTML = `<div class="task-col high" style="grid-column:1/-1;border-top-color:var(--em)">
      <div class="task-col-h"><span>✓ Completed</span><span class="cnt">${tasks.length}</span></div>
      ${tasks.length ? tasks.map(t => `<div class="t-row done"><div class="t-chk on" onclick="togT(${t.id})"><svg width="9" height="9"><use href="#i-check"/></svg></div><span class="t-lbl">${laEscP(t.name)}</span><span class="t-del" onclick="delT(${t.id})">✕</span></div>`).join('') : '<div class="empty-state">No completed tasks</div>'}
    </div>`;
    return;
  }

  const cols = [
    { key: 'high', label: '🔴 Focus', cls: 'high' },
    { key: 'medium', label: '🟡 Next', cls: 'medium' },
    { key: 'low', label: '🔵 Later', cls: 'low' }
  ];

  board.innerHTML = cols.map(col => {
    const items = tasks.filter(t => t.prio === col.key);
    const rows = items.length ? items.map(t => {
      const due = t.due ? `<span class="t-due soon">${t.due}</span>` : '';
      return `<div class="t-row p${(t.prio||'m')[0]} ${t.done?'done':''}">
        <div class="t-chk ${t.done?'on':''}" onclick="togT(${t.id})">${t.done?'<svg width="9" height="9"><use href="#i-check"/></svg>':''}</div>
        <span class="t-lbl">${laEscP(t.name)}</span>${due}
        <span class="t-del" onclick="delT(${t.id})">✕</span></div>`;
    }).join('') : `<div class="empty-state">Nothing here</div>`;
    return `<div class="task-col ${col.cls}"><div class="task-col-h"><span>${col.label}</span><span class="cnt">${items.length}</span></div>${rows}</div>`;
  }).join('');
}

function patchTaskRendering() {
  const orig = window.renderTasks;
  if (!orig || window._taskBoardPatched) return;
  window._taskBoardPatched = true;
  window.renderTasks = function() {
    orig();
    renderTaskBoard();
  };
  const origFilter = window.setTaskFilter;
  if (origFilter) {
    window.setTaskFilter = function(f) {
      origFilter(f);
      renderTaskBoard();
    };
  }
}

function renderAptTodayStrip() {
  const panel = document.getElementById('panel-appointments');
  if (!panel) return;
  let strip = document.getElementById('apt-today-strip');
  if (!strip) {
    strip = document.createElement('div');
    strip.id = 'apt-today-strip';
    const ph = panel.querySelector('.ph');
    panel.insertBefore(strip, ph?.nextSibling);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayApts = [...S.apts].filter(a => a.dt?.startsWith(today)).sort((a, b) => a.dt.localeCompare(b.dt));

  if (!todayApts.length) {
    strip.innerHTML = `<div class="premium-hero" style="margin-bottom:0"><div><h3>Calendar <em>clear</em> today</h3><p>Block focus time or schedule what you've been postponing.</p></div><button type="button" class="btn btn-gold btn-sm" onclick="document.getElementById('a-title')?.focus()">Book now</button></div>`;
    return;
  }

  strip.innerHTML = `
    <div class="c-eye" style="margin-bottom:8px">Today</div>
    <div class="apt-today-strip">${todayApts.map(a => {
      const dt = new Date(a.dt);
      return `<div class="apt-today-card"><div class="time">${dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div><div class="title">${laEscP(a.title)}</div></div>`;
    }).join('')}</div>`;
}

function patchAptRendering() {
  const orig = window.renderApts;
  if (!orig || window._aptStripPatched) return;
  window._aptStripPatched = true;
  window.renderApts = function() {
    orig();
    renderAptTodayStrip();
  };
}

function forceServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.update()));
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'LA_SW_UPDATED' && typeof toast === 'function') {
      toast('Life OS 2.0 update installed — refresh if layout looks old', 'in');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initPremiumV2();
    renderTaskBoard();
    renderAptTodayStrip();
    forceServiceWorkerUpdate();
  }, 400);
});

window.LA_VERSION = LA_VERSION;
