/* Screen renderers — upload, quality, automap, processing, canonical */

window.Screens = window.Screens || {};

(function () {
  const { el, escape, fmt, navigate, toast, pillFor, scoreColor, getData, showDrawer, animateCounts, animateArchetypeBars, animateScoreBars } = App;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function screenHeader(title, subtitle, crumbs = []) {
    return `
      <div class="screen-header">
        <div class="crumbs">${crumbs.map(c => `<span>${escape(c)}</span>`).join(' <span>›</span> ')}</div>
        <h1 class="screen-title">${escape(title)}</h1>
        ${subtitle ? `<div class="screen-subtitle">${escape(subtitle)}</div>` : ''}
      </div>
    `;
  }

  function scoreRingHTML(score) {
    const pct = Math.max(0, Math.min(100, score));
    const color = scoreColor(score);
    return `
      <div class="score-ring" style="--p: ${pct}%; color: ${color}; background: conic-gradient(${color} ${pct}%, var(--bg-elevated) 0);">
        <div class="score-ring-inner" style="color: ${color}">${score}</div>
      </div>`;
  }

  const SOURCE_ICONS = {
    'HCP master': { initials: 'IQ', label: 'IQVIA-style', color: '#1d4d8b' },
    'HCO hierarchy': { initials: 'DH', label: 'Definitive-style', color: '#6f42a1' },
    'Affiliations': { initials: 'AF', label: 'HCP↔HCO links', color: '#0c6e3c' },
    'Claims': { initials: 'CL', label: 'Stroke/TIA activity', color: '#b45309' },
    'Publications': { initials: 'PB', label: 'Pubs + trials', color: '#1e6091' },
    'CRM': { initials: 'CR', label: 'Bayer engagement', color: '#d97706' },
  };

  // Plain-language meaning + source provenance for the columns AutoMap derives
  // (none of these exist in the raw source files — they are computed).
  const DERIVED_COLUMNS = [
    { col: 'launch_relevance_score', meaning: 'Overall priority for the secondary stroke prevention launch — how much this HCP matters end-to-end. Blends disease volume, scientific standing, network reach and system position.', sources: ['Claims', 'Publications', 'Affiliations', 'CRM'] },
    { col: 'scientific_influence_score', meaning: 'Academic / evidence standing: publication output, recency, citations, co-authorship reach, and trial leadership roles.', sources: ['Publications'] },
    { col: 'clinical_network_score', meaning: 'Reach across the shared-patient / referral network — how many other HCPs this clinician is clinically connected to.', sources: ['Claims', 'Affiliations'] },
    { col: 'system_influence_score', meaning: 'Ability to move pathway and protocol decisions inside a health system, from leadership titles and the facility’s stroke-center tier.', sources: ['Affiliations', 'HCO hierarchy'] },
    { col: 'bayer_relationship_strength', meaning: 'Depth of the existing Bayer relationship: MSL/rep interaction frequency and recency, advisory-board and speaker history.', sources: ['CRM'] },
    { col: 'digital_engagement_score', meaning: 'Responsiveness to digital and content channels — email open rate, webinar attendance, and disease-topic content engagement.', sources: ['CRM'] },
    { col: 'referral_centrality_score', meaning: 'How central the HCP is as a referral hub (inbound vs outbound referral volume and shared-patient degree).', sources: ['Claims'] },
    { col: 'bridge_score', meaning: 'Strength as a connector routing community-care patients into comprehensive stroke centers.', sources: ['Claims', 'Affiliations', 'HCO hierarchy'] },
    { col: 'disease_relevance_score', meaning: 'Stroke / TIA clinical focus from ischemic-stroke and TIA patient volume plus secondary-prevention follow-up activity.', sources: ['Claims'] },
    { col: 'primary_launch_archetype', meaning: 'Launch playbook segment (e.g. Scientific KOL, Referral Hub) assigned by threshold rules over the scores above, with human-readable reason codes.', sources: ['All scores above'] },
    { col: 'recommended_next_action', meaning: 'Suggested first engagement step and owning Bayer team, derived from the archetype and relationship gap.', sources: ['Archetype', 'CRM'] },
  ];

  /* ------------------------------------------------------------------ */
  /* 1. Upload                                                           */
  /* ------------------------------------------------------------------ */

  Screens.upload = function (host) {
    const tiles = getData().tiles;
    const loaded = App.state.uploadsLoaded;
    host.innerHTML = screenHeader(
      'Upload data sources',
      'Drop IQVIA-style HCP master, Definitive-style HCO hierarchy, claims/activity, publication/trial, and CRM/digital engagement extracts. The app will profile, map, and harmonize them into a launch-ready HCP network model.',
      ['Workflow', 'Upload sources'],
    ) + `
      <div class="upload-zone" id="upload-zone">
        <div class="icon">↑</div>
        <h3>Drag and drop your Excel files</h3>
        <p>Or click to browse. We auto-detect IQVIA, Definitive, Affiliations, Claims, Publications, and CRM schemas.</p>
        <div class="accepted">Accepts .xlsx · .xls · .csv</div>
        <button class="btn btn-primary mt-12" id="upload-btn">Upload data sources</button>
      </div>
      <div class="demo-note">
        <b>Demo note.</b> Click <b>Upload data sources</b> to load the six synthetic extracts. Once loaded, click any source tile to inspect its data-quality profile below, then continue to AutoMap.
      </div>
      ${loaded ? `
        <div class="space-between mb-12">
          <div class="section-title" style="margin:0">Loaded sources (${tiles.length})</div>
          <div class="text-small text-muted">Total <b data-count="${tiles.reduce((a, t) => a + t.row_count, 0)}">0</b> source rows · <b data-count="${tiles.length}">0</b> files</div>
        </div>
        <div class="grid grid-3 stagger" id="upload-tiles"></div>
        <div id="source-detail-panel" class="source-detail-panel hidden"></div>
        <div class="row-end mt-20">
          <button class="btn" id="add-file">+ Add another file</button>
          <button class="btn btn-primary" id="continue-quality">Review data quality →</button>
        </div>
      ` : `
        <div class="empty-sources" id="empty-sources">
          <div class="empty-icon">📂</div>
          <div class="empty-title">No sources loaded yet</div>
          <div class="text-small text-muted">Click <b>Upload data sources</b> above to load the six synthetic extracts.</div>
        </div>
      `}
    `;

    if (loaded) {
      const tileGrid = host.querySelector('#upload-tiles');
      tiles.forEach(t => {
        const meta = SOURCE_ICONS[t.schema_type] || { initials: 'XX', label: t.schema_type, color: '#475569' };
        const tile = document.createElement('div');
        tile.className = 'file-tile lift';
        tile.style.cursor = 'pointer';
        tile.innerHTML = `
          <div class="file-tile-head">
            <div class="row">
              <div class="file-tile-icon" style="background:${meta.color}1a;color:${meta.color}">${meta.initials}</div>
              <div>
                <div class="file-tile-name">${escape(t.file_name)}</div>
                <div class="file-tile-type">${escape(meta.label)} · ${escape(t.sheet)}</div>
              </div>
            </div>
            <span class="pill pill-green">Detected</span>
          </div>
          <div class="file-tile-stats">
            <div><b data-count="${t.row_count}">0</b> rows</div>
            <div><b>${t.column_count}</b> cols</div>
            <div><b>${t.issue_count}</b> issues</div>
          </div>
          <div class="row" style="justify-content:space-between;align-items:center">
            <div class="text-small text-muted">Quality score</div>
            ${scoreRingHTML(t.score)}
          </div>
        `;
        tile.onclick = () => {
          tileGrid.querySelectorAll('.file-tile.is-selected').forEach(x => x.classList.remove('is-selected'));
          tile.classList.add('is-selected');
          showSourceDetailInline(host, t.file_name);
        };
        tileGrid.appendChild(tile);
      });
      animateCounts(host);
      host.querySelector('#continue-quality').onclick = () => navigate('quality');
      host.querySelector('#add-file').onclick = () => openUploadModal(host);
    }

    host.querySelector('#upload-zone').onclick = () => openUploadModal(host);
  };

  // Inline (bottom) source-detail panel — full width so the sample table is readable
  function showSourceDetailInline(host, fileName) {
    const prof = getData().profiles[fileName];
    const sample = prof.sample_rows || [];
    const cols = (sample[0] && Object.keys(sample[0])) || [];
    const panel = host.querySelector('#source-detail-panel');
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="space-between mb-12">
        <div>
          <div class="card-subtitle" style="margin:0">Source profile · ${escape(prof.schema_type)}</div>
          <div class="card-title" style="margin:2px 0 0">${escape(fileName)}</div>
        </div>
        <button class="btn btn-sm btn-ghost" id="close-source-detail">Close ×</button>
      </div>
      <div class="grid grid-4 mb-16">
        <div class="kpi"><div class="kpi-value" data-count="${prof.row_count}">0</div><div class="kpi-label">Rows</div></div>
        <div class="kpi"><div class="kpi-value">${prof.column_count}</div><div class="kpi-label">Columns</div></div>
        <div class="kpi"><div class="kpi-value" style="color:${scoreColor(prof.score)}" data-count="${prof.score}">0</div><div class="kpi-label">Quality score</div></div>
        <div class="kpi"><div class="kpi-value">${prof.issues.length}</div><div class="kpi-label">Checks</div></div>
      </div>
      <div class="grid grid-2" style="gap:20px;align-items:start">
        <div>
          <div class="section-title" style="margin-top:0">Detected issues</div>
          <div class="text-small text-muted mb-12">Click an issue to see example rows.</div>
          <div class="quality-issues">
            ${prof.issues.map((i, idx) => `
              <div class="quality-issue is-clickable" data-sidx="${idx}">
                <div class="left"><span class="severity-dot ${i.severity}"></span>${escape(i.label)}</div>
                <span class="row" style="gap:6px"><b>${fmt(i.count)}</b><span class="qi-chevron">›</span></span>
              </div>
              <div class="issue-inline-example hidden" data-sexample="${idx}"></div>
            `).join('')}
          </div>
        </div>
        <div>
          ${Object.keys(prof.missing_by_key).length ? `
            <div class="section-title" style="margin-top:0">Missing values by column</div>
            <table class="table">
              <thead><tr><th>Column</th><th style="text-align:right">Missing</th></tr></thead>
              <tbody>
                ${Object.entries(prof.missing_by_key).slice(0, 10).map(([k, v]) => `
                  <tr><td class="text-mono">${escape(k)}</td><td style="text-align:right">${fmt(v)}</td></tr>
                `).join('')}
              </tbody>
            </table>` : '<div class="text-muted text-small">No missing values detected.</div>'}
        </div>
      </div>
      <div class="section-title">Sample rows</div>
      <div style="overflow-x:auto">
        <table class="table issue-example-table">
          <thead><tr>${cols.slice(0, 10).map(c => `<th>${escape(c)}</th>`).join('')}</tr></thead>
          <tbody>
            ${sample.map(row => `
              <tr>${cols.slice(0, 10).map(c => {
                const v = row[c];
                const empty = v === '' || v === null || v === undefined;
                return `<td class="${empty ? 'cell-empty' : ''}">${empty ? '—' : escape(v)}</td>`;
              }).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    animateCounts(panel);
    panel.querySelector('#close-source-detail').onclick = () => {
      panel.classList.add('hidden');
      host.querySelectorAll('.file-tile.is-selected').forEach(x => x.classList.remove('is-selected'));
    };
    panel.querySelectorAll('.quality-issue.is-clickable[data-sidx]').forEach(row => {
      row.onclick = () => {
        const idx = row.getAttribute('data-sidx');
        const box = panel.querySelector(`[data-sexample="${idx}"]`);
        const isOpen = !box.classList.contains('hidden');
        panel.querySelectorAll('.issue-inline-example').forEach(b => { b.classList.add('hidden'); b.innerHTML = ''; });
        panel.querySelectorAll('.quality-issue.is-active').forEach(r => r.classList.remove('is-active'));
        if (!isOpen) {
          box.innerHTML = issueExampleTableHTML(prof.issues[idx]);
          box.classList.remove('hidden');
          row.classList.add('is-active');
        }
      };
    });
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Multi-file uploader — walks through loading the six source extracts
  function openUploadModal(host) {
    const tiles = getData().tiles;
    const overlay = document.createElement('div');
    overlay.className = 'sim-modal';
    overlay.innerHTML = `
      <div class="sim-modal-scrim"></div>
      <div class="sim-modal-card">
        <div class="sim-modal-head">
          <div class="sim-modal-title">Upload data sources</div>
          <button class="sim-modal-close" type="button">×</button>
        </div>
        <div class="sim-modal-body">
          <div class="sim-drop" id="sim-drop">
            <div class="icon">↑</div>
            <div><b>Drop your files here or click to browse</b></div>
            <div class="text-small text-muted">6 synthetic extracts selected · .xlsx · .csv</div>
          </div>
          <div class="sim-file-list hidden" id="sim-list">
            ${tiles.map((t, i) => {
              const meta = SOURCE_ICONS[t.schema_type] || { initials: 'XX', color: '#475569' };
              return `
                <div class="sim-file-row" data-i="${i}">
                  <div class="sim-file-ic" style="background:${meta.color}1a;color:${meta.color}">${meta.initials}</div>
                  <div class="sim-file-main">
                    <div class="space-between"><span class="sim-file-name">${escape(t.file_name)}</span><span class="sim-file-status text-small" data-status="${i}">Queued</span></div>
                    <div class="progress-bar sim-mini-bar"><div class="progress-bar-fill" data-bar="${i}" style="width:0%"></div></div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
        <div class="sim-modal-foot">
          <button class="btn" id="sim-cancel">Cancel</button>
          <button class="btn btn-primary" id="sim-done" disabled>Done →</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    const close = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 220);
    };
    overlay.querySelector('.sim-modal-scrim').onclick = close;
    overlay.querySelector('.sim-modal-close').onclick = close;
    overlay.querySelector('#sim-cancel').onclick = close;

    function startUploads() {
      overlay.querySelector('#sim-drop').classList.add('hidden');
      overlay.querySelector('#sim-list').classList.remove('hidden');
      let idx = 0;
      const next = () => {
        if (idx >= tiles.length) {
          overlay.querySelector('#sim-done').disabled = false;
          return;
        }
        const i = idx;
        const bar = overlay.querySelector(`[data-bar="${i}"]`);
        const status = overlay.querySelector(`[data-status="${i}"]`);
        status.textContent = 'Uploading…';
        status.className = 'sim-file-status text-small uploading';
        let p = 0;
        const tick = () => {
          p += 22 + Math.random() * 16;
          if (p >= 100) {
            bar.style.width = '100%';
            status.textContent = '✓ Detected · ' + tiles[i].schema_type;
            status.className = 'sim-file-status text-small done';
            idx++;
            setTimeout(next, 150);
            return;
          }
          bar.style.width = p + '%';
          setTimeout(tick, 120);
        };
        tick();
      };
      next();
    }

    overlay.querySelector('#sim-drop').onclick = startUploads;
    overlay.querySelector('#sim-done').onclick = () => {
      App.state.uploadsLoaded = true;
      close();
      App.navigate('upload', { instant: true });
      setTimeout(() => App.toast('6 sources loaded · profiling complete'), 280);
    };
  }

  /* ------------------------------------------------------------------ */
  /* 2. Quality                                                          */
  /* ------------------------------------------------------------------ */

  Screens.quality = function (host) {
    const tiles = getData().tiles;
    const profiles = getData().profiles;

    const totalRed = tiles.reduce((a, t) => a + profiles[t.file_name].issues.filter(i => i.severity === 'red').length, 0);
    const totalAmber = tiles.reduce((a, t) => a + profiles[t.file_name].issues.filter(i => i.severity === 'amber').length, 0);
    const avgScore = Math.round(tiles.reduce((a, t) => a + t.score, 0) / tiles.length);

    host.innerHTML = screenHeader(
      'Source tiles & data quality',
      'Each source carries useful but incomplete truth. Click a tile to inspect missing values, duplicates, and conflicts the app must reconcile.',
      ['Workflow', 'Source quality'],
    ) + `
      <div class="grid grid-4 stagger mb-16">
        <div class="kpi"><div class="kpi-value" data-count="${tiles.length}">0</div><div class="kpi-label">Sources analyzed</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${avgScore}">0</div><div class="kpi-label">Average quality score</div></div>
        <div class="kpi"><div class="kpi-value" style="color:var(--danger)" data-count="${totalRed}">0</div><div class="kpi-label">Red issues</div></div>
        <div class="kpi"><div class="kpi-value" style="color:var(--warning)" data-count="${totalAmber}">0</div><div class="kpi-label">Amber issues</div></div>
      </div>
      <div class="grid grid-3 stagger" id="quality-tiles"></div>
      <div id="issue-example-panel" class="issue-example-panel hidden"></div>
      <div class="row-end mt-24">
        <button class="btn" id="review-map">Review mapping</button>
        <button class="btn btn-primary" id="continue-automap">Continue to AutoMap →</button>
      </div>
    `;

    const grid = host.querySelector('#quality-tiles');
    tiles.forEach(t => {
      const prof = profiles[t.file_name];
      const meta = SOURCE_ICONS[t.schema_type] || { initials: '••', label: t.schema_type, color: '#475569' };
      const tile = document.createElement('div');
      tile.className = 'file-tile lift';
      const red = prof.issues.filter(i => i.severity === 'red').length;
      const amber = prof.issues.filter(i => i.severity === 'amber').length;
      const green = prof.issues.filter(i => i.severity === 'green').length;
      tile.innerHTML = `
        <div class="file-tile-head">
          <div class="row">
            <div class="file-tile-icon" style="background:${meta.color}1a;color:${meta.color}">${meta.initials}</div>
            <div>
              <div class="file-tile-name">${escape(t.schema_type)}</div>
              <div class="file-tile-type">${escape(t.file_name)}</div>
            </div>
          </div>
          ${scoreRingHTML(t.score)}
        </div>
        <div class="file-tile-stats">
          <div><b>${fmt(t.row_count)}</b> rows</div>
          <div><b>${t.column_count}</b> cols</div>
        </div>
        <div class="row">
          ${red ? `<span class="pill pill-red">${red} red</span>` : ''}
          ${amber ? `<span class="pill pill-amber">${amber} amber</span>` : ''}
          ${green ? `<span class="pill pill-green">${green} info</span>` : ''}
        </div>
        <div class="quality-issues">
          ${prof.issues.map((i, idx) => `
            <div class="quality-issue is-clickable" data-file="${escape(t.file_name)}" data-idx="${idx}" title="Click to see example rows">
              <div class="left"><span class="severity-dot ${i.severity}"></span>${escape(i.label)}</div>
              <span class="row" style="gap:6px"><b>${fmt(i.count)}</b><span class="qi-chevron">›</span></span>
            </div>
          `).join('')}
        </div>
        <div class="row-end">
          <button class="btn btn-sm btn-ghost" data-tile="${t.file_name}">Inspect →</button>
        </div>
      `;
      grid.appendChild(tile);
    });

    grid.querySelectorAll('[data-tile]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const file = btn.getAttribute('data-tile');
        openQualityDrawer(file);
      };
    });

    // Clickable issue rows → example table below the grid
    grid.querySelectorAll('.quality-issue.is-clickable').forEach(row => {
      row.onclick = () => {
        grid.querySelectorAll('.quality-issue.is-active').forEach(r => r.classList.remove('is-active'));
        row.classList.add('is-active');
        showIssueExamples(host, row.getAttribute('data-file'), parseInt(row.getAttribute('data-idx'), 10));
      };
    });

    animateCounts(host);
    host.querySelector('#continue-automap').onclick = () => navigate('automap');
    host.querySelector('#review-map').onclick = () => navigate('automap');
  };

  function issueExampleTableHTML(issue) {
    const ex = issue.example;
    if (!ex || !ex.columns || !ex.rows || !ex.rows.length) {
      return `<div class="text-muted text-small">No example rows available for this check.</div>`;
    }
    const head = ex.columns.map(c => `<th>${escape(c)}</th>`).join('');
    const body = ex.rows.map(r => `<tr>${ex.columns.map(c => {
      const v = r[c];
      const empty = v === '' || v === null || v === undefined;
      return `<td class="${empty ? 'cell-empty' : ''}">${empty ? '— missing —' : escape(v)}</td>`;
    }).join('')}</tr>`).join('');
    return `
      <div style="overflow-x:auto">
        <table class="table issue-example-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  }

  function showIssueExamples(host, fileName, idx) {
    const prof = getData().profiles[fileName];
    const issue = prof.issues[idx];
    const panel = host.querySelector('#issue-example-panel');
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="space-between mb-12">
        <div>
          <div class="card-subtitle" style="margin:0">${escape(prof.schema_type)} · ${escape(fileName)}</div>
          <div class="card-title" style="margin:2px 0 0"><span class="severity-dot ${issue.severity}"></span> ${escape(issue.label)} <span class="pill ${pillFor(issue.severity)}">${fmt(issue.count)} rows affected</span></div>
        </div>
        <button class="btn btn-sm btn-ghost" id="close-issue-panel">Close ×</button>
      </div>
      <div class="text-small text-muted mb-12">Example rows from the source that triggered this check:</div>
      ${issueExampleTableHTML(issue)}
    `;
    panel.querySelector('#close-issue-panel').onclick = () => {
      panel.classList.add('hidden');
      host.querySelectorAll('.quality-issue.is-active').forEach(r => r.classList.remove('is-active'));
    };
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function openQualityDrawer(fileName) {
    const prof = getData().profiles[fileName];
    const sample = prof.sample_rows || [];
    const cols = (sample[0] && Object.keys(sample[0])) || [];

    showDrawer(`
      <div class="drawer-header">
        <div>
          <div class="drawer-sub">Source profile · ${escape(prof.schema_type)}</div>
          <h2 class="drawer-title">${escape(fileName)}</h2>
        </div>
        <button class="drawer-close" data-drawer-close>×</button>
      </div>
      <div class="drawer-body">
        <div class="grid grid-3">
          <div class="kpi"><div class="kpi-value" data-count="${prof.row_count}">0</div><div class="kpi-label">Rows</div></div>
          <div class="kpi"><div class="kpi-value">${prof.column_count}</div><div class="kpi-label">Columns</div></div>
          <div class="kpi"><div class="kpi-value" style="color:${scoreColor(prof.score)}" data-count="${prof.score}">0</div><div class="kpi-label">Quality score</div></div>
        </div>
        <div class="drawer-section">
          <h4>Detected issues</h4>
          <div class="text-small text-muted mb-12">Click an issue to see example rows that triggered it.</div>
          <div class="quality-issues">
            ${prof.issues.map((i, idx) => `
              <div class="quality-issue is-clickable" data-didx="${idx}">
                <div class="left"><span class="severity-dot ${i.severity}"></span>${escape(i.label)}</div>
                <span class="row" style="gap:6px"><b>${fmt(i.count)}</b><span class="qi-chevron">›</span></span>
              </div>
              <div class="issue-inline-example hidden" data-dexample="${idx}"></div>
            `).join('')}
          </div>
        </div>
        ${Object.keys(prof.missing_by_key).length ? `
        <div class="drawer-section">
          <h4>Missing values by column</h4>
          <table class="table">
            <thead><tr><th>Column</th><th style="text-align:right">Missing</th></tr></thead>
            <tbody>
              ${Object.entries(prof.missing_by_key).slice(0, 8).map(([k, v]) => `
                <tr><td>${escape(k)}</td><td style="text-align:right">${fmt(v)}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : ''}
        <div class="drawer-section">
          <h4>Sample rows</h4>
          <div style="overflow-x:auto">
            <table class="table">
              <thead><tr>${cols.slice(0, 6).map(c => `<th>${escape(c)}</th>`).join('')}</tr></thead>
              <tbody>
                ${sample.map(row => `
                  <tr>${cols.slice(0,6).map(c => `<td>${escape(row[c] ?? '')}</td>`).join('')}</tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `);
    animateCounts(document.getElementById('drawer-panel'));

    const panel = document.getElementById('drawer-panel');
    panel.querySelectorAll('.quality-issue.is-clickable[data-didx]').forEach(row => {
      row.onclick = () => {
        const idx = row.getAttribute('data-didx');
        const box = panel.querySelector(`[data-dexample="${idx}"]`);
        const isOpen = !box.classList.contains('hidden');
        panel.querySelectorAll('.issue-inline-example').forEach(b => { b.classList.add('hidden'); b.innerHTML = ''; });
        panel.querySelectorAll('.quality-issue.is-active').forEach(r => r.classList.remove('is-active'));
        if (!isOpen) {
          box.innerHTML = issueExampleTableHTML(prof.issues[idx]);
          box.classList.remove('hidden');
          row.classList.add('is-active');
        }
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. Rules + AutoMap CTA                                              */
  /* ------------------------------------------------------------------ */

  Screens.automap = function (host) {
    host.innerHTML = screenHeader(
      'Rules & AutoMap',
      'Click AutoMap to detect schemas, map source columns, resolve HCP/HCO identities, infer affiliations, build network edges, and generate launch-relevant derived columns.',
      ['Workflow', 'Rules & AutoMap'],
    ) + `
      <div class="grid grid-2 stagger">
        <div class="rules-panel">
          <div class="space-between mb-12">
            <div>
              <div class="card-title">Mapping rules</div>
              <div class="card-subtitle">Defaults shown — adjust if you need a different rule of truth.</div>
            </div>
            <button class="btn btn-sm" id="edit-rules">Edit rules</button>
          </div>
          <div class="rule-row"><span class="rule-label">Primary HCP identifier priority</span><span class="rule-value">NPI → source ID → fuzzy name + HCO → name + specialty + city</span></div>
          <div class="rule-row"><span class="rule-label">HCO source of truth</span><span class="rule-value">Definitive hierarchy (CRM preserved as commercial view)</span></div>
          <div class="rule-row"><span class="rule-label">Affiliation inference</span><span class="rule-value">Claims + listed primary + CRM account + publication + recency</span></div>
          <div class="rule-row"><span class="rule-label">Publication matching</span><span class="rule-value">Author name + institution + specialty + co-author context</span></div>
          <div class="rule-row"><span class="rule-label">Disease area</span><span class="rule-value">Ischemic stroke · TIA · secondary prevention</span></div>
          <div class="rule-row"><span class="rule-label">Time window</span><span class="rule-value">Last 24 months (claims + engagement)</span></div>
          <div class="rule-row"><span class="rule-label">Edge confidence threshold</span><span class="rule-value">≥ 0.55</span></div>
        </div>
        <div class="card">
          <div class="card-title">What AutoMap will produce</div>
          <div class="card-subtitle">Derived in one pass from your six sources.</div>
          <div class="grid mt-12" style="gap:6px">
            ${[
              ['canonical_hcp_profile', '820 records · 70 derived columns'],
              ['canonical_hco_profile', '73 records · hierarchy normalized'],
              ['network_edges', '~3k edges across 6 edge types'],
              ['hcp_archetypes', '10 archetypes · with reason codes'],
              ['mapping_report', 'Source-to-canonical column trace'],
            ].map(([f, m]) => `
              <div class="space-between" style="padding:10px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px">
                <div>
                  <div style="font-weight:600">${escape(f)}</div>
                  <div class="text-small text-muted">${escape(m)}</div>
                </div>
                <span class="pill pill-grey">Will create</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-title">Additional derived columns AutoMap will create</div>
        <div class="card-subtitle">These do not exist in any source file — AutoMap computes them. Below is what each means and which sources it is synthesized from.</div>
        <div style="overflow-x:auto" class="mt-12">
          <table class="table derived-table">
            <thead>
              <tr><th>Derived column</th><th>What it means (plain language)</th><th>Synthesized from</th></tr>
            </thead>
            <tbody>
              ${DERIVED_COLUMNS.map(d => `
                <tr>
                  <td class="text-mono">${escape(d.col)}</td>
                  <td>${escape(d.meaning)}</td>
                  <td>${d.sources.map(s => `<span class="pill pill-grey">${escape(s)}</span>`).join(' ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="row-end mt-16">
        <button class="btn" id="save-rules">Save rules</button>
        <button class="btn btn-primary" id="run-automap">⚡ Run AutoMap</button>
      </div>
    `;

    host.querySelector('#run-automap').onclick = () => navigate('processing');
    host.querySelector('#edit-rules').onclick = () => openRulesDrawer();
    host.querySelector('#save-rules').onclick = () => toast('Mapping rules saved');
  };

  function openRulesDrawer() {
    showDrawer(`
      <div class="drawer-header">
        <div>
          <div class="drawer-sub">Mapping rules · workspace defaults</div>
          <h2 class="drawer-title">Edit AutoMap rules</h2>
        </div>
        <button class="drawer-close" data-drawer-close>×</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-section">
          <h4>Identity resolution</h4>
          <div class="form-row">
            <label>Primary HCP identifier priority</label>
            <select class="filter-select">
              <option>NPI → source ID → fuzzy name + HCO → name + specialty + city</option>
              <option>NPI → name + HCO → name + specialty</option>
              <option>NPI only</option>
            </select>
          </div>
          <div class="form-row">
            <label>Fuzzy match threshold</label>
            <input type="range" min="50" max="100" value="85" class="filter-input" oninput="this.nextElementSibling.textContent = this.value + '%'"/>
            <span class="text-small text-muted">85%</span>
          </div>
        </div>
        <div class="drawer-section">
          <h4>HCO source of truth</h4>
          <div class="form-row">
            <label>Hierarchy preference</label>
            <select class="filter-select">
              <option>Definitive (CRM preserved as commercial view)</option>
              <option>CRM as primary</option>
              <option>IQVIA as primary</option>
            </select>
          </div>
        </div>
        <div class="drawer-section">
          <h4>Edge construction</h4>
          <div class="form-row">
            <label>Edge confidence threshold</label>
            <input type="number" min="0" max="1" step="0.05" value="0.55" class="filter-input" style="width:90px"/>
          </div>
          <div class="form-row">
            <label>Co-publication minimum shared pubs</label>
            <input type="number" min="1" max="10" value="2" class="filter-input" style="width:60px"/>
          </div>
          <div class="form-row">
            <label>Time window</label>
            <select class="filter-select">
              <option>Last 24 months</option>
              <option>Last 36 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
        </div>
        <div class="drawer-section">
          <h4>Disease scope</h4>
          <div class="row">
            <label class="filter-checkbox"><input type="checkbox" checked> Ischemic stroke</label>
            <label class="filter-checkbox"><input type="checkbox" checked> TIA</label>
            <label class="filter-checkbox"><input type="checkbox" checked> Secondary prevention</label>
            <label class="filter-checkbox"><input type="checkbox"> Hemorrhagic stroke</label>
          </div>
        </div>
        <div class="row-end mt-12">
          <button class="btn" data-drawer-close>Cancel</button>
          <button class="btn btn-primary" id="apply-rules">Save rules</button>
        </div>
      </div>
    `);
    document.querySelector('#apply-rules').onclick = () => {
      App.closeDrawer();
      toast('Mapping rules updated — re-run AutoMap to apply');
    };
  }

  /* ------------------------------------------------------------------ */
  /* 4. Processing                                                       */
  /* ------------------------------------------------------------------ */

  Screens.processing = function (host) {
    const stages = [
      { label: 'Detecting source schemas', meta: '6 sources detected', metric: ['sources_detected', 6] },
      { label: 'Profiling source quality', meta: '24 issue patterns scored', metric: ['quality_issues', 24] },
      { label: 'Mapping source columns to canonical model', meta: '142 columns mapped', metric: ['columns_mapped', 142] },
      { label: 'Resolving HCP identities', meta: 'NPI + fuzzy name resolution', metric: ['canonical_hcps', getData().summary.canonical_hcp_count] },
      { label: 'Normalizing HCO and IDN hierarchy', meta: 'Definitive prevails', metric: ['canonical_hcos', getData().summary.canonical_hco_count] },
      { label: 'Inferring primary clinical and academic affiliations', meta: 'Multi-source consensus', metric: ['affiliations', getData().summary.affiliation_count] },
      { label: 'Creating network edges', meta: 'Affiliation · referral · co-author · trial · topic', metric: ['edges', getData().network_edges.length] },
      { label: 'Calculating influence scores', meta: 'Scientific × clinical × system × Bayer', metric: ['scores', 7] },
      { label: 'Classifying launch archetypes', meta: '10 archetypes', metric: ['archetypes', Object.keys(getData().summary.archetype_counts).length] },
      { label: 'Preparing canonical output', meta: 'Excel + JSON', metric: ['files_ready', 5] },
    ];

    const logSnippets = [
      '<span class="tok-key">resolve_npi</span>(<span class="tok-num">1700000001</span>) → <span class="tok-key">match</span>: Patel · confidence <span class="tok-num">0.97</span>',
      '<span class="tok-key">fuzzy_match</span>("S. Lin", "Sarah J. Lin") → <span class="tok-num">0.91</span>',
      '<span class="tok-key">dedup_hcp</span>: collapsed <span class="tok-num">12</span> hero variant rows',
      '<span class="tok-warn">warn</span>: missing NPI on <span class="tok-num">27</span> publication rows · fuzzy fallback engaged',
      '<span class="tok-key">hco_alias</span>: "GLHN UMC" ↔ "Great Lakes Health Network University Medical Center"',
      '<span class="tok-key">infer_primary</span>: claims + listed + CRM agreed on <span class="tok-num">784</span> HCPs',
      '<span class="tok-warn">conflict</span>: <span class="tok-num">71</span> HCPs with multiple primary flags · queued for review',
      '<span class="tok-key">build_edge</span>(referral) → batches: <span class="tok-num">8</span> · IDN clusters: <span class="tok-num">6</span>',
      '<span class="tok-key">build_edge</span>(co-publication) → pairs: <span class="tok-num">267</span> · threshold ≥ 2 shared pubs',
      '<span class="tok-key">score.scientific_influence</span>(Patel) = <span class="tok-num">100.0</span>',
      '<span class="tok-key">score.system_influence</span>(Lin) = <span class="tok-num">87.3</span>',
      '<span class="tok-key">classify</span>(Gomez) = <span class="tok-num">"Clinical Referral Hub"</span> · 2° "Community Bridge"',
      '<span class="tok-key">classify</span>(Shaw) = <span class="tok-num">"Emerging Expert"</span> · 2° "Digital-Responsive Influencer"',
      '<span class="tok-key">action</span>(Patel) = "Advisory board invitation + co-authored evidence brief"',
      '<span class="tok-key">flush</span>: canonical_hcp_profile.xlsx ready · <span class="tok-num">820</span> rows',
    ];

    host.innerHTML = screenHeader(
      'Running AutoMap',
      'The workbench is harmonizing the six sources into a canonical HCP/HCO model with derived launch intelligence.',
      ['Workflow', 'Processing'],
    ) + `
      <div class="card">
        <div class="space-between mb-12">
          <div>
            <div class="card-title" id="proc-stage-name">Initializing pipeline…</div>
            <div class="card-subtitle">Stage <span id="proc-stage-i">0</span> / ${stages.length}</div>
          </div>
          <div class="row" style="gap:14px">
            <div class="text-mono text-muted" id="elapsed">0.0s</div>
            <span class="pill pill-blue" id="status-pill">Running</span>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" id="proc-bar"></div></div>
        <div class="grid grid-2 mt-16" style="gap:16px">
          <div>
            <div class="section-title" style="margin-top:0">Pipeline stages</div>
            <div id="stages"></div>
          </div>
          <div>
            <div class="section-title" style="margin-top:0">Live activity</div>
            <div class="live-log" id="live-log"></div>
            <div class="section-title mt-12">Building up</div>
            <div class="grid grid-2 stagger" id="metric-grid"></div>
          </div>
        </div>
      </div>
      <div class="row-end mt-16">
        <button class="btn" id="skip-processing">Skip animation →</button>
      </div>
    `;

    const stagesEl = host.querySelector('#stages');
    stages.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'processing-stage';
      row.id = `stage-${i}`;
      row.innerHTML = `
        <div class="stage-num">${i + 1}</div>
        <div class="stage-label">${escape(s.label)}</div>
        <div class="stage-meta">${escape(s.meta)}</div>
        <div class="stage-icon"></div>
      `;
      stagesEl.appendChild(row);
    });

    const metricGrid = host.querySelector('#metric-grid');
    const metricEls = {};
    stages.forEach((s, i) => {
      const [key, target] = s.metric;
      const card = document.createElement('div');
      card.className = 'kpi';
      card.style.padding = '10px 12px';
      card.innerHTML = `<div class="kpi-value" style="font-size:16px" id="m-${key}">0</div><div class="kpi-label" style="font-size:10px">${escape(s.label.toLowerCase())}</div>`;
      metricGrid.appendChild(card);
      metricEls[key] = { node: card.querySelector(`#m-${key}`), target, current: 0 };
    });

    const liveLog = host.querySelector('#live-log');

    const startedAt = Date.now();
    let idx = 0;
    let stopped = false;
    let logIdx = 0;
    const elapsed = host.querySelector('#elapsed');
    const bar = host.querySelector('#proc-bar');
    const stageName = host.querySelector('#proc-stage-name');
    const stageI = host.querySelector('#proc-stage-i');
    const statusPill = host.querySelector('#status-pill');

    // Animate elapsed timer
    const timer = setInterval(() => {
      if (stopped) return;
      elapsed.textContent = `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
    }, 80);

    // Log streaming
    function pushLog() {
      if (stopped || logIdx >= logSnippets.length * 2) return;
      const line = document.createElement('div');
      line.className = 'live-log-line';
      line.innerHTML = logSnippets[logIdx % logSnippets.length];
      liveLog.appendChild(line);
      // keep only last 8 visible
      while (liveLog.children.length > 8) liveLog.removeChild(liveLog.firstChild);
      logIdx++;
    }
    const logTimer = setInterval(pushLog, 240);
    pushLog();

    // Metric count-up while a stage is active
    function tickMetric(key) {
      const m = metricEls[key];
      const stepVal = Math.max(1, Math.floor(m.target / 16));
      const interval = setInterval(() => {
        m.current += stepVal;
        if (m.current >= m.target) { m.current = m.target; clearInterval(interval); }
        m.node.textContent = m.current.toLocaleString();
      }, 28);
    }

    function tick() {
      if (stopped) return;
      if (idx > 0) {
        const prev = host.querySelector(`#stage-${idx - 1}`);
        prev.classList.remove('active'); prev.classList.add('done');
        prev.querySelector('.stage-icon').innerHTML = '<span class="check-mark">✓</span>';
      }
      if (idx >= stages.length) {
        stopped = true;
        clearInterval(timer); clearInterval(logTimer);
        bar.style.width = '100%';
        statusPill.textContent = 'Complete';
        statusPill.classList.remove('pill-blue');
        statusPill.classList.add('pill-green');
        stageName.textContent = 'Canonical model ready';
        stageI.textContent = stages.length;
        setTimeout(() => navigate('canonical'), 600);
        return;
      }
      const cur = host.querySelector(`#stage-${idx}`);
      cur.classList.add('active');
      cur.querySelector('.stage-icon').innerHTML = '<div class="spinner"></div>';
      stageName.textContent = stages[idx].label;
      stageI.textContent = idx + 1;
      bar.style.width = `${((idx + 1) / stages.length) * 100}%`;
      tickMetric(stages[idx].metric[0]);
      idx++;
      setTimeout(tick, 520 + Math.random() * 250);
    }
    tick();

    host.querySelector('#skip-processing').onclick = () => {
      stopped = true;
      clearInterval(timer); clearInterval(logTimer);
      navigate('canonical');
    };
  };

  /* ------------------------------------------------------------------ */
  /* 5. Canonical output                                                 */
  /* ------------------------------------------------------------------ */

  Screens.canonical = function (host) {
    App.state.automapComplete = true;
    const s = getData().summary;
    const archetypes = s.archetype_counts;
    const total = Object.values(archetypes).reduce((a, b) => a + b, 0);
    const sortedArch = Object.entries(archetypes).sort((a, b) => b[1] - a[1]);

    const heroIds = getData().hero_ids;
    const heroes = heroIds.map(id => App.getHCP(id)).filter(Boolean);

    host.innerHTML = screenHeader(
      'Canonical output ready',
      'The workbench harmonized your six sources into a single launch-ready model. Download the canonical files or jump into the network intelligence views.',
      ['Workflow', 'Canonical output'],
    ) + `
      <div class="grid grid-4 stagger">
        <div class="kpi"><div class="kpi-value" data-count="${s.canonical_hcp_count}">0</div><div class="kpi-label">Canonical HCPs</div><div class="kpi-meta">Identity-resolved across sources</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.canonical_hco_count}">0</div><div class="kpi-label">HCOs / IDNs</div><div class="kpi-meta">Definitive hierarchy normalized</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.affiliation_count}">0</div><div class="kpi-label">HCP–HCO affiliations</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.coauthor_edge_count}">0</div><div class="kpi-label">Co-author edges</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.referral_edge_count}">0</div><div class="kpi-label">Referral edges</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.trial_link_count}">0</div><div class="kpi-label">Trial links</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.crm_linked_hcp_count}">0</div><div class="kpi-label">CRM-linked HCPs</div></div>
        <div class="kpi"><div class="kpi-value" data-count="${s.classified_hcp_count}">0</div><div class="kpi-label">HCPs classified</div><div class="kpi-meta"><span data-count="${s.manual_review_count}">0</span> flagged for review</div></div>
      </div>

      <div class="grid grid-2 mt-24">
        <div class="card">
          <div class="space-between mb-12"><div class="card-title">Archetype distribution</div><span class="muted">${total} HCPs</span></div>
          <div class="archetype-bar" id="archetype-bar"></div>
        </div>
        <div class="card">
          <div class="card-title">Downloads</div>
          <div class="card-subtitle">Use the canonical model beyond this demo.</div>
          <div class="grid mt-12 stagger" style="gap:8px">
            ${[
              ['canonical_hcp_profile.xlsx', '820 HCPs · 70 columns'],
              ['canonical_hco_profile.xlsx', '73 HCOs · hierarchy'],
              ['network_edges.xlsx', `${s.affiliation_count + s.referral_edge_count + s.coauthor_edge_count + s.trial_link_count} edges`],
              ['hcp_archetypes.xlsx', 'Classifications + reason codes'],
              ['mapping_report.xlsx', 'Source-to-canonical trace'],
            ].map(([f, m]) => `
              <div class="space-between lift" style="padding:10px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--surface)">
                <div>
                  <div style="font-weight:600">📄 ${escape(f)}</div>
                  <div class="text-small text-muted">${escape(m)}</div>
                </div>
                <button class="btn btn-sm" data-dl="${f}">Download</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="mt-24">
        <div class="section-title">Hero HCPs surfaced in the canonical model</div>
        <div class="hero-strip stagger">
          ${heroes.map(h => {
            const initials = h.full_name_resolved.split(' ').map(w => w[0]).slice(0, 2).join('');
            return `
            <div class="hero-card lift" data-hero="${h.canonical_hcp_id}">
              <div class="avatar">${escape(initials)}</div>
              <div class="name">${escape(h.full_name_resolved)}</div>
              <div class="archetype">${escape(h.primary_launch_archetype)}</div>
              <div class="meta">${escape(h.primary_specialty_resolved)} · ${escape(h.primary_hco_name_inferred || '')}</div>
              <div class="row mt-8">
                <span class="pill pill-blue">Launch ${fmt(h.launch_relevance_score)}</span>
                <span class="pill pill-purple">Sci ${fmt(h.scientific_influence_score)}</span>
                <span class="pill pill-grey">Bayer ${fmt(h.bayer_relationship_strength)}</span>
              </div>
            </div>
          `;}).join('')}
        </div>
      </div>

      <div class="row-end mt-24">
        <button class="btn" id="dl-all">Download canonical model</button>
        <button class="btn btn-primary" id="open-network">Open network intelligence →</button>
      </div>
    `;

    // Archetype bars
    const max = Math.max(...sortedArch.map(([_, v]) => v));
    const bar = host.querySelector('#archetype-bar');
    sortedArch.forEach(([name, count]) => {
      const row = document.createElement('div');
      row.className = 'archetype-bar-row';
      row.innerHTML = `
        <div class="label">${escape(name)}</div>
        <div class="bar"><div class="fill" data-fill="${(count / max) * 100}%"></div></div>
        <div class="count">${count}</div>
      `;
      bar.appendChild(row);
    });

    animateCounts(host);
    animateArchetypeBars(host);

    host.querySelectorAll('[data-dl]').forEach(b => {
      b.onclick = () => toast(`Preparing ${b.getAttribute('data-dl')} — saved to Downloads`);
    });
    host.querySelector('#open-network').onclick = () => navigate('network');
    host.querySelector('#dl-all').onclick = () => toast('Bundling canonical_model.zip — saved to Downloads');
    host.querySelectorAll('[data-hero]').forEach(c => {
      c.onclick = () => Detail.openHCP(c.getAttribute('data-hero'));
      c.style.cursor = 'pointer';
    });
  };

})();
