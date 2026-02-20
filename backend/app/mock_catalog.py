# backend/app/mock_catalog.py

MOCK = [
    {
        "name": "sales_daily_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "resource": "bigquery://demo.retail.sales_daily_gold",
        "description": "Ventas diarias consolidadas (Gold layer)",
        "owner": "data.owner@company.com",
        "domain": "retail"
    },
    {
        "name": "customers_master",
        "type": "TABLE",
        "system": "BIGQUERY",
        "resource": "bigquery://demo.crm.customers_master",
        "description": "Clientes maestros",
        "owner": "crm.owner@company.com",
        "domain": "crm"
    },
    {
        "name": "inventory_stock",
        "type": "TABLE",
        "system": "BIGQUERY",
        "resource": "bigquery://demo.supply.inventory_stock",
        "description": "Stock actual",
        "owner": "supply.owner@company.com",
        "domain": "supply"
    }
]


def search(q: str = ""):
    q = q.lower()
    return [
        x for x in MOCK
        if q in x["name"].lower()
        or q in x["description"].lower()
        or q in x["domain"].lower()
    ]
