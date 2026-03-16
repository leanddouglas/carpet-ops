/**
 * icons.js — Futuristic SVG Icon Library
 * Neon cyan/amber glowing icons for Douglas Da Silva Carpet Cleaning App
 */
const ICONS = {
  // ── Navigation Icons ─────────────────────────────────────────────
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <rect x="3" y="3" width="13" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <rect x="20" y="3" width="13" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <rect x="3" y="20" width="13" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <rect x="20" y="20" width="13" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <line x1="9" y1="9" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="7" x2="26" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="9" y1="26" x2="9" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="26" cy="26" r="3" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  sales: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <rect x="6" y="4" width="24" height="28" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <line x1="12" y1="12" x2="24" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="17" x2="24" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="22" x2="18" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="26" cy="8" r="5" fill="#0a0e1a" stroke="#ff8c00" stroke-width="1.5"/>
    <text x="26" y="11" text-anchor="middle" font-size="6" font-weight="bold" fill="#ff8c00" font-family="monospace">$</text>
  </svg>`,

  accounting: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <rect x="3" y="5" width="30" height="26" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <line x1="3" y1="13" x2="33" y2="13" stroke="currentColor" stroke-width="1.2" opacity=".5"/>
    <line x1="12" y1="5" x2="12" y2="31" stroke="currentColor" stroke-width="1.2" opacity=".5"/>
    <polyline points="7,24 10,18 14,22 18,14 22,19 26,12 29,16" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`,

  reports: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <rect x="8" y="18" width="5" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="15.5" y="12" width="5" height="20" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="23" y="6" width="5" height="26" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <polyline points="6,28 10,20 18,14 26,8" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 1.5"/>
    <circle cx="10" cy="20" r="1.5" fill="#00d4ff"/>
    <circle cx="18" cy="14" r="1.5" fill="#00d4ff"/>
    <circle cx="26" cy="8" r="1.5" fill="#00d4ff"/>
  </svg>`,

  equipment: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <circle cx="18" cy="18" r="6" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="2" fill="currentColor"/>
    <path d="M18 5v4M18 27v4M5 18h4M27 18h4M8.9 8.9l2.8 2.8M24.3 24.3l2.8 2.8M8.9 27.1l2.8-2.8M24.3 11.7l2.8-2.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M18 12l1.5-4h-3L18 12z" fill="currentColor"/>
  </svg>`,

  settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <path d="M18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M15 4l-1.2 3.3a9 9 0 0 0-2.5 1.4L8 7.5 4.5 13l2.7 2A9 9 0 0 0 7 18a9 9 0 0 0 .2 2.3L4.5 23 8 28.5l3.3-1.2a9 9 0 0 0 2.4 1.4L15 32h6l1.2-3.3a9 9 0 0 0 2.5-1.4l3.3 1.2L31.5 23l-2.7-2.1c.1-.6.2-1.2.2-1.9s-.1-1.3-.2-1.9L31.5 15 28 9.5l-3.3 1.2a9 9 0 0 0-2.4-1.4L21 4h-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,

  personal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="24" height="24" fill="none">
    <path d="M18 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M6 31c0-4.4 5.4-8 12-8s12 3.6 12 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // ── Action Icons ─────────────────────────────────────────────────
  addIncome: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <circle cx="14" cy="14" r="12" stroke="#00ff88" stroke-width="1.5"/>
    <line x1="14" y1="8" x2="14" y2="20" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
    <line x1="8" y1="14" x2="20" y2="14" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  addExpense: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <circle cx="14" cy="14" r="12" stroke="#ff4466" stroke-width="1.5"/>
    <line x1="8" y1="14" x2="20" y2="14" stroke="#ff4466" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 9l4-4 4 4M14 5v12" stroke="#ff4466" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  invoice: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <rect x="4" y="2" width="20" height="24" rx="3" stroke="#00d4ff" stroke-width="1.5"/>
    <line x1="9" y1="9" x2="19" y2="9" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="9" y1="14" x2="19" y2="14" stroke="#00d4ff" stroke-width="1" stroke-linecap="round" opacity=".6"/>
    <line x1="9" y1="19" x2="14" y2="19" stroke="#00d4ff" stroke-width="1" stroke-linecap="round" opacity=".6"/>
    <circle cx="22" cy="6" r="4" fill="#0a0e1a" stroke="#ff8c00" stroke-width="1.5"/>
    <text x="22" y="9" text-anchor="middle" font-size="5" font-weight="bold" fill="#ff8c00" font-family="monospace">$</text>
  </svg>`,

  hours: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <circle cx="14" cy="14" r="11" stroke="#ff8c00" stroke-width="1.5"/>
    <line x1="14" y1="6" x2="14" y2="14" stroke="#ff8c00" stroke-width="2" stroke-linecap="round"/>
    <line x1="14" y1="14" x2="19" y2="17" stroke="#ff8c00" stroke-width="2" stroke-linecap="round"/>
    <circle cx="14" cy="14" r="1.5" fill="#ff8c00"/>
    <line x1="14" y1="3" x2="14" y2="5" stroke="#ff8c00" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="14" y1="23" x2="14" y2="25" stroke="#ff8c00" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="3" y1="14" x2="5" y2="14" stroke="#ff8c00" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="23" y1="14" x2="25" y2="14" stroke="#ff8c00" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // AI / Smart features
  ai: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <path d="M9 6c0-1.7 2.2-3 5-3s5 1.3 5 3" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="5" y="6" width="18" height="16" rx="4" stroke="#00d4ff" stroke-width="1.5"/>
    <line x1="10" y1="10" x2="10" y2="18" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M13 10h3a2 2 0 0 1 0 4h-3M13 14h3.5a2 2 0 0 1 0 4H13" stroke="#00d4ff" stroke-width="1.3" stroke-linecap="round"/>
    <line x1="7" y1="22" x2="7" y2="26" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="14" y1="22" x2="14" y2="26" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="21" y1="22" x2="21" y2="26" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  gst: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <polygon points="14,2 26,22 2,22" stroke="#ff8c00" stroke-width="1.5" stroke-linejoin="round"/>
    <text x="14" y="20" text-anchor="middle" font-size="9" font-weight="bold" fill="#ff8c00" font-family="monospace">$</text>
  </svg>`,

  delete: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <polyline points="3,6 5,6 21,6" stroke="#ff4466" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M19 6l-1 14H6L5 6" stroke="#ff4466" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 6V4h6v2" stroke="#ff4466" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  paid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <polyline points="20,6 9,17 4,12" stroke="#00ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  send: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <line x1="22" y1="2" x2="11" y2="13" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <polygon points="22,2 15,22 11,13 2,9" stroke="#00d4ff" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
  </svg>`,

  print: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <polyline points="6,9 6,2 18,2 18,9" stroke="#8ab0cc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 18H4a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="#8ab0cc" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="6" y="14" width="12" height="8" rx="1" stroke="#8ab0cc" stroke-width="1.5"/>
  </svg>`,

  export: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#8ab0cc" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="7,10 12,15 17,10" stroke="#8ab0cc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="12" y1="15" x2="12" y2="3" stroke="#8ab0cc" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  convert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <polyline points="1,4 1,10 7,10" stroke="#aa44ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.5 15A9 9 0 1 0 6.1 5.5L1 10" stroke="#aa44ff" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  customer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="12" cy="7" r="4" stroke="#00d4ff" stroke-width="1.5"/>
  </svg>`,

  camera: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="20" height="20" fill="none">
    <rect x="3" y="8" width="22" height="16" rx="3" stroke="#c07aff" stroke-width="1.5"/>
    <circle cx="14" cy="16" r="4" stroke="#c07aff" stroke-width="1.5"/>
    <path d="M8 8L10 4h8l2 4" stroke="#c07aff" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="21" cy="12" r="1" fill="#c07aff"/>
  </svg>`,

  // Carpet/Cleaning specific
  carpet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="none">
    <rect x="2" y="6" width="24" height="16" rx="2" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="7" y1="6" x2="7" y2="22" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <line x1="12" y1="6" x2="12" y2="22" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <line x1="17" y1="6" x2="17" y2="22" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <line x1="22" y1="6" x2="22" y2="22" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <line x1="2" y1="10" x2="26" y2="10" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <line x1="2" y1="14" x2="26" y2="14" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <line x1="2" y1="18" x2="26" y2="18" stroke="#3b82f6" stroke-width="1" opacity=".5"/>
    <path d="M8 9l2 2-2 2M12 11h4" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  truck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="none">
    <rect x="2" y="8" width="16" height="12" rx="2" stroke="#00d4ff" stroke-width="1.5"/>
    <path d="M18 11h6l2 5v4H18V11z" stroke="#00d4ff" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="7" cy="22" r="2.5" stroke="#00d4ff" stroke-width="1.5"/>
    <circle cx="22" cy="22" r="2.5" stroke="#00d4ff" stroke-width="1.5"/>
    <line x1="4" y1="12" x2="16" y2="12" stroke="#00d4ff" stroke-width="1" opacity=".5"/>
    <line x1="4" y1="15" x2="16" y2="15" stroke="#00d4ff" stroke-width="1" opacity=".5"/>
  </svg>`,

  // Misc
  close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none">
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <circle cx="11" cy="11" r="8" stroke="#4d7a9a" stroke-width="1.5"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#4d7a9a" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  save: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <polyline points="7,3 7,8 15,8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,

  alert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none">
    <path d="M10.3 3.2L2 19a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 19L13.7 3.2a2 2 0 0 0-3.4 0z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
};

// Helper: inject SVG into any element by selector
function setIcon(el, name) {
  if (!el || !ICONS[name]) return;
  el.innerHTML = ICONS[name];
}

// Inject icons into nav bar
function applyNavIcons() {
  const map = {
    'nav-dashboard': 'dashboard',
    'nav-personal':  'personal',
    'nav-sales':     'sales',
    'nav-ledger':    'accounting',
    'nav-reports':   'reports',
    'nav-tracker':   'equipment',
    'nav-settings':  'settings',
  };
  Object.entries(map).forEach(([id, icon]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const span = el.querySelector('.nav-icon');
    if (span) span.innerHTML = ICONS[icon] || '';
  });
}

// Inject header action icons
function applyHeaderIcons() {
  const btns = document.querySelectorAll('.header-btn');
  const icons = [ICONS.invoice, ICONS.addIncome, ICONS.addExpense];
  btns.forEach((btn, i) => { if (icons[i]) btn.innerHTML = icons[i]; });
}

window.ICONS = ICONS;
window.applyNavIcons = applyNavIcons;
window.applyHeaderIcons = applyHeaderIcons;
