# Magic Music - Fluxo e Objetivos

## Objetivo do projeto

O Magic Music e uma aplicacao para criar musicas personalizadas sob demanda.
O cliente informa ocasiao, estilo musical, nome da pessoa homenageada, historias e sentimentos desejados.
A IA gera uma letra personalizada e o pedido entra em uma fila de producao para que o audio final seja criado em uma ferramenta externa, como Suno.

O objetivo principal nao e tocar audio sintetico falso no navegador.
O produto deve entregar uma experiencia limpa: letra boa primeiro, producao real depois, e liberacao do MP3 final somente quando a equipe anexar o audio pronto.

## Componentes

- Frontend web: interface do cliente, biblioteca, player, loja simulada e painel admin.
- Backend Node: API para gerar letras, salvar pedidos, listar fila admin e liberar URLs de audio.
- Banco local JSON: arquivo `db.json`, usado como persistencia simples.
- Docker: container isolado `magic_music_web`.
- Nginx Proxy Manager: publica o app por um dominio/proxy externo.
- Android: app Android mantido no mesmo projeto, originado do AI Studio.

## Fluxo do cliente

1. O cliente abre o app web.
2. Escolhe a ocasiao, por exemplo aniversario, amor, casamento, pegadinha, motivacao ou festa.
3. Escolhe o estilo musical, por exemplo Pop BR, MPB, Trap, Rock, Eletronica ou Sertanejo.
4. Informa nome/apelido, historias, piadas internas, qualidades e vibes.
5. Clica para criar a letra com IA.
6. Revisa e edita titulo e letra.
7. Clica em `Enviar para Produção`.
8. O pedido entra como `pending_audio`.
9. O cliente ve a musica na biblioteca, mas o player informa que o audio ainda esta em producao.
10. Quando a equipe anexa a URL do MP3 final, o status muda para `ready` e o player passa a tocar o audio real.

## Fluxo de producao

1. A equipe acessa o painel admin pelo icone de escudo no topo do app.
2. Informa a senha definida em `ADMIN_PASSWORD`.
3. O painel mostra os pedidos pendentes.
4. Para cada pedido, a equipe copia:
   - prompt do Suno;
   - letra personalizada;
   - estilo e contexto do pedido.
5. A equipe cria a musica na ferramenta externa.
6. Depois de gerar o MP3 final, cola a URL do audio no campo do pedido.
7. Clica em `Liberar Música`.
8. O backend salva `audioUrl` e muda o status para `ready`.
9. O cliente passa a conseguir ouvir a musica real no player.

## Avisos de novos pedidos

O aviso automatico e opcional e deve ser isolado do restante da VPS.
Nao reutilizar tokens de outros projetos, especialmente os ligados ao Massoterapia RJ, para evitar falso alarme operacional.

Variaveis exclusivas do Magic Music:

```env
MAGIC_MUSIC_TELEGRAM_BOT_TOKEN=
MAGIC_MUSIC_TELEGRAM_CHAT_IDS=
```

Se essas variaveis estiverem vazias, nenhum aviso e enviado.
Mesmo sem aviso, o pedido continua salvo na fila admin.

Quando configurado com um bot exclusivo, o aviso enviado contem:

- ID do pedido;
- titulo;
- artista/destinatario;
- ocasiao;
- estilo;
- vibe;
- link do painel;
- prompt do Suno;
- letra completa.

## Regras importantes do produto

- Nao tocar audio sintetico ou TTS como se fosse musica final.
- Nao usar MP3 generico de teste como demonstracao de produto final.
- Nao liberar download sem `audioUrl` real.
- Nao reutilizar credenciais de outro servico.
- Nao expor a senha admin no JavaScript.
- Nao versionar `.env`.
- Manter o app em Docker e porta local, publicado por proxy.

## Estados do pedido

`pending_audio`

Pedido criado e aguardando producao externa.
O cliente pode ver a letra, mas nao toca audio final.

`ready`

Pedido com `audioUrl` anexada pelo admin.
O player usa o MP3 real.

## Enderecos atuais

Acesso local no servidor:

```text
http://127.0.0.1:8095
```

Preview publico temporario:

```text
http://magicmusic.5.189.152.8.nip.io
```

Quando houver dominio definitivo, configurar no Nginx Proxy Manager com SSL e atualizar:

```env
PRODUCTION_ADMIN_URL=https://dominio-definitivo
```

## Operacao diaria

1. Abrir o painel admin.
2. Ver pedidos pendentes.
3. Produzir audio externo.
4. Colar URL do MP3.
5. Validar no player.
6. Comunicar/liberar ao cliente.

## Proximos objetivos recomendados

- Criar bot/canal exclusivo para avisos do Magic Music.
- Trocar `db.json` por banco real quando houver volume de pedidos.
- Adicionar autenticacao admin com sessao/token em vez de prompt simples.
- Criar tela de status do pedido para o cliente.
- Salvar dados de contato do cliente para entrega do MP3.
- Integrar pagamento real antes de liberar download.
