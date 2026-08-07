# Recadastramento HARF 2026

Sistema para militares do Hospital de Aeronáutica de Recife preencherem o Termo de Compromisso, selecionarem setor/pastas AD e gerarem PDF para impressão e assinatura do chefe.

## Stack

- Next.js 15 (App Router) + TypeScript
- Postgres (Supabase em produção; Docker local opcional)
- Prisma ORM
- Auth.js (credentials) — **login = senha = SARAM** (conveniência, não segurança forte)
- `pdf-lib` — Termo de Compromisso + Termo de Responsabilidade + anexo AD


## Pré-requisitos

1. Node.js 20+
2. Projeto Supabase **ou** Docker Desktop para Postgres local
3. Arquivos em `data/`:
   - `setores.csv`, `grupos.csv`
   - `TERMO DE COMPROMISSO 2026_rotated.pdf`
   - `TERMO DE RESPONSABILIDADE.pdf`
   - `Efetivo Geral 21.07.2026.ods` (não versionar em repo público)


## Configuração

```bash
cp .env.example .env
```

### Opção A — Supabase

1. Crie um projeto em https://supabase.com
2. Em **Settings → Database**, copie:
   - **Transaction pooler** → `DATABASE_URL` (porta 6543, com `?pgbouncer=true`)
   - **Direct** → `DIRECT_URL` (porta 5432)
3. Defina `AUTH_SECRET` (`openssl rand -base64 32`)
4. Defina `ADMIN_PASSWORD` (senha forte do admin)

### Opção B — Postgres local (Docker)

```bash
docker compose up -d
```

No `.env`:

## Setup do banco e dados

```bash
npm install
npx prisma migrate dev --name init
npm run seed:admin
npm run import:efetivo
npm run dev
```

- App: http://localhost:3000  
- Login militar: SARAM / SARAM  
- Login admin: `admin` / senha do `.env`

## Fluxos

### Militar

1. Login com SARAM  
2. Confirma identificação  
3. Preenche status, e-mail, setor, pastas  
4. Salva → baixa PDF (`/api/pdf`)  
5. Imprime → assinatura do chefe → entrega ao TI  

### TI / Admin

- Dashboard: totais, enviados, pendentes  
- Export canônico para script AD:
  - `/api/admin/export?format=csv`
  - `/api/admin/export?format=json`

Formato CSV (`;`):

```text
situacao;saram;nome;posto_grad;source_sheet;status;status_label;setor_ad;pastas_ad;email;telefone;submitted_at
```

`pastas_ad` usa `|` como separador. O script AD futuro deve consumir **só este export** (não conectar no Supabase).

Filtros opcionais na URL (mesmos da tela admin):

- `view=enviados|pendentes|todos` (padrão na API: `enviados`)
- `posto=` posto/graduação exato (ex.: `1S`)
- `q=` busca textual (nome, SARAM, setor)

Exemplos:

- `/api/admin/export?format=csv&view=pendentes`
- `/api/admin/export?format=csv&view=enviados&posto=1S`

## PDF

- O PDF gerado inclui, nesta ordem:
  1. **Termo de Compromisso** (3 págs. do modelo oficial, com dados nas células)
  2. **Termo de Responsabilidade** (`TERMO DE RESPONSABILIDADE.pdf`, com Local/data e nome; identidade manuscrita)
  3. **Anexo AD** (setor/pastas + assinaturas de chefia)
- Data nos termos: **momento em que o usuário gera/baixa o PDF** (`Recife-PE, dd de mês de aaaa`).
- Campo **CPF** do Compromisso usa o CPF do formulário; no Responsabilidade, Identidade fica em branco.

## Deploy no Render

1. Garanta que o código está no GitHub (`origin` já aponta para o repo).
2. Em [render.com](https://render.com) → **New** → **Web Service** → conecte o repositório `recadastramento`.
3. Configuração:
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start`
   - **Instance:** Free (ou Starter se o free “dormir” demais)
4. **Environment** (Environment Variables):

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Pooler Supabase **6543** + `?pgbouncer=true` |
| `DIRECT_URL` | Direto `db.<ref>.supabase.co:5432` (migrations no build) |
| `AUTH_SECRET` | Gere com Generate / `openssl rand -base64 32` |
| `AUTH_URL` | `https://SEU-SERVICO.onrender.com` (URL do Render) |
| `ADMIN_SARAM` | `admin` |
| `ADMIN_PASSWORD` | senha forte do TI |
| `ADMIN_NOME` | `Administrador TI` |
| `NODE_VERSION` | `20.19.0` |

5. Deploy. O `npm run build` roda `prisma migrate deploy` automaticamente.
6. **Seed admin** (uma vez): no shell do Render (*Shell*) ou local apontando para o mesmo banco:
   ```bash
   npm run seed:admin
   ```
   O efetivo já deve estar no Supabase (import local anterior). Se for banco novo:
   ```bash
   npm run import:efetivo
   ```
7. Opcional: Cloudflare na frente (proxy) com a URL do Render.

**Free tier:** após ~15 min sem acesso o serviço “dorme”; o 1º hit pode levar 30–60s.

Blueprint opcional: arquivo [`render.yaml`](render.yaml) na raiz (New → Blueprint).

## Deploy na Vercel (teste / alternativa)

1. Push do código no GitHub.
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importe `recadastramento`.
3. Framework: **Next.js** (detecta sozinho). Root Directory: vazio.
4. **Environment Variables** (Production + Preview):

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Pooler Supabase **6543** + `?pgbouncer=true&sslmode=require` |
| `DIRECT_URL` | Pooler **Session** `...pooler.supabase.com:5432` + `sslmode=require` |
| `AUTH_SECRET` | gere um secret longo |
| `AUTH_URL` | `https://SEU-PROJETO.vercel.app` (ajuste após o 1º deploy) |
| `ADMIN_SARAM` | `admin` |
| `ADMIN_PASSWORD` | senha forte |
| `ADMIN_NOME` | `Administrador TI` |

5. Deploy. O build roda migrate + Next.
6. Atualize `AUTH_URL` com a URL real da Vercel e faça redeploy.
7. Teste com atenção: **login**, **formulário** e sobretudo **gerar PDF** (timeout serverless).

Arquivo de apoio: [`vercel.json`](vercel.json). A rota `/api/pdf` usa `maxDuration = 60`.

## Regras de catálogo

- Setor: apenas `setores.csv`
- Pastas: `grupos.csv` **sem** sufixo `-ch`
- PTTC (ODS) → default `RESERVA_REMUNERADA`
- ATIVA → default `MILITAR_DA_ATIVA`
- Civis: fora da v1

## Scripts

| Comando | Função |
|---------|--------|
| `npm run db:migrate` | Migrations Prisma |
| `npm run import:efetivo` | Importa ODS → users (senha = hash SARAM) |
| `npm run seed:admin` | Cria/atualiza admin |
| `npm run db:studio` | Prisma Studio |

## Segurança (expectativas)

- Auth é de **identificação operacional**.
- Admin usa senha forte separada.
- Rate limit no login.
- Não exponha `.env`, ODS com dados pessoais, nem service role do Supabase no domain controller.
