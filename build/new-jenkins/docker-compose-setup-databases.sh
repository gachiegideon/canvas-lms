#!/bin/bash

set -o errexit -o errtrace -o nounset -o pipefail -o xtrace
# ':' is a bash "no-op" and then we pass an empty argument which isn't used
parallel --will-cite ::: :

DATABASE_PROCESSES=$((${RSPEC_PROCESSES:=1}-1))

docker compose exec -T canvas bin/rails --trace db:migrate >> ./migrate.log
docker compose exec -T canvas bin/rake ci:reset_database RAILS_ENV=test CREATE_SHARDS=1

seq 0 $DATABASE_PROCESSES | parallel "docker compose exec -T postgres sh -c 'createdb -U postgres -T canvas_test canvas_test_{}'"

