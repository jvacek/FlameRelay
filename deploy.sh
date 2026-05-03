#!/bin/bash
pushd ~/Git/FlameRelay
git fetch
git reset --hard origin/main
# mkdir -p /srv/flamerelay/media
# chown -R 10001:10001 /srv/flamerelay/media
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml down -t 20
docker compose -f docker-compose.production.yml up -d
docker image prune -f
popd
