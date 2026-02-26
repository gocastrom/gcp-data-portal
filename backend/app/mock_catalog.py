"""
Mock catalog for MVP (PUBLIC SAFE)
- No credentials
- No real project IDs
- Designed to be replaced by Dataplex/Data Catalog integration

In production, these assets come from:
- Dataplex Catalog (entries / assets)
- BigQuery Information Schema + Data Catalog tags
"""

from typing import Dict, List

# Asset list used by /search
MOCK_ASSETS: List[Dict] = [
    # Retail - Gold
    {
        "display_name": "retail.sales_daily_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.retail.sales_daily_gold",
        "description": "Ventas diarias consolidadas (Gold). KPI ventas, margen, tickets. Fuente oficial para reportería ejecutiva.",
        "domain": "Retail",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "tags": ["gold", "sales", "kpi", "certified"],
    },
    {
        "display_name": "retail.sales_hourly_silver",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.retail.sales_hourly_silver",
        "description": "Ventas por hora (Silver). Base para near-real-time dashboards. Puede contener ajustes intradía.",
        "domain": "Retail",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "tags": ["silver", "sales", "near_real_time"],
    },
    {
        "display_name": "retail.margin_daily_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.retail.margin_daily_gold",
        "description": "Margen diario consolidado (Gold). Costo, venta neta, margen bruto y % margen.",
        "domain": "Retail",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "tags": ["gold", "margin", "finance", "certified"],
    },

    # Inventory
    {
        "display_name": "logistics.inventory_snapshot_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.logistics.inventory_snapshot_gold",
        "description": "Foto diaria inventario (Gold). Stock teórico vs físico. Útil para quiebres y mermas.",
        "domain": "Logistics",
        "data_owner": "log.owner@company.com",
        "data_steward": "log.steward@company.com",
        "tags": ["gold", "inventory", "critical"],
    },
    {
        "display_name": "logistics.stock_movements_silver",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.logistics.stock_movements_silver",
        "description": "Movimientos de stock (Silver). Entradas/salidas, traspasos, ajustes. Base para auditoría operacional.",
        "domain": "Logistics",
        "data_owner": "log.owner@company.com",
        "data_steward": "log.steward@company.com",
        "tags": ["silver", "inventory", "audit"],
    },

    # CRM (PII)
    {
        "display_name": "crm.customers_master",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.crm.customers_master",
        "description": "Maestro de clientes (CRM). Identificadores, atributos y segmentación. Contiene PII (acceso restringido).",
        "domain": "CRM",
        "data_owner": "crm.owner@company.com",
        "data_steward": "crm.steward@company.com",
        "tags": ["master", "customer", "pii", "restricted"],
    },
    {
        "display_name": "crm.customer_segments_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.crm.customer_segments_gold",
        "description": "Segmentación clientes (Gold). RFM, churn risk, cluster. Uso analítico y activación comercial.",
        "domain": "CRM",
        "data_owner": "crm.owner@company.com",
        "data_steward": "crm.steward@company.com",
        "tags": ["gold", "customer", "segmentation"],
    },

    # E-commerce
    {
        "display_name": "ecommerce.orders_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.ecommerce.orders_gold",
        "description": "Órdenes e-commerce (Gold). Estado, canal, método pago, montos. Fuente para KPIs digitales.",
        "domain": "Ecommerce",
        "data_owner": "eco.owner@company.com",
        "data_steward": "eco.steward@company.com",
        "tags": ["gold", "orders", "digital"],
    },
    {
        "display_name": "ecommerce.order_items_silver",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.ecommerce.order_items_silver",
        "description": "Detalle de líneas por orden (Silver). SKU, qty, precio, descuentos. Base para canasta y promociones.",
        "domain": "Ecommerce",
        "data_owner": "eco.owner@company.com",
        "data_steward": "eco.steward@company.com",
        "tags": ["silver", "orders", "items"],
    },

    # Dataplex entry demo
    {
        "display_name": "dataplex.entry.sales_gold",
        "type": "ENTRY",
        "system": "DATAPLEX",
        "linked_resource": "dataplex://demo/lakes/lk1/zones/gold/assets/sales/entries/table",
        "description": "Dataplex entry pointing to sales gold. (Demo de catálogo).",
        "domain": "Retail",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "tags": ["dataplex", "catalog", "entry"],
    },
]

# Schema registry used by /assets/schema (mock)
MOCK_SCHEMAS: Dict[str, Dict] = {
    "bigquery://demo.retail.sales_daily_gold": {
        "table_description": "Gold - Ventas diarias consolidadas. Certificada para reportería corporativa.",
        "columns": [
            {"name": "date", "type": "DATE", "mode": "REQUIRED", "description": "Fecha de negocio (CLT)."},
            {"name": "store_id", "type": "STRING", "mode": "REQUIRED", "description": "Identificador único de local."},
            {"name": "sales_net", "type": "NUMERIC", "mode": "NULLABLE", "description": "Venta neta (sin IVA si aplica)."},
            {"name": "margin_gross", "type": "NUMERIC", "mode": "NULLABLE", "description": "Margen bruto en moneda local."},
            {"name": "tickets", "type": "INT64", "mode": "NULLABLE", "description": "Cantidad de transacciones (boletas)."},
            {"name": "updated_at", "type": "TIMESTAMP", "mode": "NULLABLE", "description": "Última actualización del registro."},
        ],
    },
    "bigquery://demo.retail.sales_hourly_silver": {
        "table_description": "Silver - Ventas por hora para monitoreo intradía.",
        "columns": [
            {"name": "ts_hour", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "Hora truncada."},
            {"name": "store_id", "type": "STRING", "mode": "REQUIRED", "description": "Local."},
            {"name": "sales_net", "type": "NUMERIC", "mode": "NULLABLE", "description": "Venta neta."},
            {"name": "source_system", "type": "STRING", "mode": "NULLABLE", "description": "Sistema origen."},
        ],
    },
    "bigquery://demo.retail.margin_daily_gold": {
        "table_description": "Gold - Margen diario consolidado (certificado).",
        "columns": [
            {"name": "date", "type": "DATE", "mode": "REQUIRED", "description": "Fecha negocio."},
            {"name": "store_id", "type": "STRING", "mode": "REQUIRED", "description": "Local."},
            {"name": "sales_net", "type": "NUMERIC", "mode": "NULLABLE", "description": "Venta neta."},
            {"name": "cost", "type": "NUMERIC", "mode": "NULLABLE", "description": "Costo."},
            {"name": "margin_gross", "type": "NUMERIC", "mode": "NULLABLE", "description": "Margen bruto."},
            {"name": "margin_pct", "type": "FLOAT64", "mode": "NULLABLE", "description": "% margen bruto."},
        ],
    },
    "bigquery://demo.logistics.inventory_snapshot_gold": {
        "table_description": "Gold - Foto diaria inventario por local y SKU.",
        "columns": [
            {"name": "date", "type": "DATE", "mode": "REQUIRED", "description": "Fecha snapshot."},
            {"name": "store_id", "type": "STRING", "mode": "REQUIRED", "description": "Local."},
            {"name": "sku", "type": "STRING", "mode": "REQUIRED", "description": "Código producto."},
            {"name": "stock_theoretical", "type": "NUMERIC", "mode": "NULLABLE", "description": "Stock teórico."},
            {"name": "stock_physical", "type": "NUMERIC", "mode": "NULLABLE", "description": "Stock físico."},
            {"name": "delta", "type": "NUMERIC", "mode": "NULLABLE", "description": "Diferencia físico - teórico."},
        ],
    },
    "bigquery://demo.logistics.stock_movements_silver": {
        "table_description": "Silver - Movimientos de inventario (auditable).",
        "columns": [
            {"name": "ts", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "Timestamp evento."},
            {"name": "store_id", "type": "STRING", "mode": "REQUIRED", "description": "Local."},
            {"name": "sku", "type": "STRING", "mode": "REQUIRED", "description": "Producto."},
            {"name": "movement_type", "type": "STRING", "mode": "REQUIRED", "description": "Tipo movimiento (IN/OUT/ADJ)."},
            {"name": "qty", "type": "NUMERIC", "mode": "NULLABLE", "description": "Cantidad."},
            {"name": "ref_doc", "type": "STRING", "mode": "NULLABLE", "description": "Documento referencia."},
        ],
    },
    "bigquery://demo.crm.customers_master": {
        "table_description": "Master CRM (PII) - Acceso restringido. Uso: analítica de clientes y activación.",
        "columns": [
            {"name": "customer_id", "type": "STRING", "mode": "REQUIRED", "description": "Identificador cliente."},
            {"name": "email", "type": "STRING", "mode": "NULLABLE", "description": "Email (PII)."},
            {"name": "phone", "type": "STRING", "mode": "NULLABLE", "description": "Teléfono (PII)."},
            {"name": "birth_year", "type": "INT64", "mode": "NULLABLE", "description": "Año nacimiento (sensibilidad media)."},
            {"name": "created_at", "type": "TIMESTAMP", "mode": "NULLABLE", "description": "Alta cliente."},
        ],
    },
    "bigquery://demo.crm.customer_segments_gold": {
        "table_description": "Gold - Segmentación clientes (RFM/clusters).",
        "columns": [
            {"name": "customer_id", "type": "STRING", "mode": "REQUIRED", "description": "Cliente."},
            {"name": "segment", "type": "STRING", "mode": "REQUIRED", "description": "Segmento final."},
            {"name": "rfm_score", "type": "STRING", "mode": "NULLABLE", "description": "Score RFM."},
            {"name": "churn_risk", "type": "FLOAT64", "mode": "NULLABLE", "description": "Probabilidad churn (0-1)."},
            {"name": "as_of_date", "type": "DATE", "mode": "REQUIRED", "description": "Fecha de cálculo."},
        ],
    },
    "bigquery://demo.ecommerce.orders_gold": {
        "table_description": "Gold - Órdenes e-commerce para KPIs digitales.",
        "columns": [
            {"name": "order_id", "type": "STRING", "mode": "REQUIRED", "description": "Orden."},
            {"name": "created_at", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "Creación orden."},
            {"name": "status", "type": "STRING", "mode": "REQUIRED", "description": "Estado (CREATED/PAID/SHIPPED/etc.)."},
            {"name": "total_amount", "type": "NUMERIC", "mode": "NULLABLE", "description": "Monto total."},
            {"name": "channel", "type": "STRING", "mode": "NULLABLE", "description": "Canal (web/app)."},
        ],
    },
    "bigquery://demo.ecommerce.order_items_silver": {
        "table_description": "Silver - Detalle ítems por orden.",
        "columns": [
            {"name": "order_id", "type": "STRING", "mode": "REQUIRED", "description": "Orden."},
            {"name": "sku", "type": "STRING", "mode": "REQUIRED", "description": "Producto."},
            {"name": "qty", "type": "INT64", "mode": "NULLABLE", "description": "Cantidad."},
            {"name": "unit_price", "type": "NUMERIC", "mode": "NULLABLE", "description": "Precio unitario."},
            {"name": "discount", "type": "NUMERIC", "mode": "NULLABLE", "description": "Descuento aplicado."},
        ],
    },
    # Dataplex entry mock schema
    "dataplex://demo/lakes/lk1/zones/gold/assets/sales/entries/table": {
        "table_description": "Dataplex entry (demo). En producción, se resuelve hacia el recurso BQ y sus columnas.",
        "columns": [
            {"name": "date", "type": "DATE", "mode": "REQUIRED", "description": "Fecha."},
            {"name": "store_id", "type": "STRING", "mode": "REQUIRED", "description": "Local."},
            {"name": "sales_net", "type": "NUMERIC", "mode": "NULLABLE", "description": "Venta neta."},
        ],
    },
}
