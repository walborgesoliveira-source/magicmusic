# MAGIC MUSIC — ESPECIFICAÇÃO E ROADMAP

Versão: 2.1 (atualizado em 2026-06-15)

---

# CONTEXTO DO PROJETO

O Magic Music é uma plataforma comercial para criação de músicas personalizadas com IA.

**Stack atual:**

* Node.js puro (sem framework)
* PostgreSQL 16 (container `magic_music_db`)
* Docker + Docker Compose
* Nginx Proxy Manager
* Telegram Bot (variáveis exclusivas `MAGIC_MUSIC_*`)
* Google Gemini (geração de letras)
* Suno AI (produção musical manual)
* Asaas (pagamento PIX)
* FFmpeg (geração de prévia 60s)

---

# MODELO DE NEGÓCIO

Fluxo obrigatório:

1. Cliente solicita a música (wizard 4 passos, CPF obrigatório).
2. Equipe produz o áudio no Suno AI.
3. Admin faz upload do MP3 → FFmpeg gera prévia de 60s automaticamente.
4. Cliente recebe link e ouve a prévia.
5. Cliente aprova ou solicita ajustes.
6. Após aprovação, cliente realiza pagamento PIX.
7. Webhook Asaas confirma o pagamento automaticamente.
8. Música completa é liberada sem intervenção manual.

---

# ESTADOS DO PEDIDO

```
draft → pending_audio → preview_ready → adjustment_requested
                                      ↓
                              awaiting_payment → paid → delivered
                                                      cancelled
```

| Status | Descrição |
|---|---|
| `draft` | Pedido iniciado |
| `pending_audio` | Aguardando produção do MP3 |
| `preview_ready` | Prévia disponível para aprovação |
| `adjustment_requested` | Cliente solicitou alterações |
| `awaiting_payment` | Aguardando pagamento PIX |
| `paid` | Pagamento confirmado |
| `delivered` | Música completa liberada |
| `cancelled` | Pedido cancelado |
| `ready` | Status legado (registros migrados do db.json) |

---

# ESTRUTURA DE ARQUIVOS DE ÁUDIO

```text
storage/
└── orders/
    └── {id_9_dígitos}/
        ├── musica.mp3     (MP3 completo)
        └── preview.mp3    (primeiros 60s, gerado por FFmpeg)
```

Exemplo:

```text
storage/orders/000000001/
```

---

# BANCO DE DADOS

PostgreSQL — tabela `songs`. Schema em `scripts/init.sql`.

Campos principais:

```text
id, title, artist, language, category, cover_color_hex
original_lyrics, translated_lyrics, romanization, duration_seconds, suno_prompt
customer_name, customer_whatsapp, customer_cpf, customer_email, customer_notes
audio_url, preview_url, cover_url
status, approval_token
payment_status, payment_provider, pix_transaction_id
paid_at, delivered_at
adjustment_history (JSONB)
is_favorite, is_purchased
production_notified_at
created_at
```

---

# TOKEN DE ACESSO

Cada pedido recebe um UUID v4 como `approval_token`.

```text
f2fbe3d5-bfa4-47fc-9b18-2f7f75d1e3af
```

Usado para:
* Acessar a tela de aprovação (`/pedido/:token`)
* Acessar a tela de pagamento (`/pagamento/:token`)
* Stream da prévia (`/api/preview/:token`)
* Download da música completa (`/api/download/:token`)

Nunca expor o ID sequencial interno nas URLs públicas.

---

# GERAÇÃO DE PRÉVIA

Ferramenta: FFmpeg

```bash
ffmpeg -y -i musica.mp3 -t 60 -c copy preview.mp3
```

Executado automaticamente no upload pelo admin. Se FFmpeg falhar, a prévia cai de volta para o MP3 completo.

---

# ROTAS DA API

```text
POST /api/generate-lyrics          — gera letra via Gemini, salva no banco
POST /api/update-song              — atualiza dados do pedido; notifica Telegram
POST /api/production-request       — fallback quando Gemini indisponível
GET  /api/songs                    — todas as músicas (admin)
GET  /api/admin/orders             — pedidos com filtro de status (admin)
GET  /api/admin/pending            — pedidos pendentes de ação (admin)
POST /api/admin/upload-audio       — upload MP3 + geração de preview (admin)
GET  /api/client/songs?contact=    — pedidos do cliente por WhatsApp/e-mail
GET  /api/order/:token             — dados públicos do pedido
POST /api/order/approve            — aprova prévia → awaiting_payment
POST /api/order/request-adjustment — solicita ajuste → adjustment_requested
GET  /api/preview/:token           — stream preview.mp3
GET  /api/download/:token          — stream musica.mp3 (só paid/delivered)
POST /api/payment/create           — cria cobrança PIX no Asaas
POST /api/payment/webhook          — webhook Asaas → confirma pagamento
```

---

# PAGAMENTO PIX — ASAAS

* Cobrança criada com CPF obrigatório do cliente
* Cliente buscado por CPF no Asaas; criado se não existir
* Retorna QR Code base64 + código Copia e Cola
* Webhook valida `asaas-access-token` antes de processar
* Ao confirmar: status `delivered`, `paid_at` e `delivered_at` gravados, Telegram notificado
* Preço configurado em `MAGIC_MUSIC_PRICE` (padrão R$ 49,90)
* `ASAAS_API_KEY` usa `$$` no `.env` para escapar o `$` do Docker Compose

---

# NOTIFICAÇÕES TELEGRAM

| Evento | Trigger |
|---|---|
| Novo pedido | `/api/update-song` ou `/api/production-request` (uma vez) |
| Prévia disponível | Upload de MP3 pelo admin |
| Ajuste solicitado | `/api/order/request-adjustment` |
| Pagamento confirmado | Webhook Asaas |

Variáveis obrigatórias (exclusivas):

```env
MAGIC_MUSIC_TELEGRAM_BOT_TOKEN=
MAGIC_MUSIC_TELEGRAM_CHAT_IDS=
```

---

# PAINEL ADMINISTRATIVO

Acesso via header `X-Admin-Password`.

Funcionalidades implementadas:
* Lista de todos os pedidos com filtro por status
* Cards de pedidos pendentes (prompt Suno + letra copiáveis)
* Upload direto de MP3 por pedido
* Visualização de dados do cliente

---

# ÁREA DO CLIENTE

Aba "Cliente" no app — sem login.

O cliente informa WhatsApp ou e-mail para localizar seus pedidos.

Conforme o status exibe:
* Status descritivo ("Em produção", "Prévia disponível" etc.)
* Link de aprovação
* Link de pagamento
* Botão de download (só após `delivered`)

---

# SEGURANÇA

* Downloads e prévias somente via token UUID — nunca por ID direto
* Caminhos reais dos arquivos nunca expostos
* Webhook Asaas validado por token `asaas-access-token`
* Pagamentos verificados antes de liberar download
* Proteção contra path traversal no servidor de arquivos estáticos

---

# ROADMAP

| Fase | Status | Descrição |
|---|---|---|
| Fase 1 | ✅ Concluída | Estrutura de arquivos, prévia FFmpeg, tela de aprovação |
| Fase 2 | ✅ Concluída | Integração Asaas (PIX, QR Code) |
| Fase 3 | ✅ Concluída | Webhook PIX, confirmação e entrega automática |
| Fase 4 | ✅ Concluída | Área do cliente completa |
| Fase 5 | ✅ Concluída | Migração db.json → PostgreSQL |
| Fase 6 | 🔲 Pendente | Dashboard financeiro |
| Fase 7 | 🔲 Pendente | Estatísticas e métricas |
