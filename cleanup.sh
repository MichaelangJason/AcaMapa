#! /bin/bash

docker compose down
docker image rm mongodb/mongodb-atlas-local:latest
docker image rm moby/buildkit:buildx-stable-1
docker image rm degreemapper-dev-ai
docker image rm degreemapper-dev-app

echo "You can use 'docker system prune' to remove the dangling images, I didn't do it here to avoid removing other images"