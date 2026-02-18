# GCP Data Portal (Open Source MVP)

A simple Data Portal to discover, request, and manage access to data assets in Google Cloud Platform.

## Features

- Natural language search across data assets
- Browse datasets, tables, and storage objects
- Request access workflow
- Approval workflow (Data Owner, Data Steward, IT Owner)
- IAM access provisioning (stub / extensible)

## Architecture

Backend:
- Python
- FastAPI
- Google Cloud Data Catalog / Dataplex integration

Frontend:
- React (Vite)

Infrastructure:
- Designed for Cloud Run deployment

## Security

This repository contains NO credentials.

Authentication methods supported:

Option 1 (recommended):
Application Default Credentials

Option 2:
Service Account JSON (local only, never committed)

## Project Structure

backend/
frontend/
docs/

## Status

MVP – extensible for enterprise Data Governance platforms

## License

MIT License
