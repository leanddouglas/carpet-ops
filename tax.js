/**
 * tax.js — Tax Preparation v3 (simplified: T2125 summary + expense breakdown + budget goals)
 * Event delegation on goals list — fixes delete bug
 */

const Tax = (() => {
  let editingGoalId = null;

  function fmt(n) { return '$' + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
  function pct(v, max) { return max ? Math.min(100, Math.round((v/max)*100)) : 0; }
  function setEl(id, v) { const e=document.getElementById(id); if(e) e.textContent=v; }

  function render() {
    const yyyy = DB.Calc.currentYear();
    const s    = DB.Settings.get();
    const sum  = DB.Calc.taxSummary(yyyy);

    document.getElementById('tax-year-label').textContent = `Tax Year ${yyyy} (${s.currency})`;
    setEl('tax-gross',       fmt(sum.gross));
    setEl('tax-expenses',    fmt(sum.expenses));
    setEl('tax-net',         fmt(sum.net));
    setEl('tax-itc',         fmt(sum.itc));
    setEl('tax-gst',         fmt(sum.gstOwed));
    setEl('tax-income-tax',  fmt(sum.taxOwed));
    setEl('tax-total-owing', fmt(sum.gstOwed + sum.taxOwed));

    renderExpenseBreakdown(yyyy);
    renderGoals();
  }

  function renderExpenseBreakdown(yyyy) {
    const txns = DB.Transactions.all().filter(t => t.type==='expense' && t.date.startsWith(yyyy) && t.accountType==='business');
    const byCat = {};
    txns.forEach(t => {
      if (!byCat[t.category]) byCat[t.category] = { amount:0, itc:0 };
      byCat[t.category].amount += t.amount;
      byCat[t.category].itc   += (t.gstItc || 0);
    });
    const sorted = Object.entries(byCat).sort((a,b) => b[1].amount - a[1].amount);
    const total  = sorted.reduce((s,[,v]) => s+v.amount, 0);
    const c = document.getElementById('expense-breakdown');
    if (!c) return;
    if (!sorted.length) { c.innerHTML='<p class="text-muted" style="padding:12px;text-align:center;">No business expenses yet.</p>'; return; }
    c.innerHTML = sorted.map(([cat, data]) => {
      const p    = pct(data.amount, total);
      const meta = DB.getExpenseCategoryMeta(cat);
      return `<div class="tax-row" style="align-items:center;">
        <span style="color:var(--gray-700);flex:1;">${cat}${meta.itc ? '<span style="font-size:9px;color:var(--green-600);margin-left:4px;">ITC</span>' : ''}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:60px;height:6px;background:var(--gray-200);border-radius:3px;overflow:hidden;">
            <div style="width:${p}%;height:100%;background:var(--blue-400);border-radius:3px;"></div>
          </div>
          <div style="text-align:right;min-width:72px;">
            <span class="tax-val text-red">${fmt(data.amount)}</span>
            ${data.itc ? `<div style="font-size:10px;color:var(--green-600);">ITC ${fmt(data.itc)}</div>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderGoals() {
    const goals = DB.Goals.all();
    const ym    = DB.Calc.currentMonth();
    const yyyy  = DB.Calc.currentYear();
    const c     = document.getElementById('goals-list');
    if (!c) return;
    if (!goals.length) {
      c.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">🎯</div><div class="empty-title">No budget goals</div><div class="empty-sub">Set monthly or yearly spending limits</div></div>`;
      return;
    }
    c.innerHTML = goals.map(g => {
      const spent = DB.Transactions.all()
        .filter(t => t.type==='expense' && t.category===g.category && t.accountType==='business' && t.date.startsWith(g.period==='monthly'?ym:yyyy))
        .reduce((s,t) => s+t.amount, 0);
      const p   = pct(spent, g.limit);
      const cls = p>=100 ? 'red' : p>=75 ? 'amber' : '';
      return `<div class="card" style="margin:8px 0;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:600;font-size:14px;">${g.category}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--gray-500);">${g.period}</span>
            <button class="txn-action-btn edit" data-action="edit-goal" data-id="${g.id}">✏️</button>
            <button class="txn-action-btn delete" data-action="del-goal" data-id="${g.id}">🗑️</button>
          </div>
        </div>
        <div class="progress-label-row">
          <span class="progress-label">${fmt(spent)} of ${fmt(g.limit)}</span>
          <span class="progress-pct" style="color:${p>=100?'var(--red-500)':p>=75?'var(--amber-500)':'var(--gray-700)'};">${p}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${cls}" style="width:${p}%"></div></div>
      </div>`;
    }).join('');
  }

  function openAddGoal() {
    editingGoalId = null;
    document.getElementById('goal-modal-title').textContent = 'Add Budget Goal';
    document.getElementById('goal-form').reset();
    populateGoalCats();
    document.getElementById('goal-modal').classList.add('open');
  }

  function editGoal(id) {
    const g = DB.Goals.all().find(g => g.id === id);
    if (!g) return;
    editingGoalId = id;
    document.getElementById('goal-modal-title').textContent = 'Edit Budget Goal';
    populateGoalCats();
    document.getElementById('goal-category').value = g.category;
    document.getElementById('goal-limit').value    = g.limit;
    document.getElementById('goal-period').value   = g.period;
    document.getElementById('goal-modal').classList.add('open');
  }

  function populateGoalCats() {
    document.getElementById('goal-category').innerHTML = DB.EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function saveGoal() {
    const cat   = document.getElementById('goal-category').value;
    const limit = parseFloat(document.getElementById('goal-limit').value);
    const period= document.getElementById('goal-period').value;
    if (!limit || limit <= 0) { App.toast('Enter a valid spending limit', 'error'); return; }
    if (editingGoalId) {
      DB.Goals.update(editingGoalId, { category:cat, limit, period });
      App.toast('Goal updated ✓', 'success');
    } else {
      DB.Goals.add({ category:cat, limit, period });
      App.toast('Goal added ✓', 'success');
    }
    document.getElementById('goal-modal').classList.remove('open');
    renderGoals();
  }

  function deleteGoal(id) {
    DB.Goals.delete(id);
    App.toast('Goal deleted', 'warning');
    renderGoals();
  }

  function exportTaxReport() {
    const yyyy = DB.Calc.currentYear();
    const sum  = DB.Calc.taxSummary(yyyy);
    const s    = DB.Settings.get();
    const txns = DB.Transactions.all().filter(t => t.date.startsWith(yyyy));
    let csv = `CRA T2125 Tax Report - ${yyyy}\n${s.businessName}\n${s.ownerName}\n\nSUMMARY\n`;
    csv += `Gross Business Income,${sum.gross}\nTotal Deductible Expenses,${sum.expenses}\nNet Business Income,${sum.net}\nGST ITC Credits,${sum.itc}\nNet GST Owing,${sum.gstOwed}\nEstimated Income Tax (25%),${sum.taxOwed}\n\n`;
    csv += `TRANSACTIONS\nDate,Type,Description,Category,Account,Amount,Owner Net,ITC\n`;
    csv += txns.map(t => `${t.date},${t.type},"${t.description}",${t.category},${t.accountType},${t.amount},${t.ownerNet??''},${t.gstItc??0}`).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type:'text/csv' })),
      download: `T2125-${yyyy}-${s.ownerName.replace(/ /g,'-')}.csv`,
    });
    a.click();
    App.toast('T2125 exported ✓', 'success');
  }

  // ── Event delegation — fixes all Tax delete bugs ──────────────────────────────
  function initEventDelegation() {
    const goalsList = document.getElementById('goals-list');
    if (goalsList) {
      goalsList.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action === 'edit-goal') editGoal(id);
        if (btn.dataset.action === 'del-goal')  deleteGoal(id);
      });
    }
    document.getElementById('goal-modal')?.addEventListener('click', e => {
      if (e.target.id === 'goal-modal') document.getElementById('goal-modal').classList.remove('open');
    });
  }

  function init() { render(); initEventDelegation(); }
  return { init, render, openAddGoal, editGoal, saveGoal, deleteGoal, exportTaxReport };
})();
