/* LifeAI Onboarding — first-run Life OS setup wizard */

let onboardStep = 0;

function shouldShowOnboardingWizard() {
  ensureSettings?.();
  if (S.settings?.onboarded) return false;
  if (localStorage.getItem('lifeai_onboard_complete')) return false;
  return !S.tasks.length && !S.apts.length && !(S.subs?.length);
}

function showOnboardingWizard() {
  if (!shouldShowOnboardingWizard()) return;
  onboardStep = 0;
  const modal = document.getElementById('onboard-wizard');
  if (modal) {
    modal.classList.add('on');
    renderOnboardStep();
  }
}

function hideOnboardingWizard() {
  document.getElementById('onboard-wizard')?.classList.remove('on');
}

function renderOnboardStep() {
  const body = document.getElementById('onboard-body');
  const dots = document.getElementById('onboard-dots');
  const back = document.getElementById('onboard-back');
  const next = document.getElementById('onboard-next');
  if (!body) return;

  const steps = [
    {
      title: 'Welcome to your <em>Life OS</em>',
      html: `<p>LifeAI isn't a dashboard of numbers. Each morning you get a briefing: what matters, what's on your calendar, where your money goes, and what to do next.</p><p style="margin-top:12px;color:var(--text-3);font-size:.82rem;">60 seconds to set up.</p>`
    },
    {
      title: 'What should we call you?',
      html: `<div class="fld"><label>Your name</label><input id="ob-name" placeholder="e.g. Alex" value="${(S.profile?.displayName || JSON.parse(localStorage.getItem('lifeai_user')||'{}').fullName || '').split(' ')[0]}"></div><div class="fld" style="margin-top:12px"><label>Monthly income (£) — optional</label><input id="ob-income" type="number" placeholder="3200" value="${S.profile?.monthlyIncome || ''}"></div>`
    },
    {
      title: 'Your first <em>priority</em>',
      html: `<div class="fld"><label>One thing to focus on today</label><input id="ob-task" placeholder="e.g. Finish project proposal"></div><p style="margin-top:12px;font-size:.78rem;color:var(--text-3)">Or load sample data to explore Finance.</p><button type="button" class="btn btn-out" style="margin-top:10px" onclick="obLoadSample()">Load sample finance data</button>`
    },
    {
      title: 'Stay in the loop',
      html: `<p>Enable morning briefings and reminders so LifeAI proactively helps you — not just when you open the app.</p><label class="toggle-row"><input type="checkbox" id="ob-notify" checked> Push notifications</label><label class="toggle-row"><input type="checkbox" id="ob-brief" checked> AI morning briefing</label>`
    },
    {
      title: 'You\'re <em>ready</em>',
      html: `<p>Your Life OS is set up. Open <strong style="color:var(--gold)">Today</strong> each morning for your briefing. Press <span style="font-family:var(--mono);color:var(--gold)">⌘K</span> to jump anywhere.</p>`
    }
  ];

  const s = steps[onboardStep];
  body.innerHTML = `<h2 class="onboard-title">${s.title}</h2><div class="onboard-content">${s.html}</div>`;

  if (dots) {
    dots.innerHTML = steps.map((_, i) =>
      `<span class="onboard-dot${i === onboardStep ? ' on' : ''}${i < onboardStep ? ' done' : ''}"></span>`
    ).join('');
  }

  if (back) back.style.visibility = onboardStep === 0 ? 'hidden' : 'visible';
  if (next) next.textContent = onboardStep === steps.length - 1 ? 'Open Today →' : 'Continue';
}

function obLoadSample() {
  if (typeof seedFinanceDemo === 'function') {
    seedFinanceDemo();
    if (typeof renderFinanceAll === 'function') renderFinanceAll();
    if (window.saveToFirestore) saveToFirestore();
    toast('Sample finance loaded ✓', 'ok');
  }
}

async function onboardNext() {
  if (onboardStep === 1) {
    const name = document.getElementById('ob-name')?.value.trim();
    const income = parseFloat(document.getElementById('ob-income')?.value);
    if (name) {
      S.profile.displayName = name;
      const u = JSON.parse(localStorage.getItem('lifeai_user') || 'null');
      if (u) { u.fullName = name; localStorage.setItem('lifeai_user', JSON.stringify(u)); }
      if (typeof updateUserTopbar === 'function') updateUserTopbar(name);
    }
    if (!isNaN(income)) S.profile.monthlyIncome = income;
  }
  if (onboardStep === 2) {
    const task = document.getElementById('ob-task')?.value.trim();
    if (task) {
      S.tasks.unshift({ id: Date.now(), name: task, prio: 'high', done: false, due: '' });
      if (typeof renderTasks === 'function') renderTasks();
    }
  }
  if (onboardStep === 3) {
    ensureSettings?.();
    S.settings.notifications = document.getElementById('ob-notify')?.checked ?? true;
    S.settings.morningBrief = document.getElementById('ob-brief')?.checked ?? true;
    if (S.settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
  if (onboardStep >= 4) {
    finishOnboarding();
    return;
  }
  onboardStep++;
  renderOnboardStep();
}

function onboardBack() {
  if (onboardStep > 0) { onboardStep--; renderOnboardStep(); }
}

function finishOnboarding() {
  ensureSettings?.();
  S.settings.onboarded = true;
  localStorage.setItem('lifeai_onboard_complete', '1');
  if (window.saveToFirestore) saveToFirestore();
  hideOnboardingWizard();
  nav('dashboard', document.querySelector('.nav-b[onclick*="dashboard"]'));
  if (typeof renderDailyBriefing === 'function') renderDailyBriefing();
  if (typeof generateAIBriefing === 'function') generateAIBriefing();
  toast('Welcome to LifeAI ✓', 'ok');
}

function initOnboarding() {
  window.showOnboardingWizard = showOnboardingWizard;
  window.onboardNext = onboardNext;
  window.onboardBack = onboardBack;
  window.finishOnboarding = finishOnboarding;

  window.showOnboardingIfNew = function() {
    const banner = document.getElementById('onboard-banner');
    if (banner && shouldShowOnboardingWizard()) banner.classList.remove('on');
    setTimeout(showOnboardingWizard, 800);
  };
}

document.addEventListener('DOMContentLoaded', initOnboarding);
