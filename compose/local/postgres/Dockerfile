FROM docker.io/postgres:18

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-18-postgis-3 \
        postgresql-18-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*
