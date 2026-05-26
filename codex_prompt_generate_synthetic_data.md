# Codex prompt: generate synthetic data files for HCP network intelligence demo

You are working in a folder that contains `synthetic_data_context.md`. Read that file first and follow it exactly.

Your task:

1. Write a Python script named `generate_synthetic_hcp_network_data.py` in the current folder.
2. The script must generate all synthetic Excel files described in `synthetic_data_context.md`.
3. Run the script and save the generated Excel files in the same folder as this prompt and context file.
4. Also generate `README_generated_data.md` with a concise description of the generated files, known data quality issues, hero HCPs, and how these files support the HCP network intelligence app.

Technical requirements:

- Use Python 3.
- Use pandas and openpyxl for Excel writing.
- Use only deterministic synthetic data. Set a random seed.
- Do not use real patient data.
- Patient-related data must be aggregate counts only.
- Make the output realistic enough to test identity resolution, fuzzy matching, source profiling, AutoMap, canonical model creation, network graph edges, filters, and 2x2 archetype views.
- Include intentional data quality issues described in the context file. Do not make the files too clean.
- Keep column names exactly as specified in the context file unless adding extra helper columns improves the demo.

Important design requirements:

- Include the flagship IDN `Great Lakes Health Network`.
- Include hero HCPs:
  - Dr. Arun Patel: Scientific KOL
  - Dr. Sarah Lin: Regional Stroke Pathway Influencer
  - Dr. Maria Gomez: Clinical Referral Hub and Community Bridge
  - Dr. Kevin Shaw: Emerging Digital-Responsive Expert
- The files must make these archetypes discoverable by combining columns across datasets, not by putting the final archetype directly into every source file.
- Some source files may include hints, such as title, role, publication count, claims volume, referral counts, CRM engagement, but the app should need to combine them to classify the HCPs.

Expected output files:

1. `IQVIA_HCP_Master.xlsx`
2. `Definitive_HCO_IDN_Hierarchy.xlsx`
3. `HCP_HCO_Affiliations.xlsx`
4. `Claims_Stroke_TIA_Activity.xlsx`
5. `Publications_Trials_Scientific_Activity.xlsx`
6. `CRM_Digital_Engagement.xlsx`
7. `README_generated_data.md`
8. `generate_synthetic_hcp_network_data.py`

Suggested implementation approach:

- Create a pool of synthetic HCPs with NPIs, names, specialties, state, and HCO affiliations.
- Create HCOs and IDNs first, including Great Lakes Health Network and several other synthetic IDNs.
- Assign HCPs to HCOs, allowing multiple affiliations.
- Generate claims/activity aggregates based on HCP role and specialty.
- Generate publications/trials by topic and HCP type.
- Generate CRM/digital engagement with realistic gaps and duplicates.
- Intentionally inject realistic data quality issues:
  - duplicate HCP rows
  - missing NPIs
  - name variants
  - hospital aliases
  - conflicting primary affiliations
  - missing stroke center values
  - publication author rows without NPI
  - stale CRM engagements
  - claims lag
  - billing/treating ambiguity
- Write each DataFrame to a separate Excel file.
- Format Excel headers, freeze panes, and auto-size columns where practical.

After generating files, print a short summary:

- number of rows per file
- number of unique HCPs
- number of HCOs
- number of records with injected quality issues
- location of generated files

Do not build the app in this step. Only create the synthetic data generation script and generated Excel files.
