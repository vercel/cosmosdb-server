#!/usr/bin/env node
import * as net from "net";
import cosmosDBServer from ".";

const argv = process.argv.slice(2);
const args: { help?: boolean; port?: number, hostname?: string } = {};
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
  --host
`);
  process.exit();
}

const server = cosmosDBServer().listen(args.port, args.hostname, () => {
  const { address, family, port } = server.address() as net.AddressInfo;
  const hostname = args.hostname ? args.hostname : (
    family === "IPv6" ? `[${address}]` : address
  );
  // eslint-disable-next-line no-console
  console.log(
    `Ready to accept connections at ${hostname}:${port}`
  );
});
