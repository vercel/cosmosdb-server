#!/usr/bin/env node
import * as net from "net";
import { createHttpServer, createHttpsServer } from ".";

const argv = process.argv.slice(2);
const args: {
  help?: boolean;
  port?: number;
  hostname?: string;
  nossl?: boolean;
} = {};
while (argv.length) {
  const key = argv.shift();
  switch (key) {
    case "-h":
    case "--help":
      args.help = true;
      break;
    case "-p":
    case "--port":
      args.port = parseInt(argv.shift(), 10);
      break;
    case "--host":
      args.hostname = argv.shift();
      break;
    case "--no-ssl":
      args.nossl = true;
      break;
    default:
      break;
  }
}

if (args.help) {
  // eslint-disable-next-line no-console
  console.log(`
Usage: cosmosdb-server [options]

Options:

  -h, --help
  -p, --port
  --no-ssl
  --host
`);
  process.exit();
}

const cosmosDBServer = args.nossl ? createHttpServer : createHttpsServer;
const server = cosmosDBServer().listen(args.port, args.hostname, () => {
  const { address, family, port } = server.address() as net.AddressInfo;
  // eslint-disable-next-line no-nested-ternary
  const hostname = args.hostname
    ? args.hostname
    : family === "IPv6"
    ? `[${address}]`
    : address;
  // eslint-disable-next-line no-console
  console.log(
    `Ready to accept HTTP${
      args.nossl ? "" : "S"
    } connections at ${hostname}:${port}`
  );
});
