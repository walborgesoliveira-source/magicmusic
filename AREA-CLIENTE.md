# Area do Cliente - Magic Music

## Objetivo

A Area do Cliente permite que o cliente acompanhe os pedidos de musica personalizada e receba o MP3 final quando a producao for liberada pelo administrador.

## Acesso

URL publica atual:

```text
http://magicmusic.5.189.152.8.nip.io
```

No app, abrir a aba:

```text
Cliente
```

## Como o cliente localiza o pedido

O cliente deve informar o mesmo contato usado na criacao da musica:

- WhatsApp
- ou e-mail

O sistema consulta:

```text
GET /api/client/songs?contact=CONTATO
```

Somente pedidos vinculados exatamente ao WhatsApp ou e-mail informado sao retornados.

## Status do pedido

### Em producao

O pedido aparece como `Em producao` quando:

- a letra ja foi criada
- o pedido ja foi enviado para o painel admin
- o MP3 final ainda nao foi anexado

Nesse estado, o cliente pode visualizar a letra, mas nao consegue baixar o MP3.

### Pronta

O pedido aparece como `Pronta` quando o administrador cola a URL do audio no painel admin e clica em:

```text
Liberar Musica
```

Nesse momento o sistema:

- salva a URL do audio
- muda o status para `ready`
- marca a musica como liberada
- habilita os botoes `Ouvir` e `Baixar MP3` para o cliente

## Fluxo operacional

1. Cliente cria a musica e informa WhatsApp/e-mail.
2. Pedido entra no Painel de Producao.
3. Admin copia a letra e o prompt para produzir no Suno.
4. Admin cola a URL do MP3 pronto no pedido.
5. Cliente entra na aba Cliente e busca pelo contato.
6. Cliente ouve ou baixa a musica pronta.

## Observacoes

- O cliente nao acessa o painel admin.
- O admin continua protegido por senha.
- A busca publica nao lista todos os pedidos; ela filtra por contato.
- O arquivo `db.json` contem dados locais/runtime e nao deve ser usado como historico publico.
