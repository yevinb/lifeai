/* LifeAI Elite v3.0 — splash, FAB, animations, unmistakable upgrade */

const LA_ELITE_VERSION = '3.0';

function initLifeElite() {
  document.body.classList.add('la-elite');
  updateVersionBadge();
  showEliteSplash();
  injectFabAI();
  showEliteBanner();
  animateBriefStats();
  patchNavReveal();
}

function updateVersionBadge() {
  const badge = document.getElementById('la-version');
  if (badge) {
    badge.innerHTML = '✦ Life OS 3.0';
    badge.title = 'Life OS 3.0 Elite — premium upgrade live';
  }
  const meta = document.querySelector('meta[name="lifeai-version"]');
  if (meta) meta.content = LA_ELITE_VERSION;
}

function showEliteSplash() {
  if (sessionStorage.getItem('la_elite_splash_v30')) return;

  const splash = document.createElement('div');
  splash.id = 'la-elite-splash';
  splash.innerHTML = `
    <svg class="splash-orb" viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="44" r="40" stroke="rgba(201,168,76,.2)" stroke-width="1"/>
      <circle cx="44" cy="44" r="28" fill="rgba(201,168,76,.08)" stroke="rgba(201,168,76,.35)" stroke-width=".5"/>
      <circle cx="44" cy="44" r="10" fill="var(--gold)" opacity=".95"/>
      <circle cx="44" cy="44" r="16" stroke="var(--gold)" stroke-width=".5" opacity=".3"/>
    </svg>
    <div class="splash-title">Life <em>OS 3.0</em></div>
    <div class="splash-sub">Elite · Daily briefing · AI copilot</div>
    <div class="splash-bar"><div class="splash-bar-fill"></div></div>`;
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add('out');
    setTimeout(() => splash.remove(), 700);
    sessionStorage.setItem('la_elite_splash_v30', '1');
    if (typeof toast === 'function') {
      toast('Life OS 3.0 Elite is live — your briefing awaits on Today', 'ok');
    }
  }, 2200);
}

function injectFabAI() {
  if (document.getElementById('la-fab-ai')) return;
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.id = 'la-fab-ai';
  fab.setAttribute('aria-label', 'Ask AI');
  fab.innerHTML = `<svg width="18" height="18"><use href="#i-spark"/></svg> Ask AI`;
  fab.onclick = () => {
    if (typeof nav === 'function') {
      nav('chat', document.querySelector('.nav-b[onclick*=chat]'));
    }
  };
  document.body.appendChild(fab);
}

function showEliteBanner() {
  if (sessionStorage.getItem('la_elite_banner_v30')) return;
  sessionStorage.setItem('la_elite_banner_v30', '1');

  const b = document.createElement('div');
  b.id = 'la-elite-banner';
  b.innerHTML = '<strong>Life OS 3.0 Elite</strong> — aurora UI, animated briefing, floating AI';
  document.body.appendChild(b);
  requestAnimationFrame(() => b.classList.add('show'));
  setTimeout(() => b.classList.remove('show'), 7000);
  setTimeout(() => b.remove(), 7800);
}

function animateBriefStats() {
  const orig = window.renderBriefHero;
  if (!orig) return;
  window.renderBriefHero = function () {
    orig();
    document.querySelectorAll('.brief-stat-val').forEach(el => {
      const raw = el.textContent.trim();
      const isMoney = raw.startsWith('£');
      const target = parseFloat(raw.replace(/[^0-9.-]/g, ''));
      if (isNaN(target)) return;
      const finalText = raw;
      let cur = 0;
      const frames = 20;
      const step = target / frames;
      let f = 0;
      const tick = () => {
        f++;
        cur = Math.min(target, step * f);
        if (isMoney) el.textContent = '£' + Math.round(cur).toLocaleString();
        else el.textContent = String(Math.round(cur));
        if (f < frames) requestAnimationFrame(tick);
        else el.textContent = finalText;
      };
      requestAnimationFrame(tick);
    });
  };
}

function patchNavReveal() {
  const origNav = window.nav;
  if (!origNav) return;
  window.nav = function (id, el) {
    origNav(id, el);
    const panel = document.getElementById('panel-' + id);
    if (panel) {
      panel.querySelectorAll('.card, .c, .brief-grid > div, .panel-hero').forEach((node, i) => {
        node.style.animation = 'none';
        node.offsetHeight;
        node.style.animation = `stag-in .5s ${i * 0.04}s ease both`;
      });
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLifeElite);
} else {
  initLifeElite();
}
