/**
 * dashboard.js — Command Center v4 (Wave-inspired)
 */
const Dashboard = (() => {
  let viewMonth = null; // null = current month

  function fmt(n) { return '$' + Math.abs(n).toLocaleString('en-CA', {minimumFractionDigits:2,maximumFractionDigits:2}); }
  function ym(offset=0) {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function navigate(dir) {
    const base = viewMonth || DB.Calc.currentMonth();
    const [y,m] = base.split('-').map(Number);
    const d = new Date(y, m-1+dir, 1);
    viewMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (viewMonth === DB.Calc.currentMonth()) viewMonth = null;
    render();
  }
  function backToCurrentMonth() { viewMonth = null; render(); }

  function render() {
    const vm = viewMonth || DB.Calc.currentMonth();
    const [yr, mo] = vm.split('-').map(Number);
    const monthLabel = new Date(yr, mo-1, 15).toLocaleString('en-CA', {month:'long',year:'numeric'});
    const s = DB.Settings.get();
    const txLabel = DB.Settings.getTaxLabel();

    // Month nav
    const el = id => document.getElementById(id);
    const setTxt = (id,v) => { const e=el(id); if(e) e.textContent=v; };
    setTxt('dash-month-label', monthLabel);
    const todayBtn = el('dash-to-current');
    if (todayBtn) todayBtn.style.display = viewMonth ? 'block' : 'none';

    // Calculations
    const gross    = DB.Transactions.monthly(vm,'income');
    const ownerNet = DB.Transactions.monthlyOwnerNet(vm);
    const expenses = DB.Transactions.monthly(vm,'expense');
    const itc      = DB.Transactions.monthlyITC(vm);
    const gstCollected = DB.Transactions.monthlyGSTCollected(vm);
    const gstOwed  = Math.max(0, gstCollected - itc);
    const netKeep  = ownerNet - gstOwed;
    const monthHrs = DB.TimeLogs.monthlyHours(vm);
    const hrsEarn  = DB.TimeLogs.monthlyEarnings(vm);
    const outstanding = DB.Invoices.totalOutstanding();
    const overdue  = DB.Invoices.totalOverdue();

    // Greeting (only if current month)
    if (!viewMonth) {
      const h = new Date().getHours();
      const greeting = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
      setTxt('hero-greeting', `👋 ${greeting}, ${(s.ownerName||'').split(' ')[0]||'there'}`);
    } else {
      setTxt('hero-greeting', `📅 ${monthLabel}`);
    }
    setTxt('hero-amount', fmt(Math.max(0,netKeep)));
    setTxt('hero-date', !viewMonth ? new Date().toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'}) : '');

    // Metrics
    setTxt('metric-income',   fmt(gross));
    setTxt('metric-owner-net',fmt(ownerNet));
    setTxt('metric-expenses', fmt(expenses));
    setTxt('metric-gst',      fmt(gstOwed));
    setTxt('metric-itc',      fmt(itc));
    setTxt('metric-hours',    monthHrs.toFixed(1)+'h / '+fmt(hrsEarn));

    // Outstanding invoices
    setTxt('metric-outstanding', fmt(outstanding));
    setTxt('metric-overdue',     fmt(overdue));

    // Progress bars
    const goalPct = s.annualGoal ? Math.min(100,Math.round((gross/(s.annualGoal/12))*100)) : 0;
    const revLabel = el('progress-revenue-label');
    if (revLabel) revLabel.textContent = `${fmt(gross)} of ${fmt(s.annualGoal/12)} monthly target — ${goalPct}%`;
    const fill = el('progress-revenue');
    if (fill) fill.style.width = goalPct + '%';

    const reservePct = s.reserveGoal ? Math.min(100,Math.round((DB.Calc.cashFlowReserve()/s.reserveGoal)*100)) : 0;
    const resLabel = el('progress-reserve-label');
    if (resLabel) resLabel.textContent = `${fmt(DB.Calc.cashFlowReserve())} of ${fmt(s.reserveGoal)} reserve — ${reservePct}%`;
    const resFill = el('progress-reserve');
    if (resFill) resFill.style.width = reservePct + '%';

    // Revenue chart (6 months)
    renderChart();

    // Service breakdown
    renderServiceBreakdown(vm);

    // Net-to-keep formula
    setTxt('nk-gross', fmt(gross));
    setTxt('nk-owner', fmt(ownerNet));
    setTxt('nk-gst',   fmt(gstOwed));
    setTxt('nk-itc',   fmt(itc));
    setTxt('nk-result',fmt(netKeep));

    // GST filing
    const gstDays = DB.Calc.daysUntilGST();
    setTxt('gst-days',   gstDays + ' days');
    setTxt('gst-date',   DB.Calc.nextGSTFiling().toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'}));
    setTxt('gst-amount', fmt(gstOwed));
    setTxt('gst-itc-display', fmt(itc));

    // Alerts
    renderAlerts(overdue, gstDays, gstOwed, ownerNet, expenses);

    // Recent transactions
    renderRecentTxns();
  }

  function renderChart() {
    const months = DB.Transactions.last6MonthsRevenue();
    const max = Math.max(...months.map(m=>m.amount),1);
    const c = document.getElementById('revenue-chart');
    if (!c) return;
    c.innerHTML = months.map(m => {
      const h = Math.max(8, Math.round((m.amount/max)*72));
      return `<div class="chart-bar-wrap">
        <div class="chart-bar-amt">${m.amount>0?'$'+Math.round(m.amount/1000)+'k':''}</div>
        <div class="chart-bar ${m.amount>0?'fill':''}" style="height:${h}px;" title="${m.label}: $${m.amount.toFixed(0)}"></div>
        <div class="chart-label">${m.label}</div>
      </div>`;
    }).join('');
  }

  function renderServiceBreakdown(vm) {
    const yyyy = vm.slice(0,4);
    const byService = DB.Calc.revenueByService(yyyy);
    const c = document.getElementById('service-breakdown');
    if (!c) return;
    if (!byService.length) { c.innerHTML='<p style="padding:12px 16px;font-size:13px;color:var(--text3);">No income recorded yet.</p>'; return; }
    c.innerHTML = byService.map(s => `<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border2);">
      <div style="width:32px;height:32px;border-radius:8px;background:${s.color}22;border:1px solid ${s.color}44;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${s.icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text);">${s.label}</div>
        <div style="height:4px;background:var(--border2);border-radius:2px;margin-top:4px;overflow:hidden;">
          <div style="width:${s.pct}%;height:100%;background:${s.color};border-radius:2px;box-shadow:0 0 6px ${s.color}66;"></div>
        </div>
      </div>
      <div style="text-align:right;min-width:80px;">
        <div style="font-family:var(--font-hud);font-size:13px;font-weight:700;color:var(--text);">${fmt(s.amount)}</div>
        <div style="font-size:11px;color:var(--cyan);">${fmt(s.ownerNet)} yours</div>
      </div>
    </div>`).join('');
  }

  function renderAlerts(overdue, gstDays, gstOwed, income, expenses) {
    const c = document.getElementById('alerts-container');
    if (!c) return;
    const alerts = [];
    if (overdue > 0) alerts.push({cls:'danger',icon:'🚨',msg:`${fmt(overdue)} in overdue invoices — follow up now`});
    if (gstDays <= 30 && gstOwed > 0) alerts.push({cls:'warning',icon:'📅',msg:`${DB.Settings.getTaxLabel()} filing due in ${gstDays} days — ${fmt(gstOwed)} owing`});
    if (income > 0 && expenses/income > 0.6) alerts.push({cls:'warning',icon:'⚠️',msg:`Expenses are ${Math.round(expenses/income*100)}% of income this month`});
    if (!DB.Invoices.all().length) alerts.push({cls:'info',icon:'💡',msg:'Create & send your first invoice to start tracking receivables'});
    if (!alerts.length) alerts.push({cls:'success',icon:'✅',msg:'All caught up! Your books look healthy.'});
    c.innerHTML = alerts.map(a=>`<div class="alert-item ${a.cls}"><span class="alert-icon">${a.icon}</span>${a.msg}</div>`).join('');
  }

  function renderRecentTxns() {
    const c = document.getElementById('recent-txns');
    if (!c) return;
    const txns = DB.Transactions.all().slice(0,5);
    if (!txns.length) { c.innerHTML='<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">No transactions yet</div>'; return; }
    c.innerHTML = txns.map(t => `<div style="display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--border2);background:var(--surface);">
      <div class="txn-icon ${t.type}" style="display:flex;align-items:center;justify-content:center;">${t.type==='income'?ICONS.addIncome:ICONS.addExpense}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.description)}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">${t.date} · <span style="color:${t.accountType==='personal'?'#aa44ff':'var(--cyan)'}">${t.accountType}</span></div>
      </div>
      <div style="font-family:var(--font-hud);font-size:13px;font-weight:700;color:${t.type==='income'?'var(--green)':'var(--red)'};">  ${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
    </div>`).join('');
  }

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function init() { render(); }
  return { init, render, navigate, backToCurrentMonth };
})();
