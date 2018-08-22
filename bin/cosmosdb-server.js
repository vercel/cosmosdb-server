#!/usr/bin/env node
const cosmosDBServer = require("../lib");

const argv = process.argv.slice(2);
const args = {};
while (argv.length) {
  const key = argv.shift();
  switch (key) {
    case "-h":
    case "--help":
      args.help = true;
      break;
    case "-p":
    case "--port":
      args.port = argv.shift();
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
`);
  process.exit();
}

const server = cosmosDBServer().listen(args.port, () => {
  const { address, family, port } = server.address();
  // eslint-disable-next-line no-console
  console.log(
    `Ready to accept connections at ${
      family === "IPv6" ? `[${address}]` : address
    }:${port}`
  );
});
