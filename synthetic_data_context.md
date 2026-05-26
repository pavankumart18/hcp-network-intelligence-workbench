# Synthetic data context for HCP network intelligence demo

## Demo goal
Create realistic synthetic Excel files that simulate the data Bayer could already license or own for a health-system-focused launch. The app will upload these files, profile quality issues, AutoMap them into a canonical HCP/HCO graph, derive launch intelligence columns, then power an interactive network graph and 2x2 archetype views.

This is not a patient-level PHI demo. Use only synthetic aggregate data.

## Business context
The application is for a pharmaceutical launch team preparing for a secondary stroke prevention launch. The audience is an enterprise data strategy lead focused on health systems, KOL networks, HCP networks, and network utilization.

The application must support both:

1. Top-down launch planning: start from health systems, IDNs, hospitals, regions, stroke centers, account priorities, and launch readiness.
2. Bottom-up network activation: start from HCPs, KOLs, referral hubs, system influencers, co-author clusters, clinical trial investigators, and Bayer engagement gaps.

Both views must use the same canonical data model.

## Main hypothesis
Bayer likely already has strong licensed and internal datasets, such as IQVIA-style HCP master data, Definitive Healthcare-style HCO hierarchy and hospital intelligence, claims/activity data, publication and trial data, CRM engagement data, and digital engagement data. The value of the demo is not basic maps or provider lists. The value is linking these sources into a Bayer-specific launch intelligence layer that explains who matters, why they matter, how they are connected, and what action Bayer should take.

## Data files to generate
Generate six Excel files in the same folder as the script.

### 1. IQVIA_HCP_Master.xlsx
One row per source HCP record, with some duplicates and data quality issues.

Columns:
- source_hcp_id
- npi
- first_name
- middle_name
- last_name
- full_name
- credentials
- primary_specialty
- secondary_specialty
- address_line_1
- city
- state
- zip
- phone
- email
- license_state
- active_status
- source_last_updated

Realistic quality issues to include:
- duplicate HCP records with same NPI and slightly different names or addresses
- missing NPI in 2 to 5 percent of rows
- broad specialties like Neurology where other sources imply Vascular Neurology or Stroke Specialist
- name variants such as S. Lin, Sarah J Lin, Dr Sarah Lin
- old addresses mixed with current practice sites

### 2. Definitive_HCO_IDN_Hierarchy.xlsx
Hospitals, clinics, stroke centers, IDNs, and parent hierarchy.

Columns:
- source_hco_id
- hco_name
- hco_alias
- hco_type
- parent_hco_id
- parent_idn_name
- facility_type
- stroke_center_level
- bed_count
- address
- city
- state
- region
- network_status
- account_priority_flag
- source_last_updated

Realistic quality issues:
- hospital aliases and acronyms
- parent IDN mismatch on some rows
- missing stroke center status in 5 to 10 percent of rows
- CRM account hierarchy may later conflict with this hierarchy

### 3. HCP_HCO_Affiliations.xlsx
Links HCPs to hospitals, clinics, departments, roles, and IDNs.

Columns:
- source_hcp_id
- npi
- source_hco_id
- hco_name
- affiliation_type
- primary_affiliation_flag
- department
- title
- start_date
- end_date
- affiliation_source
- affiliation_confidence

Realistic quality issues:
- HCPs with multiple hospitals
- stale affiliations with end dates or old start dates
- conflicting primary affiliation flags
- missing title or department
- title variants such as Stroke Director, Director Stroke Ctr, Stroke Program Director

### 4. Claims_Stroke_TIA_Activity.xlsx
Synthetic aggregate claims/activity data by HCP and optionally HCO. No patient-level PHI.

Columns:
- hcp_npi
- source_hco_id
- period_start
- period_end
- ischemic_stroke_patient_count
- tia_patient_count
- secondary_prevention_followup_count
- antithrombotic_rx_proxy_count
- referral_in_count
- referral_out_count
- shared_patient_hcp_count
- readmission_or_recurrent_event_proxy
- payer_mix_commercial_pct
- payer_mix_medicare_pct
- billing_vs_treating_role
- data_lag_days

Realistic quality issues:
- claims lag of 45 to 180 days
- some HCO attribution gaps
- billing provider differs from treating provider
- low counts suppressed or blanked
- diagnosis coding noise

### 5. Publications_Trials_Scientific_Activity.xlsx
Scientific publications, clinical trials, co-author links, conference signals.

Columns:
- publication_id
- author_name
- author_affiliation_text
- matched_npi
- title
- journal
- publication_year
- topic_tags
- citation_count
- coauthor_names
- trial_id
- trial_role
- conference_activity_flag
- source_confidence

Realistic quality issues:
- many author rows without NPI
- institution strings that do not cleanly match HCO names
- ambiguous author names
- missing or inconsistent topic tags
- trial role variants such as PI, Site Investigator, Collaborator, Steering Committee

### 6. CRM_Digital_Engagement.xlsx
Bayer-style CRM, MSL, rep, advisory, speaker, and digital engagement data.

Columns:
- crm_hcp_id
- npi
- crm_account_id
- crm_account_name
- owner_team
- last_msl_interaction_date
- msl_interaction_count_12m
- rep_interaction_count_12m
- advisory_board_flag
- speaker_program_flag
- email_open_rate
- webinar_attendance_count
- content_topics_engaged
- engagement_sentiment
- access_restriction_flag

Realistic quality issues:
- CRM contacts missing NPI
- duplicate CRM contacts
- stale engagement dates
- engagement at account level rather than HCP level
- content engagement not necessarily linked to influence

## Archetype story to embed in the data
Create enough data to support these archetypes and demo examples.

1. Scientific KOL
- High stroke/TIA publication count
- High citations
- Trial role such as PI or steering committee
- Strong co-author network
- May not have the highest local referral volume

2. Regional Stroke Pathway Influencer
- Works inside priority IDN or comprehensive stroke center
- Has leadership title such as Stroke Program Director
- Moderate publications
- High system influence
- High post-stroke follow-up activity

3. Clinical Referral Hub
- High referral centrality and shared patient network
- High disease activity
- Lower publications
- Important for bottom-up activation

4. Community-to-Stroke-Center Bridge
- Connects community hospitals to comprehensive stroke centers
- Medium to high referral counts
- Important for health-system spread

5. Under-engaged High-Value HCP
- High launch relevance or influence
- Low Bayer relationship strength or no recent engagement

6. Emerging Expert
- Recent publication growth
- Co-author links to established KOLs
- Recent trial involvement or conference activity
- Not yet heavily engaged

7. Digital-Responsive Influencer
- Good digital engagement
- Topic affinity to stroke prevention
- Moderate or high launch relevance

## Required health system demo cluster
Create one flagship synthetic IDN called Great Lakes Health Network with:
- 12 to 18 facilities
- 3 to 5 stroke centers
- at least one academic medical center
- at least 150 to 250 HCPs attached
- 4 named hero HCPs used in the demo:
  - Dr. Arun Patel: Scientific KOL
  - Dr. Sarah Lin: Regional Stroke Pathway Influencer
  - Dr. Maria Gomez: Clinical Referral Hub and Community Bridge
  - Dr. Kevin Shaw: Emerging Digital-Responsive Expert

Also create 4 to 6 other synthetic IDNs so the app has enough comparison data.

## Canonical model the app will create later
The generated source data should support the app creating these outputs:

1. canonical_hcp_profile
2. canonical_hco_profile
3. hcp_hco_affiliations
4. hcp_source_crosswalk
5. hcp_scientific_activity
6. hcp_claims_activity
7. hcp_crm_engagement
8. network_edges
9. hcp_archetypes

The script does not need to fully harmonize the data unless asked, but it should create source files with enough structure and realistic imperfection to test harmonization.

## Row count guidance
- HCP master: 900 to 1,300 source rows for 800 to 1,000 unique HCPs
- HCO hierarchy: 60 to 120 HCO rows
- Affiliations: 1,200 to 2,000 rows
- Claims/activity: 700 to 1,100 rows
- Publications/trials: 1,000 to 2,000 rows
- CRM/digital: 500 to 900 rows

## General synthetic data requirements
- Use realistic US-style names, regions, HCO names, specialties, and health-system structures.
- Use deterministic random seed for reproducibility.
- Do not use real patient data or real patient names.
- Keep all patient/activity measures aggregated.
- Save all output Excel files in the same folder as the Python script.
- Also save a README_generated_data.md file explaining the files, known quality issues, and hero HCPs.
