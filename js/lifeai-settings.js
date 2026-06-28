/* LifeAI Settings — profile, preferences, data */

function defaultSettings() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London',
    morningBrief: true,
    notifications: true,
    weekStartsMonday: true,
    currency: 'GBP',
    onboarded: false
  };
}

function ensureSettings() {
  if (!S.settings) S.settings = defaultSettings();
  S.settings = { ...defaultSettings(), ...S.settings };
}

function loadSettingsForm() {
  ensureSettings();
  const u = JSON.parse(localStorage.getItem('lifeai_user') || 'null');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
  const chk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  set('set-name', S.profile?.displayName || u?.fullName || '');
  set('set-email', u?.email || '');
  set('set-timezone', S.settings.timezone);
  set('set-income', S.profile?.monthlyIncome || '');
  set('set-budget', S.profile?.monthlyBudget || 2400);
  chk('set-morning-brief', S.settings.morningBrief);
  chk('set-notifications', S.settings.notifications);
  chk('set-week-monday', S.settings.weekStartsMonday);

  const planEl = document.getElementById('set-plan-badge');
  if (planEl) planEl.textContent = typeof isPro !== 'undefined' && isPro ? 'Pro active' : 'Free plan';
}

function saveSettings() {
  ensureSettings();
  const name = document.getElementById('set-name')?.value.trim();
  S.settings.timezone = document.getElementById('set-timezone')?.value || S.settings.timezone;
  S.settings.morningBrief = document.getElementById('set-morning-brief')?.checked ?? true;
  S.settings.notifications = document.getElementById('set-notifications')?.checked ?? true;
  S.settings.weekStartsMonday = document.getElementById('set-week-monday')?.checked ?? true;

  if (name) {
    S.profile.displayName = name;
    const u = JSON.parse(localStorage.getItem('lifeai_user') || 'null');
    if (u) {
      u.fullName = name;
      localStorage.setItem('lifeai_user', JSON.stringify(u));
    }
    if (typeof updateUserTopbar === 'function') updateUserTopbar(name);
  }

  const income = parseFloat(document.getElementById('set-income')?.value);
  const budget = parseFloat(document.getElementById('set-budget')?.value);
  if (!isNaN(income)) S.profile.monthlyIncome = income;
  if (!isNaN(budget)) S.profile.monthlyBudget = budget;

  if (window.saveToFirestore) saveToFirestore();
  if (typeof loadFinProfileFields === 'function') loadFinProfileFields();
  if (typeof renderFinanceAll === 'function') renderFinanceAll();
  if (typeof renderDailyBriefing === 'function') renderDailyBriefing();
  toast('Settings saved ✓');
}

function exportUserData() {
  const blob = new Blob([JSON.stringify({
    exported: new Date().toISOString(),
    tasks: S.tasks,
    apts: S.apts,
    exps: S.exps,
    subs: S.subs,
    goals: S.goals,
    health: S.health,
    profile: S.profile,
    settings: S.settings
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lifeai-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  toast('Data exported ✓');
}

function clearAllLocalData() {
  if (!confirm('Clear chat history and reset onboarding? Your tasks and finance data stay in the cloud.')) return;
  S.hist = [];
  if (typeof clearChatHistory === 'function') clearChatHistory();
  localStorage.removeItem('lifeai_onboard_dismissed');
  localStorage.removeItem('lifeai_welcomed');
  Object.keys(localStorage).filter(k => k.startsWith('lifeai_brief_')).forEach(k => localStorage.removeItem(k));
  toast('Local preferences reset');
}

function openSettings() {
  nav('settings', document.getElementById('nav-settings'));
  loadSettingsForm();
}

function initSettings() {
  ensureSettings();
  window.ensureSettings = ensureSettings;
  window.saveSettings = saveSettings;
  window.exportUserData = exportUserData;
  window.clearAllLocalData = clearAllLocalData;
  window.openSettings = openSettings;
  window.loadSettingsForm = loadSettingsForm;
}

document.addEventListener('DOMContentLoaded', initSettings);
