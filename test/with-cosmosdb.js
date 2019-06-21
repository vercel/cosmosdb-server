// @flow
/* eslint-disable global-require */

const { CosmosClient } = require("@azure/cosmos");
const cosmosDBServerMock = require("../src");

module.exports = function withCosmosDBServer(fn: (...any) => any) {
  return async (...args: any[]) => {
    const server = cosmosDBServerMock();
    await new Promise(resolve => {
      server.listen(0, resolve);
    });
    const { port } = server.address();

    const client = new CosmosClient({
      endpoint: `https://localhost:${port}`,
      auth: {
        masterKey: "test-master-key"
      }
    });

    try {
      return await fn(...args, client);
    } finally {
      await new Promise(resolve => {
        server.close(resolve);
      });
    }
  };
};
