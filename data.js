/**
 * data.js — Carpet & Tile Ops Canada v4
 * Full Wave-inspired data layer: Customers, Invoices, Chart of Accounts,
 * Transactions, Equipment, TimeLogs, Goals, Settings
 */

// ── Storage Helpers ───────────────────────────────────────────────────────────
const _k = {
  customers:'cto_customers', invoices:'cto_invoices', accounts:'cto_accounts',
  transactions:'cto_transactions', equipment:'cto_equipment', timeLogs:'cto_timelogs',
  goals:'cto_goals', settings:'cto_settings',
};
function _load(k){ try{ return JSON.parse(localStorage.getItem(k))||[]; }catch{ return []; } }
function _loadObj(k,d={}){ try{ return Object.assign({},d,JSON.parse(localStorage.getItem(k))); }catch{ return {...d}; } }
function _save(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function today(){ return new Date().toISOString().slice(0,10); }
function addDays(iso,n){ const d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

// ── Service Types ─────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  {id:'carpet',     label:'Carpet Cleaning',        split:0.38, icon:'🧹', color:'#3b82f6'},
  {id:'tile',       label:'Tile & Grout Cleaning',  split:0.45, icon:'🪣', color:'#14b8a6'},
  {id:'upholstery', label:'Upholstery Cleaning',    split:0.45, icon:'🛋️', color:'#8b5cf6'},
  {id:'rug',        label:'Area Rug Cleaning',       split:0.40, icon:'🪤', color:'#ec4899'},
  {id:'commercial', label:'Commercial Service',      split:0.50, icon:'🏢', color:'#10b981'},
  {id:'hourly',     label:'Hourly Service',          split:null, hourlyRate:25, icon:'⏱️', color:'#f59e0b'},
  {id:'other',      label:'Other',                   split:0.65, icon:'💰', color:'#64748b'},
];

// ── Province GST/HST/PST Rates ────────────────────────────────────────────────
const PROVINCES = [
  {code:'AB',name:'Alberta',          gst:0.05,pst:0,    hst:0   },
  {code:'BC',name:'British Columbia', gst:0.05,pst:0.07, hst:0   },
  {code:'SK',name:'Saskatchewan',     gst:0.05,pst:0.06, hst:0   },
  {code:'MB',name:'Manitoba',         gst:0.05,pst:0.07, hst:0   },
  {code:'ON',name:'Ontario',          gst:0,   pst:0,    hst:0.13},
  {code:'QC',name:'Quebec',           gst:0.05,pst:0.09975,hst:0 },
  {code:'NS',name:'Nova Scotia',      gst:0,   pst:0,    hst:0.15},
  {code:'NB',name:'New Brunswick',    gst:0,   pst:0,    hst:0.15},
  {code:'NL',name:'Newfoundland',     gst:0,   pst:0,    hst:0.15},
  {code:'PE',name:'PEI',              gst:0,   pst:0,    hst:0.15},
  {code:'NT',name:'NWT',              gst:0.05,pst:0,    hst:0   },
  {code:'NU',name:'Nunavut',          gst:0.05,pst:0,    hst:0   },
  {code:'YT',name:'Yukon',            gst:0.05,pst:0,    hst:0   },
];

// ── Settings ──────────────────────────────────────────────────────────────────
const SETTINGS_DEFAULTS = {
  businessName:'Douglas Da Silva Carpet Cleaning', ownerName:'Douglas Da Silva',
  address:'', city:'Vancouver', province:'BC', postalCode:'', country:'Canada',
  email:'', phone:'', website:'', gstNumber:'',
  gstRate:0.05, currency:'CAD', annualGoal:120000, reserveGoal:10000,
  invoiceCounter:1, estimateCounter:1, defaultPaymentTerms:30,
  defaultNotes:'Thank you for your business!',
  defaultTerms:'Payment due within 30 days.',
  invoicePrefix:'INV', estimatePrefix:'EST',
  splits:{ carpet:0.38, tile:0.45, upholstery:0.45, rug:0.40, commercial:0.50, hourlyRate:25, hourly:null, other:0.65 },
};
const Settings = {
  get(){ return _loadObj(_k.settings, SETTINGS_DEFAULTS); },
  set(u){ _save(_k.settings, Object.assign(this.get(),u)); return this.get(); },
  getSplits(){ return this.get().splits||SETTINGS_DEFAULTS.splits; },
  getSplitForService(id){ const s=this.getSplits(); return s[id]??SETTINGS_DEFAULTS.splits[id]??0.65; },
  getTaxRate(){ const s=this.get(); const p=PROVINCES.find(x=>x.code===s.province); if(!p) return s.gstRate; return p.hst||p.gst; },
  getTaxLabel(){ const s=this.get(); const p=PROVINCES.find(x=>x.code===s.province); return p?.hst?'HST':'GST'; },
  nextInvoiceNum(){ const s=this.get(); const n=s.invoiceCounter||1; _save(_k.settings,Object.assign(s,{invoiceCounter:n+1})); return `${s.invoicePrefix||'INV'}-${new Date().getFullYear()}-${String(n).padStart(3,'0')}`; },
  nextEstimateNum(){ const s=this.get(); const n=s.estimateCounter||1; _save(_k.settings,Object.assign(s,{estimateCounter:n+1})); return `${s.estimatePrefix||'EST'}-${new Date().getFullYear()}-${String(n).padStart(3,'0')}`; },
};

// ── Customers ─────────────────────────────────────────────────────────────────
const Customers = {
  all(){ return _load(_k.customers).sort((a,b)=>a.name.localeCompare(b.name)); },
  get(id){ return this.all().find(c=>c.id===id)||null; },
  add(c){ const l=_load(_k.customers); const n={id:uid(),name:c.name||'',email:c.email||'',phone:c.phone||'',address:c.address||'',city:c.city||'',province:c.province||'',postalCode:c.postalCode||'',notes:c.notes||'',createdAt:new Date().toISOString()}; l.push(n); _save(_k.customers,l); return n; },
  update(id,u){ const l=_load(_k.customers),i=l.findIndex(c=>c.id===id); if(i<0)return null; l[i]=Object.assign(l[i],u); _save(_k.customers,l); return l[i]; },
  delete(id){ _save(_k.customers,_load(_k.customers).filter(c=>c.id!==id)); },
};

// ── Chart of Accounts ─────────────────────────────────────────────────────────
const DEFAULT_ACCOUNTS = [
  // Assets
  {id:'a1000',code:'1000',name:'Cash & Chequing',    type:'asset',    isDefault:true},
  {id:'a1010',code:'1010',name:'Accounts Receivable', type:'asset',    isDefault:true},
  {id:'a1020',code:'1020',name:'Equipment & Tools',   type:'asset',    isDefault:true},
  // Liabilities
  {id:'a2000',code:'2000',name:'GST/HST Payable',     type:'liability',isDefault:true},
  {id:'a2010',code:'2010',name:'Credit Card',         type:'liability',isDefault:true},
  // Equity
  {id:'a3000',code:'3000',name:"Owner's Equity",      type:'equity',   isDefault:true},
  // Revenue
  {id:'a4000',code:'4000',name:'Carpet Cleaning Revenue',    type:'revenue',isDefault:true},
  {id:'a4010',code:'4010',name:'Tile & Grout Revenue',       type:'revenue',isDefault:true},
  {id:'a4020',code:'4020',name:'Upholstery Revenue',         type:'revenue',isDefault:true},
  {id:'a4030',code:'4030',name:'Area Rug Revenue',           type:'revenue',isDefault:true},
  {id:'a4040',code:'4040',name:'Commercial Revenue',         type:'revenue',isDefault:true},
  {id:'a4050',code:'4050',name:'Hourly Service Revenue',     type:'revenue',isDefault:true},
  {id:'a4090',code:'4090',name:'Other Revenue',              type:'revenue',isDefault:true},
  // Expenses
  {id:'a5000',code:'5000',name:'Cleaning Supplies',          type:'expense',isDefault:true},
  {id:'a5010',code:'5010',name:'Equipment Repair',           type:'expense',isDefault:true},
  {id:'a5020',code:'5020',name:'Equipment Purchase',         type:'expense',isDefault:true},
  {id:'a5030',code:'5030',name:'Vehicle Fuel',               type:'expense',isDefault:true},
  {id:'a5040',code:'5040',name:'Vehicle Maintenance',        type:'expense',isDefault:true},
  {id:'a5050',code:'5050',name:'Business Insurance',         type:'expense',isDefault:true},
  {id:'a5060',code:'5060',name:'Marketing & Advertising',    type:'expense',isDefault:true},
  {id:'a5070',code:'5070',name:'Software & Subscriptions',   type:'expense',isDefault:true},
  {id:'a5080',code:'5080',name:'Professional Fees',          type:'expense',isDefault:true},
  {id:'a5090',code:'5090',name:'Office Supplies',            type:'expense',isDefault:true},
  {id:'a5100',code:'5100',name:'Training & Certification',   type:'expense',isDefault:true},
  {id:'a5110',code:'5110',name:'Uniforms & PPE',             type:'expense',isDefault:true},
  {id:'a5120',code:'5120',name:'Utilities',                  type:'expense',isDefault:true},
  {id:'a5130',code:'5130',name:'Meals & Entertainment',      type:'expense',isDefault:true},
  {id:'a5140',code:'5140',name:'Home Office',                type:'expense',isDefault:true},
  {id:'a5150',code:'5150',name:'Cell Phone (Business %)',    type:'expense',isDefault:true},
  {id:'a5990',code:'5990',name:'Other Expenses',             type:'expense',isDefault:true},
];
const Accounts = {
  all(){ const l=_load(_k.accounts); return l.length?l:DEFAULT_ACCOUNTS; },
  byType(t){ return this.all().filter(a=>a.type===t).sort((a,b)=>a.code.localeCompare(b.code)); },
  add(a){ const l=this.all().filter(x=>!x.isDefault); l.push({id:uid(),code:a.code,name:a.name,type:a.type,isDefault:false}); _save(_k.accounts,[...DEFAULT_ACCOUNTS,...l]); },
  delete(id){ const l=this.all().filter(a=>!a.isDefault&&a.id!==id); _save(_k.accounts,[...DEFAULT_ACCOUNTS,...l]); },
};

// ── Income / Expense Categories (derived from Chart of Accounts) ──────────────
const INCOME_CATEGORIES  = ['Carpet Cleaning','Tile & Grout Cleaning','Upholstery Cleaning','Area Rug Cleaning','Commercial Service','Hourly Service','Referral Bonus','Other Income'];
const EXPENSE_CATEGORIES_DATA = [
  {name:'Cleaning Supplies',        itc:true,  personal:false},
  {name:'Equipment Repair',         itc:true,  personal:false},
  {name:'Equipment Purchase',       itc:true,  personal:false},
  {name:'Vehicle Fuel',             itc:true,  personal:false},
  {name:'Vehicle Maintenance',      itc:true,  personal:false},
  {name:'Business Insurance',       itc:false, personal:false},
  {name:'Marketing & Advertising',  itc:true,  personal:false},
  {name:'Software & Subscriptions', itc:true,  personal:false},
  {name:'Professional Fees',        itc:true,  personal:false},
  {name:'Office Supplies',          itc:true,  personal:false},
  {name:'Training & Certification', itc:true,  personal:false},
  {name:'Uniforms & PPE',           itc:true,  personal:false},
  {name:'Utilities',                itc:true,  personal:false},
  {name:'Meals & Entertainment',    itc:false, personal:true },
  {name:'Home Office',              itc:true,  personal:true },
  {name:'Cell Phone (Business %)', itc:true,  personal:true },
  {name:'Personal - Other',         itc:false, personal:true },
  {name:'Other',                    itc:true,  personal:false},
];
const EXPENSE_CATEGORIES = EXPENSE_CATEGORIES_DATA.map(c=>c.name);
function getExpenseCategoryMeta(name){ return EXPENSE_CATEGORIES_DATA.find(c=>c.name===name)||{itc:false,personal:false}; }

// ── Invoices ──────────────────────────────────────────────────────────────────
const Invoices = {
  all(){ return _load(_k.invoices).sort((a,b)=>b.date.localeCompare(a.date)); },
  get(id){ return this.all().find(i=>i.id===id)||null; },
  byStatus(status){ return this.all().filter(i=>i.status===status); },

  add(inv){
    const l=_load(_k.invoices);
    const isEst = inv.type==='estimate';
    const num = isEst ? Settings.nextEstimateNum() : Settings.nextInvoiceNum();
    const taxRate = Settings.getTaxRate();
    const items = (inv.lineItems||[]).map(li=>({
      ...li, qty:parseFloat(li.qty)||1, unitPrice:parseFloat(li.unitPrice)||0,
      amount: (parseFloat(li.qty)||1)*(parseFloat(li.unitPrice)||0),
    }));
    const subtotal = items.reduce((s,li)=>s+li.amount,0);
    const disc = parseFloat(inv.discount)||0;
    const discAmount = subtotal*(disc/100);
    const taxableSubtotal = subtotal-discAmount;
    const gstAmount = items.reduce((s,li)=>s+(li.gst?(li.amount*(1-disc/100)*taxRate):0),0);
    const total = taxableSubtotal+gstAmount;
    const n = {
      id:uid(), type:inv.type||'invoice', number:num,
      customerId:inv.customerId||null, customerName:inv.customerName||'',
      date:inv.date||today(), dueDate:inv.dueDate||addDays(today(),Settings.get().defaultPaymentTerms),
      status:inv.status||'draft', lineItems:items,
      discount:disc, subtotal, gstAmount, total,
      amountPaid:0, notes:inv.notes||Settings.get().defaultNotes,
      terms:inv.terms||Settings.get().defaultTerms,
      convertedFrom:inv.convertedFrom||null,
      createdAt:new Date().toISOString(), paidAt:null,
    };
    l.push(n); _save(_k.invoices,l); return n;
  },

  update(id,u){
    const l=_load(_k.invoices),i=l.findIndex(x=>x.id===id);
    if(i<0)return null;
    // Recompute totals if lineItems changed
    if(u.lineItems){
      const taxRate=Settings.getTaxRate();
      const items=u.lineItems.map(li=>({...li,qty:parseFloat(li.qty)||1,unitPrice:parseFloat(li.unitPrice)||0,amount:(parseFloat(li.qty)||1)*(parseFloat(li.unitPrice)||0)}));
      const subtotal=items.reduce((s,li)=>s+li.amount,0);
      const disc=parseFloat(u.discount||l[i].discount)||0;
      const discAmount=subtotal*(disc/100);
      const taxableSubtotal=subtotal-discAmount;
      const gstAmount=items.reduce((s,li)=>s+(li.gst?(li.amount*(1-disc/100)*taxRate):0),0);
      u.lineItems=items; u.subtotal=subtotal; u.gstAmount=gstAmount; u.total=taxableSubtotal+gstAmount;
    }
    l[i]=Object.assign(l[i],u); _save(_k.invoices,l); return l[i];
  },

  delete(id){ _save(_k.invoices,_load(_k.invoices).filter(i=>i.id!==id)); },

  markPaid(id){
    const inv=this.get(id); if(!inv)return null;
    this.update(id,{status:'paid',amountPaid:inv.total,paidAt:today()});
    // Auto-create transaction
    const customer=Customers.get(inv.customerId);
    const firstItem=inv.lineItems[0]||{};
    const st=firstItem.serviceType||'other';
    const splits=Settings.getSplits();
    let ownerNet=null, splitPct=null;
    if(st==='hourly'&&firstItem.hours){ ownerNet=firstItem.hours*(splits.hourlyRate||25); }
    else if(splits[st]!=null){ splitPct=splits[st]; ownerNet=inv.total*splitPct; }
    return Transactions.add({
      type:'income', amount:inv.total, description:`Invoice ${inv.number} — ${customer?customer.name:inv.customerName||'Client'}`,
      category:'Carpet Cleaning', date:today(), accountType:'business',
      gstIncluded:true, gstPaid:false, serviceType:st,
      invoiceId:id, notes:`Auto-created from ${inv.number}`,
    });
  },

  convertToInvoice(estimateId){
    const est=this.get(estimateId); if(!est||est.type!=='estimate')return null;
    const inv=this.add({...est,type:'invoice',status:'draft',convertedFrom:estimateId,lineItems:est.lineItems,discount:est.discount,notes:est.notes,terms:est.terms});
    this.update(estimateId,{status:'converted',convertedToId:inv.id});
    return inv;
  },

  checkOverdue(){
    const today_=today();
    const l=_load(_k.invoices);
    let changed=false;
    l.forEach(inv=>{
      if((inv.status==='sent'||inv.status==='viewed')&&inv.dueDate<today_){
        inv.status='overdue'; changed=true;
      }
    });
    if(changed) _save(_k.invoices,l);
  },

  totalOutstanding(){ return this.all().filter(i=>['sent','viewed','overdue'].includes(i.status)).reduce((s,i)=>s+i.total,0); },
  totalOverdue()    { return this.all().filter(i=>i.status==='overdue').reduce((s,i)=>s+i.total,0); },
};

// ── Transactions ──────────────────────────────────────────────────────────────
const Transactions = {
  all(){ return _load(_k.transactions).sort((a,b)=>b.date.localeCompare(a.date)); },
  byType(t){ return this.all().filter(x=>x.type===t); },

  add(t){
    const l=_load(_k.transactions);
    const meta=t.type==='expense'?getExpenseCategoryMeta(t.category):null;
    const autoAcct=(meta&&meta.personal)?'personal':(t.accountType||'business');
    const taxRate=Settings.getTaxRate();
    // Service split calc
    let ownerNet=null,splitPct=null;
    if(t.type==='income'&&t.serviceType){
      const splits=Settings.getSplits(); const sid=t.serviceType;
      if(sid==='hourly'&&t.hours){ ownerNet=parseFloat(t.hours)*(splits.hourlyRate||25); }
      else if(splits[sid]!=null){ splitPct=splits[sid]; ownerNet=parseFloat(t.amount)*splitPct; }
    }
    // ITC calc
    let gstItc=0;
    if(t.type==='expense'&&t.gstPaid){
      gstItc=t.gstPaidAmount?parseFloat(t.gstPaidAmount):(parseFloat(t.amount)*taxRate)/(1+taxRate);
    }
    const item={
      id:uid(), type:t.type, amount:parseFloat(t.amount), description:t.description,
      category:t.category, date:t.date||today(), accountType:autoAcct,
      gstIncluded:t.gstIncluded||false, gstPaid:t.gstPaid||false, gstItc,
      serviceType:t.serviceType||null, splitPct, ownerNet,
      hours:t.hours||null, invoiceId:t.invoiceId||null,
      receipt:t.receipt||null, notes:t.notes||'', createdAt:new Date().toISOString(),
    };
    l.push(item); _save(_k.transactions,l); return item;
  },

  update(id,u){
    const l=_load(_k.transactions),i=l.findIndex(t=>t.id===id);
    if(i<0)return null;
    if((u.gstPaid||l[i].gstPaid)&&u.type==='expense'&&!u.gstItc){
      const rate=Settings.getTaxRate();
      u.gstItc=((parseFloat(u.amount||l[i].amount))*rate)/(1+rate);
    }
    l[i]=Object.assign(l[i],u); _save(_k.transactions,l); return l[i];
  },

  delete(id){ _save(_k.transactions,_load(_k.transactions).filter(t=>t.id!==id)); },

  search(q,f={}){
    let l=this.all();
    if(q){ const qq=q.toLowerCase(); l=l.filter(t=>t.description.toLowerCase().includes(qq)||t.category.toLowerCase().includes(qq)||(t.notes||'').toLowerCase().includes(qq)); }
    if(f.type)        l=l.filter(t=>t.type===f.type);
    if(f.accountType) l=l.filter(t=>t.accountType===f.accountType);
    if(f.category)    l=l.filter(t=>t.category===f.category);
    if(f.month)       l=l.filter(t=>t.date.startsWith(f.month));
    return l;
  },

  monthly(ym,type,acct='business'){ return this.all().filter(t=>t.type===type&&t.date.startsWith(ym)&&t.accountType===acct).reduce((s,t)=>s+t.amount,0); },
  yearly(yyyy,type,acct='business'){ return this.all().filter(t=>t.type===type&&t.date.startsWith(yyyy)&&t.accountType===acct).reduce((s,t)=>s+t.amount,0); },
  monthlyOwnerNet(ym){ return this.all().filter(t=>t.type==='income'&&t.date.startsWith(ym)&&t.accountType==='business').reduce((s,t)=>s+(t.ownerNet!=null?t.ownerNet:t.amount),0); },
  monthlyITC(ym){ return this.all().filter(t=>t.type==='expense'&&t.date.startsWith(ym)&&t.accountType==='business'&&t.gstPaid).reduce((s,t)=>s+(t.gstItc||0),0); },
  yearlyITC(yyyy){ return this.all().filter(t=>t.type==='expense'&&t.date.startsWith(yyyy)&&t.accountType==='business'&&t.gstPaid).reduce((s,t)=>s+(t.gstItc||0),0); },
  monthlyGSTCollected(ym){ const r=Settings.getTaxRate(); return this.all().filter(t=>t.type==='income'&&t.date.startsWith(ym)&&t.gstIncluded).reduce((s,t)=>s+t.amount*r,0); },
  yearlyGSTCollected(yyyy){ const r=Settings.getTaxRate(); return this.all().filter(t=>t.type==='income'&&t.date.startsWith(yyyy)&&t.gstIncluded).reduce((s,t)=>s+t.amount*r,0); },
  last6MonthsRevenue(){ const now=new Date(),months=[]; for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; months.push({key,label:d.toLocaleString('default',{month:'short'}),amount:this.monthly(key,'income')}); } return months; },
};

// ── Equipment ─────────────────────────────────────────────────────────────────
const Equipment = {
  all(){ return _load(_k.equipment); },
  add(e){ const l=_load(_k.equipment),n={id:uid(),name:e.name,icon:e.icon||'🔧',lastService:e.lastService||today(),nextService:e.nextService||'',notes:e.notes||'',monthlyFund:parseFloat(e.monthlyFund)||0,status:e.status||'ok',createdAt:new Date().toISOString()}; l.push(n); _save(_k.equipment,l); return n; },
  update(id,u){ const l=_load(_k.equipment),i=l.findIndex(e=>e.id===id); if(i<0)return null; l[i]=Object.assign(l[i],u); _save(_k.equipment,l); return l[i]; },
  delete(id){ _save(_k.equipment,_load(_k.equipment).filter(e=>e.id!==id)); },
  totalMonthlyFund(){ return this.all().reduce((s,e)=>s+(e.monthlyFund||0),0); },
};

// ── Time Logs ─────────────────────────────────────────────────────────────────
const TimeLogs = {
  all(){ return _load(_k.timeLogs).sort((a,b)=>(b.date||'').localeCompare(a.date||'')); },
  add(l){ const ll=_load(_k.timeLogs),n={id:uid(),date:l.date||today(),hours:parseFloat(l.hours)||0,hourlyRate:parseFloat(l.hourlyRate)||Settings.getSplits().hourlyRate||25,notes:l.notes||l.description||'',durationMs:(parseFloat(l.hours)||0)*3600000}; ll.push(n); _save(_k.timeLogs,ll); return n; },
  update(id,u){ const l=_load(_k.timeLogs),i=l.findIndex(t=>t.id===id); if(i<0)return null; l[i]=Object.assign(l[i],u); _save(_k.timeLogs,l); return l[i]; },
  delete(id){ _save(_k.timeLogs,_load(_k.timeLogs).filter(l=>l.id!==id)); },
  monthlyHours(ym){ return this.all().filter(l=>l.date&&l.date.startsWith(ym)).reduce((s,l)=>s+(parseFloat(l.hours)||0),0); },
  monthlyEarnings(ym){ return this.all().filter(l=>l.date&&l.date.startsWith(ym)).reduce((s,l)=>s+((parseFloat(l.hours)||0)*(parseFloat(l.hourlyRate)||25)),0); },
};

// ── Budget Goals ──────────────────────────────────────────────────────────────
const Goals = {
  all(){ return _load(_k.goals); },
  add(g){ const l=_load(_k.goals),n={id:uid(),category:g.category,limit:parseFloat(g.limit),period:g.period||'monthly'}; l.push(n); _save(_k.goals,l); return n; },
  update(id,u){ const l=_load(_k.goals),i=l.findIndex(g=>g.id===id); if(i<0)return null; l[i]=Object.assign(l[i],u); _save(_k.goals,l); return l[i]; },
  delete(id){ _save(_k.goals,_load(_k.goals).filter(g=>g.id!==id)); },
};

// ── Calculations ──────────────────────────────────────────────────────────────
const Calc = {
  currentMonth(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; },
  currentYear(){ return String(new Date().getFullYear()); },

  netToKeepForMonth(ym){
    const ownerNet=Transactions.monthlyOwnerNet(ym);
    const gst=Transactions.monthlyGSTCollected(ym);
    const itc=Transactions.monthlyITC(ym);
    return ownerNet-Math.max(0,gst-itc);
  },
  netToKeepSingle(gross,serviceId,hours){
    const splits=Settings.getSplits();
    if(serviceId==='hourly'&&hours) return parseFloat(hours)*(splits.hourlyRate||25);
    const split=splits[serviceId]||0.65;
    return parseFloat(gross)*split;
  },
  gstNetLiability(yyyy){ return Math.max(0,Transactions.yearlyGSTCollected(yyyy)-Transactions.yearlyITC(yyyy)); },
  nextGSTFiling(){ const now=new Date(),quarters=[3,6,9,12],m=now.getMonth()+1; const nextQ=quarters.find(q=>q>m)||3; const year=(nextQ<=m)?now.getFullYear()+1:now.getFullYear(); return new Date(`${year}-${String(nextQ).padStart(2,'0')}-30`); },
  daysUntilGST(){ return Math.ceil((this.nextGSTFiling()-new Date())/86400000); },
  cashFlowReserve(){ const all=Transactions.all().filter(t=>t.accountType==='business'); return Math.max(0,all.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)-all.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)); },

  taxSummary(yyyy){
    const gross=Transactions.yearly(yyyy,'income'); const expenses=Transactions.yearly(yyyy,'expense');
    const net=gross-expenses; const itc=Transactions.yearlyITC(yyyy);
    const gstOwed=this.gstNetLiability(yyyy); const taxOwed=Math.max(0,net*0.25);
    return {gross,expenses,net,gstOwed,itc,taxOwed,currency:Settings.get().currency};
  },

  plByPeriod(yyyy){
    const byMonth=[]; for(let m=1;m<=12;m++){ const ym=`${yyyy}-${String(m).padStart(2,'0')}`; byMonth.push({month:m,income:Transactions.monthly(ym,'income'),expenses:Transactions.monthly(ym,'expense')}); }
    const byCategory={income:{},expense:{}};
    Transactions.all().filter(t=>t.date.startsWith(yyyy)&&t.accountType==='business').forEach(t=>{
      if(!byCategory[t.type][t.category]) byCategory[t.type][t.category]=0;
      byCategory[t.type][t.category]+=t.amount;
    });
    const gross=Transactions.yearly(yyyy,'income'),expenses=Transactions.yearly(yyyy,'expense');
    return {gross,expenses,net:gross-expenses,margin:gross?((gross-expenses)/gross*100).toFixed(1):0,byMonth,byCategory};
  },

  gstReport(yyyy){
    const txRate=Settings.getTaxRate(); const label=Settings.getTaxLabel();
    const collected=Transactions.yearlyGSTCollected(yyyy);
    const itc=Transactions.yearlyITC(yyyy); const owing=Math.max(0,collected-itc);
    // by quarter
    const quarters=[{label:'Q1',months:['01','02','03']},{label:'Q2',months:['04','05','06']},{label:'Q3',months:['07','08','09']},{label:'Q4',months:['10','11','12']}];
    const byQuarter=quarters.map(q=>{ const c=q.months.reduce((s,m)=>s+Transactions.monthlyGSTCollected(`${yyyy}-${m}`),0); const i=q.months.reduce((s,m)=>s+Transactions.monthlyITC(`${yyyy}-${m}`),0); return {label:q.label,collected:c,itc:i,owing:Math.max(0,c-i)}; });
    return {collected,itc,owing,byQuarter,rate:txRate,label};
  },

  arAging(){
    Invoices.checkOverdue();
    const now=new Date(); now.setHours(0,0,0,0);
    return Invoices.all().filter(i=>['sent','viewed','overdue'].includes(i.status)).map(i=>{
      const due=new Date(i.dueDate+'T12:00:00'); const days=Math.ceil((now-due)/86400000);
      const customer=Customers.get(i.customerId);
      return {...i,customerName:customer?customer.name:i.customerName,daysOverdue:Math.max(0,days),bucket:days<=0?'current':days<=30?'1-30':days<=60?'31-60':days<=90?'61-90':'90+'};
    }).sort((a,b)=>b.daysOverdue-a.daysOverdue);
  },

  revenueByService(yyyy){
    const txns=Transactions.all().filter(t=>t.type==='income'&&t.date.startsWith(yyyy)&&t.accountType==='business');
    const map={};
    txns.forEach(t=>{ const sid=t.serviceType||'other'; if(!map[sid]) map[sid]={amount:0,ownerNet:0,count:0}; map[sid].amount+=t.amount; map[sid].ownerNet+=(t.ownerNet!=null?t.ownerNet:t.amount); map[sid].count++; });
    const total=Object.values(map).reduce((s,v)=>s+v.amount,0);
    return Object.entries(map).map(([sid,v])=>({sid,label:SERVICE_TYPES.find(s=>s.id===sid)?.label||sid,icon:SERVICE_TYPES.find(s=>s.id===sid)?.icon||'💰',color:SERVICE_TYPES.find(s=>s.id===sid)?.color||'#64748b',...v,pct:total?(v.amount/total*100).toFixed(1):0})).sort((a,b)=>b.amount-a.amount);
  },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────
function seedIfEmpty(){
  if(localStorage.getItem('cto_seeded_v4'))return;
  const now=new Date();
  const d=(mo,day=15)=>{ const dt=new Date(now.getFullYear(),now.getMonth()-mo,day); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };

  // Customers
  const c1=Customers.add({name:'Smith Family',email:'smith@email.com',phone:'604-555-0101',address:'123 Maple Street',city:'Vancouver',province:'BC',postalCode:'V5K 1A1'});
  const c2=Customers.add({name:'Johnson Renovations',email:'johnson@email.com',phone:'604-555-0202',address:'456 Oak Ave',city:'Burnaby',province:'BC',postalCode:'V5B 2B2'});
  const c3=Customers.add({name:'BlueStar Commercial',email:'bluestar@corp.com',phone:'604-555-0303',address:'789 Commercial Dr',city:'Vancouver',province:'BC',postalCode:'V5L 3C3'});
  const c4=Customers.add({name:'Park & Chen Holdings',email:'park@holdings.com',phone:'778-555-0404',address:'321 Kingsway',city:'Vancouver',province:'BC',postalCode:'V5R 5G5'});

  // Invoices
  Invoices.add({type:'invoice',customerId:c1.id,customerName:c1.name,date:d(0,5),dueDate:d(0,35),status:'paid',lineItems:[{description:'Full carpet cleaning (3 bedrooms)',serviceType:'carpet',qty:1,unitPrice:480,gst:true}]});
  const inv2=Invoices.add({type:'invoice',customerId:c2.id,customerName:c2.name,date:d(0,8),dueDate:d(0,38),status:'sent',lineItems:[{description:'Tile & grout cleaning - kitchen & bathrooms',serviceType:'tile',qty:1,unitPrice:320,gst:true}]});
  const inv3=Invoices.add({type:'invoice',customerId:c3.id,customerName:c3.name,date:d(1,5),dueDate:d(0,-5),status:'overdue',lineItems:[{description:'Commercial office cleaning - 2000 sqft',serviceType:'commercial',qty:1,unitPrice:650,gst:true}]});
  const est1=Invoices.add({type:'estimate',customerId:c4.id,customerName:c4.name,date:d(0,2),dueDate:addDays(d(0,2),30),status:'draft',lineItems:[{description:'Upholstery cleaning - sectional sofa',serviceType:'upholstery',qty:1,unitPrice:390,gst:true}]});

  // Transactions (seeded)
  [{type:'income',amount:480,description:'Carpet Cleaning - Smith Family',category:'Carpet Cleaning',serviceType:'carpet',date:d(0,5),gstIncluded:true,invoiceId:null},
   {type:'income',amount:650,description:'Commercial Office - BlueStar',category:'Commercial Service',serviceType:'commercial',date:d(0,10),gstIncluded:true},
   {type:'income',amount:390,description:'Upholstery Cleaning - Lakeview',category:'Upholstery Cleaning',serviceType:'upholstery',date:d(1,14),gstIncluded:true},
   {type:'income',amount:540,description:'Area Rug Deep Clean x3',category:'Area Rug Cleaning',serviceType:'rug',date:d(1,20),gstIncluded:true},
   {type:'income',amount:720,description:'Carpet Cleaning - Lakeview Condos',category:'Carpet Cleaning',serviceType:'carpet',date:d(2,8),gstIncluded:true},
   {type:'income',amount:280,description:'Tile cleaning - bathroom reno',category:'Tile & Grout Cleaning',serviceType:'tile',date:d(2,15),gstIncluded:true},
   // prev year for reports
   {type:'income',amount:520,description:'Carpet - PrevYear',category:'Carpet Cleaning',serviceType:'carpet',date:`${now.getFullYear()-1}-06-15`,gstIncluded:true},
   {type:'income',amount:350,description:'Tile - PrevYear',category:'Tile & Grout Cleaning',serviceType:'tile',date:`${now.getFullYear()-1}-09-10`,gstIncluded:true},
   {type:'expense',amount:85,description:'Cleaning Chemicals',category:'Cleaning Supplies',date:d(0,6),gstPaid:true},
   {type:'expense',amount:120,description:'Fuel - Shell',category:'Vehicle Fuel',date:d(0,9),gstPaid:true},
   {type:'expense',amount:99,description:'Housecall Pro subscription',category:'Software & Subscriptions',date:d(0,1),gstPaid:true},
   {type:'expense',amount:210,description:'Van service — oil change',category:'Vehicle Maintenance',date:d(1,18),gstPaid:true},
   {type:'expense',amount:45,description:'Business insurance',category:'Business Insurance',date:d(1,5),gstPaid:false},
   {type:'expense',amount:380,description:'Truck mount repairs',category:'Equipment Repair',date:d(2,22),gstPaid:true},
   {type:'expense',amount:200,description:'Supplies - PrevYear',category:'Cleaning Supplies',date:`${now.getFullYear()-1}-07-05`,gstPaid:true},
  ].forEach(t=>Transactions.add(t));

  // Equipment
  [{name:'Truck Mount (Hot Water)',icon:'🚛',lastService:d(1),nextService:d(-2),monthlyFund:200,status:'ok'},
   {name:'Portable Extractor',icon:'🧹',lastService:d(0),nextService:d(-3),monthlyFund:80,status:'ok'},
   {name:'Tile Scrubber Machine',icon:'⚙️',lastService:d(3),nextService:d(-1),monthlyFund:60,status:'due'},
   {name:'Upholstery Tool Kit',icon:'🛋️',lastService:d(2),nextService:d(-2),monthlyFund:30,status:'ok'},
  ].forEach(e=>Equipment.add(e));

  // Hours
  [{date:d(0,1),hours:5.5,hourlyRate:25,notes:'Apartment deep clean - downtown'},{date:d(0,3),hours:3.25,hourlyRate:25,notes:'Office maintenance'},{date:d(1,5),hours:7,hourlyRate:25,notes:'Move-out clean large house'}].forEach(l=>TimeLogs.add(l));

  localStorage.setItem('cto_seeded_v4','1');
}

// ── Users ─────────────────────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { id:'user_douglas', name:'Douglas', fullName:'Douglas Da Silva', role:'business',
    color:'#00d4ff', avatar:'D', isOwner:true },
  { id:'user_selma', name:'Selma', fullName:'Selma Da Silva', role:'personal',
    color:'#c07aff', avatar:'S', isOwner:false,
    t4:{ grossSalary:52000, payPeriods:26, province:'BC',
         federalClaim:15705, provincialClaim:11981 } },
];
const Users = {
  all(){ const stored=_load('cto_users'); return stored.length?stored:DEFAULT_USERS; },
  get(id){ return this.all().find(u=>u.id===id)||this.all()[0]; },
  save(list){ _save('cto_users',list); },
  update(id,changes){
    const list=this.all(); const i=list.findIndex(u=>u.id===id);
    if(i<0) return; list[i]=Object.assign({},list[i],changes); this.save(list); return list[i];
  },
  add(u){ const list=this.all(); const n={id:'user_'+uid(),...u}; list.push(n); this.save(list); return n; },
  delete(id){ this.save(this.all().filter(u=>u.id!==id)); },
  activeId(){ return localStorage.getItem('cto_active_user')||'user_douglas'; },
  setActive(id){ localStorage.setItem('cto_active_user',id); },
  active(){ return this.get(this.activeId()); },
};

// ── T4 Tax Helpers (Canada 2025) ──────────────────────────────────────────────
const T4Calc = {
  // 2025 CRA rates
  CPP_RATE:0.0595, CPP_MAX_CONTRIB:3867.50, CPP_EXEMPTION:3500,
  EI_RATE:0.01664, EI_MAX_INSURABLE:65700, EI_MAX_CONTRIB:1093.47,
  FEDERAL_BRACKETS:[
    {min:0,     max:57375,  rate:0.15},
    {min:57375, max:114750, rate:0.205},
    {min:114750,max:177882, rate:0.26},
    {min:177882,max:253414, rate:0.29},
    {min:253414,max:Infinity,rate:0.33},
  ],
  BC_BRACKETS:[
    {min:0,     max:45654,  rate:0.0506},
    {min:45654, max:91310,  rate:0.077},
    {min:91310, max:104835, rate:0.105},
    {min:104835,max:127299, rate:0.1229},
    {min:127299,max:172602, rate:0.147},
    {min:172602,max:240716, rate:0.168},
    {min:240716,max:Infinity,rate:0.205},
  ],
  calcTax(income, brackets, personalAmount=15705){
    const taxable=Math.max(0,income-personalAmount);
    let tax=0;
    for(const b of brackets){
      if(taxable<=b.min) break;
      tax+=(Math.min(taxable,b.max)-b.min)*b.rate;
    }
    return Math.max(0,tax);
  },
  forEmployee(grossAnnual, province='BC'){
    const cpp=Math.min((grossAnnual-this.CPP_EXEMPTION)*this.CPP_RATE, this.CPP_MAX_CONTRIB);
    const ei=Math.min(grossAnnual*this.EI_RATE, this.EI_MAX_CONTRIB);
    const fedTax=this.calcTax(grossAnnual, this.FEDERAL_BRACKETS);
    const provTax=province==='BC'?this.calcTax(grossAnnual,this.BC_BRACKETS,11981):0;
    const totalTax=fedTax+provTax;
    const totalDeductions=cpp+ei+totalTax;
    const netAnnual=grossAnnual-totalDeductions;
    return { grossAnnual, cpp, ei, fedTax, provTax, totalTax, totalDeductions, netAnnual,
             netMonthly:netAnnual/12, netBiweekly:netAnnual/26,
             effectiveRate:grossAnnual>0?totalDeductions/grossAnnual:0 };
  },
};

// ── Personal Transactions ─────────────────────────────────────────────────────
const PERSONAL_CATEGORIES = [
  {id:'groceries',   label:'Groceries',     icon:'🛒', color:'#22c55e'},
  {id:'utilities',   label:'Utilities',     icon:'💡', color:'#3b82f6'},
  {id:'rent',        label:'Rent/Mortgage', icon:'🏠', color:'#8b5cf6'},
  {id:'transport',   label:'Transport',     icon:'🚗', color:'#f59e0b'},
  {id:'dining',      label:'Dining Out',    icon:'🍽️', color:'#ef4444'},
  {id:'health',      label:'Health',        icon:'🏥', color:'#ec4899'},
  {id:'subscriptions',label:'Subscriptions',icon:'📱', color:'#06b6d4'},
  {id:'entertainment',label:'Entertainment',icon:'🎬', color:'#a855f7'},
  {id:'clothing',    label:'Clothing',      icon:'👕', color:'#f97316'},
  {id:'education',   label:'Education',     icon:'📚', color:'#14b8a6'},
  {id:'childcare',   label:'Childcare',     icon:'👶', color:'#fb923c'},
  {id:'savings',     label:'Savings',       icon:'💰', color:'#00d4ff'},
  {id:'other_personal',label:'Other',       icon:'📦', color:'#64748b'},
];
const PersonalTransactions = {
  _k(userId){ return 'cto_ptxn_'+(userId||Users.activeId()); },
  all(userId){ return _load(this._k(userId)).sort((a,b)=>b.date.localeCompare(a.date)); },
  add(t, userId){
    const list=_load(this._k(userId));
    const n={id:uid(), date:t.date||today(), type:t.type||'expense',
              amount:parseFloat(t.amount)||0, description:t.description||'',
              category:t.category||'other_personal', notes:t.notes||'',
              receipt:t.receipt||null, userId:userId||Users.activeId()};
    list.push(n); _save(this._k(userId),list); return n;
  },
  update(id,u,userId){ const l=_load(this._k(userId)),i=l.findIndex(t=>t.id===id); if(i<0)return; l[i]=Object.assign(l[i],u); _save(this._k(userId),l); return l[i]; },
  delete(id,userId){ _save(this._k(userId),_load(this._k(userId)).filter(t=>t.id!==id)); },
  monthly(ym,type,userId){ return this.all(userId).filter(t=>t.date.startsWith(ym)&&(!type||t.type===type)).reduce((s,t)=>s+t.amount,0); },
  byCategory(ym,userId){ const r={}; this.all(userId).filter(t=>t.date.startsWith(ym)&&t.type==='expense').forEach(t=>{ r[t.category]=(r[t.category]||0)+t.amount; }); return r; },
};

// ── Personal Budgets ──────────────────────────────────────────────────────────
const PersonalBudgets = {
  _k(userId){ return 'cto_pbudget_'+(userId||Users.activeId()); },
  _defaults(){ return PERSONAL_CATEGORIES.reduce((o,c)=>{ o[c.id]=0; return o; },{}); },
  get(userId){ return _loadObj(this._k(userId), this._defaults()); },
  set(budgets,userId){ _save(this._k(userId), budgets); },
  setCategory(categoryId, amount, userId){ const b=this.get(userId); b[categoryId]=parseFloat(amount)||0; this.set(b,userId); },
};

// ── Savings Goals ─────────────────────────────────────────────────────────────
const PersonalGoals = {
  _k(userId){ return 'cto_pgoals_'+(userId||Users.activeId()); },
  _defaults(){ return { monthlyBudget:4000, savingsTarget:12000, savedSoFar:0, emergencyFund:6000 }; },
  get(userId){ return _loadObj(this._k(userId), this._defaults()); },
  set(g,userId){ _save(this._k(userId),g); },
};

// ── Global DB ────────────────────────────────────────────────────────────────
window.DB = {
  Settings, Customers, Invoices, Accounts, Transactions, Equipment, TimeLogs, Goals, Calc,
  SERVICE_TYPES, PROVINCES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, EXPENSE_CATEGORIES_DATA,
  PERSONAL_CATEGORIES,
  getExpenseCategoryMeta, seedIfEmpty, uid, today, addDays,
  Users, T4Calc, PersonalTransactions, PersonalBudgets, PersonalGoals,
};
