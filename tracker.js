/**
 * equipment.js — Equipment Tracking + Maintenance + Sinking Fund
 */
const EquipmentScreen = (() => {
  let editingId=null;
  const fmt=n=>'$'+Math.abs(n).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function render(){
    const c=document.getElementById('equipment-list'); if(!c)return;
    const items=DB.Equipment.all();
    const totalFund=DB.Equipment.totalMonthlyFund();
    document.getElementById('sinking-fund-total').textContent=fmt(totalFund)+'/mo';
    if(!items.length){ c.innerHTML=`<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-title">No equipment tracked</div><div class="empty-sub">Add equipment to track maintenance schedules and save for replacement costs</div></div>`; return; }
    c.innerHTML=`<div style="background:var(--surface);border-radius:12px;overflow:hidden;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100);">`+items.map(e=>{
      const next=e.nextService?`Next: ${e.nextService}`:'No schedule';
      const last=e.lastService?`Last: ${e.lastService}`:'';
      const daysToNext=e.nextService?Math.ceil((new Date(e.nextService+'T12:00:00')-new Date())/86400000):null;
      const statusClass=daysToNext!=null?(daysToNext<0?'overdue':daysToNext<=30?'due':'ok'):e.status||'ok';
      return `<div class="equip-item">
        <div class="equip-icon">${esc(e.icon||'🔧')}</div>
        <div class="equip-body">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="equip-name">${esc(e.name)}</span>
            <span class="equip-status ${statusClass}">${statusClass==='ok'?'✓ OK':statusClass==='due'?'⚠ Due':'🔴 Overdue'}</span>
          </div>
          <div class="equip-detail">${last}${last?' · ':''} ${next}${daysToNext!=null?` (${daysToNext>=0?daysToNext+'d':Math.abs(daysToNext)+'d overdue'})`:''}
          ${e.monthlyFund?`<span style="color:var(--teal-600);font-weight:600;margin-left:4px;">+${fmt(e.monthlyFund)}/mo fund</span>`:''}</div>
          ${e.notes?`<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${esc(e.notes)}</div>`:''}
        </div>
        <div style="display:flex;gap:3px;">
          <button class="txn-action-btn edit" data-action="edit-equip" data-id="${esc(e.id)}">✏️</button>
          <button class="txn-action-btn delete" data-action="del-equip" data-id="${esc(e.id)}">🗑️</button>
        </div>
      </div>`;
    }).join('')+`</div>`;
  }

  function openAdd(){ editingId=null; document.getElementById('equip-form').reset(); document.getElementById('equip-last-service').value=DB.today(); document.getElementById('equip-modal-title').textContent='Add Equipment'; document.getElementById('equip-modal').classList.add('open'); }
  function openEdit(id){
    editingId=id; const e=DB.Equipment.all().find(x=>x.id===id); if(!e)return;
    document.getElementById('equip-modal-title').textContent='Edit Equipment';
    const fi=(id_,v)=>{const el=document.getElementById(id_);if(el)el.value=v;};
    fi('equip-name',e.name);fi('equip-icon',e.icon||'');fi('equip-last-service',e.lastService||'');fi('equip-next-service',e.nextService||'');fi('equip-monthly-fund',e.monthlyFund||0);fi('equip-notes',e.notes||'');fi('equip-status-sel',e.status||'ok');
    document.getElementById('equip-modal').classList.add('open');
  }
  function save(){
    const name=document.getElementById('equip-name').value.trim(); if(!name){App.toast('Name required','error');return;}
    const data={name,icon:document.getElementById('equip-icon').value.trim()||'🔧',lastService:document.getElementById('equip-last-service').value,nextService:document.getElementById('equip-next-service').value,monthlyFund:parseFloat(document.getElementById('equip-monthly-fund').value)||0,notes:document.getElementById('equip-notes').value.trim(),status:document.getElementById('equip-status-sel').value};
    if(editingId){DB.Equipment.update(editingId,data);App.toast('Equipment updated ✓','success');}
    else{DB.Equipment.add(data);App.toast('Equipment added ✓','success');}
    document.getElementById('equip-modal').classList.remove('open');
    render();
  }

  function initEventDelegation(){
    document.getElementById('equipment-list')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      if(btn.dataset.action==='edit-equip')openEdit(btn.dataset.id);
      if(btn.dataset.action==='del-equip'){DB.Equipment.delete(btn.dataset.id);App.toast('Equipment removed','warning');render();}
    });
    document.getElementById('equip-modal')?.addEventListener('click',e=>{if(e.target.id==='equip-modal')document.getElementById('equip-modal').classList.remove('open');});
  }

  function init(){render();initEventDelegation();}
  return {init,render,openAdd,openEdit,save};
})();
