import { useState } from "react";
import CriarCampanha from "./components/CriarCampanha";
import ListaCampanhas from "./components/ListaCampanhas";

type View = "lista" | "criar";

export default function App() {
  const [view, setView] = useState<View>("lista");

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>📣 Meta Ads Manager</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setView("lista")}
            style={{ padding: "8px 16px", cursor: "pointer", fontWeight: view === "lista" ? "bold" : "normal" }}
          >
            Campanhas
          </button>
          <button
            onClick={() => setView("criar")}
            style={{ padding: "8px 16px", cursor: "pointer", fontWeight: view === "criar" ? "bold" : "normal" }}
          >
            + Nova Campanha
          </button>
        </nav>
      </header>

      {view === "lista" && <ListaCampanhas onNovaCampanha={() => setView("criar")} />}
      {view === "criar" && <CriarCampanha onConcluido={() => setView("lista")} />}
    </div>
  );
}
