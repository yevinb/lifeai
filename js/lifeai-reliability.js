/* LifeAI Reliability — guards so buttons never silently fail */

function laSafe(fn, label) {
  return function (...args) {
    try {
      return fn.apply(this, args);
    } catch (e) {
      console.error(label || 'LifeAI error:', e);
      if (typeof toast === 'function') toast('Something went wrong — please try again', 'er');
    }
  };
}

function patchReliability() {
  /* Safe nav — panel must exist */
  if (typeof nav === 'function' && !window._navSafe) {
    window._navSafe = true;
    const orig = nav;
    window.nav = function (id, el) {
      const panel = document.getElementById('panel-' + id);
      if (!panel) {
        toast('That section is unavailable', 'er');
        return;
      }
      orig(id, el);
    };
  }

  /* Prevent double-submit on chat */
  const sbtn = document.getElementById('sbtn');
  if (sbtn && typeof sendChat === 'function' && !window._sendChatSafe) {
    window._sendChatSafe = true;
    const origSend = sendChat;
    window.sendChat = async function () {
      if (sbtn.disabled) return;
      await origSend();
    };
  }

  /* Offline hint */
  window.addEventListener('offline', () => toast('You\'re offline — changes save when you reconnect', 'in'));
  window.addEventListener('online', () => toast('Back online ✓', 'ok'));

  /* Unhandled errors — user-visible once */
  if (!window._laErrHook) {
    window._laErrHook = true;
    window.addEventListener('error', () => {
      if (typeof hideAppLoading === 'function') hideAppLoading();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(patchReliability, 200));
