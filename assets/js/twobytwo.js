/* 2x2 archetype maps using Chart.js */

window.Screens = window.Screens || {};

(function () {
  const { el, escape, fmt, navigate, getData } = App;

  const PLOTS = [
    {
      id: 'sci-system',
      title: 'Scientific × System influence',
      desc: 'Separate publication-heavy KOLs from operational pathway leaders.',
      y: 'scientific_influence_score', yLabel: 'Scientific influence',
      x: 'system_influence_score', xLabel: 'System influence',
      quads: {
        tr: { name: 'Strategic launch KOLs', archetype: ['Scientific KOL', 'Regional Stroke Pathway Influencer'] },
        tl: { name: 'Evidence leaders', archetype: ['Evidence Leader', 'Scientific KOL'] },
        br: { name: 'Operational pathway influencers', archetype: ['Regional Stroke Pathway Influencer', 'Operational Pathway Influencer'] },
        bl: { name: 'Monitor', archetype: ['Monitor'] },
      },
    },
    {
      id: 'launch-bayer',
      title: 'Launch relevance × Bayer relationship',
      desc: 'Find priority outreach gaps and ready-to-activate HCPs.',
      y: 'launch_relevance_score', yLabel: 'Launch relevance',
      x: 'bayer_relationship_strength', xLabel: 'Bayer relationship strength',
      quads: {
        tr: { name: 'Activate now', filter: { minLaunch: 50, minBayer: 50 } },
        tl: { name: 'Priority outreach', filter: { minLaunch: 50, maxBayer: 25, underengaged: true } },
        br: { name: 'Maintain selectively', filter: { maxLaunch: 50, minBayer: 50 } },
        bl: { name: 'Low priority', filter: { maxLaunch: 50, maxBayer: 25 } },
      },
    },
    {
      id: 'sci-clinical',
      title: 'Scientific × Clinical network influence',
      desc: 'Academic depth vs referral-network reach.',
      y: 'scientific_influence_score', yLabel: 'Scientific influence',
      x: 'clinical_network_score', xLabel: 'Clinical network influence',
      quads: {
        tr: { name: 'Rare high-value influencer', archetype: ['Scientific KOL', 'Regional Stroke Pathway Influencer'] },
        tl: { name: 'Academic KOL', archetype: ['Scientific KOL', 'Evidence Leader', 'Emerging Expert'] },
        br: { name: 'Referral hub', archetype: ['Clinical Referral Hub', 'Community-to-Stroke-Center Bridge'] },
        bl: { name: 'Lower priority', archetype: ['Monitor'] },
      },
    },
  ];

  const COLOR_MAP = {
    'Scientific KOL': '#0c6e3c',
    'Regional Stroke Pathway Influencer': '#1d4d8b',
    'Operational Pathway Influencer': '#3b82f6',
    'Clinical Referral Hub': '#b45309',
    'Community-to-Stroke-Center Bridge': '#d97706',
    'Under-engaged High-Value HCP': '#b91c1c',
    'Emerging Expert': '#6f42a1',
    'Digital-Responsive Influencer': '#1e6091',
    'Evidence Leader': '#0891b2',
    'Monitor': '#94a3b8',
  };

  Screens.twobytwo = function (host) {
    const d = getData();
    host.innerHTML = `
      <div class="screen-header">
        <div class="crumbs"><span>Network intelligence</span><span>›</span><span>2×2 archetype maps</span></div>
        <h1 class="screen-title">2×2 archetype maps</h1>
        <div class="screen-subtitle">Separate scientific, clinical, system, and Bayer-relationship influence. Hero HCPs are highlighted with a halo. Click a quadrant to filter the network graph.</div>
        <div class="screen-actions">
          <label class="muted text-small" style="display:flex;align-items:center;gap:8px">View
            <select id="tbt-scope" class="filter-select" style="width:auto">
              <option value="all">All HCPs</option>
              <option value="GLHN">Great Lakes Health Network only</option>
              <option value="midwest">Midwest only</option>
              <option value="neuro">Stroke-relevant specialties only</option>
            </select>
          </label>
          <span class="pill pill-grey" id="tbt-count">0 HCPs</span>
        </div>
      </div>
      <div class="twobytwo-grid stagger" id="tbt-grid"></div>
    `;

    let scope = 'all';
    host.querySelector('#tbt-scope').onchange = (e) => {
      scope = e.target.value;
      renderAll();
    };

    const grid = host.querySelector('#tbt-grid');

    function filterScope(hcps) {
      if (scope === 'GLHN') return hcps.filter(h => h.parent_idn_name === 'Great Lakes Health Network');
      if (scope === 'midwest') return hcps.filter(h => h.region === 'Midwest');
      if (scope === 'neuro') return hcps.filter(h => ['Vascular Neurology', 'Neurology', 'Interventional Neurology', 'Neurosurgery'].includes(h.primary_specialty_resolved));
      return hcps;
    }

    function renderAll() {
      grid.innerHTML = '';
      const subset = filterScope(d.canonical_hcps);
      host.querySelector('#tbt-count').textContent = `${subset.length} HCPs`;
      PLOTS.forEach(plot => {
        const card = document.createElement('div');
        card.className = 'tbt-card';
        card.innerHTML = `
          <div class="tbt-head">
            <div>
              <div class="tbt-title">${escape(plot.title)}</div>
              <div class="tbt-axes">${escape(plot.desc)} · y: ${escape(plot.yLabel)} · x: ${escape(plot.xLabel)}</div>
            </div>
            <button class="btn btn-sm btn-ghost" data-jump="${plot.id}">Open in graph →</button>
          </div>
          <div class="tbt-canvas-wrap" style="height:340px">
            <canvas id="cnv-${plot.id}"></canvas>
            <div class="in-chart-quadrant" data-pos="tl" data-quad="${plot.id}-tl" style="top:8px;left:46px">↖ ${escape(plot.quads.tl.name)}</div>
            <div class="in-chart-quadrant" data-pos="tr" data-quad="${plot.id}-tr" style="top:8px;right:8px">↗ ${escape(plot.quads.tr.name)}</div>
            <div class="in-chart-quadrant" data-pos="bl" data-quad="${plot.id}-bl" style="bottom:34px;left:46px">↙ ${escape(plot.quads.bl.name)}</div>
            <div class="in-chart-quadrant" data-pos="br" data-quad="${plot.id}-br" style="bottom:34px;right:8px">↘ ${escape(plot.quads.br.name)}</div>
          </div>
          <div class="text-small text-muted mt-8">Click a quadrant label to filter the network graph.</div>
        `;
        grid.appendChild(card);
        // make quadrant labels clickable
        card.querySelectorAll('.in-chart-quadrant').forEach(q => {
          q.style.cursor = 'pointer';
          q.style.pointerEvents = 'auto';
          q.onclick = () => filterFromQuadrant(plot, q.getAttribute('data-pos'));
        });
        // "Open in graph" — jump to the network with the plot's strongest archetype set
        const jumpBtn = card.querySelector(`[data-jump="${plot.id}"]`);
        if (jumpBtn) {
          jumpBtn.onclick = () => filterFromQuadrant(plot, 'tr');
        }
        drawPlot(plot, card.querySelector('canvas'), subset);
      });
    }

    function filterFromQuadrant(plot, pos) {
      const quad = plot.quads[pos];
      // Build URL hash-style filter and navigate to network
      App.state.filters = App.state.filters || {};
      App.state.filters.fromQuadrant = { plot: plot.id, pos, quad };
      // Use archetype filter when defined; else pass through to graph "custom"
      navigate('network', { quadrant: { plot: plot.id, pos, quad } });
    }

    function drawPlot(plot, canvas, hcps) {
      const byArchetype = {};
      hcps.forEach(h => {
        const k = h.primary_launch_archetype;
        (byArchetype[k] = byArchetype[k] || []).push(h);
      });
      const datasets = Object.entries(byArchetype).map(([arc, items]) => ({
        label: arc,
        data: items.map(h => ({ x: h[plot.x], y: h[plot.y], hcp: h, r: h.is_hero ? 8 : 4 })),
        backgroundColor: COLOR_MAP[arc] || '#94a3b8',
        pointRadius: ctx => (ctx.raw && ctx.raw.hcp && ctx.raw.hcp.is_hero) ? 8 : 4,
        pointHoverRadius: ctx => (ctx.raw && ctx.raw.hcp && ctx.raw.hcp.is_hero) ? 11 : 7,
        borderColor: ctx => (ctx.raw && ctx.raw.hcp && ctx.raw.hcp.is_hero) ? '#0c6e3c' : 'rgba(255,255,255,0.85)',
        borderWidth: ctx => (ctx.raw && ctx.raw.hcp && ctx.raw.hcp.is_hero) ? 2.5 : 1,
      }));

      new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
          maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutCubic' },
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              padding: 10,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              callbacks: {
                label: ctx => {
                  const h = ctx.raw.hcp;
                  return [
                    `${h.full_name_resolved}${h.is_hero ? ' ★' : ''}`,
                    `${h.primary_specialty_resolved} · ${h.region || ''}`,
                    `${plot.yLabel}: ${ctx.raw.y}  ·  ${plot.xLabel}: ${ctx.raw.x}`,
                    `Archetype: ${h.primary_launch_archetype}`,
                    `Primary HCO: ${h.primary_hco_name_inferred || ''}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: { min: 0, max: 100, title: { display: true, text: plot.xLabel, font: { size: 11 } }, ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
            y: { min: 0, max: 100, title: { display: true, text: plot.yLabel, font: { size: 11 } }, ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
          },
          onClick: (evt, els) => {
            if (!els.length) return;
            const e = els[0];
            const point = datasets[e.datasetIndex].data[e.index];
            Detail.openHCP(point.hcp.canonical_hcp_id);
          },
        },
        plugins: [quadrantBackgroundPlugin(), heroHaloPlugin()],
      });
    }

    function quadrantBackgroundPlugin() {
      return {
        id: 'quadrantBg',
        beforeDraw(chart) {
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return;
          const xMid = scales.x.getPixelForValue(50);
          const yMid = scales.y.getPixelForValue(50);
          ctx.save();
          ctx.fillStyle = '#f3f5f9'; ctx.fillRect(chartArea.left, yMid, xMid - chartArea.left, chartArea.bottom - yMid);
          ctx.fillStyle = '#e3edf9'; ctx.fillRect(chartArea.left, chartArea.top, xMid - chartArea.left, yMid - chartArea.top);
          ctx.fillStyle = '#d6f0de'; ctx.fillRect(xMid, chartArea.top, chartArea.right - xMid, yMid - chartArea.top);
          ctx.fillStyle = '#fcefd7'; ctx.fillRect(xMid, yMid, chartArea.right - xMid, chartArea.bottom - yMid);
          ctx.strokeStyle = '#c9d1dc'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(xMid, chartArea.top); ctx.lineTo(xMid, chartArea.bottom); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(chartArea.left, yMid); ctx.lineTo(chartArea.right, yMid); ctx.stroke();
          ctx.restore();
        },
      };
    }

    // Draw soft halos around hero HCP points
    function heroHaloPlugin() {
      return {
        id: 'heroHalo',
        afterDatasetsDraw(chart) {
          const { ctx, scales } = chart;
          chart.data.datasets.forEach((ds) => {
            ds.data.forEach(p => {
              if (p.hcp && p.hcp.is_hero) {
                const x = scales.x.getPixelForValue(p.x);
                const y = scales.y.getPixelForValue(p.y);
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(x, y, 5, x, y, 16);
                grad.addColorStop(0, 'rgba(12, 110, 60, 0.35)');
                grad.addColorStop(1, 'rgba(12, 110, 60, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
              }
            });
          });
        },
      };
    }

    renderAll();
  };
})();
