#!/usr/bin/env bash
set -euo pipefail

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
ts-node ./src/cli.ts -p "$port" &
pid=$!

cd test/azure-sdk-for-js/sdk/cosmosdb/cosmos
npm install

cp src/tsconfig.json{,.bak}
cp ../../../../tsconfig.sdk.patch.json src/tsconfig.json
npm run build:test -- --force
mv src/tsconfig.json{.bak,}

ACCOUNT_HOST="https://localhost:$port" npm run integration-test:node -- --i --exit \
  -g 'Authorization|database account|http proxy|Change Feed|Cross Partition|indexing|Offer CRUD|Parallel Query As String|Permission|Query Metrics On Single Partition Collection|ResourceLink Trimming|Session Token|spatial|sproc|stored procedure|Trigger|trigger|TTL|User|Non Partitioned|Validate SSL verification|matching constant version & package version'
