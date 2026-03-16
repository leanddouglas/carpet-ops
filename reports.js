/**
 * reports.js — P&L, GST/HST Report, AR Aging, Revenue by Service
 */
const Reports = (() => {
  let reportTab='pl', reportYear=new Date().getFullYear();
  const fmt=n=>'$'+Math.abs(n).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function switchTab(tab){ reportTab=tab;
    document.querySelectorAll('#reports-screen .screen-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    document.querySelectorAll('#reports-screen .tab-pane').forEach(p=>p.classList.toggle('active',p.id===`rep-tab-${tab}`));
    render();
  }

  function render(){
    if(reportTab==='pl')       renderPL();
    else if(reportTab==='gst') renderGST();
    else if(reportTab==='ar')  renderAR();
    else                       renderRevByService();
  }

  function renderPL(){
    const c=document.getElementById('pl-content'); if(!c)return;
    const pl=DB.Calc.plByPeriod(String(reportYear));
    const txLabel=DB.Settings.getTaxLabel();
    const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const maxVal=Math.max(...pl.byMonth.map(m=>Math.max(m.income,m.expenses)),1);

    const incCats=Object.entries(pl.byCategory.income||{}).sort((a,b)=>b[1]-a[1]);
    const expCats=Object.entries(pl.byCategory.expense||{}).sort((a,b)=>b[1]-a[1]);

    c.innerHTML=`
      <!-- Summary Cards -->
      <div class="report-summary">
        <div class="rs-item"><div class="rs-val" style="color:var(--green-600);">${fmt(pl.gross)}</div><div class="rs-label">Total Revenue</div></div>
        <div class="rs-item"><div class="rs-val" style="color:var(--red-500);">${fmt(pl.expenses)}</div><div class="rs-label">Total Expenses</div></div>
        <div class="rs-item"><div class="rs-val" style="color:${pl.net>=0?'var(--blue-700)':'var(--red-500)'};">${fmt(pl.net)}</div><div class="rs-label">Net Profit</div></div>
        <div class="rs-item"><div class="rs-val" style="color:var(--teal-500);">${pl.margin}%</div><div class="rs-label">Profit Margin</div></div>
      </div>
      <!-- Monthly chart -->
      <div style="padding:14px 16px;">
        <div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:10px;">Monthly Overview — ${reportYear}</div>
        <div style="display:flex;align-items:flex-end;gap:3px;height:80px;overflow-x:auto;">
          ${pl.byMonth.map((m,i)=>`<div style="flex:1;display:flex;align-items:flex-end;gap:1px;min-width:20px;">
            <div style="flex:1;background:var(--green-400);border-radius:2px 2px 0 0;height:${Math.round((m.income/maxVal)*72)}px;min-height:${m.income?2:0}px;" title="${MONTHS[i]}: ${fmt(m.income)}"></div>
            <div style="flex:1;background:var(--red-300);border-radius:2px 2px 0 0;height:${Math.round((m.expenses/maxVal)*72)}px;min-height:${m.expenses?2:0}px;" title="${MONTHS[i]}: ${fmt(m.expenses)}"></div>
          </div>`).join('')}
        </div>
        <div style="display:flex;gap:3px;padding-top:4px;">${MONTHS.map(m=>`<div style="flex:1;text-align:center;font-size:8px;color:var(--gray-400);">${m}</div>`).join('')}</div>
        <div style="display:flex;gap:12px;margin-top:6px;justify-content:flex-end;font-size:11px;">
          <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:var(--green-400);border-radius:2px;display:inline-block;"></span>Revenue</span>
          <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:var(--red-300);border-radius:2px;display:inline-block;"></span>Expenses</span>
        </div>
      </div>
      <!-- Revenue breakdown -->
      <div style="padding:0 16px 8px;">
        <div style="font-size:12px;font-weight:700;color:var(--green-600);text-transform:uppercase;padding:8px 0 4px;">Revenue Breakdown</div>
        ${incCats.map(([cat,amt])=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100);font-size:13px;"><span>${esc(cat)}</span><span style="font-weight:600;color:var(--green-600);">${fmt(amt)}</span></div>`).join('')}
        ${!incCats.length?`<div style="padding:12px 0;color:var(--text-muted);font-size:13px;">No revenue recorded</div>`:''}
        <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:800;"><span>Total Revenue</span><span style="color:var(--green-600);">${fmt(pl.gross)}</span></div>
      </div>
      <!-- Expense breakdown -->
      <div style="padding:0 16px 8px;">
        <div style="font-size:12px;font-weight:700;color:var(--red-500);text-transform:uppercase;padding:8px 0 4px;">Expense Breakdown</div>
        ${expCats.map(([cat,amt])=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100);font-size:13px;"><span>${esc(cat)}</span><span style="font-weight:600;color:var(--red-500);">${fmt(amt)}</span></div>`).join('')}
        ${!expCats.length?`<div style="padding:12px 0;color:var(--text-muted);font-size:13px;">No expenses recorded</div>`:''}
        <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:800;"><span>Total Expenses</span><span style="color:var(--red-500);">${fmt(pl.expenses)}</span></div>
      </div>
      <!-- Net profit row -->
      <div style="margin:0 16px 16px;padding:14px;background:${pl.net>=0?'var(--blue-50)':'var(--red-50)'};border-radius:10px;border:1.5px solid ${pl.net>=0?'var(--blue-200)':'var(--red-200)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:14px;font-weight:700;color:var(--gray-700);">Net Business Income</div><div style="font-size:11px;color:var(--text-muted);">T2125 Line — Est. tax ~25%</div></div>
          <div style="text-align:right;"><div style="font-size:22px;font-weight:800;color:${pl.net>=0?'var(--blue-700)':'var(--red-500)'};">${fmt(pl.net)}</div><div style="font-size:12px;color:var(--text-muted);">Est. tax ${fmt(Math.max(0,pl.net*0.25))}</div></div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" style="margin:0 16px 16px;" data-action="export-pl">⬇ Export CSV</button>`;
    c.querySelector('[data-action="export-pl"]')?.addEventListener('click',exportPLCSV);
  }

  function renderGST(){
    const c=document.getElementById('gst-content'); if(!c)return;
    const gst=DB.Calc.gstReport(String(reportYear));
    const daysLeft=DB.Calc.daysUntilGST();
    c.innerHTML=`
      <div style="background:var(--amber-50);border-left:4px solid var(--amber-500);padding:12px 16px;margin-bottom:4px;">
        <div style="font-size:12px;font-weight:700;color:var(--amber-700);text-transform:uppercase;">Next Filing Due</div>
        <div style="font-size:16px;font-weight:800;color:var(--amber-800);">${DB.Calc.nextGSTFiling().toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'})} · ${daysLeft} days</div>
      </div>
      <div class="report-summary">
        <div class="rs-item"><div class="rs-val" style="color:var(--amber-600);">${fmt(gst.collected)}</div><div class="rs-label">${gst.label} Collected</div></div>
        <div class="rs-item"><div class="rs-val" style="color:var(--green-600);">${fmt(gst.itc)}</div><div class="rs-label">ITC Credits (paid)</div></div>
        <div class="rs-item"><div class="rs-val" style="color:${gst.owing>0?'var(--red-500)':'var(--green-600)'};">${fmt(gst.owing)}</div><div class="rs-label">Net ${gst.label} Owing</div></div>
        <div class="rs-item"><div class="rs-val">${(gst.rate*100).toFixed(0)}%</div><div class="rs-label">${gst.label} Rate</div></div>
      </div>
      <!-- Quarterly breakdown -->
      <div style="padding:0 16px;">
        <div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;padding:12px 0 6px;">Quarterly Breakdown</div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:var(--gray-50);">
              <th style="padding:8px;text-align:left;font-size:10px;color:var(--gray-400);text-transform:uppercase;">Quarter</th>
              <th style="padding:8px;text-align:right;font-size:10px;color:var(--gray-400);">${gst.label} Collected</th>
              <th style="padding:8px;text-align:right;font-size:10px;color:var(--gray-400);">ITC</th>
              <th style="padding:8px;text-align:right;font-size:10px;color:var(--gray-400);">Owing</th>
            </tr></thead>
            <tbody>${gst.byQuarter.map(q=>`<tr style="border-bottom:1px solid var(--gray-100);">
              <td style="padding:10px 8px;font-weight:600;">${q.label}</td>
              <td style="padding:10px 8px;text-align:right;color:var(--amber-600);">${fmt(q.collected)}</td>
              <td style="padding:10px 8px;text-align:right;color:var(--green-600);">${fmt(q.itc)}</td>
              <td style="padding:10px 8px;text-align:right;font-weight:700;color:${q.owing>0?'var(--red-500)':'var(--green-600)'};">${fmt(q.owing)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
        <div style="margin-top:12px;padding:10px;background:var(--blue-50);border-radius:8px;font-size:11px;color:var(--blue-700);">
          ℹ️ ${gst.label} registered businesses must file quarterly. Consult CRA guidelines for your filing period.
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" style="margin:12px 16px;" data-action="export-gst">⬇ Export CSV</button>`;
    c.querySelector('[data-action="export-gst"]')?.addEventListener('click',exportGSTCSV);
  }

  function renderAR(){
    const c=document.getElementById('ar-content'); if(!c)return;
    const aging=DB.Calc.arAging();
    const buckets={current:0,'1-30':0,'31-60':0,'61-90':0,'90+':0};
    const bAmts={current:0,'1-30':0,'31-60':0,'61-90':0,'90+':0};
    aging.forEach(i=>{buckets[i.bucket]=(buckets[i.bucket]||0)+1;bAmts[i.bucket]=(bAmts[i.bucket]||0)+i.total;});
    const total=aging.reduce((s,i)=>s+i.total,0);
    c.innerHTML=`
      <div style="padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--gray-200);">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Total Outstanding AR</div>
        <div style="font-size:26px;font-weight:800;color:${total>0?'var(--amber-600)':'var(--green-600)'};">${fmt(total)}</div>
      </div>
      <!-- Aging buckets -->
      <div style="padding:12px 16px;">
        <div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">Aging Summary</div>
        ${[['current','Current (not yet due)','var(--green-500)'],['1-30','1–30 days overdue','var(--amber-400)'],['31-60','31–60 days overdue','var(--orange-500, #f97316)'],['61-90','61–90 days overdue','var(--red-400)'],['90+','90+ days overdue','var(--red-600)']].map(([k,label,color])=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--gray-800);">${label}</div>
              <div style="font-size:11px;color:var(--text-muted);">${buckets[k]||0} invoice${(buckets[k]||0)!==1?'s':''}</div>
              <div style="margin-top:4px;height:4px;width:120px;background:var(--gray-100);border-radius:2px;overflow:hidden;"><div style="height:100%;background:${color};width:${total>0?(bAmts[k]||0)/total*100:0}%;"></div></div>
            </div>
            <div style="font-size:15px;font-weight:800;color:${(bAmts[k]||0)>0?color:'var(--green-600)'};">${fmt(bAmts[k]||0)}</div>
          </div>`).join('')}
      </div>
      <!-- Invoice list -->
      ${aging.length?`<div style="padding:0 16px;"><div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;padding:8px 0 4px;">Outstanding Invoices</div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">
            <th style="padding:8px;text-align:left;font-size:10px;color:var(--gray-400);text-transform:uppercase;">Customer</th>
            <th style="padding:8px;text-align:left;font-size:10px;color:var(--gray-400);">Invoice</th>
            <th style="padding:8px;text-align:right;font-size:10px;color:var(--gray-400);">Amount</th>
            <th style="padding:8px;text-align:center;font-size:10px;color:var(--gray-400);">Status</th>
          </tr></thead>
          <tbody>${aging.map(inv=>`<tr style="border-bottom:1px solid var(--gray-100);">
            <td style="padding:8px;font-weight:600;">${esc(inv.customerName)}</td>
            <td style="padding:8px;color:var(--gray-500);">${esc(inv.number)}<br><span style="font-size:10px;">Due ${inv.dueDate}</span></td>
            <td style="padding:8px;text-align:right;font-weight:700;">${fmt(inv.total)}</td>
            <td style="padding:8px;text-align:center;"><span class="badge ${inv.status}">${inv.status}</span>${inv.daysOverdue>0?`<div style="font-size:10px;color:var(--red-500);margin-top:2px;">${inv.daysOverdue}d</div>`:''}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`:`<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No outstanding invoices</div><div class="empty-sub">All invoices have been paid!</div></div>`}`;
  }

  function renderRevByService(){
    const c=document.getElementById('service-content'); if(!c)return;
    const svcs=DB.Calc.revenueByService(String(reportYear));
    const total=svcs.reduce((s,v)=>s+v.amount,0);
    c.innerHTML=!svcs.length?`<div class="empty-state"><div class="empty-icon">📈</div><div class="empty-title">No data yet</div><div class="empty-sub">Add income with service types to see breakdown</div></div>`:
      `<div style="padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border2);">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Total Revenue ${reportYear}</div>
        <div style="font-size:24px;font-weight:800;color:var(--green-600);">${fmt(total)}</div>
      </div>
      <!-- Donut-like bar chart -->
      <div style="padding:14px 16px;">
        <div style="height:14px;border-radius:7px;overflow:hidden;display:flex;margin-bottom:12px;">
          ${svcs.map(s=>`<div style="flex:${s.amount};background:${s.color};" title="${s.label}: ${s.pct}%"></div>`).join('')}
        </div>
        ${svcs.map(s=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100);">
          <div style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${s.icon} ${s.label}</div><div style="height:4px;background:var(--gray-100);border-radius:2px;margin-top:4px;overflow:hidden;"><div style="height:100%;width:${s.pct}%;background:${s.color};"></div></div></div>
          <div style="text-align:right;min-width:90px;"><div style="font-size:13px;font-weight:700;">${fmt(s.amount)}</div><div style="font-size:11px;color:var(--teal-600);">${fmt(s.ownerNet)} yours (${s.pct}%)</div></div>
        </div>`).join('')}
      </div>`;
  }

  function exportPLCSV(){
    const pl=DB.Calc.plByPeriod(String(reportYear));
    const rows=[['Carpet & Tile Ops — P&L Report',reportYear],[''],['Category','Amount']];
    rows.push(['=== REVENUE ===','']);
    Object.entries(pl.byCategory.income||{}).forEach(([c,a])=>rows.push([c,a.toFixed(2)]));
    rows.push(['Total Revenue',pl.gross.toFixed(2)],[''],['=== EXPENSES ===','']);
    Object.entries(pl.byCategory.expense||{}).forEach(([c,a])=>rows.push([c,a.toFixed(2)]));
    rows.push(['Total Expenses',pl.expenses.toFixed(2)],[''],['Net Profit',pl.net.toFixed(2)],['Profit Margin %',pl.margin]);
    const csv=rows.map(r=>r.join(',')).join('\n');
    const b=new Blob([csv],{type:'text/csv'}); const u=URL.createObjectURL(b);
    const a=document.createElement('a');a.href=u;a.download=`PL_${reportYear}.csv`;a.click();
    App.toast('P&L CSV downloaded ✓','success');
  }

  function exportGSTCSV(){
    const gst=DB.Calc.gstReport(String(reportYear));
    const rows=[[`${gst.label} Report — ${reportYear}`],[''],['Metric','Amount']];
    rows.push([`${gst.label} Collected on Sales`,gst.collected.toFixed(2)],[`ITC Credits (${gst.label} paid on expenses)`,gst.itc.toFixed(2)],[`Net ${gst.label} Owing`,gst.owing.toFixed(2)],[''],['Quarter',`${gst.label} Collected`,'ITC','Net Owing']);
    gst.byQuarter.forEach(q=>rows.push([q.label,q.collected.toFixed(2),q.itc.toFixed(2),q.owing.toFixed(2)]));
    const csv=rows.map(r=>r.join(',')).join('\n');
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);
    const a=document.createElement('a');a.href=u;a.download=`${gst.label}_Report_${reportYear}.csv`;a.click();
    App.toast(`${gst.label} CSV downloaded ✓`,'success');
  }

  function setYear(dir){
    reportYear+=dir;
    const el=document.getElementById('reports-year-label');if(el)el.textContent=reportYear;
    render();
  }

  function initEventDelegation(){
    document.getElementById('rep-year-prev')?.addEventListener('click',()=>setYear(-1));
    document.getElementById('rep-year-next')?.addEventListener('click',()=>setYear(1));
  }

  function init(){
    const el=document.getElementById('reports-year-label');if(el)el.textContent=reportYear;
    render();initEventDelegation();
  }
  return {init,render,switchTab,setYear};
})();
