# HCP Network Intelligence Workbench

> A static, end-to-end product demo of an enterprise HCP (Healthcare Professional) network intelligence platform built around a fictional secondary stroke prevention launch. Walks from raw, messy data sources through identity resolution, network construction, and launch-ready KOL archetypes.

No backend, no servers — just HTML, CSS, JS, and a Python data generator. Everything runs from `index.html`.

---

## What it does

Pharmaceutical launch teams need to answer questions like *"Inside Great Lakes Health Network, who can actually influence post-stroke pathway adoption?"* — but the underlying truth is split across IQVIA-style HCP masters, Definitive-style HCO hierarchies, claims data, publication records, and CRM engagement logs, each with its own conflicts, duplicates, and gaps.

This workbench shows the full flow:

1. **Upload sources** — six synthetic Excel extracts pre-loaded
2. **Source quality** — per-file profiling, red/amber/green issues, null counts, conflicts
3. **Rules & AutoMap** — identity resolution rules, edge construction thresholds
4. **Processing** — staged pipeline animation with live log
5. **Canonical output** — 820 resolved HCPs, 73 HCOs/IDNs, 3,108 network edges
6. **Network graph** — interactive vis-network canvas with 8 launch scenarios
7. **2×2 archetype maps** — scientific × system, launch × Bayer, scientific × clinical
8. **Network assistant** — grounded Q&A over the canonical model

Four "hero" HCPs are deliberately woven through the synthetic data to anchor the launch story:

| Hero | Archetype |
|---|---|
| Dr. Arun Patel | Scientific KOL |
| Dr. Sarah Lin | Regional Stroke Pathway Influencer |
| Dr. Maria Gomez | Clinical Referral Hub |
| Dr. Kevin Shaw | Emerging Expert · Digital-Responsive Influencer |

The flagship IDN is the fictional **Great Lakes Health Network** (16 facilities, 3 stroke centers, 1 AMC).

---

## Running it

No build step. Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

The app loads `assets/data/demo_data.js` (~3.7 MB precomputed bundle) and renders everything client-side.

### Regenerating the synthetic data

```bash
pip install pandas openpyxl
python generate_synthetic_hcp_network_data.py
```

This rebuilds the six source Excel files **and** the `assets/data/demo_data.js` bundle the UI reads. Deterministic — uses `random.seed(42)`. See `README_generated_data.md` for the data dictionary.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | Vanilla HTML / CSS / JS — no framework |
| Network graph | [vis-network](https://visjs.github.io/vis-network/docs/network/) 9.1.9 (CDN) |
| 2×2 plots | [Chart.js](https://www.chartjs.org/) 4.4.1 (CDN) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Data generator | Python 3 + pandas + openpyxl |
| Persistence | None — static JSON bundle exposed as `window.DEMO_DATA` |

Light enterprise theme: Bayer green primary (`#0c6e3c`), deep blue accent (`#1d4d8b`).

---

## Project structure

```
.
├── index.html                              # App shell
├── assets/
│   ├── css/styles.css                      # Light enterprise theme + animations
│   ├── data/demo_data.js                   # Precomputed canonical bundle
│   └── js/
│       ├── app.js                          # State, router, staged loader, utils
│       ├── boot.js                         # Hash routing + topbar bindings
│       ├── screens.js                      # Upload / Quality / AutoMap / Processing / Canonical
│       ├── network.js                      # vis-network graph + scenarios + filters
│       ├── twobytwo.js                     # Chart.js 2×2 plots with hero halo
│       ├── assistant.js                    # Grounded chat assistant
│       └── detail.js                       # Tabbed HCP/HCO detail drawer
├── generate_synthetic_hcp_network_data.py  # Data generator (seed 42)
├── *.xlsx                                  # 6 synthetic source files
├── README_generated_data.md                # Data dictionary
├── hcp_network_intelligence_prd.md         # Product brief
└── synthetic_data_context.md               # Data design notes
```

---

## Demo notes

Every button in the UI does something — even where the underlying action is fictional. Examples:

- **Upload zone / Add file** → modal walks through a staged fake upload (progress bar → schema detection → continue)
- **Edit rules** → drawer with editable selects/sliders that persists nothing but feels real
- **HCP detail → Take action** → log outreach (form modal), download brief, open in network, flag for review
- **2×2 quadrant labels** → click jumps to the network graph pre-filtered to that archetype
- **Network assistant** → ~10 canned questions are deeply answered (with tables, evidence, source pills); the rest get a clean fallback

Screen transitions use a staged loader that ticks through a checklist per screen (e.g., the network graph loader says "Loading 820 HCPs · 73 HCOs" → "Resolving 3,108 relationship edges" → "Running force-directed layout" → "Rendering interactive canvas") so the demo feels like a real enterprise tool spinning up.

---

## Disclaimer

All HCPs, HCOs, IDNs, publications, claims data, and engagement records in this repository are **synthetic**. Names, NPIs, addresses, and metrics are programmatically generated and do not correspond to any real individual, organization, or patient. The "Bayer" branding and the secondary-stroke-prevention launch framing are used as a realistic enterprise scenario; this project is not affiliated with or endorsed by Bayer.
