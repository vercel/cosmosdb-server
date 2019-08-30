# cosmosdb-server

A Cosmos DB server implementation for testing your apps locally.

```js
const { default: cosmosServer } = require('@zeit/cosmosdb-server');
const { CosmosClient } = require('@azure/cosmos');

// disable SSL verification
// since the server uses self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

cosmosServer().listen(3000, () => {
  console.log(`Cosmos DB server running at https://localhost:3000`);

  runClient().catch(console.error);
});

async function runClient() {
  const client = new CosmosClient({
    endpoint: `https://localhost:3000`,
    key: "dummy key"
  });

  // initialize databases since the server is always empty when it boots
  const { database } = await client.databases.createIfNotExists({ id: 'test-db' });
  const { container } = await database.containers.createIfNotExists({ id: 'test-container' });

  // use the client
  // ...
});
```

To run the server on cli:

```sh
cosmosdb-server -p 3000
```

## installation

```sh
npm install @zeit/cosmosdb-server
```

It exposes the `cosmosdb-server` cli command as well.

## Supported operations

- Database operations.
- Container operations.
- Item operations.
- User-defined function operations.
- Any SQL queries except spatial functions
