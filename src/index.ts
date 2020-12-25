import { readFileSync } from "fs";
import { createServer, ServerOptions } from "https";
import { join } from "path";
import * as tls from "tls";
import uuid from "uuid/v4";
import Account from "./account";
import routes from "./routes";

const options: ServerOptions = {
  cert: readFileSync(join(__dirname, "..", "cert.pem")),
  key: readFileSync(join(__dirname, "..", "key.pem")),
  minVersion: "TLSv1" as tls.SecureVersion,
  rejectUnauthorized: false,
  requestCert: false
};

export default (opts?: ServerOptions) => {
  let account: Account | undefined;

  const server = createServer({ ...options, ...opts }, (req, res) => {
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
      res.setHeader(
        "content-location",
        `https://${req.headers.host}${req.url}`
      );
      res.setHeader("connection", "close");
      res.setHeader("x-ms-activity-id", uuid());
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
  }).on("listening", () => {
    const address = server.address();
    if (typeof address === "object" && address) {
      account = new Account(address.port);
    } else {
      throw new Error(`Unexpected address type: ${address}`);
    }
  });

  return server;
};
