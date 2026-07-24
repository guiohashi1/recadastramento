# Recadastramento HARF 2026

Sistema para militares do Hospital de Aeronáutica de Recife preencherem o Termo de Compromisso, selecionarem setor/pastas AD e gerarem PDF para impressão e assinatura do chefe.

## Stack

- Next.js 15 (App Router) + TypeScript
- Postgres (Supabase em produção; Docker local opcional)
- Prisma ORM
- Auth.js (credentials) — **login = senha = SARAM** (conveniência, não segurança forte)
- `pdf-lib` — modelo oficial como fundo (logo/tabelas) + dados nas células + anexo AD


## Pré-requisitos

1. Node.js 20+
2. Projeto Supabase **ou** Docker Desktop para Postgres local
3. Arquivos em `data/`:
   - `setores.csv`, `grupos.csv`
   - `TERMO DE COMPROMISSO 2026_rotated.pdf` (referência visual; o PDF gerado não usa overlay)
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

```env
DATABASE_URL="postgresql://recadastro:recadastro@localhost:5432/recadastramento"
DIRECT_URL="postgresql://recadastro:recadastro@localhost:5432/recadastramento"
AUTH_SECRET="dev-secret-change-me"
AUTH_URL="http://localhost:3000"
ADMIN_SARAM="admin"
ADMIN_PASSWORD="TroqueEstaSenhaForte!"
ADMIN_NOME="Administrador TI"
```

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
saram;nome;posto_grad;status;status_label;setor_ad;pastas_ad;email;telefone;submitted_at
```

`pastas_ad` usa `|` como separador. O script AD futuro deve consumir **só este export** (não conectar no Supabase).

## PDF

- O PDF gerado **usa as 3 páginas do modelo oficial** (`TERMO DE COMPROMISSO 2026_rotated.pdf`): logo, tabelas e cláusulas intactas.
- Páginas convertidas para A4 retrato (corrige `/Rotate 90`); dados escritos nas células em branco.
- Data no Termo: **momento em que o usuário gera/baixa o PDF** (`Recife-PE, dd de mês de aaaa`).
- Página extra (anexo AD): status, setor, pastas e SARAM (não constam no modelo oficial).
- Campo **CPF** do papel recebe o valor de **Identidade** do formulário (não há CPF no efetivo).

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
