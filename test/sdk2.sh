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

# # Update pnpm version in rush.json. Version 7.26.0 contains a bug.
# sed -i '' 's/"pnpmVersion": "7.26.0"/"pnpmVersion": "7.33.7"/' rush.json

# npm i -g @microsoft/rush
# rush install || rush install # try twice, the first seems to fail for no reason, but then it works

# # Override all `tsconfig.json` to prevent it picking up type definitions from our
# # node_modules (which is a parent dir).
# # Manually filtering a couple of dodgy ones out, because they contain json comments, which jq can't parse
# for f in $(find . -name tsconfig.json | grep -v node_modules); do
#   cp "$f" "$f.bak"
#   cat "$f.bak" | jq '. * { "compilerOptions": { "typeRoots": ["./node_modules/@types/"] }}' > "$f" || echo "skipping $f"
#   rm "$f.bak"
# done

cd test/azure-sdk-for-js/sdk/cosmosdb/cosmos
# rush build -t . && rush test -t .

# git reset --hard

# ACCOUNT_HOST="https://localhost:$port" npm run test:node:integration -- \
#   --config vitest.int.config.ts \
#   --exclude="**/*{Authorization,http proxy,Change Feed,Partition,partitions,indexing,Offer CRUD,Parallel Query As String,Permission,Query Metrics On Single Partition Collection,ResourceLink Trimming,Session Token,spatial,sproc,stored procedure,Trigger,trigger,TTL,User,Non Partitioned,Validate SSL verification,matching constant version & package version,Conflicts,GROUP BY,.readOffer,autoscale,with v2 container,nonStreaming,Iterator,startFromBeginning}*"



# Set pattern as environment variable to avoid shell escaping issues
# export VITEST_TEST_NAME_PATTERN='\^\(?!.*\(Authorization\|Change\ Feed\|Partition\|indexing\|Offer\ CRUD\|Permission\|Session\ Token\|sproc\|stored\ procedure\|Trigger\|TTL\|User\|Non\ Partitioned\|autoscale\|nonStreaming\|Iterator\|startFromBeginning\)\).*\$'
# ACCOUNT_HOST="https://localhost:$port" npm run test:node:integration -- --testNamePattern="$VITEST_TEST_NAME_PATTERN"

ACCOUNT_HOST="https://localhost:$port" npm run test:node:integration -- --testNamePattern='\^\(?!.*\(Authorization\|Change\ Feed\|Partition\|indexing\|Offer\ CRUD\|Permission\|Session\ Token\|sproc\|stored\ procedure\|Trigger\|TTL\|User\|Non\ Partitioned\|autoscale\|nonStreaming\|Iterator\|startFromBeginnin\|Full\ Text\ Search\|Full\ text\ search\ feature\|GROUP\ BY\|TOP\|DISTINCT\|ORDER\ BY\|LIMIT\|Conflicts\|readOffer\|validate\ trigger\ functionality\|SELECT\ VALUE\ AVG\ with\ ORDER\ BY\|changeFeedIterator\|test\ changefeed\|validate\ changefeed\ results\|New\ session\ token\|Validate\ SSL\ verification\|test\ batch\ operations\|test\ bulk\ operations\|test\ executeBulkOperations\|Id\ encoding\|Correlated\ Activity.*force\ query\ plan\|Correlated\ Activity.*GROUP\ BY\|aggregate\ query\ over\ null\ value\|Vector\ search\ feature\|Vector\ Search\ Query\|Bad\ partition\ key\ definition\|Reading\ items\ using\ container\|ClientSideEncryption\)\).*'
# ACCOUNT_HOST="https://localhost:$port" npm run test:node:integration -- --testNamePattern="\^.*patch\ operations.*\$"
