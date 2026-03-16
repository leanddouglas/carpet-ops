/**
 * ledger.js — Business Ledger v3
 * - Event delegation (no inline onclick) — fixes all delete bugs
 * - Hours Worked tab built in (replaces Tracker)
 * - No confirm() dialogs
 */

const Ledger = (() => {
  let ledgerTab      = 'transactions'; // 'transactions' | 'hours'
  let currentFilter  = 'all';
  let currentSearch  = '';
  let editingId      = null;
  let editingHoursId = null;
  let receiptDataUrl = null;

  function fmt(n) { return '$' + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits:2, maximumFractionDigits:2 }); }

  // ── Main render ─────────────────────────────────────────────────────────────
  function render() {
    if (ledgerTab === 'hours') { renderHours(); return; }
    renderTransactions();
  }

  // ── Tab switcher ─────────────────────────────────────────────────────────────
  function switchTab(tab) {
    ledgerTab = tab;
    document.querySelectorAll('#ledger-screen .ledger-tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab)
    );
    document.getElementById('ledger-txn-section').style.display   = tab==='transactions' ? '' : 'none';
    document.getElementById('ledger-hours-section').style.display = tab==='hours' ? '' : 'none';
    render();
  }

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────────
  function renderTransactions() {
    const filters = {};
    if (currentFilter==='income')   filters.type='income';
    if (currentFilter==='expense')  filters.type='expense';
    if (currentFilter==='business') filters.accountType='business';
    if (currentFilter==='personal') filters.accountType='personal';
    const txns = DB.Transactions.search(currentSearch, filters);
    const container = document.getElementById('ledger-list');
    if (!container) return;

    if (!txns.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No transactions</div><div class="empty-sub">Add income or expenses to get started</div></div>`;
      renderSummary([], []);
      return;
    }

    const catIcons = {
      'Carpet Cleaning':'🧹','Tile & Grout Cleaning':'🪣','Upholstery Cleaning':'🛋️','Area Rug Cleaning':'🪤',
      'Commercial Service':'🏢','Hourly Service':'⏱️','Referral Bonus':'🤝','Other Income':'💰',
      'Cleaning Supplies':'🧴','Equipment Repair':'🔧','Equipment Purchase':'🖥️','Vehicle Fuel':'⛽',
      'Vehicle Maintenance':'🔩','Insurance':'🛡️','Marketing':'📢','Software & Subscriptions':'💻',
      'Professional Fees':'👔','Office Supplies':'📎','Training & Certification':'🎓','Uniforms & PPE':'🦺',
      'Utilities':'💡','Meals & Entertainment':'🍽️','Home Office':'🏠','Cell Phone (Business %)':'📱',
      'Personal - Other':'👤','Other':'📌',
    };

    const groups = {};
    txns.forEach(t => { if (!groups[t.date]) groups[t.date]=[]; groups[t.date].push(t); });

    container.innerHTML = Object.keys(groups).sort((a,b)=>b.localeCompare(a)).map(date => {
      const label = fmtDateLabel(date);
      const items = groups[date].map(t => {
        const icon = catIcons[t.category] || (t.type==='income'?'💵':'💸');
        const sign = t.type==='income' ? '+' : '-';
        const splitBadge = (t.type==='income' && t.ownerNet!=null)
          ? `<span style="font-size:10px;color:var(--teal-500);font-weight:600;margin-left:4px;">→ ${fmt(t.ownerNet)} yours</span>` : '';
        const itcBadge = (t.type==='expense' && t.gstPaid && t.gstItc)
          ? `<span style="font-size:10px;color:var(--green-600);font-weight:600;margin-left:4px;">ITC ${fmt(t.gstItc)}</span>` : '';
        return `<div class="txn-item" data-id="${esc(t.id)}" tabindex="0">
          <div class="txn-icon ${t.type}">${icon}</div>
          <div class="txn-body">
            <div class="txn-desc">${esc(t.description)}${splitBadge}${itcBadge}</div>
            <div class="txn-meta"><span class="txn-tag ${t.accountType}">${t.accountType}</span>${esc(t.category)}${t.gstIncluded?' · GST':''}${t.gstPaid?' · ITC':''}</div>
          </div>
          <div class="txn-actions">
            <button class="txn-action-btn edit" data-action="edit-txn" data-id="${esc(t.id)}" title="Edit">✏️</button>
            <button class="txn-action-btn delete" data-action="del-txn" data-id="${esc(t.id)}" title="Delete">🗑️</button>
          </div>
          <div class="txn-amount ${t.type}">${sign}${fmt(t.amount)}</div>
        </div>`;
      }).join('');
      return `<div class="txn-date-group"><div class="txn-date-label">${label}</div>${items}</div>`;
    }).join('');

    renderSummary(txns.filter(t=>t.type==='income'), txns.filter(t=>t.type==='expense'));
  }

  function renderSummary(income, expenses) {
    const totalIn  = income.reduce((s,t)=>s+t.amount,0);
    const totalOut = expenses.reduce((s,t)=>s+t.amount,0);
    const ownerNet = income.reduce((s,t)=>s+(t.ownerNet!=null?t.ownerNet:t.amount),0);
    const totalItc = expenses.reduce((s,t)=>s+(t.gstItc||0),0);
    const net = totalIn - totalOut;
    const el = document.getElementById('ledger-summary');
    if (!el) return;
    el.innerHTML = `<div style="display:flex;gap:0;padding:8px 16px 4px;font-size:12px;border-bottom:1px solid var(--gray-100);">
      <div style="flex:1;text-align:center;padding:6px;border-right:1px solid var(--gray-100);">
        <div style="font-weight:800;color:var(--green-600);font-size:15px;">${fmt(totalIn)}</div>
        <div style="color:var(--gray-500);font-size:10px;">Gross Income</div>
        <div style="color:var(--teal-500);font-size:10px;">${fmt(ownerNet)} yours</div>
      </div>
      <div style="flex:1;text-align:center;padding:6px;border-right:1px solid var(--gray-100);">
        <div style="font-weight:800;color:var(--red-500);font-size:15px;">${fmt(totalOut)}</div>
        <div style="color:var(--gray-500);font-size:10px;">Expenses</div>
        <div style="color:var(--green-600);font-size:10px;">ITC ${fmt(totalItc)}</div>
      </div>
      <div style="flex:1;text-align:center;padding:6px;">
        <div style="font-weight:800;color:${net>=0?'var(--blue-600)':'var(--red-500)'};font-size:15px;">${net>=0?'+':'-'}${fmt(Math.abs(net))}</div>
        <div style="color:var(--gray-500);font-size:10px;">Net</div>
      </div>
    </div>`;
  }

  // ── HOURS LOG ─────────────────────────────────────────────────────────────────
  function renderHours() {
    const logs = DB.TimeLogs.all();
    const ym = DB.Calc.currentMonth();
    const monthlyHrs = DB.TimeLogs.monthlyHours(ym);
    const splits = DB.Settings.getSplits();
    const hourlyRate = splits.hourlyRate || 25;

    const container = document.getElementById('hours-log-list');
    if (!container) return;

    // Summary
    const sumEl = document.getElementById('hours-summary');
    if (sumEl) {
      const monthlyEarnings = monthlyHrs * hourlyRate;
      sumEl.innerHTML = `<div style="display:flex;gap:0;padding:8px 16px 4px;font-size:12px;border-bottom:1px solid var(--gray-100);">
        <div style="flex:1;text-align:center;padding:6px;border-right:1px solid var(--gray-100);">
          <div style="font-weight:800;color:var(--blue-600);font-size:15px;">${monthlyHrs.toFixed(1)}</div>
          <div style="color:var(--gray-500);font-size:10px;">Hours this month</div>
        </div>
        <div style="flex:1;text-align:center;padding:6px;">
          <div style="font-weight:800;color:var(--green-600);font-size:15px;">${fmt(monthlyEarnings)}</div>
          <div style="color:var(--gray-500);font-size:10px;">Earnings @ $${hourlyRate}/hr</div>
        </div>
      </div>`;
    }

    if (!logs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏱️</div><div class="empty-title">No hours logged</div><div class="empty-sub">Use the form above to log hours worked</div></div>`;
      return;
    }

    container.innerHTML = logs.map(l => {
      const hrs   = l.durationMs ? (l.durationMs / 3600000).toFixed(2) : (l.hours || 0);
      const rate  = l.hourlyRate || hourlyRate;
      const total = parseFloat(hrs) * rate;
      const dateStr = l.date || l.startTime?.slice(0,10) || '—';
      return `<div class="txn-item" data-id="${esc(l.id)}">
        <div class="txn-icon income">⏱️</div>
        <div class="txn-body">
          <div class="txn-desc">${esc(l.notes || l.description || 'Hours worked')}</div>
          <div class="txn-meta">${dateStr} · ${parseFloat(hrs).toFixed(2)} hrs @ $${rate}/hr</div>
        </div>
        <div class="txn-actions">
          <button class="txn-action-btn delete" data-action="del-log" data-id="${esc(l.id)}" title="Delete">🗑️</button>
        </div>
        <div class="txn-amount income">+${fmt(total)}</div>
      </div>`;
    }).join('');
  }

  function logHours() {
    const date  = document.getElementById('hours-date').value;
    const hrs   = parseFloat(document.getElementById('hours-amount').value);
    const rate  = parseFloat(document.getElementById('hours-rate').value) || DB.Settings.getSplits().hourlyRate || 25;
    const desc  = document.getElementById('hours-desc').value.trim() || 'Hours worked';

    if (!date)       { App.toast('Please select a date', 'error'); return; }
    if (!hrs || hrs <= 0) { App.toast('Please enter valid hours', 'error'); return; }

    const durationMs = hrs * 3600000;
    DB.TimeLogs.add({ startTime: date + 'T08:00:00.000Z', endTime: date + 'T08:00:00.000Z', durationMs, hours: hrs, hourlyRate: rate, notes: desc, description: desc, date });
    document.getElementById('hours-date').value = DB.today();
    document.getElementById('hours-amount').value = '';
    document.getElementById('hours-rate').value = rate;
    document.getElementById('hours-desc').value = '';
    App.toast(`${hrs} hrs logged → ${fmt(hrs*rate)} earned ✓`, 'success');
    renderHours();
    Dashboard.render();
  }

  function deleteLog(id) {
    DB.TimeLogs.delete(id);
    App.toast('Hour log removed', 'warning');
    renderHours();
    Dashboard.render();
  }

  // ── Modal open/close/save ─────────────────────────────────────────────────────
  function openAddIncome()  { editingId=null; receiptDataUrl=null; prepModal('income'); }
  function openAddExpense() { editingId=null; receiptDataUrl=null; prepModal('expense'); }

  function prepModal(type) {
    document.getElementById('txn-modal-title').textContent = editingId ? 'Edit Transaction' : (type==='income'?'Add Income':'Add Expense');
    document.getElementById('txn-type').value = type;
    if (!editingId) {
      document.getElementById('txn-form').reset();
      document.getElementById('txn-date').value = DB.today();
      setSegActive('business');
      document.getElementById('receipt-preview-wrap').innerHTML = '';
      document.getElementById('receipt-upload-area').style.display = 'block';
    }
    populateCategorySelect(type);
    populateServiceType(type);
    updateGSTRow(type);
    updateITCRow(type);
    updateHoursRow();
    updateSplitPreview();
    document.getElementById('txn-modal').classList.add('open');
    setTimeout(() => document.getElementById('txn-amount')?.focus(), 150);
  }

  function openEdit(id) {
    const t = DB.Transactions.all().find(tx => tx.id === id);
    if (!t) return;
    editingId = id;
    receiptDataUrl = t.receipt || null;
    prepModal(t.type);
    document.getElementById('txn-amount').value      = t.amount;
    document.getElementById('txn-description').value = t.description;
    document.getElementById('txn-category').value    = t.category;
    document.getElementById('txn-date').value        = t.date;
    document.getElementById('txn-notes').value       = t.notes || '';
    document.getElementById('txn-gst').checked       = !!t.gstIncluded;
    const gstPaidEl = document.getElementById('txn-gst-paid');
    if (gstPaidEl) gstPaidEl.checked = !!t.gstPaid;
    const stEl = document.getElementById('txn-service-type');
    if (stEl && t.serviceType) stEl.value = t.serviceType;
    const hrsEl = document.getElementById('txn-hours');
    if (hrsEl && t.hours) hrsEl.value = t.hours;
    setSegActive(t.accountType || 'business');
    if (receiptDataUrl) showReceiptPreview(receiptDataUrl);
    updateAutoAccountType();
    updateSplitPreview();
  }

  function closeModal() { document.getElementById('txn-modal').classList.remove('open'); editingId=null; receiptDataUrl=null; }

  function saveTransaction() {
    const type   = document.getElementById('txn-type').value;
    const amount = parseFloat(document.getElementById('txn-amount').value);
    const desc   = document.getElementById('txn-description').value.trim();
    const cat    = document.getElementById('txn-category').value;
    const date   = document.getElementById('txn-date').value;
    const notes  = document.getElementById('txn-notes').value.trim();
    const gst    = document.getElementById('txn-gst').checked;
    const gstPaid= document.getElementById('txn-gst-paid')?.checked || false;
    const acct   = document.querySelector('#txn-modal .seg-btn.active')?.dataset.val || 'business';
    const st     = document.getElementById('txn-service-type')?.value || null;
    const hours  = parseFloat(document.getElementById('txn-hours')?.value) || null;

    if (!amount || amount <= 0) { App.toast('Please enter a valid amount', 'error'); return; }
    if (!desc)   { App.toast('Please enter a description', 'error'); return; }
    if (!date)   { App.toast('Please select a date', 'error'); return; }

    const data = { type, amount, description:desc, category:cat, date, notes, gstIncluded:gst, gstPaid, accountType:acct, serviceType:(type==='income'?st:null), hours:(st==='hourly'?hours:null), receipt:receiptDataUrl };
    if (editingId) {
      DB.Transactions.update(editingId, data);
      App.toast('Transaction updated ✓', 'success');
    } else {
      DB.Transactions.add(data);
      App.toast('Transaction added ✓', 'success');
    }
    closeModal();
    render();
    Dashboard.render();
  }

  function deleteTransaction(id) {
    DB.Transactions.delete(id);
    App.toast('Deleted', 'warning');
    render();
    Dashboard.render();
  }

  // ── Form helpers ──────────────────────────────────────────────────────────────
  function populateCategorySelect(type) {
    const cats = type==='income' ? DB.INCOME_CATEGORIES : DB.EXPENSE_CATEGORIES;
    document.getElementById('txn-category').innerHTML = cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }

  function populateServiceType(type) {
    const wrap = document.getElementById('service-type-wrap');
    if (!wrap) return;
    wrap.style.display = type==='income' ? 'block' : 'none';
    const sel = document.getElementById('txn-service-type');
    if (sel) sel.innerHTML = DB.SERVICE_TYPES.map(s => {
      const splits = DB.Settings.getSplits();
      const label = s.split ? Math.round(s.split*100)+'% split' : `$${splits.hourlyRate||25}/hr`;
      return `<option value="${s.id}">${s.icon} ${s.label} (${label})</option>`;
    }).join('');
  }

  function updateGSTRow(type)  { const el=document.getElementById('gst-toggle-row'); if(el) el.style.display = type==='income'?'flex':'none'; }
  function updateITCRow(type)  { const el=document.getElementById('itc-toggle-row'); if(el) el.style.display = type==='expense'?'flex':'none'; }

  function updateHoursRow() {
    const st   = document.getElementById('txn-service-type')?.value;
    const wrap = document.getElementById('hours-wrap');
    if (wrap) wrap.style.display = (st==='hourly') ? 'block' : 'none';
    updateSplitPreview();
  }

  function updateSplitPreview() {
    const type  = document.getElementById('txn-type')?.value;
    const amt   = parseFloat(document.getElementById('txn-amount')?.value) || 0;
    const st    = document.getElementById('txn-service-type')?.value || '';
    const hrs   = parseFloat(document.getElementById('txn-hours')?.value) || 0;
    const el    = document.getElementById('split-preview');
    if (!el || type!=='income') { if(el) el.style.display='none'; return; }
    const net = DB.Calc.netToKeepSingle(amt, st, hrs);
    const splits = DB.Settings.getSplits();
    const splitLabel = st==='hourly'
      ? `$${splits.hourlyRate||25}/hr × ${hrs}hrs`
      : (splits[st] ? Math.round(splits[st]*100)+'%' : '65%') + ' split';
    el.style.display = (amt>0||hrs>0) ? 'block' : 'none';
    el.innerHTML = `<div style="background:var(--blue-50);border-radius:8px;padding:10px 12px;margin-bottom:8px;">
      <div style="font-size:11px;color:var(--gray-500);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">Your share (${splitLabel})</div>
      <div style="font-size:20px;font-weight:800;color:var(--blue-600);">$${net.toFixed(2)}</div>
    </div>`;
  }

  function updateAutoAccountType() {
    const type = document.getElementById('txn-type')?.value;
    const cat  = document.getElementById('txn-category')?.value;
    if (type==='expense') {
      const meta = DB.getExpenseCategoryMeta(cat);
      setSegActive(meta.personal ? 'personal' : 'business');
    }
  }

  function setSegActive(val) {
    document.querySelectorAll('#txn-modal .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val===val));
  }

  // ── Receipt ───────────────────────────────────────────────────────────────────
  function handleReceiptUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { App.toast('Image too large (max 3MB)', 'error'); return; }
    const r = new FileReader();
    r.onload = e => { receiptDataUrl=e.target.result; document.getElementById('receipt-upload-area').style.display='none'; showReceiptPreview(receiptDataUrl); };
    r.readAsDataURL(file);
  }

  function showReceiptPreview(url) {
    document.getElementById('receipt-preview-wrap').innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
      <img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:2px solid var(--gray-200);">
      <div><div style="font-size:12px;font-weight:600;color:var(--green-600);">✓ Receipt attached</div>
      <button data-action="remove-receipt" class="btn btn-sm btn-secondary" style="margin-top:4px;">Remove</button></div></div>`;
  }

  function removeReceipt() {
    receiptDataUrl = null;
    document.getElementById('receipt-preview-wrap').innerHTML = '';
    document.getElementById('receipt-upload-area').style.display = 'block';
    document.getElementById('receipt-file-input').value = '';
  }

  function exportCSV() {
    const txns = DB.Transactions.all();
    const csv = [['Date','Type','Description','Category','Account','Amount','Owner Net','Service Type','GST Included','GST Paid','ITC','Notes']]
      .concat(txns.map(t=>[t.date,t.type,`"${t.description}"`,t.category,t.accountType,t.amount,t.ownerNet??'',t.serviceType??'',t.gstIncluded,t.gstPaid,t.gstItc??0,`"${t.notes||''}"`]))
      .map(r=>r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})),
      download: `cto-ledger-${DB.today()}.csv`,
    });
    a.click();
    App.toast('CSV exported ✓', 'success');
  }

  function fmtDateLabel(iso) {
    const d=new Date(iso+'T12:00:00'), t=new Date(); t.setHours(12,0,0,0);
    const y=new Date(t); y.setDate(y.getDate()-1);
    if (d.toDateString()===t.toDateString()) return 'Today';
    if (d.toDateString()===y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-CA',{weekday:'long',month:'short',day:'numeric'});
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ── Event Delegation (key bug fix — no inline onclick) ────────────────────────
  function initEventDelegation() {
    // Ledger list (transactions)
    const ledgerList = document.getElementById('ledger-list');
    if (ledgerList) {
      ledgerList.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id  = btn.dataset.id;
        if (btn.dataset.action === 'edit-txn') openEdit(id);
        if (btn.dataset.action === 'del-txn')  deleteTransaction(id);
      });
    }

    // Hours log list
    const hoursList = document.getElementById('hours-log-list');
    if (hoursList) {
      hoursList.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        if (btn.dataset.action === 'del-log') deleteLog(btn.dataset.id);
      });
    }

    // Receipt remove (inside modal, dynamic)
    document.getElementById('receipt-preview-wrap')?.addEventListener('click', e => {
      if (e.target.closest('[data-action="remove-receipt"]')) removeReceipt();
    });

    // Modal overlay click to close
    document.getElementById('txn-modal')?.addEventListener('click', e => {
      if (e.target.id === 'txn-modal') closeModal();
    });

    // Filter chips
    document.querySelectorAll('#ledger-screen .chip').forEach(c => c.addEventListener('click', () => {
      document.querySelectorAll('#ledger-screen .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      currentFilter = c.dataset.filter;
      renderTransactions();
    }));

    // Search
    document.getElementById('ledger-search')?.addEventListener('input', e => {
      currentSearch = e.target.value;
      renderTransactions();
    });

    // Ledger tab buttons
    document.querySelectorAll('#ledger-screen .ledger-tab-btn').forEach(b => {
      b.addEventListener('click', () => switchTab(b.dataset.tab));
    });

    // Segment buttons
    document.querySelectorAll('#txn-modal .seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#txn-modal .seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
    });

    // Service type change
    document.getElementById('txn-service-type')?.addEventListener('change', updateHoursRow);
    document.getElementById('txn-amount')?.addEventListener('input', updateSplitPreview);
    document.getElementById('txn-hours')?.addEventListener('input', updateSplitPreview);
    document.getElementById('txn-category')?.addEventListener('change', updateAutoAccountType);
    document.getElementById('txn-type')?.addEventListener('change', e => {
      populateCategorySelect(e.target.value);
      populateServiceType(e.target.value);
      updateGSTRow(e.target.value);
      updateITCRow(e.target.value);
    });

    // Hours rate default
    const rateEl = document.getElementById('hours-rate');
    if (rateEl && !rateEl.value) rateEl.value = DB.Settings.getSplits().hourlyRate || 25;
  }

  function init() {
    // Default hours date
    const hdEl = document.getElementById('hours-date');
    if (hdEl) hdEl.value = DB.today();
    const hrEl = document.getElementById('hours-rate');
    if (hrEl) hrEl.value = DB.Settings.getSplits().hourlyRate || 25;

    render();
    initEventDelegation();
  }

  return { init, render, openAddIncome, openAddExpense, openEdit, closeModal, saveTransaction, deleteTransaction, deleteLog, logHours, switchTab, handleReceiptUpload, removeReceipt, exportCSV };
})();
