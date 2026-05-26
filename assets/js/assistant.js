/* Network assistant — canned answers grounded in the canonical data */

window.Screens = window.Screens || {};

(function () {
  const { el, escape, fmt, navigate, getData } = App;

  const SUGGESTED = [
    'Which HCPs inside Great Lakes Health Network can influence post-stroke pathway adoption?',
    'Who are the under-engaged high-value HCPs in the Midwest?',
    'Which HCPs are scientific KOLs versus operational pathway influencers?',
    'Which community physicians bridge patients into comprehensive stroke centers?',
    'Which emerging experts should Medical Affairs monitor?',
    'Who should Bayer engage first in Great Lakes Health Network and why?',
    'Which HCPs have high digital responsiveness and strong launch relevance?',
    'Which HCPs have conflicting affiliations that need review?',
    'Show me doctors who co-publish on ischemic stroke or TIA.',
    'Compare Dr. Arun Patel, Dr. Sarah Lin, Dr. Maria Gomez, and Dr. Kevin Shaw.',
  ];

  Screens.assistant = function (host) {
    host.innerHTML = `
      <div class="screen-header">
        <div class="crumbs"><span>Network intelligence</span><span>›</span><span>Network assistant</span></div>
        <h1 class="screen-title">Network assistant</h1>
        <div class="screen-subtitle">Ask structured questions over the canonical HCP/HCO graph. The assistant only answers from derived columns and network edges.</div>
      </div>
      <div class="assistant-shell">
        <div class="assistant-chat">
          <div class="assistant-messages" id="messages">
            <div class="msg bot">
              <div class="msg-author">Workbench Assistant</div>
              <div class="msg-bubble">Hi — I can answer questions about the canonical HCP / HCO model. Pick a suggested question or type your own.</div>
            </div>
          </div>
          <div class="assistant-input-row">
            <input class="assistant-input" id="ai-input" placeholder="Ask a question about the network…" />
            <button class="btn btn-primary" id="ai-send">Send</button>
          </div>
        </div>
        <aside class="card">
          <div class="card-title">Suggested questions</div>
          <div class="card-subtitle">Click a prompt to see how the assistant grounds its answer.</div>
          <div class="suggested-questions mt-12" id="suggestions"></div>
        </aside>
      </div>
    `;

    const messages = host.querySelector('#messages');
    const sug = host.querySelector('#suggestions');
    SUGGESTED.forEach(q => {
      const b = document.createElement('button');
      b.className = 'suggested-question';
      b.textContent = q;
      b.onclick = () => ask(q);
      sug.appendChild(b);
    });

    const input = host.querySelector('#ai-input');
    host.querySelector('#ai-send').onclick = () => { if (input.value.trim()) ask(input.value.trim()); };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (input.value.trim()) ask(input.value.trim()); }
    });

    function ask(q) {
      input.value = '';
      addMsg('user', q);
      // typing indicator
      const typingMsg = document.createElement('div');
      typingMsg.className = 'msg bot';
      typingMsg.innerHTML = `<div class="msg-author">Workbench Assistant</div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
      messages.appendChild(typingMsg);
      messages.scrollTop = messages.scrollHeight;
      const delay = 600 + Math.random() * 500;
      setTimeout(() => {
        typingMsg.remove();
        const ans = answer(q);
        addMsg('bot', ans.text, ans.tableHTML, ans.evidence, ans.sources);
      }, delay);
    }

    function addMsg(role, text, tableHTML, evidence, sources) {
      const m = document.createElement('div');
      m.className = `msg ${role}`;
      const author = role === 'user' ? 'You' : 'Workbench Assistant';
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sourcesHTML = sources ? `<div class="bot-evidence"><b>Sources:</b> ${sources.map(s => `<span class="pill pill-grey">${App.escape(s)}</span>`).join(' ')}</div>` : '';
      m.innerHTML = `
        <div class="msg-author">${author} · <span class="text-faint">${ts}</span></div>
        <div class="msg-bubble">${text}${tableHTML || ''}${evidence ? `<div class="bot-evidence">${evidence}</div>` : ''}${sourcesHTML}</div>
      `;
      messages.appendChild(m);
      m.querySelectorAll('[data-hcp]').forEach(el => {
        el.style.cursor = 'pointer';
        el.onclick = () => Detail.openHCP(el.getAttribute('data-hcp'));
      });
      messages.scrollTop = messages.scrollHeight;
    }
  };

  function nameChip(h) {
    return `<span class="pill pill-blue" data-hcp="${h.canonical_hcp_id}">${escape(h.full_name_resolved)}</span>`;
  }

  function rankTable(rows, columns) {
    return `<table class="bot-table"><thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map(r => `<tr>${columns.map(c => `<td>${c.render(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function answer(q) {
    const d = getData();
    const text = q.toLowerCase();
    const hcps = d.canonical_hcps;

    if (text.includes('great lakes') && (text.includes('pathway') || text.includes('influence'))) {
      const idn = 'Great Lakes Health Network';
      const list = hcps.filter(h => h.parent_idn_name === idn)
        .filter(h => h.system_influence_score >= 50 || h.primary_launch_archetype === 'Regional Stroke Pathway Influencer')
        .sort((a, b) => b.system_influence_score - a.system_influence_score)
        .slice(0, 8);
      const table = rankTable(list, [
        { label: 'HCP', render: nameChip },
        { label: 'Role', render: r => `<span class="text-muted">${escape(r.institutional_role || r.inferred_clinical_role)}</span>` },
        { label: 'System', render: r => fmt(r.system_influence_score) },
        { label: 'Launch', render: r => fmt(r.launch_relevance_score) },
        { label: 'Archetype', render: r => escape(r.primary_launch_archetype) },
      ]);
      return {
        text: `<b>${list.length} HCPs</b> in Great Lakes Health Network can influence post-stroke pathway adoption. Ranked by system influence:`,
        tableHTML: table,
        evidence: `<b>Why:</b> System influence = leadership title (Director / Chief), Comprehensive or Primary stroke center, Tier 1 account flag, and high post-stroke follow-up activity. <b>Action:</b> Pair MSL evidence discussion with KAM-led pathway workshop.`,
        sources: ['canonical_hcp_profile', 'canonical_hco_profile', 'Affiliations'],
      };
    }

    if (text.includes('under-engaged') || text.includes('relationship gap') || text.includes('midwest')) {
      let list = hcps.filter(h => h.under_engaged_flag);
      if (text.includes('midwest')) list = list.filter(h => h.region === 'Midwest');
      list = list.sort((a, b) => b.launch_relevance_score - a.launch_relevance_score).slice(0, 10);
      const table = rankTable(list, [
        { label: 'HCP', render: nameChip },
        { label: 'Specialty', render: r => escape(r.primary_specialty_resolved) },
        { label: 'Launch', render: r => fmt(r.launch_relevance_score) },
        { label: 'Bayer', render: r => fmt(r.bayer_relationship_strength) },
        { label: 'IDN', render: r => `<span class="text-muted">${escape(r.parent_idn_name || '—')}</span>` },
      ]);
      return {
        text: `<b>${list.length} under-engaged high-value HCPs</b>${text.includes('midwest') ? ' in the Midwest' : ''}. These pair high launch relevance with weak Bayer relationship.`,
        tableHTML: table,
        evidence: `<b>Definition:</b> launch_relevance ≥ 60 AND bayer_relationship_strength ≤ 25. <b>Action:</b> Priority MSL outreach within 30 days; tailored evidence brief.`,
        sources: ['canonical_hcp_profile', 'CRM_Digital_Engagement', 'Claims_Stroke_TIA_Activity'],
      };
    }

    if (text.includes('kol') && text.includes('operational')) {
      const sci = hcps.filter(h => h.primary_launch_archetype === 'Scientific KOL').sort((a, b) => b.scientific_influence_score - a.scientific_influence_score).slice(0, 5);
      const ops = hcps.filter(h => ['Regional Stroke Pathway Influencer', 'Operational Pathway Influencer'].includes(h.primary_launch_archetype)).sort((a, b) => b.system_influence_score - a.system_influence_score).slice(0, 5);
      return {
        text: `<b>Scientific KOLs</b> drive evidence and trials; <b>operational pathway influencers</b> drive pathway adoption inside an IDN. These are different jobs.`,
        tableHTML: `<table class="bot-table"><thead><tr><th>Scientific KOLs</th><th>Operational pathway influencers</th></tr></thead><tbody>` +
          Array.from({ length: Math.max(sci.length, ops.length) }, (_, i) =>
            `<tr><td>${sci[i] ? nameChip(sci[i]) + ' · ' + fmt(sci[i].scientific_influence_score) : ''}</td>` +
            `<td>${ops[i] ? nameChip(ops[i]) + ' · ' + fmt(ops[i].system_influence_score) : ''}</td></tr>`
          ).join('') + `</tbody></table>`,
        evidence: `<b>Why separate them:</b> publication-heavy KOLs may not own the local pathway. Don't recommend only publication-heavy KOLs for pathway adoption.`,
        sources: ['Publications_Trials_Scientific_Activity', 'Affiliations', 'canonical_hcp_profile'],
      };
    }

    if (text.includes('community') && (text.includes('bridge') || text.includes('comprehensive') || text.includes('stroke center'))) {
      const list = hcps.filter(h => h.community_to_stroke_center_bridge_flag || h.secondary_launch_archetype === 'Community-to-Stroke-Center Bridge')
        .sort((a, b) => b.bridge_score - a.bridge_score).slice(0, 8);
      return {
        text: `<b>${list.length} HCPs</b> bridge community hospitals into comprehensive stroke centers.`,
        tableHTML: rankTable(list, [
          { label: 'HCP', render: nameChip },
          { label: 'Primary HCO', render: r => escape(r.primary_hco_name_inferred || '—') },
          { label: 'Bridge score', render: r => fmt(r.bridge_score) },
          { label: 'Referrals', render: r => `${fmt(r.referral_in_count)} in / ${fmt(r.referral_out_count)} out` },
        ]),
        evidence: `<b>Why:</b> high shared-patient network with stroke-center HCPs, primary affiliation at a community hospital, and strong referral-out volume.`,
      };
    }

    if (text.includes('emerging') || text.includes('medical affairs') && text.includes('monitor')) {
      const list = hcps.filter(h => h.primary_launch_archetype === 'Emerging Expert' || h.secondary_launch_archetype === 'Emerging Expert')
        .sort((a, b) => b.recent_publication_count_3y - a.recent_publication_count_3y).slice(0, 8);
      return {
        text: `<b>${list.length} emerging experts</b> Medical Affairs should monitor.`,
        tableHTML: rankTable(list, [
          { label: 'HCP', render: nameChip },
          { label: 'Recent pubs', render: r => fmt(r.recent_publication_count_3y) },
          { label: 'Co-author KOL?', render: r => r.top_coauthor_kol_flag ? '<span class="pill pill-green">Yes</span>' : '—' },
          { label: 'Digital', render: r => fmt(r.digital_engagement_score) },
          { label: 'Trial role', render: r => escape(r.trial_role_strength) },
        ]),
        evidence: `<b>Signal:</b> 3+ stroke publications in the past 3 years, co-author link to a senior KOL, recent trial role, low advisory exposure.`,
      };
    }

    if (text.includes('great lakes') && (text.includes('engage first') || text.includes('first in') || text.includes('sequence'))) {
      const idn = 'Great Lakes Health Network';
      const subset = hcps.filter(h => h.parent_idn_name === idn);
      const arun = subset.find(h => h.full_name_resolved.includes('Arun'));
      const sarah = subset.find(h => h.full_name_resolved.includes('Sarah Lin') || h.full_name_resolved.includes('Sarah J'));
      const maria = subset.find(h => h.full_name_resolved.includes('Maria E'));
      const kevin = subset.find(h => h.full_name_resolved.includes('Kevin T'));
      const order = [arun, sarah, maria, kevin].filter(Boolean);
      return {
        text: `Suggested engagement sequence inside <b>Great Lakes Health Network</b>:`,
        tableHTML: rankTable(order.map((h, i) => ({ ...h, _rank: i + 1 })), [
          { label: '#', render: r => `<b>${r._rank}</b>` },
          { label: 'HCP', render: nameChip },
          { label: 'Role in launch', render: r => escape(r.primary_launch_archetype) },
          { label: 'Owner', render: r => escape(r.recommended_bayer_team) },
          { label: 'First action', render: r => `<span class="text-muted">${escape(r.recommended_next_action)}</span>` },
        ]),
        evidence: `<b>Logic:</b> open with the Scientific KOL for evidence credibility, secure the pathway with the Stroke Program Director, activate the community-bridge referral hub, then nurture the emerging digital-responsive expert. Avoids stacking only publication-heavy KOLs.`,
        sources: ['canonical_hcp_profile', 'hcp_archetypes', 'CRM_Digital_Engagement'],
      };
    }

    if (text.includes('digital')) {
      const list = hcps.filter(h => h.digital_engagement_score >= 40 && h.launch_relevance_score >= 50)
        .sort((a, b) => b.digital_engagement_score - a.digital_engagement_score).slice(0, 8);
      return {
        text: `<b>${list.length} HCPs</b> combine strong digital responsiveness with launch relevance.`,
        tableHTML: rankTable(list, [
          { label: 'HCP', render: nameChip },
          { label: 'Digital', render: r => fmt(r.digital_engagement_score) },
          { label: 'Launch', render: r => fmt(r.launch_relevance_score) },
          { label: 'Topics', render: r => (r.topic_affinity || []).map(t => `<span class="pill pill-grey">${escape(t)}</span>`).join(' ') },
        ]),
        evidence: `<b>Signal:</b> email open rate + webinar attendance on stroke / secondary prevention content, plus disease relevance > 50.`,
      };
    }

    if (text.includes('conflicting affiliation') || text.includes('review')) {
      const list = hcps.filter(h => h.affiliation_conflict_flag).slice(0, 10);
      return {
        text: `<b>${list.length} HCPs</b> have conflicting primary affiliations that need manual review.`,
        tableHTML: rankTable(list, [
          { label: 'HCP', render: nameChip },
          { label: 'Affiliations', render: r => fmt(r.affiliation_count) },
          { label: 'Primary inferred', render: r => escape(r.primary_hco_name_inferred || '—') },
          { label: 'Reason', render: r => `<span class="text-muted">${escape(r.primary_affiliation_reason)}</span>` },
        ]),
        evidence: `<b>Why:</b> more than one source marked the HCP's primary affiliation as Y on different HCOs.`,
      };
    }

    if (text.includes('co-publish') || (text.includes('publication') && text.includes('stroke'))) {
      const list = hcps.filter(h => h.stroke_publication_count >= 3).sort((a, b) => b.stroke_publication_count - a.stroke_publication_count).slice(0, 10);
      return {
        text: `<b>${list.length} HCPs</b> co-publish on ischemic stroke or TIA topics.`,
        tableHTML: rankTable(list, [
          { label: 'HCP', render: nameChip },
          { label: 'Stroke pubs', render: r => fmt(r.stroke_publication_count) },
          { label: 'Citations', render: r => fmt(r.citation_count_total) },
          { label: 'Co-author deg', render: r => fmt(r.coauthor_degree) },
        ]),
        evidence: `<b>Source:</b> Publications_Trials_Scientific_Activity.xlsx with topic_tags containing "stroke" or "TIA".`,
      };
    }

    if (text.includes('compare') && (text.includes('arun') || text.includes('patel') || text.includes('sarah') || text.includes('maria') || text.includes('kevin'))) {
      const heroes = d.hero_ids.map(id => App.getHCP(id)).filter(Boolean);
      return {
        text: `Side-by-side of the four hero HCPs:`,
        tableHTML: rankTable(heroes, [
          { label: 'HCP', render: nameChip },
          { label: 'Archetype', render: r => escape(r.primary_launch_archetype) },
          { label: 'Sci', render: r => fmt(r.scientific_influence_score) },
          { label: 'Clinical', render: r => fmt(r.clinical_network_score) },
          { label: 'System', render: r => fmt(r.system_influence_score) },
          { label: 'Bayer', render: r => fmt(r.bayer_relationship_strength) },
          { label: 'Action', render: r => `<span class="text-muted">${escape(r.recommended_next_action)}</span>` },
        ]),
        evidence: `<b>Insight:</b> publication-heavy HCPs (Arun) do not automatically own the pathway (Sarah) or the referral network (Maria). Each plays a complementary role in the launch.`,
      };
    }

    // generic search by name
    const named = hcps.find(h => h.full_name_resolved.toLowerCase().includes(text.replace(/[^a-z\s\.]/g, '').trim()));
    if (named && q.length < 60) {
      return {
        text: `Closest match: ${nameChip(named)} · <b>${escape(named.primary_launch_archetype)}</b>`,
        tableHTML: '',
        evidence: `Open the detail drawer for full reason codes and recommended action.`,
      };
    }

    // fallback
    return {
      text: `I answer from the canonical model only. Try a suggested question on the right, or ask about a specific IDN, archetype, region, specialty, or HCP.`,
      tableHTML: '',
      evidence: `<b>Available fields:</b> archetype, launch_relevance_score, scientific_influence_score, clinical_network_score, system_influence_score, bayer_relationship_strength, digital_engagement_score, referral_centrality_score, bridge_score, parent_idn_name, primary_specialty, region, stroke_center_affiliation_flag.`,
    };
  }

})();
