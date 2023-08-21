# cosmosdb-server

A Cosmos DB server implementation for testing your apps locally.

```js
const { default: cosmosServer } = require("@vercel/cosmosdb-server");
const { CosmosClient } = require("@azure/cosmos");
const https = require("https");

cosmosServer().listen(3000, () => {
  console.log(`Cosmos DB server running at https://localhost:3000`);

  runClient().catch(console.error);
});

async function runClient() {
  const client = new CosmosClient({
    endpoint: `https://localhost:3000`,
    key: "dummy key",
    // disable SSL verification
    // since the server uses self-signed certificate
    agent: https.Agent({ rejectUnauthorized: false })
  });

  // initialize databases since the server is always empty when it boots
  const { database } = await client.databases.createIfNotExists({ id: 'test-db' });
  const { container } = await database.containers.createIfNotExists({ id: 'test-container' });

  // use the client
  // ...
}
```

To choose between listening for HTTP and HTTPS, import the right function.

```js
const { createHttpServer, createHttpsServer } = require("@vercel/cosmosdb-server"); 
```

To run the server on cli:

```sh
cosmosdb-server -p 3000
```

or without SSL:

```sh
cosmosdb-server -p 3000 --no-ssl
```

## installation

```sh
npm install @vercel/cosmosdb-server
```

It exposes the `cosmosdb-server` cli command as well.

## API

#### cosmosServer(opts?: https.ServerOptions): https.Server

Create a new instance of cosmos server. You can pass https server options as the argument.

See [`https.createServer`](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) for more information.

## Supported operations

- Database operations.
- Container operations.
- Item operations.
- User-defined function operations.
- Any SQL queries except the spatial functions `ST_ISVALID` and `ST_ISVALIDDETAILED`. Other spatial functions are supported; however, the `ST_DISTANCE` function uses centroid distances and results may differ from Cosmos DB values.

It may not support newly added features yet. Please report on the Github issue if you find one.

## Developing

To build the project, use `yarn build`.

To run the server from development code, after building, use `node lib/cli.js`.
