import { useMemo, useState } from "react";
import Search from "./pages/Search.jsx";
import Asset from "./pages/Asset.jsx";
import RequestAccess from "./pages/RequestAccess.jsx";
import Approvals from "./pages/Approvals.jsx";

function Nav({ route, setRoute }) {
  const items = [
    { key: "search", label: "Search" },
    { key: "approvals", label: "Approvals" }
  ];

  return (
    <div className="nav">
      {items.map((it) => (
        <a
          key={it.key}
          href="#"
          className={route === it.key ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            setRoute(it.key);
          }}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState("search");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const page = useMemo(() => {
    if (route === "search") {
      return (
        <Search
          onSelect={(asset) => {
            setSelectedAsset(asset);
            setRoute("asset");
          }}
        />
      );
    }
    if (route === "asset") {
      return (
        <Asset
          asset={selectedAsset}
          onBack={() => setRoute("search")}
          onRequest={() => setRoute("request")}
        />
      );
    }
    if (route === "request") {
      return (
        <RequestAccess
          asset={selectedAsset}
          onBack={() => setRoute("asset")}
          onDone={() => setRoute("approvals")}
        />
      );
    }
    if (route === "approvals") {
      return <Approvals />;
    }
    return null;
  }, [route, selectedAsset]);

  return (
    <div className="container">
      <h1>GCP Data Portal (MVP)</h1>
      <p style={{ opacity: 0.7, marginTop: -8 }}>
        Search assets · Request access · Approvals workflow
      </p>

      <Nav route={route} setRoute={setRoute} />

      <div className="card">{page}</div>
    </div>
  );
}
