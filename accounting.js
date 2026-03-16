/**
 * accounting.js — Transactions + Hours Worked + Chart of Accounts
 */
const Accounting = (() => {
  let txnTab='transactions', txnFilter='all', txnSearch='', editingTxnId=null, receiptData=null;
  const fmt=n=>'$'+Math.abs(n).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function switchTab(tab){
    txnTab=tab;
    document.querySelectorAll('#ledger-screen .screen-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    document.querySelectorAll('#ledger-screen .tab-pane').forEach(p=>p.classList.toggle('active',p.id===`acct-tab-${tab}`));
    render();
  }

  function render(){
    if(txnTab==='transactions') renderTransactions();
    else if(txnTab==='hours') renderHours();
    else renderAccounts();
    renderLedgerSummary();
  }

  function renderLedgerSummary(){
    const vm=DB.Calc.currentMonth();
    const inc=DB.Transactions.monthly(vm,'income');
    const exp=DB.Transactions.monthly(vm,'expense');
    const itc=DB.Transactions.monthlyITC(vm);
    const el=document.getElementById('ledger-summary'); if(!el)return;
    el.innerHTML=`<div style="display:flex;background:var(--bg2);border-bottom:1px solid var(--gray-100);">
      <div style="flex:1;padding:12px;border-right:1px solid var(--gray-100);text-align:center;">
        <div style="font-size:15px;font-weight:800;color:var(--green-600);">${fmt(inc)}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">INCOME<br><span style="color:var(--teal-500);">${fmt(DB.Transactions.monthlyOwnerNet(vm))} yours</span></div>
      </div>
      <div style="flex:1;padding:12px;border-right:1px solid var(--gray-100);text-align:center;">
        <div style="font-size:15px;font-weight:800;color:var(--red-500);">${fmt(exp)}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">EXPENSES<br><span style="color:var(--green-600);">ITC ${fmt(itc)}</span></div>
      </div>
      <div style="flex:1;padding:12px;text-align:center;">
        <div style="font-size:15px;font-weight:800;color:${inc-exp>=0?'var(--blue-700)':'var(--red-500)'};">${fmt(inc-exp)}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">NET<br><span style="color:var(--gray-400);">This Month</span></div>
      </div>
    </div>`;
  }

  function renderTransactions(){
    const c=document.getElementById('txn-list'); if(!c)return;
    const filter={};
    if(txnFilter==='income')   filter.type='income';
    if(txnFilter==='expense')  filter.type='expense';
    if(txnFilter==='business') filter.accountType='business';
    if(txnFilter==='personal') filter.accountType='personal';
    const txns=DB.Transactions.search(txnSearch,filter);
    if(!txns.length){ c.innerHTML=`<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No transactions found</div><div class="empty-sub">Add income or expenses using the buttons above</div></div>`; return; }
    // Group by date
    const groups={};
    txns.forEach(t=>{ if(!groups[t.date]) groups[t.date]=[]; groups[t.date].push(t); });
    c.innerHTML=Object.entries(groups).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,items])=>`
      <div class="txn-date-group">
        <div class="txn-date-label">${new Date(date+'T12:00:00').toLocaleDateString('en-CA',{weekday:'long',month:'short',day:'numeric'})}</div>
        ${items.map(t=>{
          const icon=t.type==='income'?'💵':'💸';
          const svc=t.serviceType?DB.SERVICE_TYPES.find(s=>s.id===t.serviceType):null;
          return `<div class="txn-item" data-action="edit-txn" data-id="${esc(t.id)}">
            <div class="txn-icon ${t.type}">${icon}</div>
            <div class="txn-body">
              <div class="txn-desc">${esc(t.description)}</div>
              <div class="txn-meta">
                <span class="txn-tag ${t.accountType}">${t.accountType}</span>
                <span>${esc(t.category)}</span>
                ${svc?`<span>${svc.icon} ${svc.label}</span>`:''}
                ${t.gstPaid?`<span style="color:var(--green-600);font-weight:600;">ITC ${fmt(t.gstItc||0)}</span>`:''}
                ${t.gstIncluded?`<span style="color:var(--amber-600);">+${DB.Settings.getTaxLabel()}</span>`:''}
                ${t.invoiceId?`<span style="color:var(--blue-600);">📄 Invoice</span>`:''}
              </div>
              ${t.type==='income'&&t.ownerNet!=null?`<div style="font-size:11px;color:var(--teal-500);font-weight:600;">Your share: ${fmt(t.ownerNet)}</div>`:''}
            </div>
            <div style="text-align:right;">
              <div class="txn-amount ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
              <div style="display:flex;gap:2px;justify-content:flex-end;margin-top:2px;">
                <button class="txn-action-btn edit" data-action="edit-txn" data-id="${esc(t.id)}" title="Edit">✏️</button>
                <button class="txn-action-btn delete" data-action="del-txn" data-id="${esc(t.id)}" title="Delete">🗑️</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');
  }

  // Hours tab
  function renderHours(){
    const c=document.getElementById('hours-log-list'); if(!c)return;
    // Pre-fill rate from settings
    const rateField=document.getElementById('hours-rate');
    if(rateField&&!rateField.value) rateField.value=DB.Settings.getSplits().hourlyRate||25;
    // Pre-fill date
    const dateField=document.getElementById('hours-date');
    if(dateField&&!dateField.value) dateField.value=DB.today();
    const logs=DB.TimeLogs.all();
    const vm=DB.Calc.currentMonth();
    const totalHrs=DB.TimeLogs.monthlyHours(vm);
    const totalEarn=DB.TimeLogs.monthlyEarnings(vm);
    const sumEl=document.getElementById('hours-summary');
    if(sumEl) sumEl.innerHTML=`<div style="display:flex;background:var(--bg2);border-bottom:1px solid var(--gray-100);">
      <div style="flex:1;padding:12px;border-right:1px solid var(--gray-100);text-align:center;"><div style="font-size:18px;font-weight:800;color:var(--blue-700);">${totalHrs.toFixed(1)}h</div><div style="font-size:10px;color:var(--text-muted);">HOURS THIS MONTH</div></div>
      <div style="flex:1;padding:12px;text-align:center;"><div style="font-size:18px;font-weight:800;color:var(--green-600);">${fmt(totalEarn)}</div><div style="font-size:10px;color:var(--text-muted);">EARNED</div></div>
    </div>`;
    if(!logs.length){ c.innerHTML=`<div class="empty-state"><div class="empty-icon">⏱️</div><div class="empty-title">No hours logged yet</div><div class="empty-sub">Log time above to track hourly earnings</div></div>`; return; }
    c.innerHTML=logs.map(l=>`<div class="txn-item">
      <div class="txn-icon income">⏱️</div>
      <div class="txn-body">
        <div class="txn-desc">${esc(l.notes||'Hours worked')}</div>
        <div class="txn-meta"><span>${l.date}</span><span>${l.hours}h @ ${fmt(l.hourlyRate)}/hr</span></div>
      </div>
      <div style="text-align:right;">
        <div class="txn-amount income">+${fmt(l.hours*l.hourlyRate)}</div>
        <button class="txn-action-btn delete" data-action="del-log" data-id="${esc(l.id)}" style="margin-top:4px;">🗑️</button>
      </div>
    </div>`).join('');
  }

  function logHours(){
    const date=document.getElementById('hours-date').value||DB.today();
    const hours=parseFloat(document.getElementById('hours-amount').value);
    const rate=parseFloat(document.getElementById('hours-rate').value)||DB.Settings.getSplits().hourlyRate||25;
    const notes=document.getElementById('hours-desc').value.trim();
    if(!hours||hours<=0){App.toast('Enter valid hours','error');return;}
    DB.TimeLogs.add({date,hours,hourlyRate:rate,notes});
    document.getElementById('hours-amount').value='';
    document.getElementById('hours-desc').value='';
    App.toast(`${hours}h logged — ${fmt(hours*rate)} earned ✓`,'success');
    renderHours();Dashboard.render();
  }

  // Chart of accounts
  function renderAccounts(){
    const c=document.getElementById('accounts-list'); if(!c)return;
    const types=['asset','liability','equity','revenue','expense'];
    const labels={asset:'Assets',liability:'Liabilities',equity:'Equity',revenue:'Revenue',expense:'Expenses'};
    c.innerHTML=types.map(type=>{
      const items=DB.Accounts.byType(type);
      return `<div class="account-type-group">
        <div class="account-type-label">${labels[type]}</div>
        ${items.map(a=>`<div class="account-item">
          <span class="account-code">${a.code}</span>
          <span class="account-name">${esc(a.name)}</span>
          ${!a.isDefault?`<button class="txn-action-btn delete" data-action="del-account" data-id="${esc(a.id)}" style="margin-left:auto;">🗑️</button>`:''}
        </div>`).join('')}
      </div>`;
    }).join('');
  }

  // Transaction form
  function openAddIncome(){ editingTxnId=null; receiptData=null; prepTxnModal('income'); }
  function openAddExpense(){ editingTxnId=null; receiptData=null; prepTxnModal('expense'); }
  function openEditTxn(id){
    const t=DB.Transactions.all().find(x=>x.id===id); if(!t)return;
    editingTxnId=id; receiptData=t.receipt||null;
    prepTxnModal(t.type);
    const fi=(id_,v)=>{const e=document.getElementById(id_);if(e)e.value=v;};
    fi('txn-amount',t.amount);fi('txn-description',t.description);fi('txn-category',t.category);fi('txn-date',t.date);fi('txn-notes',t.notes||'');
    // account type
    document.querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===t.accountType));
    document.getElementById('txn-acct-type').value=t.accountType;
    if(t.serviceType){ const sel=document.getElementById('txn-service-type');if(sel)sel.value=t.serviceType; }
    if(t.gstIncluded){ const cb=document.getElementById('txn-gst');if(cb)cb.checked=true; }
    if(t.gstPaid){const cb=document.getElementById('txn-gst-paid');if(cb)cb.checked=true;}
    updateSplitPreview();
  }

  function prepTxnModal(type){
    const isIncome=type==='income';
    document.getElementById('txn-modal-title').textContent=(editingTxnId?'Edit ':'Add ')+(isIncome?'Income':'Expense');
    document.getElementById('txn-type').value=type;
    document.getElementById('txn-acct-type').value='business';
    document.querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.val==='business'));
    document.getElementById('service-type-wrap').style.display=isIncome?'block':'none';
    document.getElementById('gst-toggle-row').style.display=isIncome?'flex':'none';
    document.getElementById('itc-toggle-row').style.display=isIncome?'none':'flex';
    document.getElementById('txn-gst').checked=isIncome?true:false;
    document.getElementById('txn-gst-paid').checked=false;
    const cat=document.getElementById('txn-category');
    cat.innerHTML=(isIncome?DB.INCOME_CATEGORIES:DB.EXPENSE_CATEGORIES).map(c=>`<option>${esc(c)}</option>`).join('');
    const svc=document.getElementById('txn-service-type');
    svc.innerHTML=DB.SERVICE_TYPES.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');
    if(!editingTxnId){ document.getElementById('txn-form').reset(); document.getElementById('txn-category').innerHTML=(isIncome?DB.INCOME_CATEGORIES:DB.EXPENSE_CATEGORIES).map(c=>`<option>${esc(c)}</option>`).join(''); document.getElementById('txn-date').value=DB.today(); }
    document.getElementById('split-preview').style.display='none';
    document.getElementById('receipt-preview-wrap').innerHTML='';
    if(receiptData) document.getElementById('receipt-preview-wrap').innerHTML=`<img src="${receiptData}" style="width:100%;border-radius:8px;margin-top:8px;">`;
    document.getElementById('txn-modal').classList.add('open');
  }

  function updateSplitPreview(){
    const type=document.getElementById('txn-type')?.value;
    if(type!=='income'){document.getElementById('split-preview').style.display='none';return;}
    const svc=document.getElementById('txn-service-type')?.value;
    const amt=parseFloat(document.getElementById('txn-amount')?.value)||0;
    const preview=document.getElementById('split-preview'); if(!preview)return;
    const net=DB.Calc.netToKeepSingle(amt,svc,null);
    const splits=DB.Settings.getSplits();
    const pct=svc==='hourly'?null:splits[svc];
    preview.style.display=amt>0?'block':'none';
    preview.innerHTML=`<div class="split-preview-box"><div class="split-preview-label">Your share${pct?` (${Math.round(pct*100)}%)`:''}</div><div class="split-preview-val">$${Math.abs(net).toFixed(2)}</div></div>`;
  }

  function handleReceiptUpload(input){
    const file=input.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>{ receiptData=e.target.result; document.getElementById('receipt-preview-wrap').innerHTML=`<img src="${receiptData}" style="width:100%;border-radius:8px;margin-top:8px;">`; };
    reader.readAsDataURL(file);
  }

  function saveTxn(){
    const type=document.getElementById('txn-type').value;
    const amount=parseFloat(document.getElementById('txn-amount').value);
    const description=document.getElementById('txn-description').value.trim();
    const category=document.getElementById('txn-category').value;
    const date=document.getElementById('txn-date').value;
    const notes=document.getElementById('txn-notes').value.trim();
    const acct=document.getElementById('txn-acct-type').value;
    const svc=type==='income'?document.getElementById('txn-service-type').value:null;
    const gstInc=document.getElementById('txn-gst').checked;
    const gstPaid=document.getElementById('txn-gst-paid').checked;
    if(!amount||amount<=0){App.toast('Enter a valid amount','error');return;}
    if(!description){App.toast('Enter a description','error');return;}
    if(!date){App.toast('Select a date','error');return;}
    const data={type,amount,description,category,date,notes,accountType:acct,gstIncluded:gstInc,gstPaid,serviceType:svc,receipt:receiptData};
    if(editingTxnId){DB.Transactions.update(editingTxnId,data);App.toast('Transaction updated ✓','success');}
    else{DB.Transactions.add(data);App.toast('Transaction saved ✓','success');}
    document.getElementById('txn-modal').classList.remove('open');
    render();Dashboard.render();
  }

  function exportCSV(){
    const txns=DB.Transactions.all();
    const rows=[['Date','Type','Description','Category','Amount','Account','GST Incl','ITC','Owner Net','Notes']];
    txns.forEach(t=>rows.push([t.date,t.type,`"${(t.description||'').replace(/"/g,'""')}"`,t.category,t.amount.toFixed(2),t.accountType,t.gstIncluded?'Yes':'No',(t.gstItc||0).toFixed(2),(t.ownerNet!=null?t.ownerNet:t.amount).toFixed(2),`"${(t.notes||'').replace(/"/g,'""')}"`]));
    const csv=rows.map(r=>r.join(',')).join('\n');
    const b=new Blob([csv],{type:'text/csv'}); const u=URL.createObjectURL(b);
    const a=document.createElement('a'); a.href=u; a.download=`transactions_${DB.Calc.currentMonth()}.csv`; a.click();
    App.toast('CSV downloaded ✓','success');
  }

  function initEventDelegation(){
    // Txn list
    document.getElementById('txn-list')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      if(btn.dataset.action==='edit-txn')openEditTxn(btn.dataset.id);
      if(btn.dataset.action==='del-txn'){DB.Transactions.delete(btn.dataset.id);App.toast('Deleted','warning');render();Dashboard.render();}
    });
    // Hours list
    document.getElementById('hours-log-list')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      if(btn.dataset.action==='del-log'){DB.TimeLogs.delete(btn.dataset.id);App.toast('Log deleted','warning');renderHours();Dashboard.render();}
    });
    // Accounts list
    document.getElementById('accounts-list')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      if(btn.dataset.action==='del-account'){DB.Accounts.delete(btn.dataset.id);App.toast('Account removed','warning');renderAccounts();}
    });
    // Seg control
    document.querySelectorAll('.seg-btn').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.seg-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const v=b.dataset.val; document.getElementById('txn-acct-type').value=v;
      // Also update expense categories based on personal flag
      const type=document.getElementById('txn-type')?.value;
      if(type==='expense'){
        const filtered=v==='personal'?DB.EXPENSE_CATEGORIES:DB.EXPENSE_CATEGORIES_DATA.filter(c=>!c.personal||true).map(c=>c.name);
        document.getElementById('txn-category').innerHTML=filtered.map(c=>`<option>${esc(c)}</option>`).join('');
      }
    }));
    // Split preview
    document.getElementById('txn-amount')?.addEventListener('input',updateSplitPreview);
    document.getElementById('txn-service-type')?.addEventListener('change',updateSplitPreview);
    // Filters
    document.querySelectorAll('#ledger-screen .chip').forEach(chip=>chip.addEventListener('click',()=>{
      document.querySelectorAll('#ledger-screen .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active'); txnFilter=chip.dataset.filter; renderTransactions();
    }));
    // Search
    document.getElementById('ledger-search')?.addEventListener('input',e=>{txnSearch=e.target.value;renderTransactions();});
    // Modal backdrop
    document.getElementById('txn-modal')?.addEventListener('click',e=>{if(e.target.id==='txn-modal')document.getElementById('txn-modal').classList.remove('open');});
  }

  function init(){render();initEventDelegation();}
  return {init,render,switchTab,openAddIncome,openAddExpense,openEditTxn,saveTxn,logHours,handleReceiptUpload,exportCSV};
})();
