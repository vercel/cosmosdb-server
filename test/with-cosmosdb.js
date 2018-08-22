// @flow
/* eslint-disable global-require */

const cosmosDBServerMock = require("../src");

module.exports = function withCosmosDBServer(fn: () => any) {
  return async (...args: any[]) => {
    const server = cosmosDBServerMock();
    await new Promise(resolve => {
      server.listen(resolve);
    });
    const { port } = server.address();

    const client = require("@zeit/cosmosdb")({
      accountId: "test-acccount",
      databaseName: "test-database",
      disableLogging: true,
      endpoint: `https://localhost:${port}`,
      masterKey: "test-masterkey"
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
