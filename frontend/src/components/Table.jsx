export default function Table({ columns, rows, onRowClick }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: "12px 10px",
                  borderBottom: "1px solid #eee",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={idx}
              style={{
                cursor: onRowClick ? "pointer" : "default",
                borderBottom: "1px solid #f2f2f2",
              }}
              onClick={() => onRowClick && onRowClick(r)}
            >
              {columns.map((c) => {
                // Acciones: evita wrap y alinea a la derecha (aunque el row traiga un <div flex>)
                const isActions = c.key === "_actions" || c.key === "actions";

                return (
                  <td
                    key={c.key}
                    style={{
                      padding: "12px 10px",
                      verticalAlign: "top",
                      whiteSpace: isActions ? "nowrap" : "normal",
                      textAlign: isActions ? "right" : "left",
                      minWidth: isActions ? 220 : undefined,
                    }}
                  >
                    {r[c.key]}
                  </td>
                );
              })}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ opacity: 0.7, padding: "12px 10px" }}>
                No results
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
