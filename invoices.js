/**
 * invoices.js — Sales: Invoices + Estimates + Customers (Wave-inspired)
 */
const SalesModule = (() => {
  let salesTab='invoices', editingInvId=null, editingCustId=null, lineItems=[], viewingInvId=null;
  const fmt=n=>'$'+Math.abs(n).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const STATUS_LABELS={draft:'Draft',sent:'Sent',viewed:'Viewed',paid:'Paid',overdue:'Overdue',converted:'Converted',estimate:'Estimate'};
  const statusColor=s=>({draft:'#94a3b8',sent:'#3b82f6',viewed:'#7c3aed',paid:'#16a34a',overdue:'#ef4444',converted:'#94a3b8'}[s]||'#94a3b8');

  function switchTab(tab){
    salesTab=tab;
    document.querySelectorAll('#sales-screen .screen-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    document.querySelectorAll('#sales-screen .tab-pane').forEach(p=>p.classList.toggle('active',p.id===`sales-tab-${tab}`));
    render();
  }

  function render(){
    if(salesTab==='invoices')  renderList('invoice');
    else if(salesTab==='estimates') renderList('estimate');
    else renderCustomers();
    renderSummaryBar();
  }

  function renderSummaryBar(){
    DB.Invoices.checkOverdue();
    const all=DB.Invoices.all().filter(i=>i.type==='invoice');
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    s('inv-sum-outstanding',fmt(DB.Invoices.totalOutstanding()));
    s('inv-sum-overdue',fmt(DB.Invoices.totalOverdue()));
    s('inv-sum-paid',fmt(all.filter(i=>i.status==='paid').reduce((t,i)=>t+i.total,0)));
  }

  function renderList(type){
    const listId=type==='invoice'?'invoice-list':'estimate-list';
    const c=document.getElementById(listId); if(!c)return;
    const items=DB.Invoices.all().filter(i=>i.type===type);
    if(!items.length){ c.innerHTML=`<div class="empty-state"><div class="empty-icon">${type==='invoice'?'📄':'📝'}</div><div class="empty-title">No ${type}s yet</div><div class="empty-sub">Tap the button above to create your first ${type}</div></div>`; return; }
    c.innerHTML=items.map(inv=>{
      const custName=DB.Customers.get(inv.customerId)?.name||inv.customerName||'Client';
      const daysOv=inv.status==='overdue'?Math.ceil((new Date()-new Date(inv.dueDate+'T12:00:00'))/86400000):0;
      return `<div class="invoice-item" data-action="view-inv" data-id="${esc(inv.id)}">
        <div style="flex:0 0 3px;height:52px;border-radius:2px;background:${statusColor(inv.status)};margin-right:6px;"></div>
        <div class="invoice-body">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span class="invoice-num">${esc(inv.number)}</span>
            <span class="badge ${inv.status}">${STATUS_LABELS[inv.status]||inv.status}</span>
            ${daysOv>0?`<span style="font-size:10px;color:var(--red-500);font-weight:600;">${daysOv}d overdue</span>`:''}
          </div>
          <div class="invoice-client">${esc(custName)}</div>
          <div class="invoice-date">Issued ${inv.date} · Due ${inv.dueDate}</div>
        </div>
        <div style="text-align:right;">
          <div class="invoice-amount">${fmt(inv.total)}</div>
          <div style="display:flex;gap:3px;margin-top:4px;justify-content:flex-end;">
            ${inv.status!=='paid'&&inv.status!=='converted'?`<button class="txn-action-btn edit" data-action="edit-inv" data-id="${esc(inv.id)}">✏️</button>`:''}
            <button class="txn-action-btn delete" data-action="del-inv" data-id="${esc(inv.id)}">🗑️</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function openView(id){
    const inv=DB.Invoices.get(id); if(!inv)return;
    viewingInvId=id;
    const customer=DB.Customers.get(inv.customerId);
    const custName=customer?.name||inv.customerName||'Client';
    const s=DB.Settings.get(); const txLabel=DB.Settings.getTaxLabel();
    const modal=document.getElementById('inv-view-modal');
    const body=document.getElementById('inv-view-body'); if(!body)return;
    const actions=[];
    if(inv.status==='draft') actions.push(`<button class="btn btn-outline btn-sm" data-action="mark-sent">Mark Sent</button>`);
    if(['sent','viewed','overdue'].includes(inv.status)&&inv.type==='invoice') actions.push(`<button class="btn btn-success btn-sm" data-action="mark-paid">✓ Mark Paid</button>`);
    if(inv.type==='estimate'&&inv.status!=='converted') actions.push(`<button class="btn btn-primary btn-sm" data-action="convert-est">→ Invoice</button>`);
    if(inv.status!=='paid'&&inv.status!=='converted') actions.push(`<button class="btn btn-secondary btn-sm" data-action="edit-this-inv">Edit</button>`);
    actions.push(`<button class="btn btn-secondary btn-sm" data-action="print-inv">🖨 Print</button>`);
    actions.push(`<button class="txn-action-btn delete" data-action="del-this-inv" title="Delete">🗑️</button>`);
    const liRows=(inv.lineItems||[]).map(li=>`<tr><td style="padding:8px 6px;">${esc(li.description)}</td><td style="padding:8px 6px;text-align:center;">${li.qty}</td><td style="padding:8px 6px;text-align:right;">${fmt(li.unitPrice)}</td><td style="padding:8px 6px;text-align:center;">${li.gst?'✓':'-'}</td><td style="padding:8px 6px;text-align:right;font-weight:700;">${fmt(li.amount)}</td></tr>`).join('');
    body.innerHTML=`
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;justify-content:flex-end;">${actions.join('')}</div>
      <div style="background:var(--blue-700);color:#fff;padding:16px;border-radius:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div><div style="font-size:17px;font-weight:800;">${esc(s.businessName)}</div><div style="font-size:11px;opacity:.7;">${[s.city,s.province].filter(Boolean).join(', ')}${s.gstNumber?' · '+txLabel+'# '+s.gstNumber:''}</div></div>
        <div style="text-align:right;"><div style="font-size:20px;font-weight:800;opacity:.85;">${inv.type==='estimate'?'ESTIMATE':'INVOICE'}</div><span class="badge ${inv.status}">${STATUS_LABELS[inv.status]}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;font-size:13px;">
        <div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:4px;">Bill To</div>
          <div style="font-weight:700;">${esc(custName)}</div>
          ${customer?.address?`<div style="color:var(--gray-600);">${esc(customer.address)}</div>`:''}
          ${customer?.city?`<div style="color:var(--gray-600);">${esc(customer.city)}${customer.province?', '+customer.province:''}</div>`:''}
          ${customer?.email?`<div style="color:var(--gray-600);">${esc(customer.email)}</div>`:''}
          ${customer?.phone?`<div style="color:var(--gray-600);">${esc(customer.phone)}</div>`:''}
        </div>
        <div style="text-align:right;">
          <div><span style="color:var(--gray-400);font-size:11px;"># </span><strong>${esc(inv.number)}</strong></div>
          <div><span style="color:var(--gray-400);font-size:11px;">Date </span><strong>${inv.date}</strong></div>
          <div><span style="color:var(--gray-400);font-size:11px;">Due </span><strong>${inv.dueDate}</strong></div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">
          <th style="padding:7px 6px;text-align:left;font-size:10px;color:var(--gray-400);text-transform:uppercase;">Description</th>
          <th style="padding:7px 6px;text-align:center;font-size:10px;color:var(--gray-400);">Qty</th>
          <th style="padding:7px 6px;text-align:right;font-size:10px;color:var(--gray-400);">Price</th>
          <th style="padding:7px 6px;text-align:center;font-size:10px;color:var(--gray-400);">${txLabel}</th>
          <th style="padding:7px 6px;text-align:right;font-size:10px;color:var(--gray-400);">Amount</th>
        </tr></thead>
        <tbody>${liRows}</tbody>
      </table>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;padding:12px 6px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;width:210px;"><span style="color:var(--gray-500);">Subtotal</span><span>${fmt(inv.subtotal)}</span></div>
        ${inv.discount>0?`<div style="display:flex;justify-content:space-between;width:210px;"><span style="color:var(--gray-500);">Discount (${inv.discount}%)</span><span style="color:var(--red-500);">-${fmt(inv.subtotal*inv.discount/100)}</span></div>`:''}
        <div style="display:flex;justify-content:space-between;width:210px;"><span style="color:var(--gray-500);">${txLabel}</span><span>${fmt(inv.gstAmount)}</span></div>
        <div style="display:flex;justify-content:space-between;width:210px;border-top:2px solid var(--gray-200);padding-top:8px;margin-top:4px;"><span style="font-weight:700;font-size:16px;">Total</span><span style="font-size:20px;font-weight:800;color:var(--blue-700);">${fmt(inv.total)}</span></div>
        ${inv.status==='paid'?`<div style="color:var(--green-600);font-weight:600;font-size:12px;">✓ Paid ${inv.paidAt||''}</div>`:''}
      </div>
      ${inv.notes?`<div style="font-size:12px;color:var(--gray-500);padding:8px;background:var(--gray-50);border-radius:6px;margin-top:4px;">📝 ${esc(inv.notes)}</div>`:''}
      ${inv.terms?`<div style="font-size:12px;color:var(--gray-500);padding:6px 8px;margin-top:4px;">📋 ${esc(inv.terms)}</div>`:''}`;
    modal.classList.add('open');
    buildPrintArea(inv,customer,s,txLabel);
  }

  function buildPrintArea(inv,customer,s,txLabel){
    const area=document.getElementById('print-invoice-area'); if(!area)return;
    const custName=customer?.name||inv.customerName||'Client';
    const liRows=(inv.lineItems||[]).map(li=>`<tr><td>${esc(li.description)}</td><td>${li.qty}</td><td>${fmt(li.unitPrice)}</td><td>${li.gst?'Y':'-'}</td><td>${fmt(li.amount)}</td></tr>`).join('');
    area.innerHTML=`<div class="prt-header"><div><div class="prt-logo">${esc(s.businessName)}</div><div style="font-size:12px;color:#64748b;margin-top:2px;">${[s.address,s.city,s.province].filter(Boolean).join(' · ')}${s.gstNumber?' · GST# '+s.gstNumber:''}</div></div><div class="prt-meta"><div><strong>${inv.type==='estimate'?'ESTIMATE':'INVOICE'}</strong> ${inv.number}</div><div>Date: ${inv.date}</div><div>Due: ${inv.dueDate}</div></div></div>
      <div class="prt-addresses"><div><div class="prt-addr-label">Bill To</div><div class="prt-addr-name">${esc(custName)}</div><div class="prt-addr-detail">${[customer?.address,customer?.city,customer?.province].filter(Boolean).join(', ')}<br>${customer?.email||''} ${customer?.phone||''}</div></div><div></div></div>
      <table class="prt-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>${txLabel}?</th><th>Amount</th></tr></thead><tbody>${liRows}</tbody></table>
      <div class="prt-totals"><div class="prt-totals-box"><div class="prt-total-row"><span>Subtotal</span><span>${fmt(inv.subtotal)}</span></div>${inv.discount>0?`<div class="prt-total-row"><span>Discount (${inv.discount}%)</span><span>-${fmt(inv.subtotal*inv.discount/100)}</span></div>`:''}<div class="prt-total-row"><span>${txLabel}</span><span>${fmt(inv.gstAmount)}</span></div><div class="prt-total-row prt-total-final"><span>Total</span><span>${fmt(inv.total)}</span></div></div></div>
      <div class="prt-notes"><strong>Notes:</strong> ${esc(inv.notes||s.defaultNotes)}<br><strong>Terms:</strong> ${esc(inv.terms||s.defaultTerms)}</div>`;
  }

  function closeViewModal(){ document.getElementById('inv-view-modal').classList.remove('open'); viewingInvId=null; }

  function openNew(type='invoice'){ editingInvId=null; lineItems=[{description:'',serviceType:'carpet',qty:1,unitPrice:'',gst:true}]; prepInvModal(type); }
  function openEdit(id){ const inv=DB.Invoices.get(id); if(!inv)return; editingInvId=id; lineItems=inv.lineItems.map(li=>({...li})); prepInvModal(inv.type); const fi=(id_,v)=>{const e=document.getElementById(id_);if(e)e.value=v;}; fi('inv-date',inv.date);fi('inv-due',inv.dueDate);fi('inv-notes',inv.notes||'');fi('inv-terms',inv.terms||'');fi('inv-discount',inv.discount||0);const ce=document.getElementById('inv-customer');if(ce)ce.value=inv.customerId||''; renderLineItems(); }

  function prepInvModal(type){
    const s=DB.Settings.get();
    document.getElementById('inv-modal-title').textContent=(editingInvId?'Edit ':'New ')+(type==='invoice'?'Invoice':'Estimate');
    document.getElementById('inv-type').value=type;
    if(!editingInvId){ document.getElementById('inv-date').value=DB.today(); document.getElementById('inv-due').value=DB.addDays(DB.today(),s.defaultPaymentTerms); document.getElementById('inv-notes').value=s.defaultNotes||''; document.getElementById('inv-terms').value=s.defaultTerms||''; document.getElementById('inv-discount').value=0; }
    populateCustomerSelect();
    renderLineItems();
    updateTotals();
    document.getElementById('inv-modal').classList.add('open');
  }

  function populateCustomerSelect(){
    const sel=document.getElementById('inv-customer'); if(!sel)return;
    sel.innerHTML='<option value="">— Select Customer —</option>'+DB.Customers.all().map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  }

  function renderLineItems(){
    const c=document.getElementById('inv-line-items'); if(!c)return;
    const txLabel=DB.Settings.getTaxLabel();
    c.innerHTML=`<table class="line-items-table"><thead><tr><th style="width:34%">Description</th><th style="width:20%">Service</th><th style="width:8%">Qty</th><th style="width:15%">Price</th><th style="width:8%">${txLabel}</th><th style="width:10%">Amt</th><th style="width:5%"></th></tr></thead>
      <tbody>${lineItems.map((li,i)=>`<tr>
        <td><input class="li-input" placeholder="Service description" value="${esc(li.description)}" data-li="${i}" data-field="description"></td>
        <td><select class="li-input" data-li="${i}" data-field="serviceType">${DB.SERVICE_TYPES.map(st=>`<option value="${st.id}"${li.serviceType===st.id?' selected':''}>${st.icon} ${st.label}</option>`).join('')}</select></td>
        <td><input class="li-input" type="number" min="1" step="1" value="${li.qty||1}" data-li="${i}" data-field="qty" style="width:44px;"></td>
        <td><input class="li-input" type="number" min="0" step="0.01" placeholder="0.00" value="${li.unitPrice||''}" data-li="${i}" data-field="unitPrice"></td>
        <td style="text-align:center;"><input type="checkbox" ${li.gst?'checked':''} data-li="${i}" data-field="gst" style="width:18px;height:18px;cursor:pointer;"></td>
        <td style="text-align:right;font-weight:600;font-size:13px;" id="li-amt-${i}">${fmt((parseFloat(li.qty)||1)*(parseFloat(li.unitPrice)||0))}</td>
        <td><button data-del-li="${i}" style="background:none;border:none;color:var(--red-400);font-size:16px;cursor:pointer;padding:2px 6px;">✕</button></td>
      </tr>`).join('')}</tbody></table>
      <button data-action="add-li" class="btn btn-secondary btn-sm" style="margin-top:8px;">+ Add Line</button>`;
    c.querySelectorAll('[data-li]').forEach(el=>{el.addEventListener('input',handleLI);el.addEventListener('change',handleLI);});
    c.querySelectorAll('[data-del-li]').forEach(btn=>btn.addEventListener('click',()=>{lineItems.splice(parseInt(btn.dataset.delLi),1);renderLineItems();}));
    c.querySelector('[data-action="add-li"]')?.addEventListener('click',()=>{lineItems.push({description:'',serviceType:'carpet',qty:1,unitPrice:'',gst:true});renderLineItems();});
  }

  function handleLI(e){
    const i=parseInt(e.target.dataset.li); const f=e.target.dataset.field;
    if(isNaN(i))return;
    lineItems[i][f]=(f==='gst')?e.target.checked:e.target.value;
    const amt=(parseFloat(lineItems[i].qty)||1)*(parseFloat(lineItems[i].unitPrice)||0);
    const amtEl=document.getElementById(`li-amt-${i}`);if(amtEl)amtEl.textContent=fmt(amt);
    updateTotals();
  }

  function updateTotals(){
    const disc=parseFloat(document.getElementById('inv-discount')?.value)||0;
    const taxRate=DB.Settings.getTaxRate(); const txLabel=DB.Settings.getTaxLabel();
    const sub=lineItems.reduce((s,li)=>s+(parseFloat(li.qty)||1)*(parseFloat(li.unitPrice)||0),0);
    const gstAmt=lineItems.reduce((s,li)=>s+(li.gst?((parseFloat(li.qty)||1)*(parseFloat(li.unitPrice)||0))*(1-disc/100)*taxRate:0),0);
    const total=sub*(1-disc/100)+gstAmt;
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    s('inv-sub-display',fmt(sub));s('inv-gst-display',`${txLabel}: ${fmt(gstAmt)}`);
    s('inv-disc-display',disc>0?`Discount: -${fmt(sub*disc/100)}`:'');
    s('inv-total-display',fmt(total));
  }

  function saveInvoice(){
    const type=document.getElementById('inv-type').value;
    const custId=document.getElementById('inv-customer').value;
    const date=document.getElementById('inv-date').value;
    if(!date){App.toast('Select a date','error');return;}
    if(!lineItems.some(li=>parseFloat(li.unitPrice)>0)){App.toast('Add at least one item','error');return;}
    const data={type,customerId:custId||null,customerName:DB.Customers.get(custId)?.name||'',date,dueDate:document.getElementById('inv-due').value,notes:document.getElementById('inv-notes').value.trim(),terms:document.getElementById('inv-terms').value.trim(),discount:parseFloat(document.getElementById('inv-discount').value)||0,lineItems,status:'draft'};
    if(editingInvId){DB.Invoices.update(editingInvId,data);App.toast('Invoice updated ✓','success');}
    else{DB.Invoices.add(data);App.toast('Invoice created ✓','success');}
    document.getElementById('inv-modal').classList.remove('open');
    render();Dashboard.render();
  }

  // Customers
  function renderCustomers(){
    const c=document.getElementById('customers-list'); if(!c)return;
    const custs=DB.Customers.all();
    if(!custs.length){c.innerHTML=`<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No customers yet</div><div class="empty-sub">Add customers to start creating invoices</div></div>`;return;}
    c.innerHTML=custs.map(cu=>{
      const init=cu.name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?';
      const invs=DB.Invoices.all().filter(i=>i.customerId===cu.id&&i.type==='invoice');
      const out=invs.filter(i=>['sent','viewed','overdue'].includes(i.status)).reduce((s,i)=>s+i.total,0);
      return `<div class="contact-item">
        <div class="contact-avatar">${esc(init)}</div>
        <div class="contact-body">
          <div class="contact-name">${esc(cu.name)}</div>
          <div class="contact-detail">${cu.email?`<span>📧 ${esc(cu.email)}</span>`:''}${cu.phone?`<span>📱 ${esc(cu.phone)}</span>`:''}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${invs.length} invoice${invs.length!==1?'s':''} ${out>0?`· <span style="color:var(--amber-600);font-weight:600;">${fmt(out)} outstanding</span>`:''}</div>
        </div>
        <div style="display:flex;gap:3px;"><button class="txn-action-btn edit" data-action="edit-cust" data-id="${esc(cu.id)}">✏️</button><button class="txn-action-btn delete" data-action="del-cust" data-id="${esc(cu.id)}">🗑️</button></div>
      </div>`;
    }).join('');
  }

  function openNewCust(){editingCustId=null;prepCustModal();}
  function openEditCust(id){editingCustId=id;const c=DB.Customers.get(id);if(!c)return;prepCustModal();['name','email','phone','address','city','province','postal','notes'].forEach(f=>{const el=document.getElementById(`cust-${f}`);if(el)el.value=c[f==='postal'?'postalCode':f]||'';});}
  function prepCustModal(){document.getElementById('cust-modal-title').textContent=editingCustId?'Edit Customer':'New Customer';if(!editingCustId)document.getElementById('cust-form').reset();document.getElementById('cust-modal').classList.add('open');}
  function saveCust(){
    const name=document.getElementById('cust-name').value.trim();if(!name){App.toast('Name required','error');return;}
    const data={name,email:document.getElementById('cust-email').value.trim(),phone:document.getElementById('cust-phone').value.trim(),address:document.getElementById('cust-address').value.trim(),city:document.getElementById('cust-city').value.trim(),province:document.getElementById('cust-province').value.trim(),postalCode:document.getElementById('cust-postal').value.trim(),notes:document.getElementById('cust-notes').value.trim()};
    if(editingCustId){DB.Customers.update(editingCustId,data);App.toast('Customer updated ✓','success');}
    else{DB.Customers.add(data);App.toast('Customer added ✓','success');}
    document.getElementById('cust-modal').classList.remove('open');
    renderCustomers();
  }

  // View modal actions
  function handleViewAction(action){
    const id=viewingInvId;
    if(action==='mark-sent'){DB.Invoices.update(id,{status:'sent'});App.toast('Marked as Sent','success');closeViewModal();render();}
    if(action==='mark-paid'){DB.Invoices.markPaid(id);App.toast('✓ Paid — transaction created','success');closeViewModal();render();Dashboard.render();}
    if(action==='convert-est'){const inv=DB.Invoices.convertToInvoice(id);App.toast(`Converted → ${inv.number} ✓`,'success');closeViewModal();render();}
    if(action==='edit-this-inv'){closeViewModal();openEdit(id);}
    if(action==='print-inv'){window.print();}
    if(action==='del-this-inv'){DB.Invoices.delete(id);App.toast('Deleted','warning');closeViewModal();render();Dashboard.render();}
  }

  function closeViewModal(){document.getElementById('inv-view-modal').classList.remove('open');viewingInvId=null;}

  function initEventDelegation(){
    ['invoice-list','estimate-list'].forEach(lid=>{
      document.getElementById(lid)?.addEventListener('click',e=>{
        const btn=e.target.closest('[data-action]');if(!btn)return;
        const id=btn.dataset.id;
        if(btn.dataset.action==='view-inv')openView(id);
        if(btn.dataset.action==='edit-inv'){closeViewModal();openEdit(id);}
        if(btn.dataset.action==='del-inv'){DB.Invoices.delete(id);App.toast('Deleted','warning');render();Dashboard.render();}
      });
    });
    document.getElementById('customers-list')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      if(btn.dataset.action==='edit-cust')openEditCust(btn.dataset.id);
      if(btn.dataset.action==='del-cust'){DB.Customers.delete(btn.dataset.id);App.toast('Customer removed','warning');renderCustomers();}
    });
    document.getElementById('inv-view-body')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      handleViewAction(btn.dataset.action);
    });
    document.getElementById('inv-discount')?.addEventListener('input',updateTotals);
    ['inv-modal','inv-view-modal','cust-modal'].forEach(mid=>{
      document.getElementById(mid)?.addEventListener('click',e=>{if(e.target.id===mid)document.getElementById(mid).classList.remove('open');});
    });
  }

  function init(){render();initEventDelegation();}
  return {init,render,switchTab,openNew,openEdit,openView,saveInvoice,openNewCust,openEditCust,saveCust,closeViewModal};
})();
