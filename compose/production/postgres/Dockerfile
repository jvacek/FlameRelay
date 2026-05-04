FROM docker.io/postgis/postgis:18-3.6

COPY ./compose/production/postgres/backup_pubkey.asc /tmp/backup_pubkey.asc
RUN gpg --import /tmp/backup_pubkey.asc && rm /tmp/backup_pubkey.asc

COPY ./compose/production/postgres/maintenance /usr/local/bin/maintenance
RUN chmod +x /usr/local/bin/maintenance/*
RUN mv /usr/local/bin/maintenance/* /usr/local/bin \
    && rmdir /usr/local/bin/maintenance
