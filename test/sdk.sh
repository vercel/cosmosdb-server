#/usr/bin/env bash
set -euo pipefail

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
./bin/cosmosdb-server.js -p "$port" &
pid=$!

cd test/azure-cosmos-js
yarn
ACCOUNT_HOST="https://localhost:$port" yarn test-ts -- -i \
  -g 'Authorization|database account|Incremental Feed Tests|indexing|Parallel Query As String|Permission|Query Metrics On Single Partition Collection|ResourceLink Trimming|response headers|Session Token|spatial|sproc|stored procedure|Trigger|trigger|TTL|User'
