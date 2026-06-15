# Magic Music — Visão Geral do Projeto

> Documento gerado em 2026-06-13. Descreve o estado atual da aplicação, seus recursos e fluxos operacionais.

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
9. [Player e reprodução](#9-player-e-reprodução)
10. [Sistema de créditos e pagamento](#10-sistema-de-créditos-e-pagamento)
11. [Estados do pedido](#11-estados-do-pedido)
12. [Notificações Telegram](#12-notificações-telegram)
13. [App Android](#13-app-android)
14. [Endereços e acesso](#14-endereços-e-acesso)
15. [Próximos objetivos](#15-próximos-objetivos)

---

## 1. O que é o Magic Music

Plataforma web para criação de músicas personalizadas sob demanda.

O cliente informa a **ocasião**, o **estilo musical**, o **nome do homenageado** e histórias/sentimentos. A IA (Google Gemini) gera uma letra personalizada com estrutura de verso/refrão. O pedido entra numa fila de produção, a equipe cria o áudio no **Suno AI** e entrega o MP3 final ao cliente.

Não há áudio sintético ou TTS como produto final — apenas a letra é gerada automaticamente; o áudio real é produzido por humano.

---

## 2. Infraestrutura e recursos

| Camada | Tecnologia | Detalhe |
|---|---|---|
| Backend | Node.js puro (`http` nativo) | `server.js` — sem framework |
| Frontend | HTML + CSS + JavaScript puro | `index.html`, `style.css`, `app.js` |
| Banco de dados | JSON local | `db.json` — persistência em arquivo |
| Contêiner | Docker | imagem `node:18-alpine`, container `magic_music_web` |
| Orquestração | Docker Compose | `docker-compose.yml` |
| Proxy reverso | Nginx Proxy Manager (NPM) | publicado via rede `proxy_net` |
| IA de letras | Google Gemini API | modelo padrão `gemini-1.5-flash` |
| IA de áudio | Suno AI (externo, manual) | equipe cria o MP3 fora do sistema |
| Notificações | Telegram Bot API | variáveis exclusivas `MAGIC_MUSIC_*` |
| Android | App Kotlin (mesmo repo) | pasta `app/`, originado do AI Studio |

### Redes Docker

- `magic_music_net` — rede interna do container
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
├── db.json                # Banco de dados JSON (runtime)
├── .env                   # Variáveis de ambiente (não versionado)
├── .env.example           # Modelo das variáveis
├── Dockerfile             # Build da imagem Node
├── docker-compose.yml     # Orquestração do container
├── FLUXO-E-OBJETIVOS.md   # Documento de referência original
├── AREA-CLIENTE.md        # Documentação da área do cliente
├── PROJETO.md             # Este arquivo
├── scripts/
│   └── deploy.sh          # Script de atualização no servidor
└── app/                   # Projeto Android (Kotlin/Gradle)
    └── src/...
```

---

## 4. Variáveis de ambiente

Definidas em `.env` (não versionado). Modelo em `.env.example`.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | Sim | Chave da Google Gemini API para gerar letras |
| `ADMIN_PASSWORD` | Sim | Senha do painel administrativo |
| `PORT` | Não (padrão `3000`) | Porta interna do container |
| `APP_PORT` | Não (padrão `8095`) | Porta exposta no host |
| `PRODUCTION_ADMIN_URL` | Não | URL do painel admin incluída no aviso Telegram |
| `MAGIC_MUSIC_TELEGRAM_BOT_TOKEN` | Não | Token do bot exclusivo do Magic Music |
| `MAGIC_MUSIC_TELEGRAM_CHAT_IDS` | Não | IDs dos chats de destino (vírgula) |

> **Isolamento:** As variáveis `MAGIC_MUSIC_*` são exclusivas deste projeto e não devem reutilizar tokens de outros serviços.

---

## 5. API — rotas do servidor

Todas as rotas retornam JSON. Autenticação admin via header `X-Admin-Password`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/generate-lyrics` | Público | Gera letra via Gemini, salva no `db.json` com status `pending_audio` |
| `GET` | `/api/songs` | Público | Lista todas as músicas do banco |
| `POST` | `/api/update-song` | Público | Atualiza título, letra e dados de contato do cliente; dispara aviso Telegram se ainda não notificado |
| `POST` | `/api/production-request` | Público | Registra pedido de fallback (quando Gemini falhou); salva diretamente no banco |
| `POST` | `/api/purchase-song` | Público | Marca música como `isPurchased = true` |
| `GET` | `/api/client/songs?contact=` | Público | Busca pedidos pelo WhatsApp ou e-mail do cliente |
| `GET` | `/api/admin/pending` | Admin | Lista músicas com status `pending_audio` |
| `POST` | `/api/admin/submit-audio` | Admin | Vincula URL do MP3 ao pedido e muda status para `ready` |

### Servindo arquivos estáticos

Qualquer rota não reconhecida como API serve o arquivo estático equivalente. Se o arquivo não existir, retorna `index.html` (fallback SPA).

---

## 6. Fluxo do cliente

```
[1] Escolhe a ocasião
        ↓
[2] Escolhe o estilo musical
        ↓
[3] Preenche nome, histórias e vibes
        ↓
[4] Clica "Criar com IA"
    → POST /api/generate-lyrics (Gemini)
    → fallback: template local offline
        ↓
[5] Revisa título e letra (editável)
    Preenche WhatsApp e e-mail (WhatsApp obrigatório)
        ↓
[6] Clica "Enviar para Produção"
    → POST /api/update-song (song existente no banco)
    → ou POST /api/production-request (fallback offline)
    → Aviso Telegram enviado (se configurado)
        ↓
[7] Pedido salvo como "pending_audio"
    Música aparece na biblioteca com status "Em produção"
        ↓
[8] Quando admin libera o MP3:
    Status muda para "ready"
    Player habilita reprodução e download
```

### Créditos

- Cada pedido enviado consome **1 crédito**.
- Créditos são salvos no `localStorage` do navegador.
- Créditos iniciais: 3 (seed local).
- Compra de créditos via checkout Pix simulado (não integrado a gateway real).

---

## 7. Fluxo de produção (admin)

```
[1] Admin clica no ícone de escudo no topo do app
        ↓
[2] Informa a ADMIN_PASSWORD
    → GET /api/admin/pending (valida senha no header)
        ↓
[3] Painel exibe cards com pedidos "pending_audio"
    Cada card mostra:
    - Título, estilo e destinatário
    - Dados de contato do cliente (nome, WhatsApp, e-mail, obs.)
    - Prompt Suno (copiável)
    - Letra completa (copiável)
        ↓
[4] Admin acessa o Suno AI externamente
    Cria a música usando o prompt e a letra do pedido
        ↓
[5] Admin cola a URL do MP3 no campo do card
    Clica "Liberar Música"
    → POST /api/admin/submit-audio
    → status muda para "ready"
    → isPurchased = true
        ↓
[6] Cliente já pode ouvir e baixar o MP3 final
```

---

## 8. Área do cliente (autoatendimento)

Aba **"Cliente"** no app. Não requer login.

```
[1] Cliente informa WhatsApp ou e-mail usado no pedido
        ↓
[2] Sistema consulta:
    GET /api/client/songs?contact=CONTATO
    (filtra por customerWhatsapp ou customerEmail normalizados)
        ↓
[3] Lista os pedidos vinculados ao contato
    Cada pedido mostra:
    - Título, ocasião, estilo, data
    - Status: "Em produção" ou "Pronta"
        ↓
[4] Se "Pronta":
    - Botão "Ouvir" → abre no player com isPurchased=true
    - Botão "Baixar MP3" → download direto da audioUrl
        ↓
[5] Se "Em produção":
    - Mostra a letra
    - Download bloqueado
```

---

## 9. Player e reprodução

### Modo "pending_audio" (sem MP3)

- Player exibe a letra mas **não reproduz áudio real**.
- Ao clicar em play, exibe aviso informando que o áudio ainda está em produção.

### Modo "ready" (com MP3)

- Usa **HTML5 Audio** (`<Audio>`) para reproduzir a `audioUrl`.
- Preview limitado a **1 minuto** se `isPurchased = false`.
  - Após 60 s o player pausa e abre o checkout Pix.
- Letras sincronizadas automaticamente com o progresso da reprodução.
- Seekbar interativa; clique em linha da letra avança para aquela posição.
- Mini player flutuante ativo durante reprodução.

### Visualizador

- Canvas animado com barras de frequência (Web Audio API `AnalyserNode`).
- Em idle: ondas flutuantes suaves.
- Durante reprodução com MP3 real: barras reativas ao áudio.

### Sintetizador de backing (apenas demo/preview)

- Web Audio API gera kick, snare e acordes conforme o estilo (Pop BR, Trap, Rock, MPB, Eletrônica, Sertanejo).
- **Não é o produto final** — usado apenas como demonstração antes do MP3 real estar disponível.

---

## 10. Sistema de créditos e pagamento

| Pacote | Preço | Créditos |
|---|---|---|
| 1 crédito | R$ 19,90 | 1 |
| 3 créditos | R$ 34,90 | 3 |
| 5 créditos | R$ 49,90 | 5 |

- Checkout exibe código Pix copiável (gerado localmente, sem integração real).
- Botão "Confirmar pagamento" libera créditos sem validação de pagamento real.
- Compra de música individual (após preview de 1 min): R$ 19,90, mesmo fluxo Pix.

> **Pendente:** integração com gateway de pagamento real.

---

## 11. Estados do pedido

| Status | Descrição | Player | Download |
|---|---|---|---|
| `pending_audio` | Letra criada, aguardando MP3 | Bloqueado | Bloqueado |
| `ready` | MP3 vinculado pelo admin | Liberado | Liberado (se `isPurchased`) |

Campo `isPurchased` controla o acesso completo (preview vs. completo).

---

## 12. Notificações Telegram

Quando um pedido é enviado para produção (`/api/update-song` ou `/api/production-request`), o servidor tenta enviar uma mensagem ao bot configurado.

**Conteúdo do aviso:**
- ID, título, artista, ocasião, estilo, vibe
- Dados de contato do cliente (nome, WhatsApp, e-mail, observações)
- Link do painel admin
- Prompt Suno completo
- Letra completa

**Regras:**
- Se `MAGIC_MUSIC_TELEGRAM_BOT_TOKEN` ou `MAGIC_MUSIC_TELEGRAM_CHAT_IDS` estiverem vazios, nenhum aviso é enviado.
- O pedido é salvo normalmente mesmo sem aviso.
- Aviso é enviado apenas uma vez por pedido (campo `productionNotifiedAt`).
- Token exclusivo — nunca reutilizar de outros projetos.

---

## 13. App Android

- Localização: pasta `app/` no mesmo repositório.
- Tecnologia: Kotlin + Gradle (Kotlin DSL).
- Origem: AI Studio.
- Contém templates de letras offline (`SongTemplates`) espelhados no `app.js`.
- Build configurado em `app/build.gradle.kts` e `settings.gradle.kts`.
- Keystore de debug em `debug.keystore.base64`.

---

## 14. Endereços e acesso

| Destino | Endereço |
|---|---|
| Acesso local no servidor | `http://127.0.0.1:8095` |
| Preview público atual | `http://magicmusic.5.189.152.8.nip.io` |
| Domínio definitivo | A definir — configurar no NPM com SSL e atualizar `PRODUCTION_ADMIN_URL` |

---

## 15. Próximos objetivos

- [ ] Configurar bot/canal Telegram exclusivo do Magic Music
- [ ] Integrar gateway de pagamento real (antes de liberar download)
- [ ] Trocar `db.json` por banco relacional (PostgreSQL) quando houver volume
- [ ] Autenticação admin com sessão/token em vez de prompt simples
- [ ] Tela de status de pedido dedicada para o cliente (sem precisar buscar por contato)
- [ ] Domínio definitivo com SSL no Nginx Proxy Manager
- [ ] Validar pagamento Pix automaticamente via webhook do banco
