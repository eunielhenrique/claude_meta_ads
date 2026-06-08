import { useState } from "react";
import { callEdge } from "../supabase";
import { Play, Pause, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { Campaign } from "../App";

interface Props {
  campaigns: Campaign[];
  loading: boolean;
  onRefresh: () => void;
  onCriar: () => void;
}

export function ListaCampanhas({ campaigns, loading, onRefresh, onCriar }: Props) {
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleStatus(campaign: Campaign) {
    setToggling(campaign.id);
    try {
      const isAct = campaign.status === "ACTIVE" || campaign.effective_status === "ACTIVE";
      const novoStatus = isAct ? "PAUSED" : "ACTIVE";
      await callEdge("/campaigns/status", {
        campaign_id: campaign.id,
        status: novoStatus,
      });
      onRefresh();
    } catch (e: any) {
      alert(e.message ?? "Erro ao alterar status");
    } finally {
      setToggling(null);
    }
  }

  if (campaigns.length === 0 && !loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 40px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, backdropFilter: "blur(10px)" }}>
        <AlertCircle size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 24, fontSize: 15 }}>Nenhuma campanha encontrada na sua conta de anúncios.</p>
        <button
          onClick={onCriar}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          <Plus size={16} /> Criar primeira campanha
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(10px)" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Campanhas no Meta Ads</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{campaigns.length} campanha(s) detectada(s)</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer" }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Atualizar
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th style={th}>Nome</th>
              <th style={th}>Objetivo</th>
              <th style={th}>Orçamento</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const isAct = c.status === "ACTIVE" || c.effective_status === "ACTIVE";
              const budget = c.daily_budget ? `R$ ${(Number(c.daily_budget) / 100).toFixed(2)}/dia` : c.lifetime_budget ? `R$ ${(Number(c.lifetime_budget) / 100).toFixed(2)} total` : "N/A";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.01)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={td}>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{c.name}</span>
                    <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>ID: {c.id}</span>
                  </td>
                  <td style={td}>
                    <span style={{ textTransform: "capitalize", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                      {c.objective.toLowerCase().replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={td}>{budget}</td>
                  <td style={td}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: isAct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: isAct ? "#86efac" : "#fca5a5"
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isAct ? "#22c55e" : "#ef4444" }} />
                      {isAct ? "Ativa" : "Pausada"}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button
                      onClick={() => toggleStatus(c)}
                      disabled={toggling === c.id}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer",
                        background: isAct ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                        color: isAct ? "#fca5a5" : "#86efac"
                      }}
                    >
                      {toggling === c.id ? (
                        <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                      ) : isAct ? (
                        <Pause size={12} />
                      ) : (
                        <Play size={12} />
                      )}
                      {toggling === c.id ? "Ajustando..." : isAct ? "Pausar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "14px 20px",
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  fontSize: 12,
};

const td: React.CSSProperties = {
  padding: "16px 20px",
  color: "rgba(255,255,255,0.8)",
  verticalAlign: "middle",
};
