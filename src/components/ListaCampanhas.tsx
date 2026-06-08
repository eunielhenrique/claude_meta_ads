import { useEffect, useState, useCallback } from "react";
import { callEdge } from "../supabase";

interface Campanha {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  daily_budget: string;
  objective: string;
}

interface Props {
  onNovaCampanha: () => void;
}

export default function ListaCampanhas({ onNovaCampanha }: Props) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const result = await callEdge<{ campanhas: Campanha[] }>("claude_meta_ads", {
        action: "listar_campanhas",
      });
      setCampanhas(result.campanhas ?? []);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function toggleStatus(campanha: Campanha) {
    setToggling(campanha.id);
    try {
      const novoStatus = campanha.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      await callEdge("claude_meta_ads", {
        action: "atualizar_status",
        campanhaId: campanha.id,
        status: novoStatus,
      });
      await carregar();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggling(null);
    }
  }

  if (loading) return <p>Carregando campanhas...</p>;
  if (erro) return <p style={{ color: "#dc2626" }}>Erro: {erro}</p>;

  if (campanhas.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48, background: "#f8fafc", borderRadius: 8 }}>
        <p style={{ color: "#64748b", marginBottom: 16 }}>Nenhuma campanha encontrada.</p>
        <button
          onClick={onNovaCampanha}
          style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          Criar primeira campanha
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, color: "#64748b" }}>{campanhas.length} campanha(s)</p>
        <button onClick={carregar} style={{ padding: "6px 12px", fontSize: 13 }}>
          Atualizar
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={th}>Nome</th>
            <th style={th}>Objetivo</th>
            <th style={th}>Orçamento/dia</th>
            <th style={th}>Status</th>
            <th style={th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {campanhas.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={td}>{c.name}</td>
              <td style={td}>{c.objective}</td>
              <td style={td}>R$ {(Number(c.daily_budget) / 100).toFixed(2)}</td>
              <td style={td}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    background: c.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                    color: c.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {c.status === "ACTIVE" ? "Ativa" : "Pausada"}
                </span>
              </td>
              <td style={td}>
                <button
                  onClick={() => toggleStatus(c)}
                  disabled={toggling === c.id}
                  style={{ padding: "5px 10px", fontSize: 12, cursor: "pointer" }}
                >
                  {toggling === c.id
                    ? "..."
                    : c.status === "ACTIVE"
                    ? "Pausar"
                    : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 600,
  color: "#374151",
};

const td: React.CSSProperties = {
  padding: "12px 14px",
  color: "#374151",
};
