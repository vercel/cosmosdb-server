# cosmosdb-server

A Cosmos DB server implementation for testing your apps locally.

```js
const { default: cosmosServer } = require('@zeit/cosmosdb-server');
const { CosmosClient } = require('@azure/cosmos');

cosmosServer().listen(3000, () => {
  console.log(`Cosmos DB server running at https://localhost:3000`);

  // disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  runClient().catch(console.error);
});

async function runClient() {
  const client = new CosmosClient({
    endpoint: `https://localhost:3000`,
    auth: {
      masterKey: "test key" // dummy key
    }
  });

  // use the client
});
```

To run the server on cli:

```sh
cosmosdb-server -p 3000
```

## Supported operations

- Database operations.
- Container operations.
- Item operations.
- User-defined function operations.
- Any SQL queries except spatial functions
