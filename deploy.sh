#!/bin/bash
pushd ~/Git/FlameRelay
git fetch
git reset --hard origin/main
docker-compose -f production.yml build
docker-compose -f production.yml down -t 20
docker-compose -f production.yml up -d
# docker system prune -a -f
# docker system prune -f
popd
