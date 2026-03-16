/**
 * personal.js — Personal & Household Dashboard v1
 * Selma (T4 Employee) + Douglas personal expenses
 * Donut charts, T4 tax breakdown, budget categories, savings ring
 */
const Personal = (() => {
  let activeUserId = null;
  const fmt = n => '$' + Math.abs(n||0).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const pct = (v,t) => t>0 ? Math.min(100,Math.round(v/t*100)) : 0;
  const eid = id => document.getElementById(id);

  // ── SVG Donut Ring ──────────────────────────────────────────────────────────
  function buildDonut(segments, size=100, stroke=14) {
    const r = (size-stroke)/2, cx=size/2, c = 2*Math.PI*r;
    let offset = 0;
    const arcs = segments.filter(s=>s.value>0).map(s => {
      const dash = (s.value/100)*c;
      const el = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none"
        stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${c}"
        stroke-dashoffset="${-offset*c/100}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cx})"/>`;
      offset += s.value;
      return el;
    });
    // Background ring
    const bg = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none"
      stroke="rgba(255,255,255,0.06)" stroke-width="${stroke}"/>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${arcs.join('')}</svg>`;
  }

  // ── Render budget donut ──────────────────────────────────────────────────────
  function renderBudgetDonut(userId) {
    const ym = DB.Calc.currentMonth();
    const spent = DB.PersonalTransactions.byCategory(ym, userId);
    const budgets = DB.PersonalBudgets.get(userId);
    const totSpent = Object.values(spent).reduce((s,v)=>s+v,0);
    const goals = DB.PersonalGoals.get(userId);
    const totalBudget = goals.monthlyBudget || 4000;

    // Build segments for top 5 categories
    const cats = DB.PERSONAL_CATEGORIES.filter(c=>c.id!=='savings')
      .map(c=>({...c, spent:spent[c.id]||0, budget:budgets[c.id]||0}))
      .filter(c=>c.spent>0)
      .sort((a,b)=>b.spent-a.spent);

    const segments = cats.slice(0,6).map(c=>({
      color: c.color,
      value: pct(c.spent, totalBudget)
    }));

    const donutEl = eid('personal-donut');
    if(donutEl) donutEl.innerHTML = buildDonut(segments, 120, 16);

    const donutLabel = eid('personal-donut-center');
    const remaining = Math.max(0, totalBudget-totSpent);
    if(donutLabel) donutLabel.innerHTML = `
      <div class="ring-center-val">${fmt(remaining)}</div>
      <div class="ring-center-label">REMAINING</div>`;

    const legendEl = eid('personal-donut-legend');
    if(legendEl) legendEl.innerHTML = cats.slice(0,5).map(c=>`
      <div class="ring-legend-item">
        <div class="ring-dot" style="background:${c.color}"></div>
        <span class="ring-legend-label">${c.label}</span>
        <span class="ring-legend-val">${fmt(c.spent)}</span>
      </div>`).join('');
  }

  // ── Render savings ring ──────────────────────────────────────────────────────
  function renderSavingsRing(userId) {
    const goals = DB.PersonalGoals.get(userId);
    const savePct = pct(goals.savedSoFar||0, goals.savingsTarget||12000);
    const emergPct = pct(goals.savedSoFar||0, goals.emergencyFund||6000);
    const segments = [{color:'#00d4ff', value:savePct}];
    const el = eid('savings-ring');
    if(el) el.innerHTML = buildDonut(segments, 100, 13);
    const lbl = eid('savings-ring-center');
    if(lbl) lbl.innerHTML = `<div class="ring-center-val" style="font-size:12px;">${savePct}%</div><div class="ring-center-label">SAVED</div>`;
    const setTxt = (id,v) => { const e=eid(id); if(e) e.textContent=v; };
    setTxt('savings-saved', fmt(goals.savedSoFar||0));
    setTxt('savings-target', fmt(goals.savingsTarget||12000));
    setTxt('savings-emerg', fmt(goals.emergencyFund||6000));
    setTxt('savings-emerg-pct', emergPct+'%');
  }

  // ── Render T4 breakdown ──────────────────────────────────────────────────────
  function renderT4(userId) {
    const user = DB.Users.get(userId);
    if(!user || user.role !== 'personal' || !user.t4) {
      const el = eid('t4-section'); if(el) el.style.display='none'; return;
    }
    const t4 = user.t4;
    const calc = DB.T4Calc.forEmployee(t4.grossSalary||0, t4.province||'BC');
    const perPay = t4.payPeriods||26;

    const setTxt = (id,v) => { const e=eid(id); if(e) e.textContent=v; };
    setTxt('t4-name', user.name+"'s T4 Summary");
    setTxt('t4-gross', fmt(calc.grossAnnual));
    setTxt('t4-net-annual', fmt(calc.netAnnual));
    setTxt('t4-net-biweekly', fmt(calc.netBiweekly));
    setTxt('t4-net-monthly', fmt(calc.netMonthly));
    setTxt('t4-cpp', fmt(calc.cpp));
    setTxt('t4-ei', fmt(calc.ei));
    setTxt('t4-fed-tax', fmt(calc.fedTax));
    setTxt('t4-prov-tax', fmt(calc.provTax));
    setTxt('t4-total-deductions', fmt(calc.totalDeductions));
    setTxt('t4-effective-rate', (calc.effectiveRate*100).toFixed(1)+'%');

    // T4 donut
    const grossA = calc.grossAnnual||1;
    const t4Segments = [
      {color:'#00d4ff', value:pct(calc.netAnnual, grossA)},
      {color:'#ff5252', value:pct(calc.totalTax, grossA)},
      {color:'#ffaa00', value:pct(calc.cpp, grossA)},
      {color:'#c07aff', value:pct(calc.ei, grossA)},
    ];
    const t4Ring = eid('t4-donut');
    if(t4Ring) t4Ring.innerHTML = buildDonut(t4Segments, 100, 13);
    const t4Center = eid('t4-donut-center');
    if(t4Center) t4Center.innerHTML = `<div class="ring-center-val" style="font-size:11px;">${(calc.effectiveRate*100).toFixed(0)}%</div><div class="ring-center-label">TAX RATE</div>`;
  }

  // ── Render monthly expense chart ─────────────────────────────────────────────
  function renderMonthlyChart(userId) {
    const months = [];
    const now = new Date();
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.push({label:d.toLocaleString('en-CA',{month:'short'}), ym,
        income: DB.PersonalTransactions.monthly(ym,'income',userId),
        expense: DB.PersonalTransactions.monthly(ym,'expense',userId)});
    }
    const maxVal = Math.max(...months.map(m=>Math.max(m.income,m.expense)),1);
    const el = eid('personal-chart');
    if(!el) return;
    el.innerHTML = `<div style="display:flex;align-items:flex-end;gap:5px;height:80px;padding:0 16px 0;">
      ${months.map(m=>`
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="width:100%;display:flex;gap:2px;align-items:flex-end;height:72px;">
            <div style="flex:1;background:rgba(0,230,118,.2);border-radius:3px 3px 0 0;height:${Math.max(4,m.income/maxVal*68)}px;min-height:4px;box-shadow:0 0 6px rgba(0,230,118,.2);"></div>
            <div style="flex:1;background:rgba(255,82,82,.25);border-radius:3px 3px 0 0;height:${Math.max(4,m.expense/maxVal*68)}px;min-height:4px;box-shadow:0 0 6px rgba(255,82,82,.25);"></div>
          </div>
          <div style="font-family:var(--font-hud);font-size:8px;color:var(--text3);">${m.label}</div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:16px;padding:4px 16px;justify-content:center;">
      <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text3);"><div style="width:10px;height:4px;border-radius:2px;background:rgba(0,230,118,.6);"></div>Income</div>
      <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text3);"><div style="width:10px;height:4px;border-radius:2px;background:rgba(255,82,82,.6);"></div>Expenses</div>
    </div>`;
  }

  // ── Render category list ─────────────────────────────────────────────────────
  function renderCategories(userId) {
    const ym = DB.Calc.currentMonth();
    const spent = DB.PersonalTransactions.byCategory(ym, userId);
    const budgets = DB.PersonalBudgets.get(userId);
    const el = eid('personal-categories');
    if(!el) return;
    const cats = DB.PERSONAL_CATEGORIES.filter(c=>c.id!=='savings');
    el.innerHTML = cats.map(c=>{
      const s=spent[c.id]||0, b=budgets[c.id]||0, p=b>0?pct(s,b):0;
      const over = b>0 && s>b;
      return `<div class="budget-cat-item">
        <div class="budget-cat-color" style="background:${c.color};"></div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="budget-cat-name">${c.label}</span>
            <span class="budget-cat-amt" style="color:${over?'var(--red)':s>0?'var(--text)':'var(--text3)'};">${s>0?fmt(s):'—'}</span>
          </div>
          ${b>0?`<div class="progress-track" style="margin-top:4px;">
            <div class="progress-fill" style="width:${p}%;background:${over?'var(--red)':c.color};box-shadow:0 0 6px ${c.color}55;"></div>
          </div>
          <div style="font-size:9px;color:var(--text3);margin-top:1px;">Budget: ${fmt(b)} ${over?'<span style="color:var(--red);">● OVER</span>':''}</div>`:''}
        </div>
      </div>`;
    }).join('');
  }

  // ── Render recent personal transactions ──────────────────────────────────────
  function renderRecentTxns(userId) {
    const el = eid('personal-recent-txns');
    if(!el) return;
    const txns = DB.PersonalTransactions.all(userId).slice(0,8);
    if(!txns.length){
      el.innerHTML='<div class="empty-state"><div class="empty-title">No transactions yet</div><div class="empty-sub">Add your first household expense below</div></div>';
      return;
    }
    el.innerHTML = txns.map(t=>{
      const cat = DB.PERSONAL_CATEGORIES.find(c=>c.id===t.category)||{icon:'📦',color:'#666'};
      return `<div class="txn-item" style="position:relative;">
        <div class="txn-icon ${t.type}" style="background:${cat.color}18;border-color:${cat.color}33;">
          <span style="font-size:17px;">${cat.icon}</span>
        </div>
        <div class="txn-body">
          <div class="txn-desc">${esc(t.description)}</div>
          <div class="txn-meta">${t.date} · ${cat.label}${t.receipt?` · <span style="color:var(--cyan)">📷</span>`:''}</div>
        </div>
        <span class="txn-amount ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</span>
        <button class="txn-action-btn delete" onclick="Personal.deleteTxn('${t.id}','${userId}')" title="Delete">${window.ICONS&&ICONS.delete||'🗑'}</button>
      </div>`;
    }).join('');
  }

  // ── Hero metrics row ──────────────────────────────────────────────────────────
  function renderHero(userId) {
    const ym = DB.Calc.currentMonth();
    const income  = DB.PersonalTransactions.monthly(ym,'income',userId);
    const expense = DB.PersonalTransactions.monthly(ym,'expense',userId);
    const goals   = DB.PersonalGoals.get(userId);
    const net     = income - expense;
    const user    = DB.Users.get(userId);
    const setTxt = (id,v) => { const e=eid(id); if(e) e.textContent=v; };
    setTxt('personal-hero-name', (user.name||'Personal')+' Dashboard');
    setTxt('personal-hero-amount', fmt(Math.max(0,net)));
    setTxt('personal-hero-income', fmt(income));
    setTxt('personal-hero-expense', fmt(expense));
    setTxt('personal-hero-budget', fmt(goals.monthlyBudget||0));
    const budgetPct = pct(expense, goals.monthlyBudget||4000);
    const fill = eid('personal-budget-fill');
    if(fill){ fill.style.width=budgetPct+'%'; fill.className='progress-fill '+(budgetPct>90?'red':budgetPct>70?'amber':'green'); }
    setTxt('personal-budget-pct', budgetPct+'% of monthly budget used');
  }

  // ── Open Add Transaction modal ────────────────────────────────────────────────
  function openAdd(type='expense', userId) {
    const uid = userId || activeUserId || DB.Users.activeId();
    const user = DB.Users.get(uid);
    document.getElementById('personal-txn-type').value = type;
    document.getElementById('personal-txn-userid').value = uid;
    document.getElementById('personal-txn-date').value = DB.today();
    document.getElementById('personal-txn-amount').value = '';
    document.getElementById('personal-txn-desc').value = '';
    document.getElementById('personal-txn-receipt-preview').innerHTML = '';
    // Populate categories
    const sel = document.getElementById('personal-txn-category');
    if(sel) sel.innerHTML = DB.PERSONAL_CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
    // Modal title
    const title = document.getElementById('personal-txn-modal-title');
    if(title) title.textContent = (type==='income'?'Add Income':'Add Expense')+' — '+user.name;
    document.getElementById('modal-personal-txn').classList.add('open');
  }

  function savePersonalTxn() {
    const userId = document.getElementById('personal-txn-userid').value;
    const type   = document.getElementById('personal-txn-type').value;
    const amount = parseFloat(document.getElementById('personal-txn-amount').value);
    const desc   = document.getElementById('personal-txn-desc').value.trim();
    const cat    = document.getElementById('personal-txn-category').value;
    const date   = document.getElementById('personal-txn-date').value;
    const receipt= document.getElementById('personal-txn-receipt-preview').dataset.base64||null;
    if(!amount||!desc) { App.showToast('Please fill in amount and description','error'); return; }
    DB.PersonalTransactions.add({type,amount,description:desc,category:cat,date,receipt}, userId);
    document.getElementById('modal-personal-txn').classList.remove('open');
    render(userId);
    App.showToast('Transaction saved ✓','success');
  }

  function deleteTxn(id, userId) {
    DB.PersonalTransactions.delete(id, userId);
    render(userId||activeUserId);
    App.showToast('Deleted','info');
  }

  // ── User switcher in personal screen ─────────────────────────────────────────
  function renderUserSwitcher() {
    const el = eid('personal-user-switcher');
    if(!el) return;
    const users = DB.Users.all();
    el.innerHTML = users.map(u=>`
      <button class="user-avatar${u.id===activeUserId?' active':''}"
        style="background:${u.color}22;color:${u.color};border-color:${u.color};${u.id===activeUserId?'box-shadow:0 0 10px '+u.color+'88;':''}"
        onclick="Personal.switchUser('${u.id}')">${u.avatar||u.name[0]}</button>
    `).join('');
  }

  function switchUser(userId) {
    activeUserId = userId;
    render(userId);
  }

  // ── Camera / Receipt capture ──────────────────────────────────────────────────
  function handleReceipt(inputEl) {
    const file = inputEl.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('personal-txn-receipt-preview');
      preview.innerHTML = `<img src="${e.target.result}" class="receipt-thumb" onclick="this.style.width=this.style.width==='100%'?'60px':'100%'">`;
      preview.dataset.base64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── Main render ───────────────────────────────────────────────────────────────
  function render(userId) {
    activeUserId = userId || DB.Users.activeId();
    renderUserSwitcher();
    renderHero(activeUserId);
    renderBudgetDonut(activeUserId);
    renderSavingsRing(activeUserId);
    renderT4(activeUserId);
    renderMonthlyChart(activeUserId);
    renderCategories(activeUserId);
    renderRecentTxns(activeUserId);
  }

  function init() { activeUserId = DB.Users.activeId(); render(activeUserId); }
  return { init, render, switchUser, openAdd, savePersonalTxn, deleteTxn, handleReceipt };
})();
