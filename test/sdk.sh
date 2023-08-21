#!/usr/bin/env bash
## This script is used to build the Azure SDK and run their integration tests
# against our cosmosdb server.
#
# This is done to ensure we maintain compatibility with the Azure SDK.
#
# Note that the `azure-sdk-for-js` is a git submodule of this repo, and we install `rush`, as that is the
# tool they use to manage their monorepo.
set -euo pipefail

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
ts-node ./src/cli.ts -p "$port" &
pid=$!

cd test/azure-sdk-for-js
npm i -g @microsoft/rush
rush install || rush install # try twice, the first seems to fail for no reason, but then it works

# Override all `tsconfig.json` to prevent it picking up type definitions from our
# node_modules (which is a parent dir).
# Manually filtering a couple of dodgy ones out, because they contain json comments, which jq can't parse
for f in $(find . -name tsconfig.json | grep -v node_modules); do
  cp "$f" "$f.bak"
  cat "$f.bak" | jq '. * { "compilerOptions": { "typeRoots": ["./node_modules/@types/"] }}' > "$f" || echo "skipping $f"
  rm "$f.bak"
done

cd sdk/cosmosdb/cosmos
rush build:test -t .

git reset --hard

ACCOUNT_HOST="https://localhost:$port" npm run integration-test:node -- -i --exit \
  -g 'Authorization|http proxy|Change Feed|Partition|indexing|Offer CRUD|Parallel Query As String|Permission|Query Metrics On Single Partition Collection|ResourceLink Trimming|Session Token|spatial|sproc|stored procedure|Trigger|trigger|TTL|User|Non Partitioned|Validate SSL verification|matching constant version & package version|Conflicts|Partition|GROUP BY|.readOffer|autoscale|with v2 container'
