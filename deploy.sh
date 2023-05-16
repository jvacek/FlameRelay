#!/bin/bash
pushd ~/Git/FlameRelay
git fetch
git reset --hard origin/master
docker-compose -f production.yml build
docker-compose -f production.yml up --force-recreate -d
docker system prune -a -f
popd
