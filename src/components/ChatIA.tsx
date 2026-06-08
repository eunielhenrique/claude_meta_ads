import { useState, useRef, useEffect } from "react";
import { callEdge } from "../supabase";
import {
  Send, Loader2, Bot, User, CheckCircle, AlertTriangle,
  TrendingUp, Image, Megaphone, RefreshCw, Sparkles,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: Action[];
  error?: boolean;
}

interface Action {
  tool: string;
  input: any;
  result: any;
}

const TOOL_LABELS: Record<string, string> = {
  get_recent_posts:       "Buscando posts",
  get_campaigns:          "Carregando campanhas",
  get_adsets:             "Carregando conjuntos",
  get_insights:           "Analisando métricas",
  create_campaign:        "Criando campanha",
  create_adset:           "Criando conjunto de anúncios",
  boost_post:             "Patrocinando post",
  update_campaign_status: "Atualizando status",
  update_budget:          "Ajustando orçamento",
};

const SUGGESTIONS = [
  { icon: "📸", text: "Pega os 5 últimos posts do Instagram e patrocina todos com R$ 15/dia cada" },
  { icon: "📊", text: "Quais campanhas estão ativas? Mostra as métricas dos últimos 7 dias" },
  { icon: "🚀", text: "Cria uma campanha de engajamento para o Instagram, orçamento R$ 30/dia, público 25-55 anos" },
  { icon: "⏸️", text: "Pausa todas as campanhas com CPM acima de R$ 20" },
];

export function ChatIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const isLanding = messages.length === 0 && !loading;

  useEffect(() => {
    if (!isLanding) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLanding]);

  useEffect(() => {
    if (isLanding) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isLanding]);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    const claudeMessages = history.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await callEdge("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: claudeMessages }),
      });
      if (res.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Erro: ${res.error}`, error: true }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: res.text, actions: res.actions }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Falha na conexão: ${e.message}`, error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* ── Landing ── */
  if (isLanding) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 56px)" }}>

        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", marginBottom: 24 }}>
            <Sparkles size={13} color="#a5b4fc" />
            <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 500 }}>Powered by Claude AI</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-1.5px", background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Meta Ads com IA
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
            Crie campanhas, patrocine posts e otimize resultados.<br />Basta descrever o que você quer.
          </p>
        </div>

        {/* Big input */}
        <div style={{ width: "100%", maxWidth: 680, marginBottom: 20 }}>
          <div style={{ borderRadius: 16, padding: 1, background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(236,72,153,0.3), rgba(59,130,246,0.4))" }}>
            <div style={{ borderRadius: 15, background: "rgba(12,12,20,0.95)", padding: "16px 20px 12px" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ex: Pega os 10 últimos posts do Instagram e patrocina todos com R$ 20/dia cada..."
                rows={3}
                style={{ width: "100%", border: "none", background: "transparent", color: "#f0f0f0", fontSize: 15, lineHeight: 1.6, resize: "none", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Enter para enviar · Shift+Enter nova linha</span>
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
                    borderRadius: 10, border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
                    background: input.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)",
                    color: input.trim() ? "#fff" : "#555", fontSize: 13, fontWeight: 600,
                  }}
                >
                  <Send size={14} /> Enviar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion cards */}
        <div style={{ width: "100%", maxWidth: 680, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s.text)}
              style={{
                textAlign: "left", padding: "12px 14px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12, lineHeight: 1.4,
                display: "flex", gap: 8, alignItems: "flex-start",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.2)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
              {s.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Chat ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: msg.role === "assistant" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                {msg.role === "assistant" ? <Bot size={15} color="#fff" /> : <User size={15} color="#aaa" />}
              </div>

              <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : msg.error ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                  border: msg.error ? "1px solid rgba(239,68,68,0.3)" : msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  fontSize: 14, lineHeight: 1.65, color: msg.error ? "#fca5a5" : "#f0f0f0",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {msg.actions.map((a, j) => <ActionBadge key={j} action={a} />)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={15} color="#fff" />
              </div>
              <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.2s ease-in-out 0s infinite" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", animation: "pulse 1.2s ease-in-out 0.3s infinite" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "pulse 1.2s ease-in-out 0.6s infinite" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", backdropFilter: "blur(20px)", background: "rgba(8,8,16,0.8)", flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ borderRadius: 14, padding: 1, background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25), rgba(59,130,246,0.3))" }}>
            <div style={{ borderRadius: 13, background: "rgba(12,12,20,0.98)", padding: "12px 16px 10px" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Diga o que quer fazer com suas campanhas..."
                rows={2}
                disabled={loading}
                style={{
                  width: "100%", border: "none", background: "transparent",
                  color: "#f0f0f0", fontSize: 14, lineHeight: 1.55,
                  resize: "none", fontFamily: "inherit", opacity: loading ? 0.4 : 1,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Enter · Shift+Enter nova linha</span>
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
                    borderRadius: 8, border: "none",
                    cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    background: input.trim() && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)",
                    color: input.trim() && !loading ? "#fff" : "#444",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                  {loading ? "Processando..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

/* ── ActionBadge ── */
function ActionBadge({ action }: { action: Action }) {
  const [open, setOpen] = useState(false);
  const label = TOOL_LABELS[action.tool] ?? action.tool;
  const ok    = !action.result?.error;

  const getIcon = () => {
    if (!ok)                                return <AlertTriangle size={10} />;
    if (action.tool === "get_recent_posts") return <Image size={10} />;
    if (action.tool.includes("campaign"))   return <Megaphone size={10} />;
    if (action.tool.includes("insight"))    return <TrendingUp size={10} />;
    if (action.tool === "boost_post")       return <Megaphone size={10} />;
    if (action.tool.includes("update"))     return <RefreshCw size={10} />;
    return <CheckCircle size={10} />;
  };

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20, border: "none", cursor: "pointer",
        background: ok ? "rgba(99,102,241,0.12)" : "rgba(239,68,68,0.1)",
        color: ok ? "#a5b4fc" : "#fca5a5", fontSize: 11, fontWeight: 500,
      }}>
        {getIcon()} {label} {ok ? "✓" : "✗"}
        <span style={{ opacity: 0.4 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <pre style={{ marginTop: 4, padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.35)", overflowX: "auto", maxHeight: 200, lineHeight: 1.5 }}>
          {JSON.stringify({ input: action.input, result: action.result }, null, 2)}
        </pre>
      )}
    </div>
  );
}
