import { readFileSync } from "fs";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import { join } from "path";
import * as tls from "tls";
import { randomUUID } from "crypto";
import Account from "./account";
import routes from "./routes";

const generateRequestHandler = ({
  keepAlive = false
}: {
  /**
   * If set to `true` adds `Connection: keep-alive` header, otherwise uses
   * `Connection: close`.
   */
  keepAlive?: boolean | undefined;
}) => (
  account: Account,
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const route = routes(req);

  (async () => {
    let body;
    if (route) {
      const [params, handler] = route;
      try {
        body = await handler(account, req, res, params);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        body = { message: err.message };
        res.statusCode = 500;
      }
      if (res.statusCode > 399 && !body.message) {
        body.message = "";
      }
    } else {
      res.statusCode = 400;
      body = { message: "no route" };
    }

    if (body && body._etag) {
      res.setHeader("etag", body._etag);
    }

    res.setHeader("content-type", "application/json");
    res.setHeader("content-location", `https://${req.headers.host}${req.url}`);
    res.setHeader("connection", keepAlive ? "keep-alive" : "close");
    res.setHeader("x-ms-activity-id", randomUUID());
    res.setHeader("x-ms-request-charge", "1");
    if (req.headers["x-ms-documentdb-populatequerymetrics"]) {
      res.setHeader(
        "x-ms-documentdb-query-metrics",
        "totalExecutionTimeInMs=0.00;queryCompileTimeInMs=0.00;queryLogicalPlanBuildTimeInMs=0.00;queryPhysicalPlanBuildTimeInMs=0.00;queryOptimizationTimeInMs=0.00;VMExecutionTimeInMs=0.00;indexLookupTimeInMs=0.00;documentLoadTimeInMs=0.00;systemFunctionExecuteTimeInMs=0.00;userFunctionExecuteTimeInMs=0.00;retrievedDocumentCount=0;retrievedDocumentSize=0;outputDocumentCount=1;outputDocumentSize=0;writeOutputTimeInMs=0.00;indexUtilizationRatio=0.00"
      );
    }

    if (req.headers["a-im"] && res.statusCode === 200) {
      if (req.headers["if-none-match"]) {
        res.statusCode = 304;
      }
      res.setHeader("etag", "1");
    }
    res.end(JSON.stringify(body));
  })().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    if (!res.finished) {
      res.statusCode = 500;
      res.end("");
    }
  });
};

const createAccount = (address: string | net.AddressInfo) => {
  if (!address || typeof address !== "object") {
    throw new Error(`Unexpected address type: ${address}`);
  }

  const { address: host, port } = address as net.AddressInfo;
  const hostname = host === "0.0.0.0" || host === "::" ? "localhost" : host;

  return new Account(hostname, port);
};

export function createHttpServer(opts: http.ServerOptions = {}) {
  let account: Account | undefined;

  const handleRequest = generateRequestHandler({
    keepAlive: opts.keepAlive
  });
  const server = http
    .createServer(opts, (req, res) => {
      handleRequest(account, req, res);
    })
    .on("listening", () => {
      account = createAccount(server.address());
    });

  return server;
}

export function createHttpsServer(opts?: https.ServerOptions) {
  let account: Account | undefined;

  const options: https.ServerOptions = {
    cert: readFileSync(join(__dirname, "..", "cert.pem")),
    key: readFileSync(join(__dirname, "..", "key.pem")),
    minVersion: "TLSv1" as tls.SecureVersion,
    rejectUnauthorized: false,
    requestCert: false,
    ...opts
  };

  const handleRequest = generateRequestHandler({
    keepAlive: options.keepAlive
  });
  const server = https
    .createServer(options, (req, res) => {
      handleRequest(account, req, res);
    })
    .on("listening", () => {
      account = createAccount(server.address());
    });

  return server;
}

export default createHttpsServer;
