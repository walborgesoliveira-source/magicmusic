# Magic Music

Projeto Magic Music com app Android, frontend web e backend Node para geracao de letras, fila administrativa e compras.

## Docker

Este projeto roda em container exclusivo, isolado dos demais servicos do servidor.

1. Crie ou ajuste o arquivo `.env` na raiz:

```env
APP_PORT=8095
PORT=3000
GEMINI_API_KEY=MY_GEMINI_API_KEY
ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
PRODUCTION_ADMIN_URL=http://magicmusic.5.189.152.8.nip.io
MAGIC_MUSIC_TELEGRAM_BOT_TOKEN=
MAGIC_MUSIC_TELEGRAM_CHAT_IDS=
```

2. Suba o ambiente:

```bash
cd /root/magic-music
docker compose up -d
```

Acesso local do servidor:

```text
http://127.0.0.1:8095
```

## Proxy

Para publicar via Nginx Proxy Manager, crie um Proxy Host apontando para:

```text
Forward Hostname / IP: 127.0.0.1
Forward Port: 8095
```

Ative SSL, Let's Encrypt e Force HTTPS quando o DNS do dominio estiver apontado para o servidor.

## Painel administrativo

O painel administrativo usa a senha definida em `ADMIN_PASSWORD`.
No app web, clique no icone de escudo no topo e informe essa senha para acessar a fila de musicas pendentes e liberar URLs de audio.

## Avisos de producao

Quando uma letra e confirmada, o pedido entra na fila do painel admin.
Opcionalmente, o Magic Music pode enviar aviso por Telegram usando apenas as variaveis exclusivas `MAGIC_MUSIC_TELEGRAM_BOT_TOKEN` e `MAGIC_MUSIC_TELEGRAM_CHAT_IDS`.
Nao reutilize tokens de outros servicos para evitar falso alarme em operacoes como Massoterapia RJ.

## Android / AI Studio

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

### Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ff41a83b-ba53-4fa7-b623-eb27af2620bf

### Run Locally

**Prerequisites:**  [Android Studio](https://developer.android.com/studio)


1. Open Android Studio
2. Select **Open** and choose the directory containing this project
3. Allow Android Studio to fix any incompatibilities as it imports the project.
4. Create a file named `.env` in the project directory and set `GEMINI_API_KEY` in that file to your Gemini API key (see `.env.example` for an example)
5. Remove this line from the app's `build.gradle.kts` file: `signingConfig = signingConfigs.getByName("debugConfig")`
6. Run the app on an emulator or physical device
