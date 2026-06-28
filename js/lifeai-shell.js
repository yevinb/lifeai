/* LifeAI Shell — loading, nav polish, accessibility */

function showAppLoading(msg) {
  const el = document.getElementById('app-loading');
  if (!el) return;
  el.classList.add('on');
  const t = el.querySelector('.load-msg');
  if (t && msg) t.textContent = msg;
}

function hideAppLoading() {
  document.getElementById('app-loading')?.classList.remove('on');
}

function enhanceAvatarMenu() {
  const dd = document.getElementById('logoutDropdown');
  if (!dd || dd.dataset.enhanced) return;
  dd.dataset.enhanced = '1';
  dd.innerHTML = `
    <div onclick="openSettings()">⚙ Settings</div>
    <div onclick="nav('dashboard',document.querySelector('.nav-b[onclick*=dashboard]'))">Today</div>
    <div onclick="logout()">Sign Out</div>`;
}

function patchNavForShell() {
  const orig = window.nav;
  window.nav = function(id, el) {
    orig(id, el);
    document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '#/' + id);
    if (typeof renderCopilot === 'function') renderCopilot(id);
  };

  const hash = location.hash.replace('#/', '');
  if (hash && document.getElementById('panel-' + hash)) {
    const navEl = document.getElementById('nav-' + hash) ||
      document.querySelector(`.nav-b[onclick*="${hash}"]`);
    nav(hash, navEl);
  } else {
    renderCopilot?.('dashboard');
  }
}

function initShell() {
  enhanceAvatarMenu();
  patchNavForShell();
  window.showAppLoading = showAppLoading;
  window.hideAppLoading = hideAppLoading;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('onboard-wizard')?.classList.remove('on');
      document.getElementById('la-cmd')?.classList.remove('on');
      hideUpgradeModal?.();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initShell, 50));
