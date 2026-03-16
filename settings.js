/**
 * settings.js — Business Profile, Splits, Tax, Data Management
 */
const SettingsScreen = (() => {
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const GOAL_CATEGORIES=['Cleaning Supplies','Equipment Repair','Vehicle Fuel','Vehicle Maintenance','Business Insurance','Marketing & Advertising','Software & Subscriptions','Professional Fees','Other'];

  function load(){
    const s=DB.Settings.get();
    const fi=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};
    fi('set-business-name',s.businessName||'');fi('set-owner-name',s.ownerName||'');
    fi('set-address',s.address||'');fi('set-city',s.city||'');fi('set-email',s.email||'');fi('set-phone',s.phone||'');fi('set-gst-number',s.gstNumber||'');
    // Province select
    const pSel=document.getElementById('set-province');
    if(pSel){ pSel.innerHTML=DB.PROVINCES.map(p=>`<option value="${p.code}"${s.province===p.code?' selected':''}>${p.name} — ${p.hst?'HST '+(p.hst*100)+'%':p.gst?'GST '+(p.gst*100)+'%+(PST '+(p.pst*100)+'%)':'5%'}</option>`).join(''); }
    fi('set-payment-terms',s.defaultPaymentTerms||30);
    fi('set-annual-goal',s.annualGoal||120000);fi('set-reserve-goal',s.reserveGoal||10000);
    // Splits
    const sp=s.splits||{};
    fi('set-split-carpet',((sp.carpet||0.38)*100).toFixed(0));fi('set-split-tile',((sp.tile||0.45)*100).toFixed(0));
    fi('set-split-upholstery',((sp.upholstery||0.45)*100).toFixed(0));fi('set-split-rug',((sp.rug||0.40)*100).toFixed(0));
    fi('set-split-commercial',((sp.commercial||0.50)*100).toFixed(0));fi('set-hourly-rate',sp.hourlyRate||25);
    renderGoals();
    renderUsers();
    updateHeaderName(s.businessName,s.ownerName);
  }

  function save(){
    const prov=document.getElementById('set-province')?.value||'BC';
    const splits={
      carpet:parseFloat(document.getElementById('set-split-carpet')?.value||38)/100,
      tile:parseFloat(document.getElementById('set-split-tile')?.value||45)/100,
      upholstery:parseFloat(document.getElementById('set-split-upholstery')?.value||45)/100,
      rug:parseFloat(document.getElementById('set-split-rug')?.value||40)/100,
      commercial:parseFloat(document.getElementById('set-split-commercial')?.value||50)/100,
      hourlyRate:parseFloat(document.getElementById('set-hourly-rate')?.value||25),
    };
    DB.Settings.set({
      businessName:document.getElementById('set-business-name')?.value.trim()||'Carpet & Tile Ops',
      ownerName:document.getElementById('set-owner-name')?.value.trim()||'',
      address:document.getElementById('set-address')?.value.trim()||'',
      city:document.getElementById('set-city')?.value.trim()||'',
      email:document.getElementById('set-email')?.value.trim()||'',
      phone:document.getElementById('set-phone')?.value.trim()||'',
      gstNumber:document.getElementById('set-gst-number')?.value.trim()||'',
      province:prov,
      defaultPaymentTerms:parseInt(document.getElementById('set-payment-terms')?.value||30),
      annualGoal:parseFloat(document.getElementById('set-annual-goal')?.value||120000),
      reserveGoal:parseFloat(document.getElementById('set-reserve-goal')?.value||10000),
      splits,
    });
    const s=DB.Settings.get();
    updateHeaderName(s.businessName,s.ownerName);
    App.toast('Settings saved ✓','success');
    Dashboard.render();
  }

  function updateHeaderName(biz,owner){
    const bn=document.getElementById('header-business-name');if(bn)bn.textContent=biz||'Carpet & Tile Ops';
    const on=document.getElementById('header-business-sub');if(on)on.textContent=owner||'';
  }

  // ── Manage Users ──
  function renderUsers(){
    const l=document.getElementById('settings-users-list'); if(!l)return;
    const users=DB.Users.all();
    l.innerHTML = users.map(u=>`
      <div class="user-card">
        <div class="user-card-avatar" style="color:${u.color};">${u.avatar}</div>
        <div style="flex:1;">
          <div class="user-card-name">${esc(u.name)}${u.fullName?' <span style="font-size:11px;color:var(--text3);font-weight:400;">('+esc(u.fullName)+')</span>':''}</div>
          <div class="user-card-role" style="color:${u.color};">${u.role==='personal'?'Household / T4':'Business Owner'}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="SettingsScreen.editUser('${u.id}')">Edit</button>
      </div>
    `).join('');
  }

  function editUser(id){
    const u=DB.Users.get(id); if(!u)return;
    document.getElementById('user-edit-id').value=u.id;
    document.getElementById('user-edit-name').value=u.name||'';
    document.getElementById('user-edit-fullname').value=u.fullName||'';
    // T4 section
    const t4Sec=document.getElementById('user-edit-t4-section');
    if(u.role==='personal'){
      t4Sec.style.display='block';
      document.getElementById('user-t4-gross').value=u.t4?.grossSalary||'';
      
      const pSel=document.getElementById('user-t4-province');
      if(pSel) pSel.innerHTML=DB.PROVINCES.map(p=>`<option value="${p.code}"${(u.t4?.province||'BC')===p.code?' selected':''}>${p.name}</option>`).join('');
      
      const ppSel=document.getElementById('user-t4-periods');
      if(ppSel) ppSel.value=u.t4?.payPeriods||26;
    } else {
      t4Sec.style.display='none';
    }
    document.getElementById('user-modal').classList.add('open');
  }

  function saveUser(){
    const id=document.getElementById('user-edit-id').value;
    const u=DB.Users.get(id); if(!u)return;
    const changes = {
      name: document.getElementById('user-edit-name').value.trim()||u.name,
      fullName: document.getElementById('user-edit-fullname').value.trim()
    };
    if(u.role==='personal'){
      changes.t4 = {
        grossSalary: parseFloat(document.getElementById('user-t4-gross').value||0),
        province: document.getElementById('user-t4-province').value||'BC',
        payPeriods: parseInt(document.getElementById('user-t4-periods').value||26),
        federalClaim: u.t4?.federalClaim||15705,
        provincialClaim: u.t4?.provincialClaim||11981
      };
    }
    DB.Users.update(id, changes);
    App.toast('User profile saved','success');
    document.getElementById('user-modal').classList.remove('open');
    renderUsers();
    if(typeof Personal!=='undefined') Personal.render(); 
  }

  function renderGoals(){
    const c=document.getElementById('goals-list'); if(!c)return;
    const goals=DB.Goals.all();
    if(!goals.length){ c.innerHTML=`<div style="padding:16px;text-align:center;color:var(--gray-400);font-size:13px;">No budget goals yet</div>`; return; }
    const vm=DB.Calc.currentMonth();
    c.innerHTML=`<div style="background:var(--surface);border-radius:12px;overflow:hidden;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100);">`+goals.map(g=>{
      const spent=DB.Transactions.all().filter(t=>t.type==='expense'&&t.category===g.category&&t.date.startsWith(vm)).reduce((s,t)=>s+t.amount,0);
      const pct=Math.min(100,Math.round(spent/g.limit*100));
      const color=pct>=100?'red':pct>=75?'amber':'';
      return `<div style="padding:12px 16px;border-bottom:1px solid var(--gray-100);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-size:13px;font-weight:600;">${esc(g.category)} <span style="font-size:11px;color:var(--text-muted);">(${g.period})</span></div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:13px;font-weight:700;color:${pct>=100?'var(--red-500)':'var(--gray-800)'};">$${spent.toFixed(0)} / $${g.limit}</span>
            <button class="txn-action-btn delete" data-action="del-goal" data-id="${esc(g.id)}">🗑️</button>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill ${color}" style="width:${pct}%;"></div></div>
        ${pct>=100?`<div style="font-size:11px;color:var(--red-500);margin-top:3px;">⚠️ Over budget by $${(spent-g.limit).toFixed(0)}</div>`:''}
      </div>`;
    }).join('')+`</div>`;
  }

  function openAddGoal(){
    document.getElementById('goal-category').innerHTML=GOAL_CATEGORIES.map(c=>`<option>${c}</option>`).join('');
    document.getElementById('goal-form').reset();
    document.getElementById('goal-modal-title').textContent='Add Budget Goal';
    document.getElementById('goal-modal').classList.add('open');
  }
  function saveGoal(){
    const cat=document.getElementById('goal-category').value;
    const limit=parseFloat(document.getElementById('goal-limit').value);
    const period=document.getElementById('goal-period').value;
    if(!limit||limit<=0){App.toast('Enter a spending limit','error');return;}
    DB.Goals.add({category:cat,limit,period});
    App.toast('Goal added ✓','success');
    document.getElementById('goal-modal').classList.remove('open');
    renderGoals();
  }

  function exportAllData(){
    const data={settings:DB.Settings.get(),customers:DB.Customers.all(),invoices:DB.Invoices.all(),transactions:DB.Transactions.all(),equipment:DB.Equipment.all(),timeLogs:DB.TimeLogs.all(),goals:DB.Goals.all(),exportedAt:new Date().toISOString()};
    const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);
    const a=document.createElement('a');a.href=u;a.download=`cto_backup_${DB.today()}.json`;a.click();
    App.toast('Backup downloaded ✓','success');
  }

  function importData(){
    const input=document.createElement('input');input.type='file';input.accept='.json';
    input.onchange=e=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        try{
          const d=JSON.parse(ev.target.result);
          if(d.settings)  localStorage.setItem('cto_settings',JSON.stringify(d.settings));
          if(d.customers) localStorage.setItem('cto_customers',JSON.stringify(d.customers));
          if(d.invoices)  localStorage.setItem('cto_invoices',JSON.stringify(d.invoices));
          if(d.transactions)localStorage.setItem('cto_transactions',JSON.stringify(d.transactions));
          if(d.equipment) localStorage.setItem('cto_equipment',JSON.stringify(d.equipment));
          if(d.timeLogs)  localStorage.setItem('cto_timelogs',JSON.stringify(d.timeLogs));
          if(d.goals)     localStorage.setItem('cto_goals',JSON.stringify(d.goals));
          App.toast('Backup restored ✓ — reloading…','success');
          setTimeout(()=>location.reload(),1200);
        }catch(err){App.toast('Invalid backup file','error');}
      };
      reader.readAsText(e.target.files[0]);
    };
    input.click();
  }

  function clearAllData(){
    // No confirm() — use a two-tap method
    const btn=document.getElementById('btn-clear-data');
    if(!btn)return;
    if(btn.dataset.confirm!=='1'){ btn.textContent='⚠️ Tap again to confirm clear'; btn.dataset.confirm='1'; btn.style.color='var(--red-500)'; setTimeout(()=>{btn.dataset.confirm='0';btn.textContent='Clear All Data';btn.style.color='';},3000); }
    else{
      ['cto_customers','cto_invoices','cto_transactions','cto_equipment','cto_timelogs','cto_goals','cto_settings','cto_seeded_v4'].forEach(k=>localStorage.removeItem(k));
      App.toast('All data cleared — reloading…','warning');
      setTimeout(()=>location.reload(),1200);
    }
  }

  function initEventDelegation(){
    document.getElementById('goals-list')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      if(btn.dataset.action==='del-goal'){DB.Goals.delete(btn.dataset.id);App.toast('Goal removed','warning');renderGoals();}
    });
    document.getElementById('goal-modal')?.addEventListener('click',e=>{if(e.target.id==='goal-modal')document.getElementById('goal-modal').classList.remove('open');});
  }

  function init(){load();initEventDelegation();}
  return {init,load,save,renderGoals,renderUsers,editUser,saveUser,openAddGoal,saveGoal,exportAllData,importData,clearAllData};
})();
