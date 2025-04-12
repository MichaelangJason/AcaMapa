#!/bin/bash

# start the database
docker compose up -d db
# recover the db data
docker exec degreemapper-dev-db-1 /bin/bash -c "chmod +x /db-setup/setup.sh && /db-setup/setup.sh"
# build and start the ai backend
docker compose up -d ai

# build and start the app
docker buildx create --name degreemapper-builder --driver docker-container --driver-opt network=degreemapper-dev_degreemapper-network --use
docker compose up -d app
docker buildx rm degreemapper-builder

# open the app in default browser
sleep 2
open http://localhost:3000