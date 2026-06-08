# Magic Music

Projeto isolado em Docker para o site/app Magic Music.

## Estrutura

- `docker-compose.yml`: sobe o container web exclusivo.
- `.env`: configura porta local e nome da aplicacao.
- `app/`: arquivos publicados pelo Nginx.
- `scripts/deploy.sh`: atualiza o projeto e reinicia o Docker Compose.

## Executar

```bash
cd /root/magic-music
docker compose up -d
```

Acesso local:

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
