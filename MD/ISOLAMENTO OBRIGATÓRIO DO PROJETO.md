# ISOLAMENTO OBRIGATÓRIO DO PROJETO

## Princípio Fundamental

O Magic Music deve operar de forma totalmente independente dos demais projetos existentes na VPS.

Em hipótese alguma poderá compartilhar:

* Banco de dados
* Arquivos
* Diretórios
* Tokens
* Bots
* Grupos Telegram
* Variáveis de ambiente
* APIs internas
* Estruturas de armazenamento

com qualquer outro sistema hospedado no servidor.

---

# ISOLAMENTO DE TELEGRAM

## Obrigatório

Criar um BOT exclusivo para o Magic Music.

Exemplo:

```text
magicmusic_bot
```

Utilizar variáveis exclusivas:

```env
MAGIC_MUSIC_TELEGRAM_BOT_TOKEN=
MAGIC_MUSIC_TELEGRAM_CHAT_IDS=
```

---

## Proibido

Não utilizar:

```text
Bot da MassoterapiaRJ
Bot da IA Guru
Bot do Sistema de Chamados
Bot do FluxoPro
Bot de qualquer outro projeto
```

---

## Grupo Exclusivo

Criar grupo próprio.

Exemplo:

```text
Magic Music Produção
```

ou

```text
Magic Music Operação
```

Todos os eventos devem ser enviados somente para este grupo.

---

## Eventos Obrigatórios

Enviar mensagens separadas para:

```text
Novo Pedido
Prévia Disponível
Ajuste Solicitado
Pagamento Recebido
Música Entregue
Erro de Processamento
```

Jamais misturar notificações com outros sistemas.

---

# ISOLAMENTO DE DADOS

## Banco de Dados Exclusivo

O Magic Music utiliza PostgreSQL em container próprio.

```text
Container:  magic_music_db
Banco:      magic_music
Usuário:    magic_music_user
Volume:     magic_music_pgdata
Rede:       magic_music_net (interna)
```

Não compartilhar tabelas, coleções ou registros com nenhum outro projeto.

Toda informação do Magic Music deve existir somente dentro da estrutura do projeto.

---

## Estrutura de Dados

```text
magic-music/

├── storage/
│   └── orders/
│       └── {order_id}/
│           ├── musica.mp3
│           └── preview.mp3
├── logs/
│   └── magic-music.log
└── backups/
```

---

## Proibido

Não salvar músicas em:

```text
/arquivos_massoterapia/
/clientes_iaguru/
/fluxopro/
/chamados/
/portalmagic/
```

---

# ISOLAMENTO DE ARQUIVOS

Todos os arquivos devem permanecer dentro da estrutura:

```text
storage/orders/
```

Exemplo:

```text
storage/orders/000000001/
```

Contendo:

```text
musica.mp3
preview.mp3
```

O diretório de cada pedido é nomeado com o ID do banco preenchido com zeros à esquerda até 9 dígitos.

---

# ISOLAMENTO DE BACKUPS

Criar backup exclusivo.

Estrutura:

```text
backups/
```

Nunca incluir dados de outros projetos.

---

# ISOLAMENTO DE LOGS

Criar logs dedicados.

```text
logs/magic-music.log
```

Não misturar logs de outros sistemas.

---

# ISOLAMENTO DE APIS

As seguintes integrações utilizam credenciais exclusivas do Magic Music:

* **Google Gemini** — `GEMINI_API_KEY`
* **Asaas (PIX)** — `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`
* **Telegram** — `MAGIC_MUSIC_TELEGRAM_BOT_TOKEN`, `MAGIC_MUSIC_TELEGRAM_CHAT_IDS`

Caso sejam criadas integrações futuras (Mercado Pago, Efí, Cloudflare R2, MinIO), as credenciais deverão ser igualmente exclusivas do Magic Music.

---

# ISOLAMENTO DE REDE DOCKER

Redes utilizadas:

```text
magic_music_net  — rede interna (web ↔ db), isolada dos demais projetos
proxy_net        — rede externa compartilhada com o Nginx Proxy Manager (necessária para o proxy reverso)
```

Nenhum outro container do servidor tem acesso à `magic_music_net`.

---

# REGRA DE SEGURANÇA

O agente responsável pelo projeto deve considerar que:

1. O Magic Music é um sistema independente.
2. Nenhum dado de outro projeto pode ser acessado.
3. Nenhum cliente de outro sistema pode aparecer no Magic Music.
4. Nenhum arquivo de outro projeto pode ser listado, processado ou entregue.
5. Nenhuma notificação pode ser enviada para grupos externos ao Magic Music.
6. Toda operação deve permanecer confinada ao diretório do projeto.

Qualquer funcionalidade nova deve respeitar rigorosamente este isolamento.
