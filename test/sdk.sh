#!/usr/bin/env bash
## This script is used to build the Azure SDK and run their integration tests
# against our cosmosdb server.
#
# This is done to ensure we maintain compatibility with the Azure SDK.
#
# Note that the `azure-sdk-for-js` is a git submodule of this repo, and we install `rush`, as that is the
# tool they use to manage their monorepo.
set -euo pipefail

mv node_modules node_modules.bak

cd test/azure-sdk-for-js
npm i -g @microsoft/rush

rush purge
rush install #|| rush install # try twice, the first seems to fail for no reason, but then it works

# Override all `tsconfig.json` to prevent it picking up type definitions from our
# node_modules (which is a parent dir).
# Manually filtering a couple of dodgy ones out, because they contain json comments, which jq can't parse
# for f in $(find . -name tsconfig.json | grep -v node_modules); do
#   cp "$f" "$f.bak"
#   cat "$f.bak" | jq '. * { "compilerOptions": { "typeRoots": ["./node_modules/@types/"] }}' > "$f" || echo "skipping $f"
#   rm "$f.bak"
# done

cd sdk/cosmosdb/cosmos

# Fix TypeScript compilation errors by adding "dom" to lib array for console support
# jq '.compilerOptions.lib = (.compilerOptions.lib // ["es2019"]) + ["dom"] | .compilerOptions.lib |= unique' tsconfig.json > tsconfig.json.tmp && mv tsconfig.json.tmp tsconfig.json
# jq '.compilerOptions.lib = (.compilerOptions.lib // ["es2019"]) + ["dom"] | .compilerOptions.lib |= unique' test/tsconfig.json > test/tsconfig.json.tmp && mv test/tsconfig.json.tmp test/tsconfig.json

rush build -t . && rush test -t .

#git reset --hard

cd ../../../../../
mv node_modules.bak node_modules

readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
ts-node ./src/cli.ts -p "$port" &
pid=$!

cd test/azure-sdk-for-js/sdk/cosmosdb/cosmos

ACCOUNT_HOST="https://localhost:$port" npm run test:node:integration -- --testNamePattern='\^\(?!.*\(Authorization\|Change\ Feed\|Partition\|indexing\|Offer\ CRUD\|Permission\|Session\ Token\|sproc\|stored\ procedure\|Trigger\|TTL\|User\|Non\ Partitioned\|autoscale\|nonStreaming\|Iterator\|startFromBeginnin\|Full\ Text\ Search\|Full\ text\ search\ feature\|GROUP\ BY\|TOP\|DISTINCT\|ORDER\ BY\|LIMIT\|Conflicts\|readOffer\|validate\ trigger\ functionality\|SELECT\ VALUE\ AVG\ with\ ORDER\ BY\|changeFeedIterator\|test\ changefeed\|validate\ changefeed\ results\|New\ session\ token\|Validate\ SSL\ verification\|test\ batch\ operations\|test\ bulk\ operations\|test\ executeBulkOperations\|Id\ encoding\|Correlated\ Activity.*force\ query\ plan\|Correlated\ Activity.*GROUP\ BY\|aggregate\ query\ over\ null\ value\|Vector\ search\ feature\|Vector\ Search\ Query\|Bad\ partition\ key\ definition\|Reading\ items\ using\ container\|ClientSideEncryption\)\).*'
