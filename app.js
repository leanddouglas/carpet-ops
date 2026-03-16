/**
 * app.js — SPA Orchestrator v4 (Wave-inspired)
 */
const App = (() => {
  const screens = ['dashboard','personal','sales','ledger','reports','tracker','settings'];
  let currentScreen = 'dashboard';

  function navigate(screen) {
    currentScreen = screen;
    // Show/hide screens
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === screen+'-screen'));
    // Update nav
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.id === 'nav-'+screen));
    // Render screen
    if (screen==='dashboard') Dashboard.render();
    if (screen==='personal')  Personal.render();
    if (screen==='sales')     SalesModule.render();
    if (screen==='ledger')    Accounting.render();
    if (screen==='reports')   Reports.render();
    if (screen==='tracker')   EquipmentScreen.render();
    if (screen==='settings')  SettingsScreen.load();
    // Scroll to top
    document.getElementById(screen+'-screen')?.scrollTo(0,0);
  }

  function toast(msg, type='success', duration=2800) {
    const c = document.getElementById('toast-container'); if(!c)return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = {success:'✓',error:'✕',warning:'⚠',info:'ℹ'};
    t.innerHTML = `<span>${icons[type]||'✓'}</span><span style="flex:1;">${String(msg).replace(/</g,'&lt;')}</span>`;
    c.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-8px)'; t.style.transition='all .2s'; setTimeout(()=>t.remove(),220); }, duration);
  }

  function renderUserSwitcher() {
    const sw = document.getElementById('user-switcher'); if(!sw) return;
    const activeId = DB.Users.activeId();
    const activeUser = DB.Users.get(activeId);
    const users = DB.Users.all();
    if(users.length < 2) { sw.style.display='none'; return; }
    
    // Find next user to toggle to (simple 2-user toggle for now)
    const nextUser = users.find(u => u.id !== activeId) || users[0];
    
    sw.style.display='flex';
    sw.innerHTML = `
      <div style="width:28px;height:28px;border-radius:50%;background:${activeUser.color}22;border:1px solid ${activeUser.color};color:${activeUser.color};display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;" 
           onclick="App.switchUser('${nextUser.id}')" title="Switch to ${nextUser.name}">
        ${activeUser.avatar}
      </div>
    `;
  }

  function switchUser(userId) {
    const user = DB.Users.get(userId);
    if(!user) return;
    DB.Users.setActive(userId);
    renderUserSwitcher();
    toast(`Switched to ${user.name}'s profile`, 'info');
    
    // Route to appropriate dashboard
    if(user.role === 'personal') navigate('personal');
    else navigate('dashboard');
  }

  function init() {
    // Seed demo data
    DB.seedIfEmpty();
    // Init all modules
    Dashboard.init();
    SalesModule.init();
    Accounting.init();
    Reports.init();
    EquipmentScreen.init();
    SettingsScreen.init();
    if(typeof Personal!=='undefined') Personal.init();
    
    // Initial UI state
    renderUserSwitcher();
    const activeId = DB.Users.activeId();
    const active = DB.Users.get(activeId);
    if(active && active.role === 'personal') navigate('personal');
    else navigate('dashboard');

    // Check overdue invoices on load
    DB.Invoices.checkOverdue();
    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key==='Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
      }
    });
  }
  return { init, navigate, toast, switchUser, renderUserSwitcher };
})();

document.addEventListener('DOMContentLoaded', App.init);
