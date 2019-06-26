/* eslint-disable global-require */
import { CosmosClient } from "@azure/cosmos";
import * as net from "net";
import cosmosDBServer from "../src";

export default function withCosmosDBServer(fn: (...args: any[]) => any) {
  return async (...args: any[]) => {
    const server = cosmosDBServer();
    await new Promise(resolve => {
      server.listen(0, resolve);
    });
    const { port } = server.address() as net.AddressInfo;

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
}
