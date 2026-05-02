#!/bin/bash
pushd ~/Git/FlameRelay
git fetch
git reset --hard origin/main
mkdir -p /srv/flamerelay/media
chown -R 100:101 /srv/flamerelay/media
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml down -t 20
docker compose -f docker-compose.production.yml up -d
docker image prune -f
popd
