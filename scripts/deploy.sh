#!/bin/bash
set -euo pipefail

cd /root/magic-music

git pull --ff-only
docker compose up -d
