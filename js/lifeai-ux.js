/* LifeAI UX v2.1 — polish every screen to premium standard */

function uxEsc(s) {
  return typeof laEsc === 'function' ? laEsc(s) : String(s ?? '');
}

function getDisplayName() {
  return S.profile?.displayName ||
    JSON.parse(localStorage.getItem('lifeai_user') || '{}').fullName?.split(' ')[0] ||
    'You';
}

function updateSidebarUser() {
  const name = getDisplayName();
  const av = document.querySelector('.topbar .av');
  if (av && name !== 'You') {
    av.childNodes[0].textContent = name.charAt(0).toUpperCase();
  }
  let sideUser = document.getElementById('sidebar-user');
  if (!sideUser) {
    const sf = document.querySelector('.sidebar .sf');
    if (!sf) return;
    sideUser = document.createElement('div');
    sideUser.id = 'sidebar-user';
    sideUser.className = 'sidebar-user';
    sf.parentElement.insertBefore(sideUser, sf);
  }
  sideUser.innerHTML = `<div class="su-name">${uxEsc(name)}</div><div class="su-plan">${typeof isPro !== 'undefined' && isPro ? 'Pro member' : 'Free · Upgrade in Settings'}</div>`;
}

function updateSidebarProgress() {
  const done = S.tasks.filter(t => t.done).length;
  const tot = Math.max(S.tasks.length, 1);
  const sfT = document.getElementById('sf-t');
  const sfTv = document.getElementById('sf-tv');
  if (sfT) sfT.style.width = Math.round(done / tot * 100) + '%';
  if (sfTv) sfTv.textContent = done + '/' + tot;

  const stepsPct = Math.min((S.health?.steps || 0) / 10000 * 100, 100);
  const sfSteps = document.querySelector('.sf-r:nth-child(2) .sf-bf');
  const sfStepsV = document.querySelector('.sf-r:nth-child(2) .sf-v');
  if (sfSteps) sfSteps.style.width = stepsPct + '%';
  if (sfStepsV) sfStepsV.textContent = Math.round(stepsPct) + '%';

  const waterPct = Math.min((S.health?.water || 0) / 2 * 100, 100);
  const sfWater = document.querySelector('.sf-r:nth-child(3) .sf-bf');
  const sfWaterV = document.querySelector('.sf-r:nth-child(3) .sf-v');
  if (sfWater) sfWater.style.width = waterPct + '%';
  if (sfWaterV) sfWaterV.textContent = (S.health?.water || 0).toFixed(1) + 'L';
}

function injectTasksHero() {
  const panel = document.getElementById('panel-tasks');
  if (!panel || document.getElementById('tasks-premium-hero')) return;
  const hero = document.createElement('div');
  hero.id = 'tasks-premium-hero';
  const hint = panel.querySelector('.ai-inline');
  panel.insertBefore(hero, hint || panel.querySelector('#task-tabs'));

  const pending = S.tasks.filter(t => !t.done).length;
  const high = S.tasks.filter(t => !t.done && t.prio === 'high').length;

  hero.innerHTML = `
    <div class="premium-hero">
      <div>
        <h3>${pending ? `<em>${pending}</em> priorities` : 'Clear slate — <em>build momentum</em>'}</h3>
        <p>${high ? `${high} high-focus item${high > 1 ? 's' : ''} — tackle before noon for best results.` : 'Add tasks with due dates — they surface in your daily briefing.'}</p>
      </div>
      <div class="premium-hero-actions">
        <button type="button" class="btn btn-gold btn-sm" onclick="planDay()">Plan my day</button>
        <button type="button" class="btn btn-out btn-sm" onclick="document.getElementById('t-name')?.focus()">+ Add task</button>
      </div>
    </div>`;
}

function injectEmailHero() {
  const panel = document.getElementById('panel-email');
  if (!panel || document.getElementById('email-premium-hero')) return;
  const hero = document.createElement('div');
  hero.id = 'email-premium-hero';
  const ph = panel.querySelector('.ph');
  panel.insertBefore(hero, ph?.nextSibling);

  const drafts = S.drafts?.length || 0;
  hero.innerHTML = `
    <div class="premium-hero">
      <div>
        <h3>Write faster with <em>AI</em></h3>
        <p>${drafts ? `${drafts} saved draft${drafts > 1 ? 's' : ''} ready — or generate a fresh one below.` : 'Describe what you need to say. LifeAI drafts professional emails in seconds.'}</p>
      </div>
      <div class="premium-hero-actions">
        <button type="button" class="btn btn-gold btn-sm" onclick="document.getElementById('e-pts')?.focus()">Start draft</button>
      </div>
    </div>
    <div class="template-chips">
      <button type="button" class="tpl-chip" onclick="applyEmailTemplate('apology')">Apology</button>
      <button type="button" class="tpl-chip" onclick="applyEmailTemplate('followup')">Follow-up</button>
      <button type="button" class="tpl-chip" onclick="applyEmailTemplate('thankyou')">Thank you</button>
      <button type="button" class="tpl-chip" onclick="applyEmailTemplate('meeting')">Meeting request</button>
    </div>`;
}

function applyEmailTemplate(type) {
  const templates = {
    apology: { sub: 'Apology for the delay', pts: 'Apologise sincerely for the delay. Explain briefly what happened. Confirm next steps and timeline. Keep professional and concise.' },
    followup: { sub: 'Following up on our conversation', pts: 'Reference our recent conversation. Summarise agreed action items. Ask if they need anything else. Professional but warm tone.' },
    thankyou: { sub: 'Thank you', pts: 'Express genuine gratitude for their help or time. Mention something specific they did. Close warmly.' },
    meeting: { sub: 'Meeting request', pts: 'Request a 30-minute meeting to discuss [topic]. Suggest 2-3 time slots this week. Explain purpose briefly.' }
  };
  const t = templates[type];
  if (!t) return;
  document.getElementById('e-sub').value = t.sub;
  document.getElementById('e-pts').value = t.pts;
  document.getElementById('e-pts').focus();
  if (typeof toast === 'function') toast('Template loaded — edit and generate', 'ok');
}

function injectChatContext() {
  const panel = document.getElementById('panel-chat');
  if (!panel || document.getElementById('chat-context-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'chat-context-bar';
  bar.className = 'chat-context-bar';
  const ph = panel.querySelector('.ph');
  panel.insertBefore(bar, ph?.nextSibling);
  renderChatContext();
}

function renderChatContext() {
  const bar = document.getElementById('chat-context-bar');
  if (!bar) return;
  const pending = S.tasks.filter(t => !t.done).length;
  const burn = typeof finMonthlyBurn === 'function' ? finMonthlyBurn() : 0;
  const fmt = typeof finFmt === 'function' ? finFmt : n => '£' + Number(n || 0).toFixed(0);
  const score = typeof computeDailyHealthScore === 'function' ? computeDailyHealthScore() : 0;

  bar.innerHTML = `
    <div class="ctx-chip" onclick="qs('What should I focus on right now?')"><span class="ctx-l">Tasks</span><span class="ctx-v">${pending} open</span></div>
    <div class="ctx-chip" onclick="qs('Give me a finance summary and savings tips')"><span class="ctx-l">Finance</span><span class="ctx-v">${fmt(burn)}/mo burn</span></div>
    <div class="ctx-chip" onclick="qs('Give me a health summary for today')"><span class="ctx-l">Health</span><span class="ctx-v">${score}% today</span></div>
    <div class="ctx-chip" onclick="qs('Plan my day intelligently based on my tasks and calendar')"><span class="ctx-l">Plan</span><span class="ctx-v">Ask AI →</span></div>`;
}

function styleUpgradeModal() {
  const m = document.getElementById('upgradeModal');
  if (m) m.classList.add('la-upgrade-modal');
}

function patchRenderDrafts() {
  const orig = window.renderDrafts;
  if (!orig || window._draftsUxPatched) return;
  window._draftsUxPatched = true;
  window.renderDrafts = function() {
    orig();
    document.querySelectorAll('#drafts-list > div').forEach(row => {
      if (!row.classList.contains('draft-card-premium')) {
        row.classList.add('draft-card-premium');
      }
    });
  };
}

function patchUxRefresh() {
  const orig = window.refreshDashboardPro;
  window.refreshDashboardPro = function() {
    if (orig) orig();
    updateSidebarProgress();
    updateSidebarUser();
    injectTasksHero();
    injectEmailHero();
    renderChatContext();
  };
}

function initLifeAIUx() {
  updateSidebarUser();
  updateSidebarProgress();
  injectTasksHero();
  injectEmailHero();
  injectChatContext();
  styleUpgradeModal();
  patchRenderDrafts();
  patchUxRefresh();

  window.applyEmailTemplate = applyEmailTemplate;
  window.renderChatContext = renderChatContext;

  const origLoad = window.loadSettingsForm;
  /* re-run after firestore load via polling once */
  setTimeout(() => {
    updateSidebarUser();
    updateSidebarProgress();
    injectTasksHero();
    injectEmailHero();
    renderChatContext();
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initLifeAIUx, 500));
