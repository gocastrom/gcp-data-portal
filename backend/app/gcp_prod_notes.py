"""
GCP Production Notes (NO se usa en MVP)

Este archivo existe para que el repo quede auto-documentado.

## 1) Auth (IAP)
- leer headers: X-Goog-Authenticated-User-Email
- mapear roles desde Google Groups

## 2) Dataplex
- usar google-cloud-dataplex
- buscar assets reales en el catalog:
  client.search_entries(query="sales")

## 3) BigQuery Preview
- usar google-cloud-bigquery
- obtener schema y sample rows
- OJO: si usuario no tiene permisos, NO devolver datos
- ideal: preview solo schema + metadata

## 4) IAM Grants
Al aprobar request:
- llamar BigQuery IAM Policy update
- registrar auditoría (quién aprobó + cuándo + qué rol)

No subir credenciales al repo.
Usar Workload Identity / Cloud Run SA.
"""
