/* HCP / HCO detail drawer — tabbed view with score bars */

window.Detail = (function () {
  const { escape, fmt, getHCP, getHCO, showDrawer, getData, scoreBar, animateScoreBars, animateCounts } = App;

  function openHCP(id) {
    const h = getHCP(id);
    if (!h) return;
    const edges = getData().network_edges.filter(e => e.source_node_id === id || e.target_node_id === id);
    const coauthorCount = edges.filter(e => e.edge_type === 'co-publication').length;
    const referralCount = edges.filter(e => e.edge_type === 'referral').length;
    const trialCount = edges.filter(e => e.edge_type === 'trial_involvement').length;
    const affCount = edges.filter(e => e.edge_type === 'affiliation').length;

    const initials = h.full_name_resolved.split(' ').map(w => w[0]).slice(0, 2).join('');
    const reasonCodes = (h.archetype_reason_codes || []).map(r => `<li>${escape(r)}</li>`).join('');

    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'identity', label: 'Identity' },
      { id: 'clinical', label: 'Clinical' },
      { id: 'system', label: 'Health system' },
      { id: 'network', label: 'Network' },
      { id: 'science', label: 'Science' },
      { id: 'bayer', label: 'Bayer' },
      { id: 'action', label: 'Action' },
    ];

    showDrawer(`
      <div class="drawer-header">
        <div class="row" style="align-items:flex-start;gap:14px;flex:1">
          <div class="avatar" style="width:48px;height:48px;border-radius:50%;background:${h.is_hero ? 'var(--primary)' : 'var(--accent)'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0">${escape(initials)}</div>
          <div style="flex:1;min-width:0">
            <div class="drawer-sub">Canonical HCP · ${escape(h.canonical_hcp_id)} ${h.is_hero ? '<span class="pill pill-green" style="margin-left:6px">Hero</span>' : ''}</div>
            <h2 class="drawer-title">${escape(h.full_name_resolved)}</h2>
            <div class="drawer-sub">${escape(h.primary_specialty_resolved)} · ${escape(h.city || '')}, ${escape(h.state || '')}</div>
          </div>
        </div>
        <button class="drawer-close" data-drawer-close>×</button>
      </div>
      <div class="drawer-tabs" id="hcp-tabs">
        ${tabs.map(t => `<button class="drawer-tab${t.id === 'overview' ? ' active' : ''}" data-tab="${t.id}">${escape(t.label)}</button>`).join('')}
      </div>
      <div class="drawer-body" id="hcp-tab-body">${renderTab('overview', h, { coauthorCount, referralCount, trialCount, affCount, reasonCodes })}</div>
    `);

    const body = document.getElementById('hcp-tab-body');
    function wireActionButtons() {
      body.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => handleHCPAction(btn.getAttribute('data-act'), h);
      });
    }
    document.querySelectorAll('#hcp-tabs .drawer-tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#hcp-tabs .drawer-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        body.innerHTML = renderTab(btn.getAttribute('data-tab'), h, { coauthorCount, referralCount, trialCount, affCount, reasonCodes });
        animateScoreBars(body);
        animateCounts(body);
        wireActionButtons();
      };
    });

    animateScoreBars(body);
    animateCounts(body);
    wireActionButtons();
  }

  function handleHCPAction(act, h) {
    const name = h.full_name_resolved;
    if (act === 'log-outreach') {
      openOutreachForm(h);
      return;
    }
    if (act === 'add-plan') {
      App.toast(`Added ${name} to "Q2 launch engagement plan"`);
      return;
    }
    if (act === 'open-network') {
      App.closeDrawer();
      App.state.networkSelection = h.canonical_hcp_id;
      App.navigate('network');
      return;
    }
    if (act === 'download-brief') {
      App.toast(`Generating HCP brief — ${name}_brief.pdf`);
      return;
    }
    if (act === 'email') {
      App.toast(`Email draft prepared — ${name}`);
      return;
    }
    if (act === 'flag-review') {
      App.toast(`${name} flagged for medical-affairs review`);
      return;
    }
  }

  function openOutreachForm(h) {
    const overlay = document.createElement('div');
    overlay.className = 'sim-modal';
    overlay.innerHTML = `
      <div class="sim-modal-scrim"></div>
      <div class="sim-modal-card">
        <div class="sim-modal-head">
          <div class="sim-modal-title">Log outreach · ${App.escape(h.full_name_resolved)}</div>
          <button class="sim-modal-close" type="button">×</button>
        </div>
        <div class="sim-modal-body">
          <div class="form-row"><label>Channel</label>
            <select class="filter-select">
              <option>MSL — scientific exchange</option>
              <option>KAM — pathway workshop</option>
              <option>Speaker bureau invite</option>
              <option>Advisory board invite</option>
              <option>Email — evidence brief</option>
              <option>Webinar follow-up</option>
            </select>
          </div>
          <div class="form-row"><label>Owner</label>
            <input class="filter-input" value="${App.escape(h.recommended_bayer_team || 'Medical Affairs')}" />
          </div>
          <div class="form-row"><label>Scheduled date</label>
            <input class="filter-input" type="date" value="${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}" />
          </div>
          <div class="form-row"><label>Talking points</label>
            <textarea class="filter-input" rows="3" placeholder="e.g., share secondary-prevention evidence brief; discuss real-world adherence data…"></textarea>
          </div>
        </div>
        <div class="sim-modal-foot">
          <button class="btn" id="ol-cancel">Cancel</button>
          <button class="btn btn-primary" id="ol-save">Log outreach</button>
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
    overlay.querySelector('#ol-cancel').onclick = close;
    overlay.querySelector('#ol-save').onclick = () => {
      close();
      App.toast(`Outreach logged for ${h.full_name_resolved}`);
    };
  }

  function renderTab(tabId, h, meta) {
    const { coauthorCount, referralCount, trialCount, affCount, reasonCodes } = meta;
    if (tabId === 'overview') {
      return `
        <div class="row mb-12">
          <span class="pill pill-green">${escape(h.primary_launch_archetype)}</span>
          ${h.secondary_launch_archetype ? `<span class="pill pill-blue">+ ${escape(h.secondary_launch_archetype)}</span>` : ''}
          <span class="pill pill-grey">Confidence ${escape(h.confidence_band)}</span>
          ${h.under_engaged_flag ? '<span class="pill pill-red">Under-engaged</span>' : ''}
        </div>
        <div class="drawer-section">
          <h4>Influence profile</h4>
          ${scoreBar('Launch relevance', h.launch_relevance_score, 'launch')}
          ${scoreBar('Scientific', h.scientific_influence_score, 'sci')}
          ${scoreBar('Clinical network', h.clinical_network_score, 'clin')}
          ${scoreBar('System influence', h.system_influence_score, 'sys')}
          ${scoreBar('Bayer relationship', h.bayer_relationship_strength, 'bayer')}
          ${scoreBar('Digital engagement', h.digital_engagement_score, 'digital')}
        </div>
        <div class="drawer-section">
          <h4>Primary placement</h4>
          <dl class="kv-grid">
            <dt>Primary HCO</dt><dd>${escape(h.primary_hco_name_inferred || '—')}</dd>
            <dt>Parent IDN</dt><dd>${escape(h.parent_idn_name || '—')}</dd>
            <dt>Stroke center?</dt><dd>${h.stroke_center_affiliation_flag ? 'Yes' : 'No'}</dd>
            <dt>Inferred role</dt><dd>${escape(h.inferred_clinical_role)}</dd>
          </dl>
        </div>
        <div class="drawer-section">
          <h4>Network footprint</h4>
          <div class="grid grid-4" style="gap:8px">
            <div class="kpi" style="padding:10px"><div class="kpi-value" style="font-size:16px" data-count="${affCount}">0</div><div class="kpi-label" style="font-size:10px">Affiliations</div></div>
            <div class="kpi" style="padding:10px"><div class="kpi-value" style="font-size:16px" data-count="${referralCount}">0</div><div class="kpi-label" style="font-size:10px">Referral edges</div></div>
            <div class="kpi" style="padding:10px"><div class="kpi-value" style="font-size:16px" data-count="${coauthorCount}">0</div><div class="kpi-label" style="font-size:10px">Co-author edges</div></div>
            <div class="kpi" style="padding:10px"><div class="kpi-value" style="font-size:16px" data-count="${trialCount}">0</div><div class="kpi-label" style="font-size:10px">Trial links</div></div>
          </div>
        </div>
      `;
    }
    if (tabId === 'identity') {
      return `
        <div class="drawer-section">
          <h4>Identity & source crosswalk</h4>
          <dl class="kv-grid">
            <dt>Canonical ID</dt><dd class="text-mono">${escape(h.canonical_hcp_id)}</dd>
            <dt>NPI</dt><dd class="text-mono">${h.npi || '—'}</dd>
            <dt>Source IDs</dt><dd class="text-mono">${(h.source_ids || []).filter(Boolean).map(escape).join(', ')}</dd>
            <dt>Name variants</dt><dd>${(h.name_variants || []).map(escape).join(', ')}</dd>
            <dt>Match confidence</dt><dd>${escape(h.match_confidence)}</dd>
            <dt>Source coverage</dt><dd>${h.source_coverage_count} sources</dd>
            <dt>Data recency</dt><dd>${fmt(h.data_recency_score)} / 100</dd>
            <dt>Data quality flag</dt><dd>${escape(h.data_quality_flag)}</dd>
          </dl>
        </div>
        <div class="drawer-section">
          <h4>Resolved attributes</h4>
          <dl class="kv-grid">
            <dt>Primary specialty</dt><dd>${escape(h.primary_specialty_resolved)}</dd>
            <dt>Secondary specialty</dt><dd>${escape(h.secondary_specialty_resolved || '—')}</dd>
            <dt>Location</dt><dd>${escape(h.city || '')}, ${escape(h.state || '')} · ${escape(h.region || '')}</dd>
          </dl>
        </div>
      `;
    }
    if (tabId === 'clinical') {
      return `
        <div class="drawer-section">
          <h4>Clinical role</h4>
          ${scoreBar('Disease relevance', h.disease_relevance_score, 'launch')}
          ${scoreBar('Follow-up activity', h.followup_activity_score, 'clin')}
          ${scoreBar('Claims disease volume', h.claims_disease_volume_score, 'sys')}
        </div>
        <div class="drawer-section">
          <h4>Patient activity (aggregate)</h4>
          <dl class="kv-grid">
            <dt>Stroke patients (12m)</dt><dd>${fmt(h.stroke_patient_count)}</dd>
            <dt>TIA patients (12m)</dt><dd>${fmt(h.tia_patient_count)}</dd>
            <dt>Inferred role</dt><dd>${escape(h.inferred_clinical_role)}</dd>
            <dt>Topic affinity</dt><dd>${(h.topic_affinity || []).map(t => `<span class="pill pill-blue">${escape(t)}</span>`).join(' ') || '—'}</dd>
          </dl>
        </div>
      `;
    }
    if (tabId === 'system') {
      return `
        <div class="drawer-section">
          <h4>Health-system position</h4>
          ${scoreBar('System influence', h.system_influence_score, 'sys')}
          ${scoreBar('Institutional influence', h.institutional_influence_score, 'launch')}
        </div>
        <div class="drawer-section">
          <h4>Placement</h4>
          <dl class="kv-grid">
            <dt>Primary HCO</dt><dd>${escape(h.primary_hco_name_inferred || '—')}</dd>
            <dt>Parent IDN</dt><dd>${escape(h.parent_idn_name || '—')}</dd>
            <dt>Stroke center?</dt><dd>${h.stroke_center_affiliation_flag ? 'Yes' : 'No'}</dd>
            <dt>Affiliations</dt><dd>${h.affiliation_count} ${h.affiliation_conflict_flag ? '<span class="pill pill-amber">Conflict</span>' : ''}</dd>
            <dt>Inferred role</dt><dd>${escape(h.institutional_role || h.inferred_clinical_role)}</dd>
            <dt>Primary reason</dt><dd class="text-muted">${escape(h.primary_affiliation_reason)}</dd>
          </dl>
        </div>
      `;
    }
    if (tabId === 'network') {
      return `
        <div class="drawer-section">
          <h4>Network signals</h4>
          ${scoreBar('Clinical network', h.clinical_network_score, 'clin')}
          ${scoreBar('Referral centrality', h.referral_centrality_score, 'sys')}
          ${scoreBar('Bridge score', h.bridge_score, 'launch')}
        </div>
        <div class="drawer-section">
          <h4>Detail</h4>
          <dl class="kv-grid">
            <dt>Referral in (12m)</dt><dd>${fmt(h.referral_in_count)}</dd>
            <dt>Referral out (12m)</dt><dd>${fmt(h.referral_out_count)}</dd>
            <dt>Shared patient deg</dt><dd>${fmt(h.shared_patient_network_degree)}</dd>
            <dt>Network cluster</dt><dd class="text-mono">${escape(h.hcp_network_cluster_id)}</dd>
            <dt>Dominant network</dt><dd>${escape(h.dominant_network_type)}</dd>
            <dt>Community bridge?</dt><dd>${h.community_to_stroke_center_bridge_flag ? 'Yes' : 'No'}</dd>
          </dl>
        </div>
      `;
    }
    if (tabId === 'science') {
      return `
        <div class="drawer-section">
          <h4>Scientific influence</h4>
          ${scoreBar('Scientific influence', h.scientific_influence_score, 'sci')}
        </div>
        <div class="drawer-section">
          <h4>Detail</h4>
          <dl class="kv-grid">
            <dt>Publications</dt><dd>${fmt(h.publication_count_total)} (stroke ${fmt(h.stroke_publication_count)})</dd>
            <dt>Recent (3y)</dt><dd>${fmt(h.recent_publication_count_3y)}</dd>
            <dt>Citations</dt><dd>${fmt(h.citation_count_total)}</dd>
            <dt>Co-author degree</dt><dd>${fmt(h.coauthor_degree)}</dd>
            <dt>Top co-author KOL?</dt><dd>${h.top_coauthor_kol_flag ? 'Yes' : 'No'}</dd>
            <dt>Trials</dt><dd>${fmt(h.trial_count)} · ${escape(h.trial_role_strength)}</dd>
            <dt>Topic affinity</dt><dd>${(h.topic_affinity || []).map(t => `<span class="pill pill-blue">${escape(t)}</span>`).join(' ') || '—'}</dd>
          </dl>
        </div>
      `;
    }
    if (tabId === 'bayer') {
      return `
        <div class="drawer-section">
          <h4>Relationship strength</h4>
          ${scoreBar('Bayer relationship', h.bayer_relationship_strength, 'bayer')}
          ${scoreBar('Digital engagement', h.digital_engagement_score, 'digital')}
        </div>
        <div class="drawer-section">
          <h4>Detail</h4>
          <dl class="kv-grid">
            <dt>CRM linked</dt><dd>${h.crm_linked_flag ? 'Yes' : 'No'}</dd>
            <dt>MSL (12m)</dt><dd>${fmt(h.msl_interaction_count_12m)}</dd>
            <dt>Rep (12m)</dt><dd>${fmt(h.rep_interaction_count_12m)}</dd>
            <dt>Last engagement</dt><dd>${escape(h.last_engagement_date || '—')}</dd>
            <dt>Advisory board</dt><dd>${h.advisory_board_flag ? 'Yes' : 'No'}</dd>
            <dt>Speaker program</dt><dd>${h.speaker_program_flag ? 'Yes' : 'No'}</dd>
            <dt>Under-engaged?</dt><dd>${h.under_engaged_flag ? '<span class="pill pill-red">Yes — priority outreach</span>' : 'No'}</dd>
          </dl>
        </div>
      `;
    }
    if (tabId === 'action') {
      return `
        <div class="drawer-section">
          <h4>Launch archetype reasoning</h4>
          <div class="row mb-12">
            <span class="pill pill-green">${escape(h.primary_launch_archetype)}</span>
            ${h.secondary_launch_archetype ? `<span class="pill pill-blue">+ ${escape(h.secondary_launch_archetype)}</span>` : ''}
          </div>
          ${reasonCodes ? `<ul style="margin:0 0 12px 18px;padding:0">${reasonCodes}</ul>` : '<div class="text-muted text-small">No reason codes computed.</div>'}
        </div>
        <div class="drawer-section">
          <h4>Recommended next steps</h4>
          <div class="card" style="background:var(--primary-soft);border-color:#c8e6d3;box-shadow:none">
            <div class="text-small"><b>Owner:</b> <span class="pill pill-blue">${escape(h.recommended_bayer_team)}</span></div>
            <div class="text-small mt-8"><b>First action:</b><br/>${escape(h.recommended_next_action)}</div>
          </div>
        </div>
        <div class="drawer-section">
          <h4>Confidence</h4>
          <dl class="kv-grid">
            <dt>Confidence band</dt><dd>${escape(h.confidence_band)}</dd>
            <dt>Match confidence</dt><dd>${escape(h.match_confidence)}</dd>
            <dt>Source coverage</dt><dd>${h.source_coverage_count} sources</dd>
          </dl>
        </div>
        <div class="drawer-section">
          <h4>Take action</h4>
          <div class="grid grid-2" style="gap:8px">
            <button class="btn btn-primary" data-act="log-outreach">Log outreach</button>
            <button class="btn" data-act="add-plan">Add to engagement plan</button>
            <button class="btn" data-act="open-network">Open in network →</button>
            <button class="btn" data-act="download-brief">Download HCP brief</button>
            <button class="btn" data-act="email">Share by email</button>
            <button class="btn" data-act="flag-review">Flag for review</button>
          </div>
        </div>
      `;
    }
    return '';
  }

  function openHCO(id) {
    const hco = getHCO(id);
    if (!hco) return;
    const hcps = getData().canonical_hcps.filter(h => h.primary_hco_id_inferred === hco.source_hco_id);
    const topHCPs = [...hcps].sort((a, b) => b.launch_relevance_score - a.launch_relevance_score).slice(0, 8);

    showDrawer(`
      <div class="drawer-header">
        <div>
          <div class="drawer-sub">Canonical HCO · ${escape(hco.canonical_hco_id)}</div>
          <h2 class="drawer-title">${escape(hco.hco_name_resolved)}</h2>
          <div class="drawer-sub">${escape(hco.hco_type)} · ${escape(hco.city)}, ${escape(hco.state)}</div>
        </div>
        <button class="drawer-close" data-drawer-close>×</button>
      </div>
      <div class="drawer-body">
        <div class="grid grid-2">
          <div class="kpi"><div class="kpi-value" style="font-size:18px" data-count="${hco.launch_readiness_score}">0</div><div class="kpi-label">Launch readiness</div></div>
          <div class="kpi"><div class="kpi-value" style="font-size:18px" data-count="${hco.affiliated_hcp_count}">0</div><div class="kpi-label">Affiliated HCPs</div></div>
          <div class="kpi"><div class="kpi-value" style="font-size:18px" data-count="${hco.high_influence_hcp_count}">0</div><div class="kpi-label">High-influence HCPs</div></div>
          <div class="kpi"><div class="kpi-value" style="font-size:18px" data-count="${hco.stroke_volume_proxy}">0</div><div class="kpi-label">Stroke volume proxy</div></div>
        </div>
        <div class="drawer-section">
          <h4>Readiness signals</h4>
          ${scoreBar('Launch readiness', hco.launch_readiness_score, 'launch')}
          ${scoreBar('Referral inflow', hco.referral_inflow_score, 'sys')}
          ${scoreBar('Data confidence', hco.data_confidence_score, 'bayer')}
        </div>
        <div class="drawer-section">
          <h4>Profile</h4>
          <dl class="kv-grid">
            <dt>HCO type</dt><dd>${escape(hco.hco_type)}</dd>
            <dt>Parent IDN</dt><dd>${escape(hco.parent_idn_name || '—')}</dd>
            <dt>Stroke center</dt><dd>${escape(hco.stroke_center_level || '—')}</dd>
            <dt>Beds</dt><dd>${fmt(hco.bed_count)}</dd>
            <dt>Region</dt><dd>${escape(hco.region)}</dd>
            <dt>Account priority</dt><dd>${escape(hco.account_priority_flag)}</dd>
            <dt>Aliases</dt><dd>${(hco.hco_aliases || []).map(escape).join(', ')}</dd>
          </dl>
        </div>
        <div class="drawer-section">
          <h4>Top affiliated HCPs</h4>
          <table class="table">
            <thead><tr><th>HCP</th><th>Archetype</th><th style="text-align:right">Launch</th></tr></thead>
            <tbody>
              ${topHCPs.map(h => `
                <tr data-hcp="${h.canonical_hcp_id}" style="cursor:pointer">
                  <td>${escape(h.full_name_resolved)}</td>
                  <td>${escape(h.primary_launch_archetype)}</td>
                  <td style="text-align:right">${fmt(h.launch_relevance_score)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="drawer-section">
          <h4>Take action</h4>
          <div class="grid grid-2" style="gap:8px">
            <button class="btn btn-primary" data-hco-act="open-network">Open in network →</button>
            <button class="btn" data-hco-act="download-brief">Download account brief</button>
            <button class="btn" data-hco-act="add-target">Add to target IDN list</button>
            <button class="btn" data-hco-act="email">Share with KAM</button>
          </div>
        </div>
      </div>
    `);

    document.querySelectorAll('[data-hcp]').forEach(row => {
      row.onclick = () => openHCP(row.getAttribute('data-hcp'));
    });
    document.querySelectorAll('[data-hco-act]').forEach(btn => {
      btn.onclick = () => handleHCOAction(btn.getAttribute('data-hco-act'), hco);
    });
    animateScoreBars(document.getElementById('drawer-panel'));
    animateCounts(document.getElementById('drawer-panel'));
  }

  function handleHCOAction(act, hco) {
    const name = hco.hco_name_resolved;
    if (act === 'open-network') {
      App.closeDrawer();
      if (hco.parent_idn_name) App.state.filters.idn = hco.parent_idn_name;
      App.navigate('network');
      return;
    }
    if (act === 'download-brief') { App.toast(`Generating account brief — ${name}.pdf`); return; }
    if (act === 'add-target') { App.toast(`${name} added to target IDN list`); return; }
    if (act === 'email') { App.toast(`Account summary shared with KAM`); return; }
  }

  return { openHCP, openHCO };
})();
