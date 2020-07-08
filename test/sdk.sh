#!/usr/bin/env bash
set -euo pipefail

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
ts-node ./src/cli.ts -p "$port" &
pid=$!

cd test/azure-sdk-for-js/sdk/cosmosdb/cosmos
npm install
npm run build:test

ACCOUNT_HOST="https://localhost:$port" npm run integration-test:node -- --i --exit \
  -g 'Authorization|http proxy|Change Feed|Partition|indexing|Offer CRUD|Parallel Query As String|Permission|Query Metrics On Single Partition Collection|ResourceLink Trimming|Session Token|spatial|sproc|stored procedure|Trigger|trigger|TTL|User|Non Partitioned|Validate SSL verification|matching constant version & package version|Conflicts|Partition|GROUP BY|.readOffer'
