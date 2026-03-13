/* ── SCROLL-IN ─────────────────────────────────── */
const fadeIo = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      fadeIo.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });

document.querySelectorAll('.fade-up').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  fadeIo.observe(el);
});

/* ── TAG INPUT ─────────────────────────────────── */
function makeTagInput({ fieldId, inputId }) {
  const field = document.getElementById(fieldId);
  const input = document.getElementById(inputId);
  const tags = [];

  function toMachineString(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  function render() {
    field.querySelectorAll('.tag-chip').forEach(chip => chip.remove());
    tags.forEach((tag, index) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `<span title="${tag}">${tag}</span><span class="tag-chip-x" data-i="${index}">×</span>`;
      field.insertBefore(chip, input);
    });
  }

  function addTag(raw) {
    const value = toMachineString(raw);
    if (!value || tags.includes(value)) return;
    tags.push(value);
    render();
  }

  function addMany(raw) {
    raw.split(/[,\n]+/).forEach(part => addTag(part));
  }

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (input.value.trim()) {
        addTag(input.value);
        input.value = '';
      }
    } else if (event.key === 'Backspace' && input.value === '' && tags.length) {
      tags.pop();
      render();
    }
  });

  input.addEventListener('paste', event => {
    event.preventDefault();
    addMany(event.clipboardData.getData('text'));
    input.value = '';
  });

  input.addEventListener('blur', () => {
    if (input.value.trim()) {
      addTag(input.value);
      input.value = '';
    }
  });

  field.addEventListener('click', event => {
    if (event.target.classList.contains('tag-chip-x')) {
      tags.splice(Number.parseInt(event.target.dataset.i, 10), 1);
      render();
      return;
    }
    input.focus();
  });

  return {
    getValues: () => [...tags]
  };
}

const servicesCtrl = makeTagInput({ fieldId: 'servicesTF', inputId: 'servicesInput' });

/* ── HELPERS ───────────────────────────────────── */
const currentOutput = {
  text: ''
};

const VALID_VALUES = {
  siteType: ['service_business', 'portfolio_business', 'content_blog', 'company_site'],
  siteGoal: ['get_leads', 'explain_services', 'show_work', 'publish_articles'],
  launchPages: ['home', 'about', 'services', 'contact', 'portfolio', 'blog'],
  homepageSections: ['services_overview', 'explanatory_content', 'testimonials', 'contact_cta', 'portfolio_teaser', 'faq', 'pricing'],
  serviceHighlightCount: ['1', '2', '3', '4_plus'],
  primaryCta: ['contact_us', 'request_quote', 'call_us', 'book_now', 'visit_store'],
  proofAvailable: ['testimonials', 'portfolio_items', 'team_members'],
  contactMethods: ['phone', 'contact_page', 'form', 'location'],
  booleanSelect: ['yes', 'no']
};

const LABELS = {
  siteType: {
    service_business: 'Service business',
    portfolio_business: 'Portfolio business',
    content_blog: 'Content / blog',
    company_site: 'Company site'
  },
  siteGoal: {
    get_leads: 'Get leads',
    explain_services: 'Explain services',
    show_work: 'Show work',
    publish_articles: 'Publish articles'
  },
  launchPages: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    contact: 'Contact',
    portfolio: 'Portfolio',
    blog: 'Blog'
  },
  homepageSections: {
    services_overview: 'Services overview',
    explanatory_content: 'Explanatory content',
    testimonials: 'Testimonials',
    contact_cta: 'Contact CTA',
    portfolio_teaser: 'Portfolio teaser',
    faq: 'FAQ',
    pricing: 'Pricing'
  },
  primaryCta: {
    contact_us: 'Contact us',
    request_quote: 'Request quote',
    call_us: 'Call us',
    book_now: 'Book now',
    visit_store: 'Visit store'
  },
  proofAvailable: {
    testimonials: 'Testimonials',
    portfolio_items: 'Portfolio items',
    team_members: 'Team members'
  },
  contactMethods: {
    phone: 'Phone',
    contact_page: 'Contact page',
    form: 'Form',
    location: 'Location'
  },
  boolean: {
    true: 'Yes',
    false: 'No'
  }
};

function getSelectValue(id, validValues) {
  const value = document.getElementById(id).value.trim();
  return validValues.includes(value) ? value : '';
}

function getCheckedValues(name, validValues) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(input => input.value.trim())
    .filter((value, index, arr) => validValues.includes(value) && arr.indexOf(value) === index);
}

function getBoolean(id) {
  const value = getSelectValue(id, VALID_VALUES.booleanSelect);
  return value === 'yes';
}

/* ── SUBMIT → JSON ─────────────────────────────── */
document.getElementById('siteForm').addEventListener('submit', event => {
  event.preventDefault();

  const cfg = {
    meta: {
      generated_at: new Date().toISOString(),
      builder_version: '1.0.0',
      source: 'fse-sitebuilder'
    },
    site: {
      type: getSelectValue('siteType', VALID_VALUES.siteType),
      goal: getSelectValue('siteGoal', VALID_VALUES.siteGoal),
      launch_pages: getCheckedValues('launchPages', VALID_VALUES.launchPages),
      homepage_sections: getCheckedValues('homepageSections', VALID_VALUES.homepageSections),
      primary_cta: getSelectValue('primaryCta', VALID_VALUES.primaryCta),
      blog_needed: getBoolean('blogNeeded'),
      location_based: getBoolean('locationBased')
    },
    business: {
      services: servicesCtrl.getValues().filter(Boolean),
      service_highlight_count: getSelectValue('serviceHighlightCount', VALID_VALUES.serviceHighlightCount)
    },
    content: {
      proof_available: getCheckedValues('proofAvailable', VALID_VALUES.proofAvailable),
      contact_methods: getCheckedValues('contactMethods', VALID_VALUES.contactMethods)
    }
  };

  renderOut(cfg);
});

/* ── JSON HIGHLIGHT ────────────────────────────── */
function hl(source) {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, match => {
      if (/^".*":$/.test(match.trim())) return `<span class="j-key">${match}</span>`;
      if (/^"/.test(match)) return `<span class="j-str">${match}</span>`;
      if (/true|false/.test(match)) return `<span class="j-bool">${match}</span>`;
      if (/null/.test(match)) return `<span class="j-null">${match}</span>`;
      return `<span class="j-num">${match}</span>`;
    });
}

/* ── SUMMARY ───────────────────────────────────── */
function labelList(values, labels) {
  return values.map(value => labels[value] || value);
}

function humanizeMachineList(values) {
  return values.map(value => value.replace(/_/g, ' '));
}

function buildSummary(cfg) {
  const rows = [];

  if (cfg.site.type) rows.push({ key: 'Type', val: LABELS.siteType[cfg.site.type] || cfg.site.type });
  if (cfg.site.goal) rows.push({ key: 'Doel', val: LABELS.siteGoal[cfg.site.goal] || cfg.site.goal });
  if (cfg.business.services.length) rows.push({ key: 'Services', chips: humanizeMachineList(cfg.business.services) });
  if (cfg.business.service_highlight_count) rows.push({ key: 'Highlight', val: cfg.business.service_highlight_count });
  if (cfg.site.launch_pages.length) rows.push({ key: 'Pagina\'s', chips: labelList(cfg.site.launch_pages, LABELS.launchPages) });
  if (cfg.site.homepage_sections.length) rows.push({ key: 'Homepage', chips: labelList(cfg.site.homepage_sections, LABELS.homepageSections) });
  if (cfg.site.primary_cta) rows.push({ key: 'CTA', val: LABELS.primaryCta[cfg.site.primary_cta] || cfg.site.primary_cta });
  if (cfg.content.proof_available.length) rows.push({ key: 'Proof', chips: labelList(cfg.content.proof_available, LABELS.proofAvailable) });
  if (cfg.content.contact_methods.length) rows.push({ key: 'Contact', chips: labelList(cfg.content.contact_methods, LABELS.contactMethods) });
  rows.push({ key: 'Locatie', val: LABELS.boolean[String(cfg.site.location_based)] });
  rows.push({ key: 'Blog', val: LABELS.boolean[String(cfg.site.blog_needed)] });

  document.getElementById('summaryGrid').innerHTML = rows.map(row =>
    row.chips
      ? `<div class="summary-row"><span class="s-key">${row.key}</span><div class="s-chips">${row.chips.map(chip => `<span class="s-chip">${chip}</span>`).join('')}</div></div>`
      : `<div class="summary-row"><span class="s-key">${row.key}</span><span class="s-val">${row.val}</span></div>`
  ).join('');
}

/* ── RENDER OUTPUT ─────────────────────────────── */
function renderOut(cfg) {
  const outputText = JSON.stringify(cfg, null, 2);
  currentOutput.text = outputText;
  buildSummary(cfg);
  document.getElementById('jsonOut').innerHTML = hl(outputText);

  const section = document.getElementById('output');
  const reveal = document.getElementById('outReveal');
  section.classList.add('show');
  requestAnimationFrame(() => requestAnimationFrame(() => reveal.classList.add('in')));
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── COPY ──────────────────────────────────────── */
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!currentOutput.text) return;

  try {
    await navigator.clipboard.writeText(currentOutput.text);
  } catch {
    const area = document.createElement('textarea');
    area.value = currentOutput.text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }

  flash('copyBtn', 'Gekopieerd ✓');
});

/* ── DOWNLOAD ──────────────────────────────────── */
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!currentOutput.text) return;

  const link = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([currentOutput.text], { type: 'application/json' })),
    download: 'site-config.json'
  });

  link.click();
  URL.revokeObjectURL(link.href);
  flash('downloadBtn', 'Opgeslagen ✓');
});

function flash(id, label) {
  const button = document.getElementById(id);
  const original = button.innerHTML;
  button.textContent = label;
  button.classList.add('ok');

  setTimeout(() => {
    button.innerHTML = original;
    button.classList.remove('ok');
  }, 2200);
}
