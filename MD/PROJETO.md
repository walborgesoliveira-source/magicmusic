# Magic Music — Visão Geral do Projeto

> Documento atualizado em 2026-06-15. Descreve o estado atual da aplicação após implementação das Fases 1–5.

---

## Sumário

1. [O que é o Magic Music](#1-o-que-é-o-magic-music)
2. [Infraestrutura e recursos](#2-infraestrutura-e-recursos)
3. [Estrutura de arquivos](#3-estrutura-de-arquivos)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [API — rotas do servidor](#5-api--rotas-do-servidor)
6. [Fluxo do cliente](#6-fluxo-do-cliente)
7. [Fluxo de produção (admin)](#7-fluxo-de-produção-admin)
8. [Área do cliente (autoatendimento)](#8-área-do-cliente-autoatendimento)
9. [Estados do pedido](#9-estados-do-pedido)
10. [Pagamento PIX — Asaas](#10-pagamento-pix--asaas)
11. [Notificações Telegram](#11-notificações-telegram)
12. [Banco de dados PostgreSQL](#12-banco-de-dados-postgresql)
13. [App Android](#13-app-android)
14. [Endereços e acesso](#14-endereços-e-acesso)
15. [Próximos objetivos](#15-próximos-objetivos)

---

## 1. O que é o Magic Music

Plataforma web para criação de músicas personalizadas sob demanda.

O cliente informa a **ocasião**, o **estilo musical**, o **nome do homenageado** e histórias/sentimentos. A IA (Google Gemini) gera uma letra personalizada com estrutura de verso/refrão. O pedido entra numa fila de produção, a equipe cria o áudio no **Suno AI** e entrega o MP3 final ao cliente após aprovação e pagamento PIX.

Não há áudio sintético ou TTS como produto final — apenas a letra é gerada automaticamente; o áudio real é produzido por humano.

---

## 2. Infraestrutura e recursos

| Camada | Tecnologia | Detalhe |
|---|---|---|
| Backend | Node.js puro (`http` nativo) | `server.js` — sem framework |
| Frontend | HTML + CSS + JavaScript puro | `index.html`, `style.css`, `app.js` |
| Banco de dados | PostgreSQL 16 | container `magic_music_db`, banco `magic_music` |
| Contêiner | Docker | imagem `node:20-alpine`, container `magic_music_web` |
| Orquestração | Docker Compose | `docker-compose.yml` |
| Proxy reverso | Nginx Proxy Manager (NPM) | publicado via rede `proxy_net` |
| IA de letras | Google Gemini API | modelo `gemini-2.0-flash` |
| IA de áudio | Suno AI (externo, manual) | equipe cria o MP3 fora do sistema |
| Geração de prévia | FFmpeg | corta primeiros 60s do MP3 original |
| Pagamento | Asaas (PIX) | cobrança + webhook automático |
| Notificações | Telegram Bot API | variáveis exclusivas `MAGIC_MUSIC_*` |
| Android | App Kotlin (mesmo repo) | pasta `app/`, originado do AI Studio |

### Redes Docker

- `magic_music_net` — rede interna entre `web` e `db`
- `proxy_net` — rede externa compartilhada com o Nginx Proxy Manager

### Portas

- Container interno: `3000`
- Acesso local no host: `127.0.0.1:8095`

---

## 3. Estrutura de arquivos

```
magic-music/
├── server.js              # Backend Node.js — toda a API REST
├── app.js                 # Frontend JS — estado, player, wizard, admin
├── index.html             # SPA única (todas as telas em abas)
├── style.css              # Estilos globais
├── db.json                # Backup histórico (não lido pelo servidor)
├── .env                   # Variáveis de ambiente (não versionado)
├── .env.example           # Modelo das variáveis
├── Dockerfile             # Build da imagem Node
├── docker-compose.yml     # Orquestração dos containers (web + db)
├── package.json           # Dependências: pg
├── scripts/
│   ├── init.sql           # Schema inicial do PostgreSQL (auto-executado)
│   ├── migrate-db-json.js # Script de migração db.json → PostgreSQL (uso único)
│   └── deploy.sh          # Script de atualização no servidor
├── storage/
│   └── orders/
│       └── {id_padded_9}/
│           ├── musica.mp3
│           └── preview.mp3
├── logs/
│   └── magic-music.log
├── backups/
├── MD/                    # Documentação do projeto
└── app/                   # Projeto Android (Kotlin/Gradle)
    └── src/...
```

---

## 4. Variáveis de ambiente

Definidas em `.env` (não versionado). Modelo em `.env.example`.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | Não (padrão `3000`) | Porta interna do container |
| `APP_PORT` | Não (padrão `8095`) | Porta exposta no host |
| `GEMINI_API_KEY` | Sim | Chave da Google Gemini API |
| `GEMINI_MODEL` | Não (padrão `gemini-2.0-flash`) | Modelo Gemini a usar |
| `ADMIN_PASSWORD` | Sim | Senha do painel administrativo |
| `PRODUCTION_ADMIN_URL` | Não | URL base do painel (usada nos links do Telegram) |
| `MAGIC_MUSIC_TELEGRAM_BOT_TOKEN` | Não | Token do bot exclusivo do Magic Music |
| `MAGIC_MUSIC_TELEGRAM_CHAT_IDS` | Não | IDs dos chats de destino (vírgula) |
| `MAGIC_MUSIC_PRICE` | Não (padrão `49.90`) | Preço do pedido em reais |
| `ASAAS_API_KEY` | Sim (produção) | Chave da API Asaas — usar `$$` para escapar `$` no Docker Compose |
| `ASAAS_BASE_URL` | Não | Base da API Asaas (padrão produção) |
| `ASAAS_WEBHOOK_TOKEN` | Não | Token de validação do webhook Asaas |
| `MAGIC_MUSIC_DB_HOST` | Não (padrão `magic_music_db`) | Host do PostgreSQL |
| `MAGIC_MUSIC_DB_PORT` | Não (padrão `5432`) | Porta do PostgreSQL |
| `MAGIC_MUSIC_DB_NAME` | Não (padrão `magic_music`) | Nome do banco |
| `MAGIC_MUSIC_DB_USER` | Sim | Usuário do banco |
| `MAGIC_MUSIC_DB_PASSWORD` | Sim | Senha do banco |

> **Isolamento:** As variáveis `MAGIC_MUSIC_*` são exclusivas deste projeto e não reutilizam tokens de outros serviços.

---

## 5. API — rotas do servidor

Todas as rotas retornam JSON. Autenticação admin via header `X-Admin-Password`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/generate-lyrics` | Público | Gera letra via Gemini, salva no banco com status `pending_audio` |
| `POST` | `/api/update-song` | Público | Atualiza título, letra e dados de contato; dispara Telegram se não notificado |
| `POST` | `/api/production-request` | Público | Registra pedido via fallback local (quando Gemini falhou) |
| `GET` | `/api/songs` | Admin | Lista todas as músicas |
| `GET` | `/api/admin/orders` | Admin | Todos os pedidos com filtro opcional por status |
| `GET` | `/api/admin/pending` | Admin | Pedidos `pending_audio` e `adjustment_requested` |
| `POST` | `/api/admin/upload-audio` | Admin | Upload direto de MP3 (header `X-Song-Id`); gera preview via FFmpeg |
| `GET` | `/api/client/songs?contact=` | Público | Pedidos do cliente por WhatsApp ou e-mail |
| `GET` | `/api/order/:token` | Público | Dados do pedido pelo approval token |
| `POST` | `/api/order/approve` | Público | Aprova prévia → status `awaiting_payment` |
| `POST` | `/api/order/request-adjustment` | Público | Solicita ajuste → status `adjustment_requested` |
| `GET` | `/api/preview/:token` | Público | Stream do `preview.mp3` (60s) |
| `GET` | `/api/download/:token` | Público | Stream do `musica.mp3` completo (só `paid`/`delivered`) |
| `POST` | `/api/payment/create` | Público | Cria cobrança PIX no Asaas, retorna QR Code |
| `POST` | `/api/payment/webhook` | Asaas | Webhook de confirmação de pagamento → status `delivered` |

### Servindo arquivos estáticos

Qualquer rota não reconhecida como API serve o arquivo estático equivalente. Se não existir, retorna `index.html` (fallback SPA).

---

## 6. Fluxo do cliente

```
[1] Escolhe a ocasião
        ↓
[2] Escolhe o estilo musical
        ↓
[3] Preenche nome, CPF, histórias e vibes
        ↓
[4] Clica "Criar com IA"
    → POST /api/generate-lyrics (Gemini)
    → fallback: template local offline
        ↓
[5] Revisa título e letra (editável)
    Preenche nome, WhatsApp, e-mail, CPF (obrigatório), observações
        ↓
[6] Clica "Enviar para Produção"
    → POST /api/update-song
    → Telegram notifica a equipe
        ↓
[7] Pedido salvo como "pending_audio"
        ↓
[8] Admin faz upload do MP3 → FFmpeg gera preview.mp3
    Status muda para "preview_ready"
    Telegram notifica cliente com link de aprovação
        ↓
[9] Cliente acessa /pedido/:token
    Ouve prévia (60s)
    Clica "Aprovar Música" ou "Solicitar Ajustes"
        ↓
[10] Se aprovado → status "awaiting_payment"
     Redireciona para /pagamento/:token
        ↓
[11] PIX gerado via Asaas (QR Code + Copia e Cola)
     Cliente paga
        ↓
[12] Webhook Asaas confirma → status "delivered"
     Telegram notifica equipe
     Botão "Baixar MP3" ativo na área do cliente
```

---

## 7. Fluxo de produção (admin)

```
[1] Admin acessa o painel (ícone de escudo no topo)
    Informa ADMIN_PASSWORD
        ↓
[2] Lista de pedidos pendentes (pending_audio / adjustment_requested)
    Cada card mostra:
    - Título, estilo, ocasião
    - Dados do cliente (nome, WhatsApp, e-mail, CPF, obs.)
    - Prompt Suno (copiável)
    - Letra completa (copiável)
        ↓
[3] Admin acessa o Suno AI externamente
    Cria a música
        ↓
[4] Faz upload do MP3 diretamente no painel
    → POST /api/admin/upload-audio (header X-Song-Id, corpo binário)
    → FFmpeg gera preview.mp3 automaticamente
    → status muda para "preview_ready"
    → Telegram envia link de aprovação ao cliente
        ↓
[5] Após pagamento confirmado: status "delivered"
    MP3 completo disponível para download via token
```

---

## 8. Área do cliente (autoatendimento)

Aba **"Cliente"** no app. Não requer login.

```
[1] Cliente informa WhatsApp ou e-mail usado no pedido
        ↓
[2] GET /api/client/songs?contact=CONTATO
    (filtra por customerWhatsapp ou customerEmail normalizados)
        ↓
[3] Lista os pedidos vinculados ao contato
    Cada pedido mostra título, ocasião, estilo, data e status
        ↓
[4] Conforme o status:
    pending_audio      → "Em produção"
    preview_ready      → botão "Ouvir Prévia" + link de aprovação
    awaiting_payment   → link de pagamento
    delivered          → botão "Baixar MP3"
```

---

## 9. Estados do pedido

```
draft → pending_audio → preview_ready → adjustment_requested
                                      ↓
                              awaiting_payment → paid → delivered
                                                      cancelled
```

| Status | Descrição |
|---|---|
| `draft` | Pedido iniciado (não usado ativamente) |
| `pending_audio` | Aguardando produção do MP3 |
| `preview_ready` | Prévia disponível para aprovação |
| `adjustment_requested` | Cliente solicitou alterações |
| `awaiting_payment` | Prévia aprovada, aguardando PIX |
| `paid` | Pagamento confirmado |
| `delivered` | Música completa liberada para download |
| `cancelled` | Pedido cancelado |
| `ready` | Status legado (compatibilidade com registros migrados) |

---

## 10. Pagamento PIX — Asaas

- Cobrança criada em `POST /api/payment/create` com CPF obrigatório
- `getOrCreateAsaasCustomer()` busca cliente por CPF no Asaas; cria se não existir
- Retorna QR Code em base64 + código Copia e Cola
- Webhook em `POST /api/payment/webhook` valida token `asaas-access-token` e confirma pagamento
- Ao confirmar: status → `delivered`, `paid_at` e `delivered_at` registrados, Telegram notificado
- Preço configurável via `MAGIC_MUSIC_PRICE` (padrão R$ 49,90)

> **Atenção:** `ASAAS_API_KEY` usa `$$` no `.env` para escapar o `$` do Docker Compose.

---

## 11. Notificações Telegram

| Evento | Quando |
|---|---|
| Novo pedido | `POST /api/update-song` ou `/api/production-request` (uma vez por pedido) |
| Prévia disponível | Após upload e geração do preview — envia link de aprovação |
| Ajuste solicitado | `POST /api/order/request-adjustment` |
| Pagamento confirmado | Webhook Asaas `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` |

- Se `MAGIC_MUSIC_TELEGRAM_BOT_TOKEN` ou `MAGIC_MUSIC_TELEGRAM_CHAT_IDS` estiverem vazios, nenhum aviso é enviado — pedido salvo normalmente.
- Token exclusivo — nunca reutilizar de outros projetos.

---

## 12. Banco de dados PostgreSQL

### Container

```
Host:     magic_music_db
Porta:    5432
Banco:    magic_music
Usuário:  magic_music_user
Volume:   magic_music_pgdata
```

### Schema principal — tabela `songs`

Definido em `scripts/init.sql`. Campos relevantes:

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL PK | ID sequencial |
| `title` | TEXT | Título da música |
| `status` | TEXT | Estado atual do pedido |
| `approval_token` | TEXT UNIQUE | UUID para acesso público ao pedido |
| `customer_name/whatsapp/cpf/email/notes` | TEXT | Dados do cliente |
| `audio_url` | TEXT | Caminho `/api/download/:token` |
| `preview_url` | TEXT | Caminho `/api/preview/:token` |
| `pix_transaction_id` | TEXT | ID da cobrança no Asaas |
| `payment_status` | TEXT | Status do pagamento |
| `paid_at` / `delivered_at` | TIMESTAMPTZ | Datas de pagamento e entrega |
| `adjustment_history` | JSONB | Histórico de ajustes solicitados |
| `production_notified_at` | TIMESTAMPTZ | Data do aviso Telegram (evita duplicatas) |
| `created_at` | TIMESTAMPTZ | Data de criação |

### Migração

O arquivo `db.json` foi mantido como backup histórico. Os 9 registros foram importados via `scripts/migrate-db-json.js` preservando os IDs originais (99–107). A sequence foi ajustada para iniciar em 108.

---

## 13. App Android

- Localização: pasta `app/` no mesmo repositório
- Tecnologia: Kotlin + Gradle (Kotlin DSL)
- Origem: AI Studio
- Contém templates de letras offline (`SongTemplates`) espelhados no `app.js`
- Build configurado em `app/build.gradle.kts` e `settings.gradle.kts`
- Keystore de debug em `debug.keystore.base64`

---

## 14. Endereços e acesso

| Destino | Endereço |
|---|---|
| Acesso local no servidor | `http://127.0.0.1:8095` |
| Preview público atual | `http://magicmusic.5.189.152.8.nip.io` |
| Domínio definitivo | A definir — configurar no NPM com SSL e atualizar `PRODUCTION_ADMIN_URL` |

### Operação Docker

```bash
cd /root/magic-music
docker compose down
docker compose build --no-cache
docker compose up -d
docker logs -f magic_music_web
```

---

## 15. Próximos objetivos

- [x] Fase 1 — Estrutura de arquivos, geração de preview (FFmpeg), tela de aprovação
- [x] Fase 2 — Integração Asaas (PIX, QR Code)
- [x] Fase 3 — Webhook PIX (confirmação automática + entrega)
- [x] Fase 4 — Área completa do cliente
- [x] Fase 5 — Migração db.json → PostgreSQL
- [ ] Fase 6 — Dashboard financeiro
- [ ] Fase 7 — Estatísticas e métricas
- [ ] Configurar bot/canal Telegram exclusivo do Magic Music
- [ ] Autenticação admin com sessão/token em vez de senha no header
- [ ] Domínio definitivo com SSL
