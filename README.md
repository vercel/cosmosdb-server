# cosmosdb-server

A Cosmos DB server implementation for testing your apps locally.

```js
const { default: cosmosServer } = require("@zeit/cosmosdb-server");
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

To run the server on cli:

```sh
cosmosdb-server -p 3000
```

## installation

```sh
npm install @zeit/cosmosdb-server
```

It exposes the `cosmosdb-server` cli command as well.

### Setup for Java

Add the certificate to the Java CA certificates store like the following:

```sh
# Example for MacOS. Adjust paths and command according to your environment.
sudo keytool -keystore "$JAVA_HOME/jre/lib/security/cacerts" -importcert -alias vercel-cosmosdb-server -file node_modules/@zeit/cosmosdb-server/cert.pem
```

Also ensure to use Gateway mode for the connection policy since this server doesn't support Direct mode:

```java
import com.azure.cosmos.ConnectionMode;
import com.azure.cosmos.ConnectionPolicy

...

ConnectionPolicy policy = ConnectionPolicy.getDefaultPolicy();
policy.setConnectionMode(ConnectionMode.GATEWAY);
```

## API

#### cosmosServer(opts?: https.ServerOptions): https.Server

Create a new instance of cosmos server. You can pass https server options as the argument.

See [`https.createServer`](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) for more information.

## Supported operations

- Database operations.
- Container operations.
- Item operations.
- User-defined function operations.
- Any SQL queries except spatial functions

It may not support newly added features yet. Please report on the Github issue if you find one.
