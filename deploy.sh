#!/bin/bash
pushd ~/Git/flamerelay
git fetch
git reset --hard origin/master
docker-compose -f production.yml build
docker-compose -f production.yml up --force-recreate -d
