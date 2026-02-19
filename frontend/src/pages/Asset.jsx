import Badge from "../components/Badge.jsx";

export default function Asset({ asset, onBack, onRequest }) {
  if (!asset) {
    return (
      <div>
        <p>No asset selected.</p>
        <button className="secondary" onClick={onBack}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{asset.display_name}</h2>
        <div className="row">
          <Badge>{asset.integrated_system}</Badge>
          <Badge>{asset.type}</Badge>
        </div>
      </div>

      <p style={{ opacity: 0.8 }}>{asset.description || "No description"}</p>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ opacity: 0.8, marginBottom: 6 }}>Linked resource</div>
        <div className="mono">{asset.linked_resource}</div>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="secondary" onClick={onBack}>Back</button>
        <button onClick={onRequest}>Request Access</button>
      </div>
    </div>
  );
}
