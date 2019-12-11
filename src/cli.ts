#!/usr/bin/env node
import * as net from "net";
import cosmosDBServer from ".";

const argv = process.argv.slice(2);
const args: { help?: boolean; port?: number, secure: boolean } = { secure: true };
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
    case "-i":
    case "--insecure":
      args.secure = false;
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
  -i, --insecure : http instead of the default https
`);
  process.exit();
}

const server = cosmosDBServer(args.secure).listen(args.port, () => {
  const { address, family, port } = server.address() as net.AddressInfo;
  // eslint-disable-next-line no-console
  console.log(
    `Ready to accept connections at ${args.secure ? 'https' : 'http'}://${
      family === "IPv6" ? `[${address}]` : address
    }:${port}/`
  );
});
