import { useState } from "react";
import { callEdge } from "../supabase";

interface Props {
  onConcluido: () => void;
}

interface FormData {
  objetivo: string;
  nome: string;
  orcamentoDiario: string;
  publicoIdade: string;
  publicoInteresses: string;
  criativos: string;
}

const PASSOS = ["Objetivo", "Orçamento", "Público", "Criativos"];

const initialForm: FormData = {
  objetivo: "LINK_CLICKS",
  nome: "",
  orcamentoDiario: "50",
  publicoIdade: "18-65",
  publicoInteresses: "",
  criativos: "",
};

export default function CriarCampanha({ onConcluido }: Props) {
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resposta, setResposta] = useState<string | null>(null);

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setErro(null);
    try {
      const result = await callEdge<{ message: string }>("claude_meta_ads", {
        action: "criar_campanha",
        campanha: form,
      });
      setResposta(result.message);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (resposta) {
    return (
      <div style={{ padding: 24, background: "#f0fdf4", borderRadius: 8 }}>
        <h2 style={{ color: "#16a34a" }}>Campanha criada com sucesso!</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{resposta}</pre>
        <button onClick={onConcluido} style={{ marginTop: 16, padding: "10px 20px" }}>
          Ver Campanhas
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {PASSOS.map((label, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "8px 0",
              textAlign: "center",
              fontSize: 13,
              background: i === passo ? "#3b82f6" : i < passo ? "#bfdbfe" : "#f1f5f9",
              color: i === passo ? "#fff" : "#374151",
              borderRadius: 6,
              fontWeight: i === passo ? "bold" : "normal",
            }}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {passo === 0 && (
        <Passo titulo="Objetivo da Campanha">
          <label>Nome da campanha</label>
          <input
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Ex: Promoção Verão 2025"
            style={inputStyle}
          />
          <label>Objetivo</label>
          <select value={form.objetivo} onChange={(e) => set("objetivo", e.target.value)} style={inputStyle}>
            <option value="LINK_CLICKS">Cliques no link</option>
            <option value="CONVERSIONS">Conversões</option>
            <option value="REACH">Alcance</option>
            <option value="BRAND_AWARENESS">Reconhecimento de marca</option>
            <option value="VIDEO_VIEWS">Visualizações de vídeo</option>
          </select>
        </Passo>
      )}

      {passo === 1 && (
        <Passo titulo="Orçamento">
          <label>Orçamento diário (R$)</label>
          <input
            type="number"
            value={form.orcamentoDiario}
            onChange={(e) => set("orcamentoDiario", e.target.value)}
            min="6"
            style={inputStyle}
          />
        </Passo>
      )}

      {passo === 2 && (
        <Passo titulo="Segmentação de Público">
          <label>Faixa etária</label>
          <input
            value={form.publicoIdade}
            onChange={(e) => set("publicoIdade", e.target.value)}
            placeholder="Ex: 18-45"
            style={inputStyle}
          />
          <label>Interesses (separados por vírgula)</label>
          <textarea
            value={form.publicoInteresses}
            onChange={(e) => set("publicoInteresses", e.target.value)}
            placeholder="Ex: tecnologia, moda, viagens"
            rows={3}
            style={inputStyle}
          />
        </Passo>
      )}

      {passo === 3 && (
        <Passo titulo="Criativos">
          <label>Descreva o anúncio para o Claude criar</label>
          <textarea
            value={form.criativos}
            onChange={(e) => set("criativos", e.target.value)}
            placeholder="Ex: Anúncio de desconto de 30% para tênis esportivos, tom animado e jovem"
            rows={5}
            style={inputStyle}
          />
        </Passo>
      )}

      {erro && <p style={{ color: "#dc2626", marginTop: 12 }}>{erro}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button
          onClick={() => setPasso((p) => p - 1)}
          disabled={passo === 0}
          style={{ padding: "10px 20px", opacity: passo === 0 ? 0.4 : 1 }}
        >
          Voltar
        </button>
        {passo < PASSOS.length - 1 ? (
          <button
            onClick={() => setPasso((p) => p + 1)}
            disabled={passo === 0 && !form.nome}
            style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Próximo
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6 }}
          >
            {loading ? "Criando..." : "Criar Campanha"}
          </button>
        )}
      </div>
    </div>
  );
}

function Passo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>{titulo}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};
