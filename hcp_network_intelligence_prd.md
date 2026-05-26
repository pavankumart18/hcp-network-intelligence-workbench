# PRD: HCP network intelligence workbench

## 1. Product summary

Build a web application that lets a user upload multiple Excel extracts representing HCP, HCO, claims, CRM, publications, trials, and digital engagement data. The app profiles data quality issues, maps the sources into a canonical HCP/HCO model, generates derived network and launch intelligence columns, and powers an interactive HCP network graph plus 2x2 launch archetype views.

The app should feel like a realistic enterprise data and intelligence workbench for a pharmaceutical launch team focused on health systems, KOL networks, and HCP network utilization.

## 2. Main user

Primary user: enterprise data strategy lead for health systems.

Secondary users:
- Medical affairs lead
- MSL lead
- Commercial launch lead
- Health-system partnership lead
- Market access lead
- Account manager

## 3. Core demo promise

The application turns the data Bayer already licenses or owns into a Bayer-specific launch intelligence layer.

It should not feel like a generic map. It should answer:

- Who matters for this launch?
- Why do they matter?
- How are they connected?
- What health systems do they influence?
- Which HCPs are scientific KOLs, pathway influencers, referral hubs, emerging experts, or under-engaged priorities?
- What should Bayer do next?

## 4. User flow overview

1. Upload files
2. Show source tiles
3. Show data quality profile per source
4. Allow optional mapping rules
5. Run AutoMap
6. Show processing progress
7. Create canonical HCP/HCO data model
8. Show canonical output summary and download option
9. Open network intelligence
10. Use network graph with scenario-based clustering and filters
11. Use 2x2 archetype maps
12. Click nodes to view HCP/HCO detail panels
13. Use network assistant with prefilled demo questions

## 5. Screen 1: file upload

### Purpose
Let user upload five or six Excel files.

### Required files
- HCP master
- HCO/IDN hierarchy
- HCP-HCO affiliations
- Claims/activity
- Publications/trials
- CRM/digital engagement

### UI requirements
- Drag-and-drop upload area
- Accepted file types: .xlsx, .xls, .csv
- File type detector
- Display uploaded files as tiles
- Each tile shows file name, inferred source type, row count, column count, status

### Demo text in grey placeholder box
"Upload IQVIA-style HCP master, Definitive-style HCO hierarchy, claims/activity, publication/trial, and CRM/digital engagement extracts. The app will profile, map, and harmonize them into a launch-ready HCP network model."

## 6. Screen 2: source tiles and data quality

### Purpose
Show that each source has useful but incomplete truth.

### Tile behavior
Clicking a tile opens a right-side data-quality drawer.

### Data-quality metrics
For every file:
- row count
- column count
- missing values by key column
- duplicate rows
- duplicate IDs
- stale records
- unmatched IDs
- suspected aliases
- conflict flags
- source-specific quality issues

### Source-specific examples

#### HCP master
- missing NPI
- duplicate NPI
- name variants
- missing specialty
- specialty conflict
- old address

#### HCO hierarchy
- hospital aliases
- missing parent IDN
- conflicting parent IDN
- missing stroke center level
- facility type mismatch

#### Affiliations
- multiple affiliations per HCP
- conflicting primary affiliation
- stale affiliation
- missing title or department

#### Claims
- claims lag
- missing HCO attribution
- billing versus treating provider ambiguity
- low counts suppressed

#### Publications/trials
- author without NPI
- ambiguous author names
- messy institution text
- missing topic tags

#### CRM/digital
- CRM HCP missing NPI
- duplicate contacts
- stale engagement
- account-level engagement not tied to HCP

### UI requirements
- Quality score per tile
- Red, amber, green issue summary
- Sample problematic rows
- Button: "Review mapping"
- Button: "Continue to AutoMap"

## 7. Screen 3: rules and AutoMap

### Purpose
Let the system map sources automatically, while allowing business rules.

### Main CTA
Button: `AutoMap`

### Optional rule drawer
Rules should be visible but secondary.

Rules:
- primary HCP identifier priority: NPI, source ID, fuzzy name + HCO, name + specialty + city
- HCO source of truth: Definitive-style hierarchy preferred, CRM hierarchy preserved as commercial view
- affiliation inference: claims activity + listed primary + CRM account + publication affiliation + recency
- publication matching: author name + institution + specialty + co-author context
- disease area: ischemic stroke, TIA, secondary prevention
- time window: last 24 months default for claims and engagement
- graph edge threshold: show edges above confidence threshold

### Grey placeholder demo guidance
"Click AutoMap to detect schemas, map source columns, resolve HCP/HCO identities, infer affiliations, build network edges, and generate launch-relevant derived columns."

## 8. Screen 4: AutoMap processing

### Processing stages
Show a progress stepper:

1. Detecting source schemas
2. Profiling source quality
3. Mapping source columns to canonical model
4. Resolving HCP identities
5. Normalizing HCO and IDN hierarchy
6. Inferring primary clinical and academic affiliations
7. Creating network edges
8. Calculating influence scores
9. Classifying launch archetypes
10. Preparing canonical output

### Completion metrics
- canonical HCPs created
- HCOs created
- affiliations linked
- referral edges created
- co-author edges created
- trial edges created
- CRM records linked
- HCPs classified
- records requiring manual review

## 9. Canonical data model

The app should create these in memory and allow download as Excel or CSV.

### canonical_hcp_profile
Required columns:
- canonical_hcp_id
- npi
- source_ids
- full_name_resolved
- name_variants
- match_confidence
- source_coverage_count
- data_recency_score
- data_quality_flag
- primary_specialty_resolved
- secondary_specialty_resolved
- disease_relevance_score
- inferred_clinical_role
- claims_disease_volume_score
- stroke_patient_count
- tia_patient_count
- followup_activity_score
- primary_hco_id_inferred
- primary_hco_name_inferred
- parent_idn_id
- parent_idn_name
- affiliation_count
- affiliation_conflict_flag
- primary_affiliation_reason
- stroke_center_affiliation_flag
- institutional_role
- publication_count_total
- stroke_publication_count
- citation_count_total
- recent_publication_count_3y
- coauthor_degree
- top_coauthor_kol_flag
- trial_count
- trial_role_strength
- topic_affinity
- referral_in_count
- referral_out_count
- shared_patient_network_degree
- referral_centrality_score
- bridge_score
- community_to_stroke_center_bridge_flag
- hcp_network_cluster_id
- dominant_network_type
- crm_linked_flag
- msl_interaction_count_12m
- rep_interaction_count_12m
- last_engagement_date
- advisory_board_flag
- speaker_program_flag
- digital_engagement_score
- bayer_relationship_strength
- under_engaged_flag
- scientific_influence_score
- clinical_network_score
- system_influence_score
- institutional_influence_score
- launch_relevance_score
- primary_launch_archetype
- secondary_launch_archetype
- archetype_reason_codes
- recommended_bayer_team
- recommended_next_action
- confidence_band

### canonical_hco_profile
Required columns:
- canonical_hco_id
- hco_name_resolved
- hco_aliases
- hco_type
- parent_hco_id
- parent_idn_name
- stroke_center_level
- bed_count
- region
- affiliated_hcp_count
- high_influence_hcp_count
- stroke_volume_proxy
- referral_inflow_score
- launch_readiness_score
- data_confidence_score

### network_edges
Required columns:
- source_node_id
- source_node_type
- target_node_id
- target_node_type
- edge_type
- edge_weight
- edge_source
- evidence_text
- time_period
- confidence_score

Edge types:
- HCP-to-HCO affiliation
- HCP-to-HCP referral
- HCP-to-HCP co-author
- HCP-to-trial investigator
- HCP-to-publication topic
- HCP-to-Bayer engagement
- HCO-to-IDN hierarchy
- HCP-to-digital topic affinity

## 10. Derived scores and archetypes

### Scores
- disease_relevance_score
- scientific_influence_score
- clinical_network_score
- system_influence_score
- institutional_influence_score
- bayer_relationship_strength
- digital_responsiveness_score
- launch_relevance_score
- data_confidence_score
- bridge_score

### Archetypes
- Scientific KOL
- Regional Stroke Pathway Influencer
- Clinical Referral Hub
- Community-to-Stroke-Center Bridge
- Under-engaged High-Value HCP
- Emerging Expert
- Digital-Responsive Influencer
- Evidence Leader
- Operational Pathway Influencer
- Monitor

### Important rule
Do not classify KOLs only by publication count. Separate scientific influence, clinical network influence, health-system influence, and Bayer relationship strength.

## 11. Prompt templates for derived columns

### HCP launch archetype prompt
Classify the HCP into one primary launch archetype and one optional secondary archetype using only these structured fields: specialty, disease relevance, stroke/TIA activity, publications, citations, trials, referral centrality, bridge score, institutional role, primary HCO, parent IDN, Bayer engagement, digital engagement, and data confidence. Distinguish scientific influence from clinical network influence and health-system pathway influence. Return archetype, reason codes, recommended Bayer team, recommended next action, and confidence.

### Primary affiliation inference prompt
Given the HCP's listed affiliations, claims activity by HCO, CRM account assignment, publication affiliation, trial site, recency, and source confidence, infer primary clinical affiliation, academic affiliation, and secondary affiliations. Provide the reason for the primary clinical affiliation and flag conflicts requiring review.

### Network utilization prompt
For this HCP, explain how Bayer should use the relationship in launch planning. Consider whether the HCP is best suited for scientific education, pathway adoption, referral network activation, digital engagement, advisory board participation, market access support, or monitoring. Return recommended use case and reason codes.

### Health-system engagement sequence prompt
For the selected health system, rank HCPs by launch relevance and complementary roles. Recommend a sequence of engagement across scientific KOLs, system pathway influencers, referral hubs, emerging experts, and market-access stakeholders. Avoid recommending only publication-heavy KOLs. Return ranked HCPs, role in launch, rationale, and Bayer team owner.

## 12. Screen 5: canonical output summary

### Purpose
Show that the app created a usable output, not just a visualization.

### UI components
- summary cards:
  - canonical HCPs
  - HCOs
  - HCP-HCO affiliations
  - co-author edges
  - referral edges
  - trial links
  - CRM-linked HCPs
  - classified HCPs
  - manual review flags
- button: Download canonical model
- button: Open network intelligence

## 13. Screen 6: network graph

### Purpose
This is the hero screen.

The graph should show HCPs, hospitals, IDNs, publications, trials, and engagement nodes. It must be interactive, filtered, and scenario-driven.

### Node types
- HCP
- Hospital
- IDN
- Publication topic cluster
- Trial
- Bayer engagement cluster
- Digital topic cluster

### Edge types
- affiliation
- referral/shared patient
- co-publication
- trial involvement
- topic affinity
- Bayer engagement
- HCO hierarchy

### Node hover for HCP
Show:
- name
- specialty
- primary practice
- parent IDN
- launch archetype
- stroke/TIA activity level
- referral centrality percentile
- publication count
- trial count
- Bayer engagement level
- recommended action

### Node hover for HCO
Show:
- HCO name
- HCO type
- parent IDN
- stroke center level
- affiliated HCPs
- high-influence HCPs
- stroke volume proxy
- launch readiness score

### Click behavior
Clicking a node opens a right-side detail drawer.

## 14. Scenario-based clustering and filters on network graph

Filters and clustering should work together. If a scenario is HCP-specific, automatically filter to HCP nodes unless HCO context is needed.

### Scenario buttons

#### Scientific KOL discovery
Auto-filter:
- HCP only
- publication and trial edges
- stroke/TIA topic affinity
Auto-cluster:
- publication affinity
Insight:
- Shows scientific experts and co-author communities.

#### Health-system pathway influence
Auto-filter:
- HCP + HCO + IDN
- selected health system
- stroke-relevant specialties
Auto-cluster:
- health-system hierarchy
Insight:
- Shows who can influence pathway adoption inside an IDN.

#### Referral hub discovery
Auto-filter:
- HCP only
- referral edges
- stroke/TIA activity
Auto-cluster:
- referral communities
Insight:
- Shows clinical network hubs and bottom-up activation points.

#### Under-engaged influencers
Auto-filter:
- HCP only
- high launch relevance
- low Bayer relationship strength
Auto-cluster:
- influence type
Insight:
- Shows relationship gaps.

#### Emerging experts
Auto-filter:
- HCP only
- recent scientific or trial activity
- exclude already known national KOLs if selected
Auto-cluster:
- growth trajectory or publication affinity
Insight:
- Shows rising experts.

#### Community bridge HCPs
Auto-filter:
- HCP + hospital nodes
- referral edges
- community hospitals + stroke centers
Auto-cluster:
- referral flow
Insight:
- Shows connectors between community care and stroke centers.

#### Launch account view
Auto-filter:
- HCP + HCO + IDN
- selected parent IDN
Auto-cluster:
- parent IDN and hospital hierarchy
Insight:
- Shows an account-level network view.

#### Digital-responsive influencers
Auto-filter:
- HCP only
- high digital engagement
- launch relevant
Auto-cluster:
- content topic affinity
Insight:
- Shows who may be activated through digital education.

### Manual filters
- node type
- edge type
- specialty
- archetype
- health system
- region
- stroke center level
- Bayer engagement level
- publication topic
- trial role
- referral centrality percentile
- patient volume band
- confidence score

## 15. Screen 7: 2x2 archetype maps

The 2x2 should be linked to the graph. Clicking a quadrant filters the graph.

### 2x2 A: scientific influence vs system influence
Y-axis: scientific_influence_score
X-axis: system_influence_score

Quadrants:
- High scientific, high system: Strategic launch KOLs
- High scientific, low system: Evidence leaders
- Low scientific, high system: Operational pathway influencers
- Low scientific, low system: Monitor

### 2x2 B: launch relevance vs Bayer relationship
Y-axis: launch_relevance_score
X-axis: bayer_relationship_strength

Quadrants:
- High relevance, high relationship: Activate now
- High relevance, low relationship: Priority outreach
- Low relevance, high relationship: Maintain selectively
- Low relevance, low relationship: Low priority

### 2x2 C: clinical network influence vs scientific influence
Y-axis: scientific_influence_score
X-axis: clinical_network_score

Quadrants:
- High both: rare high-value influencer
- High scientific, low clinical: academic KOL
- Low scientific, high clinical: referral hub
- Low both: lower priority

### UI behavior
- Clicking a quadrant auto-filters the graph.
- Hovering a point shows HCP summary.
- Clicking a point opens HCP detail drawer.
- Allow toggle between all HCPs, selected IDN, selected region, selected specialty.

## 16. Screen 8: HCP detail drawer

Sections:
- Identity and source crosswalk
- Clinical role
- Health-system role
- Network role
- Scientific influence
- Bayer relationship
- Data confidence
- Launch archetype
- Reason codes
- Recommended action

Example grey placeholder note:
"This HCP is classified as a Regional Stroke Pathway Influencer because she leads a stroke program, has high follow-up activity, is central in the IDN referral network, and has moderate scientific activity. Suggested action: MSL evidence discussion followed by pathway workshop."

## 17. Screen 9: network assistant

### Purpose
Let users ask structured questions over the canonical data.

### Important behavior
The assistant must answer from the canonical data, derived columns, and network edges. It should not make unsupported claims.

### Prefilled grey text box questions
- Which HCPs inside Great Lakes Health Network can influence post-stroke pathway adoption?
- Who are the under-engaged high-value HCPs in the Midwest?
- Which HCPs are scientific KOLs versus operational pathway influencers?
- Which community physicians bridge patients into comprehensive stroke centers?
- Which emerging experts should Medical Affairs monitor?
- Who should Bayer engage first in Great Lakes Health Network and why?
- Which HCPs have high digital responsiveness and strong launch relevance?
- Which HCPs have conflicting affiliations that need review?
- Show me doctors who co-publish on ischemic stroke or TIA.
- Compare Dr. Arun Patel, Dr. Sarah Lin, Dr. Maria Gomez, and Dr. Kevin Shaw.

## 18. Demo insights to show

Use these as presenter talking points.

1. Data is not missing. It is fragmented.
2. A single vendor file gives a useful slice, but launch decisions require the combined view.
3. A publication-heavy KOL may not be the best health-system pathway influencer.
4. Referral hubs and bridge HCPs are often hidden in claims and network data.
5. Internal CRM data changes the action: some high-value HCPs are already engaged, others are relationship gaps.
6. Top-down account planning and bottom-up HCP activation should use the same graph.
7. Every classification should have reason codes and source evidence.
8. The app should create a downloadable canonical model that can be reused beyond the demo.

## 19. Technical guidance for Codex

### Suggested stack
Use a modern React app with:
- React + TypeScript
- Vite
- Tailwind CSS
- SheetJS or similar for Excel parsing
- A graph library such as Cytoscape.js, Sigma.js, React Flow, or D3 force graph
- A chart library for 2x2 scatter plots
- Local in-browser processing is acceptable for demo scale

### Data processing modules
- fileUploadService
- sourceProfiler
- schemaDetector
- autoMapper
- entityResolver
- hcoHierarchyBuilder
- affiliationInferenceEngine
- scoreEngine
- archetypeClassifier
- graphBuilder
- networkAssistant
- exportService

### App routes or screens
- /upload
- /quality
- /automap
- /canonical-summary
- /network
- /two-by-two
- /assistant

### Export requirements
Allow download of:
- canonical_hcp_profile.xlsx
- canonical_hco_profile.xlsx
- network_edges.xlsx
- hcp_archetypes.xlsx
- mapping_report.xlsx

## 20. Acceptance criteria

The app is complete when:

1. User can upload six synthetic Excel files.
2. Source tiles show row counts, column counts, and quality issues.
3. AutoMap creates a canonical HCP/HCO model.
4. Canonical summary shows counts and download options.
5. Network graph renders HCP, HCO, IDN, publication, trial, and engagement nodes.
6. Scenario buttons auto-apply correct graph filters and cluster modes.
7. Hover and click interactions show rich HCP/HCO details.
8. 2x2 maps render from derived scores.
9. Clicking 2x2 quadrants filters the graph.
10. Archetype classifications have reason codes and recommended action.
11. Network assistant includes prefilled demo questions and answers based on canonical data.
12. The experience supports both top-down account planning and bottom-up HCP activation.
