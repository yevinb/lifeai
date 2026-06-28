/* LifeAI Finance Pro — subscriptions, goals, cashflow, net worth */

function finFmt(n) {
  return '£' + (Number(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function finSubMonthly(s) {
  if (s.cycle === 'yearly') return s.amount / 12;
  if (s.cycle === 'weekly') return s.amount * 4.33;
  return s.amount;
}

function finMonthlyBurn() {
  return (S.subs || []).filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + finSubMonthly(s), 0);
}

function finUnusedSavings() {
  return (S.subs || []).filter(s => s.status === 'unused').reduce((sum, s) => sum + finSubMonthly(s), 0);
}

function finNetWorth() {
  const assets = (S.assets || []).reduce((a, x) => a + x.value, 0);
  const debt = (S.liabilities || []).reduce((a, x) => a + x.value, 0);
  return { assets, debt, net: assets - debt };
}

function finSavingsRate() {
  const income = S.profile?.monthlyIncome || 0;
  if (!income) return 0;
  const spend = S.exps.reduce((s, e) => s + parseFloat(e.amt), 0);
  const subs = finMonthlyBurn();
  return Math.max(0, Math.round(((income - spend - subs) / income) * 100));
}

function finWeekSpend() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return S.exps.filter(e => e.id >= weekAgo).reduce((s, e) => s + parseFloat(e.amt), 0);
}

function switchFinTab(tab) {
  document.querySelectorAll('.fin-tab').forEach(b => b.classList.toggle('on', b.dataset.fin === tab));
  document.querySelectorAll('.fin-pane').forEach(p => p.classList.toggle('on', p.id === 'fin-pane-' + tab));
}

function renderFinWeeklyWrap() {
  const el = document.getElementById('fin-weekly-wrap');
  if (!el) return;
  const save = finUnusedSavings();
  const burn = finMonthlyBurn();
  const rate = finSavingsRate();
  const nw = finNetWorth();
  el.innerHTML = `
    <div class="fin-wrap">
      <div class="fin-wrap-badge">Money snapshot</div>
      <div class="fin-wrap-head">${save > 0 ? `Cancel unused subs → save ${finFmt(save * 12)}/year` : `Subscription burn ${finFmt(burn)}/mo`}</div>
      <div class="fin-wrap-metrics">
        <div><span>Burn</span><strong>${finFmt(burn)}</strong></div>
        <div><span>Savings rate</span><strong>${rate || '—'}${rate ? '%' : ''}</strong></div>
        <div><span>Net worth</span><strong>${nw.net ? finFmt(nw.net) : '—'}</strong></div>
      </div>
    </div>`;
}

function updateFinanceCardsPro() {
  const budget = S.profile?.monthlyBudget || 2400;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthSpend = S.exps.filter(e => e.id >= monthStart.getTime()).reduce((s, e) => s + parseFloat(e.amt), 0);
  const pct = Math.min(Math.round(monthSpend / budget * 100), 100);
  const weekTotal = finWeekSpend();
  const rate = finSavingsRate();

  const budgetVal = document.getElementById('fin-budget-val');
  const budgetBar = document.getElementById('fin-budget-bar');
  const budgetLbl = document.getElementById('fin-budget-lbl');
  if (budgetVal) budgetVal.textContent = finFmt(budget);
  if (budgetBar) budgetBar.style.width = pct + '%';
  if (budgetLbl) budgetLbl.innerHTML = `<span>${finFmt(monthSpend)} spent</span><span>${finFmt(Math.max(budget - monthSpend, 0))} left</span>`;

  const weekVal = document.getElementById('fin-week-val');
  const weekSub = document.getElementById('fin-week-sub');
  if (weekVal) weekVal.textContent = weekTotal > 0 ? '−' + finFmt(weekTotal) : finFmt(0);
  if (weekSub) weekSub.textContent = weekTotal > 0 ? `${S.exps.filter(e => e.id >= Date.now() - 604800000).length} transactions` : 'No transactions yet';

  const rateVal = document.getElementById('fin-rate-val');
  const rateBar = document.getElementById('fin-rate-bar');
  const rateLbl = document.getElementById('fin-rate-lbl');
  if (rateVal) rateVal.textContent = (S.profile?.monthlyIncome ? rate + '%' : '—');
  if (rateBar) rateBar.style.width = Math.min(rate, 100) + '%';
  if (rateLbl) {
    const income = S.profile?.monthlyIncome || 0;
    const left = income ? income - monthSpend - finMonthlyBurn() : 0;
    rateLbl.innerHTML = `<span>${income ? finFmt(Math.max(left, 0)) + ' free' : 'Set income in Plan'}</span><span>Target: 25%</span>`;
  }

  const burnEl = document.getElementById('fin-burn-val');
  if (burnEl) burnEl.textContent = finFmt(finMonthlyBurn());
  const saveEl = document.getElementById('fin-save-val');
  if (saveEl) saveEl.textContent = finFmt(finUnusedSavings());

  const kvSpend = document.getElementById('kv-spend');
  if (kvSpend) kvSpend.textContent = finFmt(weekTotal);

  renderFinWeeklyWrap();
}

function renderSubs() {
  const list = document.getElementById('sub-list');
  const queue = document.getElementById('sub-queue');
  if (!list) return;

  const subs = S.subs || [];
  const burn = finMonthlyBurn();

  const banner = document.getElementById('sub-burn-banner');
  if (banner) {
    banner.innerHTML = `
      <div><div class="c-eye">Monthly subscription burn</div><div style="font-family:var(--mono);font-size:1.6rem;color:var(--gold);margin:6px 0">${finFmt(burn)}</div>
      <div style="font-size:.72rem;color:var(--warn)">${finFmt(burn * 12)}/year on autopilot</div></div>
      <div style="display:flex;gap:20px;text-align:center">
        <div><div style="font-family:var(--mono);font-size:1.2rem">${subs.filter(s=>s.status==='active').length}</div><div style="font-size:.65rem;color:var(--text-3)">Active</div></div>
        <div><div style="font-family:var(--mono);font-size:1.2rem;color:var(--warn)">${subs.filter(s=>s.status==='unused').length}</div><div style="font-size:.65rem;color:var(--text-3)">Unused</div></div>
      </div>`;
  }

  if (queue) {
    const unused = subs.filter(s => s.status === 'unused' || s.status === 'trial');
    if (!unused.length) { queue.innerHTML = ''; }
    else {
      const save = unused.reduce((s, x) => s + finSubMonthly(x), 0);
      queue.innerHTML = `
        <div class="fin-queue">
          <div style="margin-bottom:12px"><strong style="color:var(--gold)">Cancel queue</strong> · Save ${finFmt(save)}/mo (${finFmt(save * 12)}/yr)</div>
          <div class="fin-queue-grid">${unused.map(s => `
            <div class="fin-queue-card">
              <div style="font-weight:500;margin-bottom:4px">${escFin(s.name)}</div>
              <div style="color:var(--em);font-family:var(--mono);font-size:.85rem">Save ${finFmt(finSubMonthly(s))}/mo</div>
              <button class="btn btn-out" style="margin-top:10px;font-size:.72rem;padding:6px 10px" onclick="cancelSub(${s.id})">Mark cancelled</button>
            </div>`).join('')}</div>
        </div>`;
    }
  }

  list.innerHTML = subs.length ? '' : '<div style="color:var(--text-3);font-size:.8rem;padding:8px 0">No subscriptions yet.</div>';
  subs.forEach(s => {
    const row = document.createElement('div');
    row.className = 'ex-r';
    const st = s.status === 'unused' ? 'color:var(--warn)' : s.status === 'trial' ? 'color:var(--info)' : 'color:var(--em)';
    row.innerHTML = `
      <div class="ex-ic">◆</div>
      <div class="ex-inf"><div class="ex-n">${escFin(s.name)}</div><div class="ex-c">${escFin(s.category)} · <span style="${st}">${s.status}</span></div></div>
      <div class="ex-a" style="color:var(--text)">${finFmt(s.amount)}<span style="font-size:.65rem;color:var(--text-3)">/${s.cycle === 'yearly' ? 'yr' : 'mo'}</span></div>
      <button class="btn btn-out" style="font-size:.68rem;padding:4px 8px;margin-left:6px" onclick="markSubUnused(${s.id})">Cancel</button>
      <span class="t-del" onclick="delSub(${s.id})">✕</span>`;
    list.appendChild(row);
  });
}

function renderGoals() {
  const el = document.getElementById('goal-list');
  if (!el) return;
  const goals = S.goals || [];
  el.innerHTML = goals.length ? '' : '<div style="color:var(--text-3);font-size:.8rem">No goals yet — add your first savings target.</div>';
  goals.forEach(g => {
    const pct = Math.min(100, Math.round((g.current / g.target) * 100) || 0);
    const row = document.createElement('div');
    row.className = 'goal-card';
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <div><div style="font-weight:500">${escFin(g.name)}</div><div style="font-size:.72rem;color:var(--text-3);margin-top:4px">${finFmt(g.current)} of ${finFmt(g.target)}</div></div>
        <div style="font-family:var(--mono);font-size:1.4rem;color:var(--gold)">${pct}%</div>
      </div>
      <div class="pb"><div class="pf" style="width:${pct}%"></div></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-out" style="font-size:.72rem" onclick="addGoalProgress(${g.id},100)">+ £100</button>
        <button class="btn btn-out" style="font-size:.72rem;color:var(--danger)" onclick="delGoal(${g.id})">Delete</button>
      </div>`;
    el.appendChild(row);
  });
}

function renderCashflow() {
  const el = document.getElementById('cf-timeline');
  if (!el) return;
  const balance = S.profile?.cashBalance || 0;
  const income = S.profile?.monthlyIncome || 0;
  let bal = balance;
  const events = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const day = d.getDate();
    if (day === 1 && income) {
      bal += income * 0.6;
      events.push({ ds, label: 'Paycheck', amt: income * 0.6, type: 'in', bal });
    }
    if (day === 15 && income > 3000) {
      bal += income * 0.4;
      events.push({ ds, label: 'Paycheck', amt: income * 0.4, type: 'in', bal });
    }
    (S.subs || []).forEach(s => {
      if (s.renewalDate === ds && s.status !== 'cancelled') {
        const amt = finSubMonthly(s);
        bal -= amt;
        events.push({ ds, label: s.name, amt, type: 'out', bal });
      }
    });
  }

  const endBal = events.length ? events[events.length - 1].bal : bal;
  const lowest = events.length ? Math.min(balance, ...events.map(e => e.bal)) : balance;

  document.getElementById('cf-summary').innerHTML = `
    <div class="cf-stat"><span>Starting</span><strong>${finFmt(balance)}</strong></div>
    <div class="cf-stat"><span>30-day projection</span><strong>${finFmt(endBal)}</strong></div>
    <div class="cf-stat"><span>Lowest point</span><strong style="color:${lowest < 500 ? 'var(--danger)' : 'var(--em)'}">${finFmt(lowest)}</strong></div>`;

  el.innerHTML = events.slice(0, 12).map(e => `
    <div class="cf-row cf-${e.type}">
      <span>${e.ds.slice(5)}</span><span>${escFin(e.label)}</span>
      <span>${e.type === 'in' ? '+' : '−'}${finFmt(e.amt)}</span>
      <span style="color:var(--text-3)">${finFmt(e.bal)}</span>
    </div>`).join('') || '<div style="color:var(--text-3);font-size:.8rem">Set cash balance & income in Plan tab.</div>';
}

function renderFinanceAll() {
  updateFinanceCardsPro();
  renderSubs();
  renderGoals();
  renderCashflow();
}

function escFin(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

function addSubFromForm() {
  const name = document.getElementById('sub-name').value.trim();
  const amount = parseFloat(document.getElementById('sub-amt').value);
  const cycle = document.getElementById('sub-cycle').value;
  const status = document.getElementById('sub-status').value;
  const category = document.getElementById('sub-cat').value;
  if (!name || isNaN(amount) || amount <= 0) { toast('Enter name and amount', 'er'); return; }
  if (!S.subs) S.subs = [];
  const renewal = new Date();
  renewal.setDate(renewal.getDate() + 14);
  S.subs.push({
    id: Date.now(),
    name, amount, cycle, status, category,
    renewalDate: renewal.toISOString().slice(0, 10)
  });
  document.getElementById('sub-name').value = '';
  document.getElementById('sub-amt').value = '';
  renderFinanceAll();
  renderExps();
  if (window.saveToFirestore) saveToFirestore();
  toast('Subscription added ✓');
}

function markSubUnused(id) {
  const s = (S.subs || []).find(x => x.id === id);
  if (s) { s.status = 'unused'; renderFinanceAll(); if (window.saveToFirestore) saveToFirestore(); toast('Added to cancel queue'); }
}

function cancelSub(id) {
  S.subs = (S.subs || []).filter(x => x.id !== id);
  renderFinanceAll();
  if (window.saveToFirestore) saveToFirestore();
  toast('Removed — savings unlocked ✓');
}

function delSub(id) {
  S.subs = (S.subs || []).filter(x => x.id !== id);
  renderFinanceAll();
  if (window.saveToFirestore) saveToFirestore();
  toast('Subscription deleted');
}

function addGoalFromForm() {
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);
  const current = parseFloat(document.getElementById('goal-current').value) || 0;
  if (!name || isNaN(target) || target <= 0) { toast('Enter goal name and target', 'er'); return; }
  if (!S.goals) S.goals = [];
  S.goals.push({ id: Date.now(), name, target, current });
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-target').value = '';
  document.getElementById('goal-current').value = '';
  renderGoals();
  renderFinWeeklyWrap();
  if (window.saveToFirestore) saveToFirestore();
  toast('Goal created ✓');
}

function addGoalProgress(id, amt) {
  const g = (S.goals || []).find(x => x.id === id);
  if (g) { g.current = Math.min(g.target, g.current + amt); renderGoals(); if (window.saveToFirestore) saveToFirestore(); toast('+' + finFmt(amt)); }
}

function delGoal(id) {
  S.goals = (S.goals || []).filter(x => x.id !== id);
  renderGoals();
  if (window.saveToFirestore) saveToFirestore();
}

function saveFinProfile() {
  if (!S.profile) S.profile = {};
  S.profile.monthlyIncome = parseFloat(document.getElementById('prof-income').value) || 0;
  S.profile.cashBalance = parseFloat(document.getElementById('prof-cash').value) || 0;
  S.profile.monthlyBudget = parseFloat(document.getElementById('prof-budget').value) || 2400;
  renderFinanceAll();
  if (window.saveToFirestore) saveToFirestore();
  toast('Profile saved ✓');
}

function loadFinProfileFields() {
  const p = S.profile || {};
  const i = document.getElementById('prof-income');
  const c = document.getElementById('prof-cash');
  const b = document.getElementById('prof-budget');
  if (i) i.value = p.monthlyIncome || '';
  if (c) c.value = p.cashBalance || '';
  if (b) b.value = p.monthlyBudget || 2400;
}

function seedFinanceDemo() {
  if ((S.subs || []).length) return;
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  S.subs = [
    { id: 1, name: 'Netflix', amount: 15.49, cycle: 'monthly', status: 'active', category: 'Entertainment', renewalDate: addDays(12) },
    { id: 2, name: 'Adobe CC', amount: 54.99, cycle: 'monthly', status: 'unused', category: 'Productivity', renewalDate: addDays(20) },
    { id: 3, name: 'Spotify', amount: 10.99, cycle: 'monthly', status: 'active', category: 'Entertainment', renewalDate: addDays(5) }
  ];
  S.goals = [
    { id: 1, name: 'Emergency fund', target: 5000, current: 1200 },
    { id: 2, name: 'Holiday', target: 2000, current: 450 }
  ];
  S.profile = { monthlyIncome: 3200, cashBalance: 1850, monthlyBudget: 2400 };
  S.assets = [{ id: 1, name: 'Savings', value: 4200 }];
  S.liabilities = [{ id: 1, name: 'Credit card', value: 890 }];
}
