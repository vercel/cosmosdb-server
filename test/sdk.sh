#!/usr/bin/env bash
set -euo pipefail

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
ts-node ./src/cli.ts -p "$port" &
pid=$!

cd test/azure-cosmos-js
npm install
ACCOUNT_HOST="https://localhost:$port" npm run test-ts -- -i \
  -g 'Authorization|database account|http proxy|Incremental Feed Tests|indexing|Parallel Query As String|Permission|Query Metrics On Single Partition Collection|ResourceLink Trimming|Session Token|spatial|sproc|stored procedure|Trigger|trigger|TTL|User'
