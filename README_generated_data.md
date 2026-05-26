# Generated synthetic data

Deterministic synthetic data for the HCP Network Intelligence demo. Seed = 42.

## Files

- **IQVIA_HCP_Master.xlsx** — 894 rows × 18 cols, quality score 78
- **Definitive_HCO_IDN_Hierarchy.xlsx** — 73 rows × 16 cols, quality score 84
- **HCP_HCO_Affiliations.xlsx** — 1758 rows × 12 cols, quality score 72
- **Claims_Stroke_TIA_Activity.xlsx** — 608 rows × 16 cols, quality score 76
- **Publications_Trials_Scientific_Activity.xlsx** — 1388 rows × 14 cols, quality score 68
- **CRM_Digital_Engagement.xlsx** — 540 rows × 15 cols, quality score 70

## Known data quality issues (intentional)

- Duplicate HCP rows and shortened name variants in IQVIA master (hero HCPs get extra variants).
- 3% missing NPI in HCP master, 10% missing NPI in CRM, ~35% missing matched_npi in publications.
- 8% missing stroke center level in HCO hierarchy; 6% legacy parent IDN string mismatches.
- Conflicting primary affiliation flags (~8% of secondary affiliations marked primary).
- 25% of secondary affiliations are stale (end_date set).
- Claims lag of 45-180 days; 10% of claims rows missing HCO attribution.
- Publications include messy institution strings, missing topic tags, and trial role variants.
- 20 duplicate CRM contacts on a legacy ACCTDUP account.

## Hero HCPs

- Dr. Arun Patel - Scientific KOL (Great Lakes Health Network UMC, OH)
- Dr. Sarah Lin - Regional Stroke Pathway Influencer (GLHN Lakeside Hospital, OH)
- Dr. Maria Gomez - Clinical Referral Hub + Community-to-Stroke-Center Bridge (Mercy Acute GLHN, OH)
- Dr. Kevin Shaw - Emerging Digital-Responsive Expert (GLHN Riverside Hospital, MI)

## Hero IDN

Great Lakes Health Network: 1 academic medical center + 15 hospitals/clinics, 3 stroke centers, ~150-200 affiliated HCPs.

## How these support the app

Each source carries useful but incomplete truth. The app must combine IQVIA identity, Definitive hierarchy, claims activity, publications, and CRM engagement to classify archetypes, build the network graph, and surface launch actions. No single file gives the full picture.
