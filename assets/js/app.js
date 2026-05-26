/* Core state, routing, utilities */

window.App = (function () {
  const STEPS = [
    { id: 'upload', label: 'Upload sources', num: '1' },
    { id: 'quality', label: 'Source quality', num: '2' },
    { id: 'automap', label: 'Rules & AutoMap', num: '3' },
    { id: 'processing', label: 'Processing', num: '4' },
    { id: 'canonical', label: 'Canonical output', num: '5' },
    { id: 'network', label: 'Network graph', num: '6' },
    { id: 'twobytwo', label: '2×2 archetype maps', num: '7' },
    { id: 'assistant', label: 'Network assistant', num: '8' },
  ];

  const state = {
    current: 'upload',
    automapComplete: false,
    selectedTile: null,
    filters: {
      scenario: null,
      idn: null,
      specialty: null,
      region: null,
      archetype: null,
      strokeCenterLevel: null,
      bayerEngagement: null,
      showHCO: true,
      showTopics: false,
      showTrials: false,
      minLaunchRelevance: 0,
    },
    networkSelection: null,
  };

  function getData() { return window.DEMO_DATA; }

  function getHCP(id) {
    return getData().canonical_hcps.find(h => h.canonical_hcp_id === id);
  }
  function getHCPByNPI(npi) {
    return getData().canonical_hcps.find(h => h.npi === npi);
  }
  function getHCO(id) {
    return getData().canonical_hcos.find(h => h.canonical_hco_id === id);
  }

  const ROUTE_STEPS = {
    upload: {
      title: 'Loading source registry',
      sub: 'Step 1 · Upload sources',
      steps: [
        { label: 'Connecting to source registry', d: 720 },
        { label: 'Authenticating · Health Systems workspace', d: 640 },
        { label: 'Reading recent upload manifests', d: 780 },
        { label: 'Loading 6 source files', d: 680 },
      ],
    },
    quality: {
      title: 'Profiling source quality',
      sub: 'Step 2 · Source quality',
      steps: [
        { label: 'Loading column profiles', d: 680 },
        { label: 'Running 142 quality checks', d: 880 },
        { label: 'Detecting nulls, duplicates, conflicts', d: 780 },
        { label: 'Compiling quality report', d: 640 },
      ],
    },
    automap: {
      title: 'Initializing AutoMap',
      sub: 'Step 3 · Rules & AutoMap',
      steps: [
        { label: 'Loading mapping rule library', d: 660 },
        { label: 'Scanning 89 source columns', d: 780 },
        { label: 'Predicting canonical field mappings', d: 980 },
        { label: 'Resolving confidence scores', d: 660 },
      ],
    },
    processing: {
      title: 'Preparing pipeline',
      sub: 'Step 4 · Processing',
      steps: [
        { label: 'Initializing ingestion pipeline', d: 680 },
        { label: 'Queueing 8 processing stages', d: 740 },
        { label: 'Loading reference taxonomies', d: 780 },
        { label: 'Warming worker pool', d: 640 },
      ],
    },
    canonical: {
      title: 'Assembling canonical model',
      sub: 'Step 5 · Canonical output',
      steps: [
        { label: 'Querying canonical HCP store', d: 720 },
        { label: 'Loading 820 resolved identities', d: 880 },
        { label: 'Joining HCO and IDN context', d: 780 },
        { label: 'Computing summary metrics', d: 680 },
      ],
    },
    network: {
      title: 'Building network graph',
      sub: 'Network graph',
      steps: [
        { label: 'Loading 820 HCPs · 73 HCOs', d: 780 },
        { label: 'Resolving 3,108 relationship edges', d: 980 },
        { label: 'Running force-directed layout', d: 1040 },
        { label: 'Rendering interactive canvas', d: 720 },
      ],
    },
    twobytwo: {
      title: 'Plotting archetype maps',
      sub: '2×2 archetype maps',
      steps: [
        { label: 'Loading archetype scores', d: 680 },
        { label: 'Computing quadrant placements', d: 780 },
        { label: 'Aligning hero KOL highlights', d: 680 },
        { label: 'Rendering plots', d: 640 },
      ],
    },
    assistant: {
      title: 'Connecting network assistant',
      sub: 'Network assistant',
      steps: [
        { label: 'Loading knowledge graph context', d: 780 },
        { label: 'Warming up retrieval index', d: 880 },
        { label: 'Loading conversation history', d: 640 },
        { label: 'Ready', d: 520 },
      ],
    },
  };

  let _routeLoaderToken = 0;
  let _routeLoaderTimers = [];

  function navigate(screenId, opts = {}) {
    const host = document.getElementById('screen');
    const prev = state.current;
    const isSame = prev === screenId;
    state.current = screenId;
    renderSidebar();

    const cfg = ROUTE_STEPS[screenId];
    const totalDelay = cfg && !isSame && !opts.instant
      ? cfg.steps.reduce((s, x) => s + x.d, 0) + 420
      : 0;

    if (totalDelay > 0) {
      showRouteLoader(cfg);
      if (prev) host.classList.add('is-leaving');
    } else {
      hideRouteLoader();
    }

    setTimeout(() => {
      host.classList.remove('is-leaving');
      host.innerHTML = '';
      host.classList.add('is-entering');
      window.scrollTo(0, 0);
      const renderer = window.Screens[screenId];
      if (renderer) {
        try { renderer(host, opts); }
        catch (e) { console.error(e); host.innerHTML = '<div class="card">Error rendering screen</div>'; }
      } else {
        host.innerHTML = '<div class="card">Screen not found</div>';
      }
      requestAnimationFrame(() => host.classList.remove('is-entering'));
      hideRouteLoader();
      history.replaceState(null, '', `#${screenId}`);
    }, totalDelay);
  }

  function clearLoaderTimers() {
    _routeLoaderTimers.forEach(t => clearTimeout(t));
    _routeLoaderTimers = [];
  }

  function showRouteLoader(cfg) {
    _routeLoaderToken++;
    const myToken = _routeLoaderToken;
    clearLoaderTimers();

    let loader = document.getElementById('route-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'route-loader';
      loader.className = 'route-loader';
      document.body.appendChild(loader);
    }
    const steps = cfg.steps;
    const total = steps.reduce((s, x) => s + x.d, 0);
    loader.innerHTML = `
      <div class="route-loader-card">
        <div class="route-loader-brand">
          <div class="route-loader-mark">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="10" cy="16" r="6" stroke="currentColor" stroke-width="2"/>
              <circle cx="22" cy="16" r="6" stroke="currentColor" stroke-width="2"/>
              <circle cx="16" cy="9" r="2.5" fill="currentColor"/>
              <circle cx="16" cy="23" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <div class="route-loader-titles">
            <div class="route-loader-title">${escape(cfg.title)}</div>
            <div class="route-loader-sub">${escape(cfg.sub)}</div>
          </div>
        </div>
        <ul class="route-loader-steps">
          ${steps.map((s, i) => `
            <li class="route-loader-step" data-i="${i}">
              <span class="rl-icon">
                <span class="rl-dot"></span>
                <span class="rl-spinner"></span>
                <span class="rl-check">
                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3.5 8.2l3 3 6-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </span>
              <span class="rl-label">${escape(s.label)}</span>
            </li>`).join('')}
        </ul>
        <div class="route-loader-progress">
          <div class="route-loader-progress-fill" style="animation-duration:${total}ms"></div>
        </div>
      </div>`;
    loader.classList.add('show');

    let acc = 0;
    steps.forEach((s, i) => {
      _routeLoaderTimers.push(setTimeout(() => {
        if (myToken !== _routeLoaderToken) return;
        loader.querySelectorAll('.route-loader-step').forEach((el, idx) => {
          el.classList.remove('is-active');
          if (idx < i) el.classList.add('is-done');
          if (idx === i) el.classList.add('is-active');
        });
      }, acc));
      acc += s.d;
    });
    _routeLoaderTimers.push(setTimeout(() => {
      if (myToken !== _routeLoaderToken) return;
      loader.querySelectorAll('.route-loader-step').forEach(el => {
        el.classList.remove('is-active');
        el.classList.add('is-done');
      });
    }, acc));
  }
  function hideRouteLoader() {
    _routeLoaderToken++;
    clearLoaderTimers();
    const loader = document.getElementById('route-loader');
    if (loader) loader.classList.remove('show');
  }

  function renderSidebar() {
    const nav = document.getElementById('nav-steps');
    nav.innerHTML = '';
    STEPS.forEach((s, idx) => {
      const a = document.createElement('a');
      a.className = 'nav-link' + (state.current === s.id ? ' active' : '');
      const currentIdx = STEPS.findIndex(x => x.id === state.current);
      const passed = currentIdx > idx;
      if (passed) a.classList.add('is-done');
      const num = document.createElement('div');
      num.className = 'step-num';
      num.textContent = passed ? '' : s.num;
      a.appendChild(num);
      const label = document.createElement('span');
      label.textContent = s.label;
      a.appendChild(label);
      a.onclick = (e) => { e.preventDefault(); navigate(s.id); };
      nav.appendChild(a);
    });
  }

  // Count-up animation for numeric KPIs. Pass selector for nodes containing data-count.
  function animateCounts(root) {
    const els = (root || document).querySelectorAll('[data-count]');
    els.forEach(el => {
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = parseInt(el.getAttribute('data-duration') || '900', 10);
      const start = performance.now();
      function step(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = target * eased;
        el.textContent = (decimals === 0 ? Math.round(v).toLocaleString() : v.toFixed(decimals)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // Animate score bar fills (uses data-fill attribute)
  function animateScoreBars(root) {
    const fills = (root || document).querySelectorAll('.score-bar .fill[data-fill]');
    fills.forEach((f, i) => {
      setTimeout(() => {
        f.style.width = `${Math.max(0, Math.min(100, parseFloat(f.getAttribute('data-fill'))))}%`;
      }, 60 + i * 40);
    });
  }

  // Animate archetype bar fills
  function animateArchetypeBars(root) {
    const fills = (root || document).querySelectorAll('.archetype-bar .fill[data-fill]');
    fills.forEach((f, i) => {
      f.style.width = '0%';
      setTimeout(() => {
        f.style.transition = 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
        f.style.width = f.getAttribute('data-fill');
      }, 80 + i * 35);
    });
  }

  function scoreBar(label, value, kind = '') {
    const v = Math.max(0, Math.min(100, value || 0));
    return `<div class="score-bar"><div class="label">${escape(label)}</div><div class="track"><div class="fill ${kind ? 'fill-' + kind : ''}" data-fill="${v}"></div></div><div class="val">${Math.round(v)}</div></div>`;
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function fmt(n) {
    if (n === null || n === undefined) return '—';
    if (typeof n === 'number') {
      if (Number.isInteger(n)) return n.toLocaleString();
      return n.toFixed(1);
    }
    return n;
  }

  function pillFor(severity) {
    if (severity === 'red') return 'pill-red';
    if (severity === 'amber') return 'pill-amber';
    return 'pill-green';
  }

  function scoreColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 65) return 'var(--warning)';
    return 'var(--danger)';
  }

  function showDrawer(html) {
    const drawer = document.getElementById('drawer');
    const panel = document.getElementById('drawer-panel');
    panel.innerHTML = html;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('[data-drawer-close]').forEach(el => el.onclick = closeDrawer);
  }
  function closeDrawer() {
    const drawer = document.getElementById('drawer');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  function escape(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'onclick') e.onclick = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  return {
    state, STEPS, navigate, renderSidebar, getData, getHCP, getHCPByNPI, getHCO,
    toast, fmt, pillFor, scoreColor, showDrawer, closeDrawer, escape, el,
    animateCounts, animateScoreBars, animateArchetypeBars, scoreBar,
  };
})();
