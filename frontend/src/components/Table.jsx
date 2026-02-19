export default function Table({ columns, rows, onRowClick }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr
            key={idx}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
            onClick={() => onRowClick && onRowClick(r)}
          >
            {columns.map((c) => (
              <td key={c.key}>{r[c.key]}</td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} style={{ opacity: 0.7 }}>
              No results
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
