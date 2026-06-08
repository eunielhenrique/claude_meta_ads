# Meta Ads Manager

Aplicação React + Supabase Edge Function para gerenciar campanhas do Meta Ads com Claude AI.

## Estrutura

```
├── src/
│   ├── App.tsx                    # App principal com navegação
│   ├── supabase.ts                # Cliente Supabase + helper callEdge
│   ├── main.tsx                   # Entry point React
│   └── components/
│       ├── CriarCampanha.tsx      # Wizard 4 passos para criar campanha
│       └── ListaCampanhas.tsx     # Lista campanhas com pause/ativar
├── supabase/
│   └── functions/
│       └── claude_meta_ads/
│           └── index.ts           # Edge Function com agentic loop Claude
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Configuração

### 1. Frontend

```bash
npm install
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase
npm run dev
```

Variáveis de ambiente (`.env.local`):
```
VITE_SUPABASE_URL=https://obeylqdqvyqezzfnvozl.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### 2. Edge Function

```bash
# Deploy da Edge Function
supabase functions deploy claude_meta_ads --project-ref obeylqdqvyqezzfnvozl
```

Secrets necessários no Supabase:
```
META_AD_ACCOUNT_ID = act_XXXXXXXXXXXXXXX
META_ACCESS_TOKEN  = seu_token_meta
ANTHROPIC_API_KEY  = sua_chave_anthropic
```

## Funcionalidades

- **Criar Campanha** — wizard 4 passos: objetivo → orçamento → público → criativos
- **Listar Campanhas** — tabela com status, orçamento e botão pause/ativar
- **Edge Function** — agentic loop com Claude Opus, ferramentas Meta API
