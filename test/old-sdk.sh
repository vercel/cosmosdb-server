#/usr/bin/env bash
set -euo pipefail

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
./bin/cosmosdb-server.js -p "$port" &
pid=$!

cd test/azure-cosmosdb-node/source
yarn
cd test
ACCOUNT_HOST="https://localhost:$port" ../node_modules/.bin/mocha -t 0 -R spec -i \
  -g 'Attachment|Authorization|database account|Id validation|indexing|Offer|Permission|response headers|spatial|sproc|stored procedure|Trigger|trigger|TTL|User'
