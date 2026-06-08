import { useState, useEffect } from "react";
import { callEdge } from "./supabase";
import { ChatIA } from "./components/ChatIA";
import { ListaCampanhas } from "./components/ListaCampanhas";
import { Megaphone, LayoutGrid, Bot, RefreshCw, Loader2, CheckCircle, X } from "lucide-react";

export type Page     = { id: string; name: string };
export type Campaign = { id: string; name: string; status: string; effective_status: string; objective: string; daily_budget?: string; lifetime_budget?: string; };

export default function App() {
  const [tab,        setTab]        = useState<"ia" | "campanhas">("ia");
  const [campaigns,  setCampaigns]  = useState<Campaign[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [aiReady,    setAiReady]    = useState<boolean | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [health, camps] = await Promise.all([
        callEdge("/health"),
        callEdge("/campaigns"),
      ]);
      setConfigured(health.configured ?? false);
      setAiReady(health.ai_configured ?? false);
      if (camps.campaigns) setCampaigns(camps.campaigns);
      if (camps.error && !camps.not_configured) setError(camps.error);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#f0f0f0", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

      {/* Gradient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "10%", right: "-15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "20%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", background: "rgba(8,8,16,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Megaphone size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.3px" }}>Meta Ads AI</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {aiReady === true && (
            <span style={{ fontSize: 11, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: 6, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Bot size={10} /> IA ativa
            </span>
          )}
          {configured === true && (
            <span style={{ fontSize: 11, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac", borderRadius: 6, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle size={10} /> Meta conectada
            </span>
          )}
          {configured === false && (
            <span style={{ fontSize: 11, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fde68a", borderRadius: 6, padding: "3px 10px" }}>
              Configure os secrets
            </span>
          )}

          <button
            onClick={() => setTab(tab === "campanhas" ? "ia" : "campanhas")}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
              borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: tab === "campanhas" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              color: tab === "campanhas" ? "#a5b4fc" : "#888",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}
          >
            {tab === "campanhas" ? <X size={12} /> : <LayoutGrid size={12} />}
            {tab === "campanhas" ? "Fechar" : "Campanhas"}
            {campaigns.length > 0 && tab !== "campanhas" && (
              <span style={{ background: "rgba(99,102,241,0.3)", color: "#c4b5fd", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>
                {campaigns.length}
              </span>
            )}
          </button>

          <button
            onClick={load}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#666", display: "flex", alignItems: "center" }}
          >
            {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {error && (
          <div style={{ margin: "12px 24px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}
        {tab === "ia" && <ChatIA />}
        {tab === "campanhas" && (
          <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: "24px 24px" }}>
            <ListaCampanhas campaigns={campaigns} loading={loading} onRefresh={load} onCriar={() => setTab("ia")} />
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        textarea:focus { outline: none; }
      `}</style>
    </div>
  );
}