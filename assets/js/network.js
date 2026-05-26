/* Network graph screen — uses vis-network */

window.Screens = window.Screens || {};

(function () {
  const { el, escape, fmt, navigate, toast, getData } = App;

  const NODE_COLORS = {
    HCP: { background: '#1d4d8b', border: '#143c6e' },
    HCP_HERO: { background: '#0c6e3c', border: '#094a28' },
    HCO: { background: '#b45309', border: '#7c3a06' },
    IDN: { background: '#6f42a1', border: '#4d2e72' },
    Topic: { background: '#1e6091', border: '#143f60' },
    Trial: { background: '#d97706', border: '#92520a' },
  };

  const EDGE_COLORS = {
    'affiliation': '#9aa9bd',
    'referral': '#1d4d8b',
    'co-publication': '#6f42a1',
    'trial_involvement': '#d97706',
    'topic_affinity': '#1e6091',
    'hco_hierarchy': '#94a3b8',
  };

  const SCENARIOS = [
    {
      id: 'scientific',
      label: 'Scientific KOL discovery',
      meta: 'Publications + trials + co-author clusters',
      apply: (f) => Object.assign(f, {
        showHCO: false, showTopics: true, showTrials: true,
        archetype: ['Scientific KOL', 'Emerging Expert'],
        edgeTypes: ['co-publication', 'trial_involvement', 'topic_affinity'],
        clusterBy: 'topic',
      }),
    },
    {
      id: 'pathway',
      label: 'Health-system pathway influence',
      meta: 'Inside an IDN, who can change pathway adoption',
      apply: (f) => Object.assign(f, {
        showHCO: true, showTopics: false, showTrials: false,
        idn: f.idn || 'Great Lakes Health Network',
        edgeTypes: ['affiliation', 'referral', 'hco_hierarchy'],
        clusterBy: 'idn',
      }),
    },
    {
      id: 'referral',
      label: 'Referral hub discovery',
      meta: 'Shared-patient hubs and bottom-up activation',
      apply: (f) => Object.assign(f, {
        showHCO: false, showTopics: false, showTrials: false,
        edgeTypes: ['referral'],
        archetype: ['Clinical Referral Hub', 'Community-to-Stroke-Center Bridge'],
        clusterBy: 'referral',
      }),
    },
    {
      id: 'underengaged',
      label: 'Under-engaged influencers',
      meta: 'High launch relevance + weak Bayer relationship',
      apply: (f) => Object.assign(f, {
        showHCO: false, showTopics: false, showTrials: false,
        underengaged: true,
        edgeTypes: ['co-publication', 'referral'],
        clusterBy: 'influence',
      }),
    },
    {
      id: 'emerging',
      label: 'Emerging experts',
      meta: 'Recent publications + co-author links to known KOLs',
      apply: (f) => Object.assign(f, {
        showHCO: false, showTopics: true, showTrials: true,
        archetype: ['Emerging Expert'],
        edgeTypes: ['co-publication', 'trial_involvement'],
        clusterBy: 'growth',
      }),
    },
    {
      id: 'bridge',
      label: 'Community bridge HCPs',
      meta: 'Connectors between community care and stroke centers',
      apply: (f) => Object.assign(f, {
        showHCO: true, showTopics: false, showTrials: false,
        archetype: ['Community-to-Stroke-Center Bridge', 'Clinical Referral Hub'],
        edgeTypes: ['affiliation', 'referral'],
        clusterBy: 'bridge',
      }),
    },
    {
      id: 'account',
      label: 'Launch account view',
      meta: 'Account-level network for selected IDN',
      apply: (f) => Object.assign(f, {
        showHCO: true, showTopics: false, showTrials: false,
        idn: f.idn || 'Great Lakes Health Network',
        edgeTypes: ['affiliation', 'referral', 'hco_hierarchy', 'co-publication'],
        clusterBy: 'idn',
      }),
    },
    {
      id: 'digital',
      label: 'Digital-responsive influencers',
      meta: 'High digital engagement + launch relevance',
      apply: (f) => Object.assign(f, {
        showHCO: false, showTopics: true, showTrials: false,
        archetype: ['Digital-Responsive Influencer', 'Emerging Expert'],
        digital: true,
        edgeTypes: ['topic_affinity', 'co-publication'],
        clusterBy: 'topic',
      }),
    },
  ];

  Screens.network = function (host, opts = {}) {
    host.style.padding = '20px 24px';
    host.innerHTML = `
      <div class="screen-header" style="margin-bottom:14px">
        <div class="crumbs"><span>Network intelligence</span><span>›</span><span>Graph</span></div>
        <h1 class="screen-title">Network graph</h1>
        <div class="screen-subtitle">Pick a scenario or build your own slice. Click any node for the detail drawer.</div>
      </div>
      <div class="network-shell">
        <aside class="network-left">
          <div class="section-title">Scenarios</div>
          <div class="scenario-list" id="scenarios"></div>
          <div class="filter-group">
            <label class="filter-label">Health system / IDN</label>
            <select class="filter-select" id="filter-idn">
              <option value="">All IDNs</option>
              ${getData().summary.idn_options.map(idn => `<option value="${escape(idn)}">${escape(idn)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Specialty</label>
            <select class="filter-select" id="filter-specialty">
              <option value="">All specialties</option>
              ${getData().summary.specialty_options.map(sp => `<option value="${escape(sp)}">${escape(sp)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Archetype</label>
            <select class="filter-select" id="filter-archetype">
              <option value="">All archetypes</option>
              ${Object.keys(getData().summary.archetype_counts).map(a => `<option value="${escape(a)}">${escape(a)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Min launch relevance: <span id="lr-val">0</span></label>
            <input type="range" min="0" max="100" value="0" class="filter-input" id="filter-launchrel" />
          </div>
          <div class="filter-group">
            <label class="filter-checkbox"><input type="checkbox" id="show-hco" checked> Show HCO + IDN nodes</label>
            <label class="filter-checkbox"><input type="checkbox" id="show-topics"> Show topic clusters</label>
            <label class="filter-checkbox"><input type="checkbox" id="show-trials"> Show trial nodes</label>
            <label class="filter-checkbox"><input type="checkbox" id="show-underengaged"> Only under-engaged</label>
          </div>
          <div class="legend">
            <div class="section-title" style="margin-top:14px">Legend</div>
            <div class="legend-row"><span class="legend-swatch" style="background:#0c6e3c"></span> Hero HCP</div>
            <div class="legend-row"><span class="legend-swatch" style="background:#1d4d8b"></span> HCP</div>
            <div class="legend-row"><span class="legend-swatch" style="background:#b45309"></span> HCO</div>
            <div class="legend-row"><span class="legend-swatch" style="background:#6f42a1"></span> IDN parent</div>
            <div class="legend-row"><span class="legend-swatch" style="background:#1e6091"></span> Topic cluster</div>
            <div class="legend-row"><span class="legend-swatch" style="background:#d97706"></span> Trial</div>
          </div>
        </aside>

        <section class="network-canvas-wrap">
          <div class="network-overlay" id="overlay">
            <span><b id="ov-nodes">0</b> nodes</span>
            <span><b id="ov-edges">0</b> edges</span>
            <span id="ov-scenario" style="color:var(--primary)">No scenario</span>
          </div>
          <div class="network-zoom">
            <button id="zoom-in" title="Zoom in">+</button>
            <button id="zoom-out" title="Zoom out">−</button>
            <button id="zoom-fit" title="Fit to view">⊡</button>
          </div>
          <div id="network-canvas"></div>
        </section>

        <aside class="network-right" id="hcp-side"></aside>
      </div>
    `;

    // build scenario buttons
    const list = host.querySelector('#scenarios');
    SCENARIOS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'scenario-btn';
      btn.dataset.scen = s.id;
      btn.innerHTML = `<span class="label">${escape(s.label)}</span><span class="meta">${escape(s.meta)}</span>`;
      btn.onclick = () => applyScenario(s.id);
      list.appendChild(btn);
    });

    // filter bindings
    host.querySelector('#filter-idn').onchange = rebuild;
    host.querySelector('#filter-specialty').onchange = rebuild;
    host.querySelector('#filter-archetype').onchange = rebuild;
    host.querySelector('#filter-launchrel').oninput = (e) => {
      host.querySelector('#lr-val').textContent = e.target.value;
      rebuild();
    };
    host.querySelector('#show-hco').onchange = rebuild;
    host.querySelector('#show-topics').onchange = rebuild;
    host.querySelector('#show-trials').onchange = rebuild;
    host.querySelector('#show-underengaged').onchange = rebuild;

    // initial state — pathway scenario for Great Lakes
    let activeFilters = {
      showHCO: true, showTopics: false, showTrials: false,
      idn: null, specialty: null, archetype: null,
      minLaunchRelevance: 0, underengaged: false,
      digital: false,
      edgeTypes: ['affiliation', 'referral', 'co-publication', 'hco_hierarchy'],
      clusterBy: null,
      scenarioId: null,
    };

    let network = null;

    function applyScenario(id) {
      const scen = SCENARIOS.find(s => s.id === id);
      if (!scen) return;
      // reset filters first then apply
      activeFilters = {
        showHCO: false, showTopics: false, showTrials: false,
        idn: null, specialty: null, archetype: null,
        minLaunchRelevance: 0, underengaged: false, digital: false,
        edgeTypes: ['affiliation', 'referral', 'co-publication', 'hco_hierarchy'],
        clusterBy: null,
        scenarioId: id,
      };
      scen.apply(activeFilters);
      // reflect in UI
      list.querySelectorAll('.scenario-btn').forEach(b => b.classList.toggle('active', b.dataset.scen === id));
      host.querySelector('#show-hco').checked = !!activeFilters.showHCO;
      host.querySelector('#show-topics').checked = !!activeFilters.showTopics;
      host.querySelector('#show-trials').checked = !!activeFilters.showTrials;
      host.querySelector('#show-underengaged').checked = !!activeFilters.underengaged;
      if (activeFilters.idn) host.querySelector('#filter-idn').value = activeFilters.idn;
      if (Array.isArray(activeFilters.archetype)) host.querySelector('#filter-archetype').value = '';
      else if (activeFilters.archetype) host.querySelector('#filter-archetype').value = activeFilters.archetype;
      host.querySelector('#ov-scenario').textContent = scen.label;
      buildGraph();
    }

    function rebuild() {
      activeFilters.showHCO = host.querySelector('#show-hco').checked;
      activeFilters.showTopics = host.querySelector('#show-topics').checked;
      activeFilters.showTrials = host.querySelector('#show-trials').checked;
      activeFilters.underengaged = host.querySelector('#show-underengaged').checked;
      activeFilters.idn = host.querySelector('#filter-idn').value || null;
      activeFilters.specialty = host.querySelector('#filter-specialty').value || null;
      activeFilters.archetype = host.querySelector('#filter-archetype').value || null;
      activeFilters.minLaunchRelevance = parseInt(host.querySelector('#filter-launchrel').value || '0', 10);
      // clear scenario when user manually edits
      activeFilters.scenarioId = null;
      list.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      host.querySelector('#ov-scenario').textContent = 'Custom slice';
      buildGraph();
    }

    function buildGraph() {
      const d = getData();
      const filterArchetype = Array.isArray(activeFilters.archetype) ? activeFilters.archetype : (activeFilters.archetype ? [activeFilters.archetype] : null);

      // Filter HCPs
      const includedHCPs = d.canonical_hcps.filter(h => {
        if (activeFilters.idn && h.parent_idn_name !== activeFilters.idn) return false;
        if (activeFilters.specialty && h.primary_specialty_resolved !== activeFilters.specialty) return false;
        if (filterArchetype && !filterArchetype.includes(h.primary_launch_archetype) && !filterArchetype.includes(h.secondary_launch_archetype)) return false;
        if (h.launch_relevance_score < activeFilters.minLaunchRelevance) return false;
        if (activeFilters.underengaged && !(h.launch_relevance_score >= 55 && h.bayer_relationship_strength <= 25)) return false;
        if (activeFilters.digital && h.digital_engagement_score < 30) return false;
        return true;
      });

      // Cap rendering at 220 HCPs for performance — prefer hero + high-influence + by IDN
      const sorted = [...includedHCPs].sort((a, b) => {
        if (a.is_hero && !b.is_hero) return -1;
        if (!a.is_hero && b.is_hero) return 1;
        return b.launch_relevance_score - a.launch_relevance_score;
      });
      const capped = sorted.slice(0, 220);
      const includedHCPIds = new Set(capped.map(h => h.canonical_hcp_id));

      const nodes = [];
      const nodeIdSet = new Set();

      // HCP nodes
      capped.forEach(h => {
        const isHero = h.is_hero;
        const color = isHero ? NODE_COLORS.HCP_HERO : NODE_COLORS.HCP;
        const size = 10 + Math.min(30, h.launch_relevance_score / 4);
        nodes.push({
          id: h.canonical_hcp_id,
          label: shortName(h.full_name_resolved),
          title: hoverHTML(h),
          shape: 'dot',
          color: color,
          size: isHero ? size + 4 : size,
          font: { color: '#102a43', size: isHero ? 14 : 12, face: 'Inter', strokeWidth: isHero ? 3 : 0, strokeColor: '#ffffff' },
          borderWidth: isHero ? 4 : 1,
          borderWidthSelected: 5,
          shadow: isHero ? { enabled: true, color: 'rgba(12, 110, 60, 0.4)', size: 14, x: 0, y: 0 } : false,
          _type: 'HCP',
          _data: h,
        });
        nodeIdSet.add(h.canonical_hcp_id);
      });

      // HCO nodes (parents of HCP primary affiliations)
      const hcoIdsToShow = new Set();
      if (activeFilters.showHCO) {
        capped.forEach(h => { if (h.primary_hco_id_inferred) hcoIdsToShow.add('C' + h.primary_hco_id_inferred); });
      }
      const idnIdsToShow = new Set();
      hcoIdsToShow.forEach(id => {
        const hco = d.canonical_hcos.find(x => x.canonical_hco_id === id);
        if (!hco) return;
        nodes.push({
          id: id,
          label: hco.hco_name_resolved,
          title: hcoHover(hco),
          shape: 'box',
          color: NODE_COLORS.HCO,
          font: { color: 'white', face: 'Inter', size: 11 },
          margin: 8,
          _type: 'HCO',
          _data: hco,
        });
        nodeIdSet.add(id);
        if (hco.parent_hco_id) idnIdsToShow.add('C' + hco.parent_hco_id);
      });
      if (activeFilters.showHCO) {
        idnIdsToShow.forEach(id => {
          const idn = d.canonical_hcos.find(x => x.canonical_hco_id === id);
          if (!idn) return;
          nodes.push({
            id: id,
            label: idn.hco_name_resolved,
            title: hcoHover(idn),
            shape: 'diamond',
            color: NODE_COLORS.IDN,
            size: 22,
            font: { color: '#102a43', face: 'Inter', size: 13, bold: true },
            _type: 'IDN',
            _data: idn,
          });
          nodeIdSet.add(id);
        });
      }

      // Topic nodes
      if (activeFilters.showTopics) {
        const topics = new Set();
        capped.forEach(h => (h.topic_affinity || []).forEach(t => topics.add(t)));
        topics.forEach(t => {
          const id = `TOPIC::${t}`;
          nodes.push({
            id, label: t, shape: 'ellipse', color: NODE_COLORS.Topic,
            font: { color: 'white', face: 'Inter', size: 12 },
            title: `Topic cluster: ${t}`,
            _type: 'Topic',
          });
          nodeIdSet.add(id);
        });
      }

      // Trial nodes
      if (activeFilters.showTrials) {
        const trialIds = new Set();
        d.network_edges.forEach(e => {
          if (e.edge_type === 'trial_involvement' && includedHCPIds.has(e.source_node_id)) trialIds.add(e.target_node_id);
        });
        trialIds.forEach(id => {
          nodes.push({
            id, label: id, shape: 'triangle', color: NODE_COLORS.Trial, size: 14,
            font: { color: '#102a43', face: 'JetBrains Mono', size: 10 },
            title: `Clinical trial: ${id}`,
            _type: 'Trial',
          });
          nodeIdSet.add(id);
        });
      }

      // Edges
      const edges = [];
      d.network_edges.forEach(e => {
        if (!activeFilters.edgeTypes.includes(e.edge_type)) return;
        if (!nodeIdSet.has(e.source_node_id) || !nodeIdSet.has(e.target_node_id)) return;
        const w = Math.max(0.4, Math.min(4, e.edge_weight / 2));
        edges.push({
          id: `${e.source_node_id}__${e.target_node_id}__${e.edge_type}`,
          from: e.source_node_id,
          to: e.target_node_id,
          color: { color: EDGE_COLORS[e.edge_type] || '#9aa9bd', opacity: 0.55 },
          width: w,
          arrows: e.edge_type === 'referral' ? { to: { enabled: true, scaleFactor: 0.35 } } : undefined,
          title: `${e.edge_type} · weight ${e.edge_weight.toFixed(1)}`,
          smooth: { type: 'continuous' },
          _data: e,
        });
      });

      // count overlay
      host.querySelector('#ov-nodes').textContent = nodes.length;
      host.querySelector('#ov-edges').textContent = edges.length;

      // Render
      const container = host.querySelector('#network-canvas');
      const options = {
        nodes: { borderWidthSelected: 4 },
        edges: { smooth: { type: 'dynamic' } },
        physics: {
          enabled: true,
          stabilization: { iterations: 180, fit: true },
          barnesHut: { gravitationalConstant: -2400, springConstant: 0.035, springLength: 110, avoidOverlap: 0.18 },
          minVelocity: 1.0,
        },
        interaction: { hover: true, tooltipDelay: 80, dragNodes: true, navigationButtons: false },
      };
      if (network) network.destroy();
      network = new vis.Network(container, { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) }, options);

      // wire zoom controls
      host.querySelector('#zoom-in').onclick = () => network.moveTo({ scale: network.getScale() * 1.25, animation: { duration: 200 } });
      host.querySelector('#zoom-out').onclick = () => network.moveTo({ scale: network.getScale() * 0.8, animation: { duration: 200 } });
      host.querySelector('#zoom-fit').onclick = () => network.fit({ animation: { duration: 350 } });

      network.on('selectNode', (params) => {
        const nodeId = params.nodes[0];
        const matched = nodes.find(n => n.id === nodeId);
        if (!matched) return;
        if (matched._type === 'HCP') {
          Detail.openHCP(nodeId);
          renderSidePanel(matched._data);
        } else if (matched._type === 'HCO' || matched._type === 'IDN') {
          Detail.openHCO(nodeId);
        }
      });

      // After stabilization, stop physics
      network.once('stabilizationIterationsDone', () => network.setOptions({ physics: { enabled: false } }));

      // initial side panel: show top HCP summary
      if (capped.length) renderSidePanel(capped[0]);
    }

    function renderSidePanel(h) {
      const side = host.querySelector('#hcp-side');
      const arc = h.primary_launch_archetype;
      const reasonHTML = (h.archetype_reason_codes || []).map(r => `<li>${App.escape(r)}</li>`).join('');
      const initials = h.full_name_resolved.split(' ').map(w => w[0]).slice(0, 2).join('');
      side.innerHTML = `
        <div class="row" style="align-items:flex-start;gap:10px">
          <div class="avatar" style="width:38px;height:38px;border-radius:50%;background:${h.is_hero ? 'var(--primary)' : 'var(--accent)'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">${App.escape(initials)}</div>
          <div style="flex:1;min-width:0">
            <div class="muted text-small">${h.is_hero ? 'Hero · Spotlight' : 'Spotlight'}</div>
            <div style="font-weight:700;font-size:15px;margin-top:2px;line-height:1.2">${App.escape(h.full_name_resolved)}</div>
            <div class="text-small text-muted">${App.escape(h.primary_specialty_resolved)} · ${App.escape(h.region || '')}</div>
          </div>
        </div>
        <div class="row mt-8">
          <span class="pill ${h.is_hero ? 'pill-green' : 'pill-blue'}">${App.escape(arc)}</span>
          ${h.secondary_launch_archetype ? `<span class="pill pill-grey">+ ${App.escape(h.secondary_launch_archetype)}</span>` : ''}
        </div>
        <div class="divider"></div>
        <div class="text-small">
          <div class="muted">Primary HCO</div>
          <div>${App.escape(h.primary_hco_name_inferred || '—')}</div>
          <div class="text-muted">${App.escape(h.parent_idn_name || '')}</div>
        </div>
        <div class="mt-12">
          ${App.scoreBar('Launch relevance', h.launch_relevance_score, 'launch')}
          ${App.scoreBar('Scientific', h.scientific_influence_score, 'sci')}
          ${App.scoreBar('Clinical network', h.clinical_network_score, 'clin')}
          ${App.scoreBar('System influence', h.system_influence_score, 'sys')}
          ${App.scoreBar('Bayer relationship', h.bayer_relationship_strength, 'bayer')}
        </div>
        ${reasonHTML ? `<div class="mt-12 text-small"><b>Reason codes</b><ul style="margin:6px 0 0 18px;padding:0">${reasonHTML}</ul></div>` : ''}
        <div class="mt-12 text-small"><b>Recommended action</b><br/><span class="text-muted">${App.escape(h.recommended_next_action)}</span></div>
        <div class="mt-8 text-small"><b>Owner</b> <span class="pill pill-blue">${App.escape(h.recommended_bayer_team)}</span></div>
        <button class="btn btn-primary mt-12" style="width:100%" data-detail="${h.canonical_hcp_id}">Open full detail →</button>
      `;
      side.querySelector('[data-detail]').onclick = () => Detail.openHCP(h.canonical_hcp_id);
      App.animateScoreBars(side);
    }

    function shortName(name) {
      const parts = name.split(' ');
      if (parts.length <= 2) return name;
      return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    }

    function hoverHTML(h) {
      // vis-network supports HTML for title if we wrap with DOM, but text is safer
      return [
        `${h.full_name_resolved} · ${h.primary_specialty_resolved}`,
        h.primary_hco_name_inferred,
        h.parent_idn_name ? `IDN: ${h.parent_idn_name}` : '',
        `Archetype: ${h.primary_launch_archetype}`,
        `Stroke/TIA: ${h.stroke_patient_count || 0} / ${h.tia_patient_count || 0}`,
        `Pubs: ${h.publication_count_total} (recent ${h.recent_publication_count_3y})`,
        `Trials: ${h.trial_count} · ${h.trial_role_strength}`,
        `Launch relevance: ${h.launch_relevance_score} · Bayer relationship: ${h.bayer_relationship_strength}`,
        `Action: ${h.recommended_next_action}`,
      ].filter(Boolean).join('\n');
    }

    function hcoHover(hco) {
      return [
        `${hco.hco_name_resolved} (${hco.hco_type})`,
        `Parent IDN: ${hco.parent_idn_name || '—'}`,
        `Stroke center: ${hco.stroke_center_level || '—'}`,
        `Beds: ${hco.bed_count || '—'}`,
        `Affiliated HCPs: ${hco.affiliated_hcp_count}`,
        `High-influence HCPs: ${hco.high_influence_hcp_count}`,
        `Stroke volume proxy: ${hco.stroke_volume_proxy}`,
        `Launch readiness: ${hco.launch_readiness_score}`,
      ].join('\n');
    }

    // If we arrived via 2x2 quadrant click, apply that filter; else default to pathway scenario
    if (opts && opts.quadrant) {
      applyQuadrant(opts.quadrant);
    } else {
      applyScenario('pathway');
    }

    function applyQuadrant(q) {
      // pos: tl / tr / bl / br
      activeFilters = {
        showHCO: true, showTopics: false, showTrials: false,
        idn: null, specialty: null, archetype: null,
        minLaunchRelevance: 0, underengaged: false, digital: false,
        edgeTypes: ['affiliation', 'referral', 'co-publication'],
        clusterBy: null, scenarioId: null,
      };
      const quad = q.quad || {};
      if (quad.archetype && quad.archetype.length) {
        activeFilters.archetype = quad.archetype;
      }
      if (quad.filter) {
        if (quad.filter.minLaunch) activeFilters.minLaunchRelevance = quad.filter.minLaunch;
        if (quad.filter.underengaged) activeFilters.underengaged = true;
      }
      // reflect UI
      list.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      host.querySelector('#ov-scenario').textContent = `Quadrant: ${quad.name || ''}`;
      host.querySelector('#filter-launchrel').value = activeFilters.minLaunchRelevance;
      host.querySelector('#lr-val').textContent = activeFilters.minLaunchRelevance;
      host.querySelector('#show-underengaged').checked = !!activeFilters.underengaged;
      App.toast(`Filtered to "${quad.name || 'quadrant'}"`);
      buildGraph();
    }
  };

})();
