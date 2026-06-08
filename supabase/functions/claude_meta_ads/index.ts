import Anthropic from "npm:@anthropic-ai/sdk";

const META_API_BASE = "https://graph.facebook.com/v20.0";

const ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const AD_ACCOUNT_ID = Deno.env.get("META_AD_ACCOUNT_ID") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

// ── Meta API helpers ─────────────────────────────────────────────────────────

async function metaGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${META_API_BASE}${path}`);
  url.searchParams.set("access_token", ACCESS_TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function metaPost(path: string, body: Record<string, unknown>) {
  const url = `${META_API_BASE}${path}?access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Claude tool definitions ───────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "listar_campanhas",
    description: "Lista todas as campanhas da conta de anúncios do Meta.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "PAUSED", "ALL"],
          description: "Filtrar pelo status",
        },
      },
      required: [],
    },
  },
  {
    name: "criar_campanha",
    description: "Cria uma nova campanha no Meta Ads.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome: { type: "string", description: "Nome da campanha" },
        objetivo: {
          type: "string",
          enum: ["LINK_CLICKS", "CONVERSIONS", "REACH", "BRAND_AWARENESS", "VIDEO_VIEWS"],
          description: "Objetivo de marketing",
        },
        orcamento_diario_centavos: {
          type: "number",
          description: "Orçamento diário em centavos (ex: 5000 = R$50)",
        },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"], description: "Status inicial" },
      },
      required: ["nome", "objetivo", "orcamento_diario_centavos"],
    },
  },
  {
    name: "atualizar_status_campanha",
    description: "Pausa ou ativa uma campanha existente.",
    input_schema: {
      type: "object" as const,
      properties: {
        campanha_id: { type: "string", description: "ID da campanha" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"], description: "Novo status" },
      },
      required: ["campanha_id", "status"],
    },
  },
  {
    name: "buscar_insights",
    description: "Busca métricas de desempenho de uma campanha.",
    input_schema: {
      type: "object" as const,
      properties: {
        campanha_id: { type: "string", description: "ID da campanha" },
        periodo: {
          type: "string",
          enum: ["today", "yesterday", "last_7d", "last_30d"],
          description: "Período dos dados",
        },
      },
      required: ["campanha_id"],
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "listar_campanhas": {
      const status = (input.status as string) ?? "ALL";
      const filter = status === "ALL" ? {} : { effective_status: `["${status}"]` };
      const data = await metaGet(`/${AD_ACCOUNT_ID}/campaigns`, {
        fields: "id,name,status,daily_budget,objective",
        ...filter,
      });
      return JSON.stringify(data.data ?? []);
    }

    case "criar_campanha": {
      const data = await metaPost(`/${AD_ACCOUNT_ID}/campaigns`, {
        name: input.nome,
        objective: input.objetivo,
        daily_budget: input.orcamento_diario_centavos,
        status: input.status ?? "PAUSED",
        special_ad_categories: [],
      });
      return JSON.stringify(data);
    }

    case "atualizar_status_campanha": {
      const data = await metaPost(`/${input.campanha_id}`, { status: input.status });
      return JSON.stringify(data);
    }

    case "buscar_insights": {
      const data = await metaGet(`/${input.campanha_id}/insights`, {
        fields: "impressions,clicks,spend,ctr,cpc,reach",
        date_preset: (input.periodo as string) ?? "last_7d",
      });
      return JSON.stringify(data.data ?? []);
    }

    default:
      return JSON.stringify({ error: `Ferramenta desconhecida: ${name}` });
  }
}

// ── Agentic loop ──────────────────────────────────────────────────────────────

async function runAgent(userMessage: string): Promise<string> {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];

  for (let round = 0; round < 10; round++) {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system:
        "Você é um especialista em Meta Ads. Use as ferramentas disponíveis para ajudar o usuário a gerenciar campanhas de anúncios. Responda sempre em português.",
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock ? (textBlock as Anthropic.TextBlock).text : "Concluído.";
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: await executeTool(block.name, block.input as Record<string, unknown>),
        }))
      );

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return "Limite de iterações atingido.";
}

// ── Edge Function handler ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json() as {
      action: string;
      campanha?: Record<string, unknown>;
      campanhaId?: string;
      status?: string;
    };

    let prompt = "";

    switch (body.action) {
      case "listar_campanhas":
        prompt = "Liste todas as campanhas da minha conta de anúncios e apresente um resumo organizado.";
        break;

      case "criar_campanha": {
        const c = body.campanha ?? {};
        const orcamentoCentavos = Math.round(Number(c.orcamentoDiario ?? 50) * 100);
        prompt =
          `Crie uma campanha com as seguintes especificações:
          - Nome: ${c.nome}
          - Objetivo: ${c.objetivo}
          - Orçamento diário: R$ ${c.orcamentoDiario} (${orcamentoCentavos} centavos)
          - Faixa etária do público: ${c.publicoIdade}
          - Interesses: ${c.publicoInteresses}
          - Descrição dos criativos: ${c.criativos}

          Crie a campanha como PAUSED inicialmente e confirme os detalhes.`;
        break;
      }

      case "atualizar_status":
        prompt = `Atualize o status da campanha ${body.campanhaId} para ${body.status} e confirme a alteração.`;
        break;

      default:
        prompt = body.action;
    }

    const message = await runAgent(prompt);

    // Para listar_campanhas, buscar os dados brutos também
    let campanhas: unknown[] = [];
    if (body.action === "listar_campanhas") {
      try {
        const data = await metaGet(`/${AD_ACCOUNT_ID}/campaigns`, {
          fields: "id,name,status,daily_budget,objective",
        });
        campanhas = data.data ?? [];
      } catch (_) {
        // retorna apenas a mensagem do Claude se a API falhar
      }
    }

    return new Response(
      JSON.stringify({ message, campanhas }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
