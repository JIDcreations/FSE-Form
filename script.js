/* ── SCROLL-IN ─────────────────────────────────── */
const fadeIo = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); fadeIo.unobserve(e.target); } });
}, { threshold: 0.07 });
document.querySelectorAll('.fade-up').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  fadeIo.observe(el);
});

/* ── COLOR PICKERS ─────────────────────────────── */
function linkColor(pid, hid) {
  const p = document.getElementById(pid), h = document.getElementById(hid);
  p.addEventListener('input', () => { h.value = p.value; });
  h.addEventListener('input', () => { if (/^#[0-9a-fA-F]{6}$/.test(h.value)) p.value = h.value; });
  h.addEventListener('blur',  () => { if (!/^#[0-9a-fA-F]{6}$/.test(h.value)) h.value = p.value; });
}
linkColor('primaryPicker', 'primaryHex');
linkColor('accentPicker',  'accentHex');

/* ── TAG INPUT ─────────────────────────────────── */
function makeTagInput({ fieldId, inputId, urlMode }) {
  const field = document.getElementById(fieldId);
  const input = document.getElementById(inputId);
  const tags  = [];

  function isValidUrl(s) {
    try { return Boolean(new URL(s)); } catch { return false; }
  }

  function trunc(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }

  function render() {
    field.querySelectorAll('.tag-chip').forEach(c => c.remove());
    tags.forEach((tag, i) => {
      const invalid = urlMode && !isValidUrl(tag);
      const chip = document.createElement('span');
      chip.className = 'tag-chip' + (invalid ? ' invalid' : '');
      chip.innerHTML = `<span title="${tag}">${trunc(tag, 32)}</span><span class="tag-chip-x" data-i="${i}">×</span>`;
      field.insertBefore(chip, input);
    });
  }

  function addTag(raw) {
    const val = raw.trim();
    if (!val || tags.includes(val)) return;
    tags.push(val);
    render();
  }

  function addMany(raw) {
    raw.split(/[,\n]+/).forEach(s => addTag(s.trim()));
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.value.trim()) { addTag(input.value); input.value = ''; }
    } else if (e.key === 'Backspace' && input.value === '' && tags.length) {
      tags.pop(); render();
    }
  });

  input.addEventListener('paste', e => {
    e.preventDefault();
    addMany(e.clipboardData.getData('text'));
    input.value = '';
  });

  input.addEventListener('blur', () => {
    if (input.value.trim()) { addTag(input.value); input.value = ''; }
  });

  field.addEventListener('click', e => {
    if (e.target.classList.contains('tag-chip-x')) {
      tags.splice(parseInt(e.target.dataset.i), 1); render();
    } else {
      input.focus();
    }
  });

  return {
    getValid: () => urlMode ? tags.filter(isValidUrl) : tags.filter(Boolean)
  };
}

const servicesCtrl = makeTagInput({ fieldId: 'servicesTF', inputId: 'servicesInput', urlMode: false });
const refsCtrl     = makeTagInput({ fieldId: 'refsTF',      inputId: 'refsInput',     urlMode: true  });

/* ── CONTENT SUGGESTIONS ───────────────────────── */
const SUGGESTIONS = {
  type: {
    portfolio:    ['projects', 'testimonials', 'contact'],
    landing_page: ['testimonials', 'faq', 'contact'],
    corporate:    ['team', 'testimonials', 'faq', 'contact'],
    'e-commerce': ['faq', 'testimonials', 'contact'],
    blog:         ['blog', 'contact'],
    saas:         ['faq', 'testimonials', 'contact'],
    event:        ['events', 'faq', 'contact'],
    nonprofit:    ['team', 'testimonials', 'contact'],
  },
  goal: {
    lead_generation:    ['testimonials', 'faq', 'contact'],
    portfolio_showcase: ['projects', 'testimonials'],
    sell_online:        ['faq', 'testimonials', 'contact'],
    brand_awareness:    ['team', 'blog', 'testimonials'],
    inform_audience:    ['blog', 'faq'],
    event_promotion:    ['events', 'contact', 'faq'],
    recruit_talent:     ['team', 'contact'],
  }
};

function applySuggestions() {
  const type = document.getElementById('siteType').value;
  const goal = document.getElementById('siteGoal').value;
  const suggested = new Set([
    ...(SUGGESTIONS.type[type] || []),
    ...(SUGGESTIONS.goal[goal] || [])
  ]);
  if (!suggested.size) return;
  document.querySelectorAll('.cb-item input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  suggested.forEach(key => { const cb = document.getElementById('cb_' + key); if (cb) cb.checked = true; });
  document.getElementById('suggestHint').classList.add('show');
}

document.getElementById('siteType').addEventListener('change', applySuggestions);
document.getElementById('siteGoal').addEventListener('change', applySuggestions);

/* ── HELPERS ───────────────────────────────────── */
const getVal = id => document.getElementById(id).value.trim();

/* ── SUBMIT → JSON ─────────────────────────────── */
document.getElementById('siteForm').addEventListener('submit', e => {
  e.preventDefault();

  const cfg = {
    meta: { generated_at: new Date().toISOString(), builder_version: '1.0.0', source: 'fse-sitebuilder' }
  };

  // Business — omit empty fields
  const biz = {};
  const cn = getVal('companyName'); if (cn) biz.company_name = cn;
  const sc = getVal('sector');      if (sc) biz.sector = sc.toLowerCase();
  const sv = servicesCtrl.getValid(); if (sv.length) biz.services = sv.map(s => s.toLowerCase());
  const ta = getVal('targetAudience'); if (ta) biz.target_audience = ta;
  if (Object.keys(biz).length) cfg.business = biz;

  // Site
  const site = {};
  const sg = getVal('siteGoal'); if (sg) site.goal = sg;
  const st = getVal('siteType'); if (st) site.type = st;
  if (Object.keys(site).length) cfg.site = site;

  // Style
  const style = {};
  const vibe   = getVal('styleVibe');   if (vibe)   style.vibe   = vibe;
  const mode   = getVal('styleMode');   if (mode)   style.mode   = mode;
  const energy = getVal('styleEnergy'); if (energy) style.energy = energy;
  const pc = getVal('primaryHex'); if (pc) style.primary_color = pc;
  const ac = getVal('accentHex');  if (ac) style.accent_color  = ac;
  const refs = refsCtrl.getValid(); if (refs.length) style.references = refs;
  if (Object.keys(style).length) cfg.style = style;

  // Content — only include checked sections
  const secs = {};
  let hasSec = false;
  document.querySelectorAll('.cb-item input[type="checkbox"]').forEach(cb => {
    if (cb.checked) { secs[cb.value] = true; hasSec = true; }
  });
  if (hasSec) cfg.content = { sections: secs };

  renderOut(cfg);
});

/* ── JSON HIGHLIGHT ────────────────────────────── */
function hl(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, m => {
      if (/^".*":$/.test(m.trim())) return `<span class="j-key">${m}</span>`;
      if (/^"/.test(m))             return `<span class="j-str">${m}</span>`;
      if (/true|false/.test(m))     return `<span class="j-bool">${m}</span>`;
      if (/null/.test(m))           return `<span class="j-null">${m}</span>`;
      return `<span class="j-num">${m}</span>`;
    });
}

/* ── SUMMARY ───────────────────────────────────── */
const GOAL_LABELS = {
  lead_generation: 'Leads genereren', portfolio_showcase: 'Portfolio tonen',
  sell_online: 'Online verkopen', brand_awareness: 'Naamsbekendheid',
  inform_audience: 'Informeren / Blog', event_promotion: 'Evenement promoten',
  recruit_talent: 'Talent aantrekken', other: 'Anders'
};
const TYPE_LABELS = {
  portfolio: 'Portfolio', landing_page: 'Landing Page', corporate: 'Corporate',
  'e-commerce': 'E-Commerce', blog: 'Blog', saas: 'SaaS', event: 'Evenement',
  nonprofit: 'Non-Profit', other: 'Anders'
};
const SEC_LABELS = {
  testimonials: 'Testimonials', team: 'Team', faq: 'FAQ',
  projects: 'Projecten', contact: 'Contact', events: 'Evenementen', blog: 'Blog'
};

function buildSummary() {
  const rows = [];
  const cn = getVal('companyName'), sc = getVal('sector');
  if (cn || sc) rows.push({ key: 'Bedrijf', val: [cn, sc].filter(Boolean).join(' — ') });
  const goal = getVal('siteGoal'); if (goal) rows.push({ key: 'Doel', val: GOAL_LABELS[goal] || goal });
  const type = getVal('siteType'); if (type) rows.push({ key: 'Type',  val: TYPE_LABELS[type] || type });
  const styleParts = [getVal('styleVibe'), getVal('styleMode'), getVal('styleEnergy')].filter(Boolean);
  if (styleParts.length) rows.push({ key: 'Stijl', val: styleParts.join(' / ') });
  const checked = [...document.querySelectorAll('.cb-item input:checked')].map(cb => SEC_LABELS[cb.value] || cb.value);
  if (checked.length) rows.push({ key: 'Secties', chips: checked });

  document.getElementById('summaryGrid').innerHTML = rows.map(r =>
    r.chips
      ? `<div class="summary-row"><span class="s-key">${r.key}</span><div class="s-chips">${r.chips.map(c => `<span class="s-chip">${c}</span>`).join('')}</div></div>`
      : `<div class="summary-row"><span class="s-key">${r.key}</span><span class="s-val">${r.val}</span></div>`
  ).join('');
}

/* ── RENDER OUTPUT ─────────────────────────────── */
function renderOut(cfg) {
  buildSummary();
  document.getElementById('jsonOut').innerHTML = hl(JSON.stringify(cfg, null, 2));
  const sec = document.getElementById('output');
  const rev = document.getElementById('outReveal');
  sec.classList.add('show');
  requestAnimationFrame(() => requestAnimationFrame(() => rev.classList.add('in')));
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── COPY ──────────────────────────────────────── */
document.getElementById('copyBtn').addEventListener('click', async () => {
  const t = document.getElementById('jsonOut').innerText;
  try { await navigator.clipboard.writeText(t); }
  catch { const a = document.createElement('textarea'); a.value=t; document.body.appendChild(a); a.select(); document.execCommand('copy'); document.body.removeChild(a); }
  flash('copyBtn', 'Gekopieerd ✓');
});

/* ── DOWNLOAD ──────────────────────────────────── */
document.getElementById('downloadBtn').addEventListener('click', () => {
  const t = document.getElementById('jsonOut').innerText;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([t], { type: 'application/json' })),
    download: 'site-config.json'
  });
  a.click(); URL.revokeObjectURL(a.href);
  flash('downloadBtn', 'Opgeslagen ✓');
});

function flash(id, lbl) {
  const b = document.getElementById(id), o = b.innerHTML;
  b.textContent = lbl; b.classList.add('ok');
  setTimeout(() => { b.innerHTML = o; b.classList.remove('ok'); }, 2200);
}
