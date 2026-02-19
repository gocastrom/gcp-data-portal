# GCP Setup (Public)

This repo contains no credentials. You must configure your own GCP project.

## 1) Enable APIs
- Dataplex API
- BigQuery API

## 2) Create Service Account
Example: data-portal-sa

## 3) Grant minimal roles
For search (Dataplex Universal Catalog):
- Dataplex Viewer (or equivalent permissions to search entries)

For BigQuery preview:
- BigQuery Job User
- BigQuery Data Viewer (on datasets you want to preview)

For provisioning (optional):
- BigQuery Admin OR a limited custom role to edit dataset access entries

## 4) Local auth
Create backend/.env with:

GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=./keys/service-account.json
CATALOG_PROVIDER=dataplex
ENABLE_PROVISIONING=false
PORT=8000

Never commit:
- backend/.env
- backend/keys/service-account.json
