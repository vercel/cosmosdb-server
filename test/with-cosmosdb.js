// @flow
/* eslint-disable global-require */

const cosmosDBServerMock = require("../src");

module.exports = function withCosmosDBServer(
  mock: (string, any) => void,
  fn: () => any
) {
  return async (...args: any[]) => {
    const server = cosmosDBServerMock();
    await new Promise(resolve => {
      server.listen(resolve);
    });
    const { port } = server.address();

    mock("@zeit/cosmosdb/lib/pick-region", () => `https://localhost:${port}`);

    const client = require("@zeit/cosmosdb")({
      accountId: "test-acccount",
      databaseName: "test-database",
      disableLogging: true,
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
