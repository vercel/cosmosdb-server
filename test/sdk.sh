#!/usr/bin/env bash
## This script is used to build the Azure SDK and run their integration tests
# against our cosmosdb server.
#
# This is done to ensure we maintain compatibility with the Azure SDK.
#
# Note that the `azure-sdk-for-js` is a git submodule of this repo, and we install `rush`, as that is the
# tool they use to manage their monorepo.
set -euo pipefail

# Required so that we do not have a "phantom" node_modules directory when running
# rush. Setting "typeRoots": ["./node_modules/@types/"] in all tsconfig.json files
# does not work.
mv node_modules node_modules.bak

cd test/azure-sdk-for-js
npm i -g @microsoft/rush

rush purge
rush install

cd sdk/cosmosdb/cosmos
rush build -t . && rush test -t .

# Cosmos SDK has been built and tested. We can use again the root node_modules directory.
cd ../../../../../
mv node_modules.bak node_modules

# Start a local CosmosDB server.
readonly port="$((RANDOM + 3000))"
trap 'kill -9 $pid' EXIT
ts-node ./src/cli.ts -p "$port" &
pid=$!

# Run the tests against the local CosmosDB server.
# The executed tests are for Cosmos SDK 4.5.0, but we only have partial support for 3.17.x.
# That is why there are so many ignored test patterns.
cd test/azure-sdk-for-js/sdk/cosmosdb/cosmos
ACCOUNT_HOST="https://localhost:$port" npm run test:node:integration -- --testNamePattern='\^\(?!.*\(Authorization\|Change\ Feed\|Partition\|indexing\|Offer\ CRUD\|Permission\|Session\ Token\|sproc\|stored\ procedure\|Trigger\|TTL\|User\|Non\ Partitioned\|autoscale\|nonStreaming\|Iterator\|startFromBeginnin\|Full\ Text\ Search\|Full\ text\ search\ feature\|GROUP\ BY\|TOP\|DISTINCT\|ORDER\ BY\|LIMIT\|Conflicts\|readOffer\|validate\ trigger\ functionality\|SELECT\ VALUE\ AVG\ with\ ORDER\ BY\|changeFeedIterator\|test\ changefeed\|validate\ changefeed\ results\|New\ session\ token\|Validate\ SSL\ verification\|test\ batch\ operations\|test\ bulk\ operations\|test\ executeBulkOperations\|Id\ encoding\|Correlated\ Activity.*force\ query\ plan\|Correlated\ Activity.*GROUP\ BY\|aggregate\ query\ over\ null\ value\|Vector\ search\ feature\|Vector\ Search\ Query\|Bad\ partition\ key\ definition\|Reading\ items\ using\ container\|ClientSideEncryption\)\).*'
