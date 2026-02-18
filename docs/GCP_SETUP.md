# GCP Setup (MVP)
1) Enable APIs:
- Dataplex API (catalog search)
- (Optional) BigQuery API (preview)

2) Create Service Account (optional for local):
- roles/dataplex.viewer
- (Optional) roles/bigquery.jobUser

3) Local auth options:
A) ADC (recommended):
   gcloud auth application-default login
B) Service account JSON (NOT committed):
   backend/keys/service-account.json
   export GOOGLE_APPLICATION_CREDENTIALS=backend/keys/service-account.json
