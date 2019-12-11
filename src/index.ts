import { readFileSync } from "fs";
import * as http from "http";
import * as https from "https";
import { join } from "path";
import * as tls from "tls";
import uuid from "uuid/v4";
import Account from "./account";
import routes from "./routes";

const options: https.ServerOptions = {
  cert: readFileSync(join(__dirname, "..", "cert.pem")),
  key: readFileSync(join(__dirname, "..", "key.pem")),
  minVersion: "TLSv1" as tls.SecureVersion,
  rejectUnauthorized: false,
  requestCert: false
};

export default (secure: boolean = true) => {
  const account = new Account();

  const createServer = secure ? https.createServer : http.createServer;
  return createServer(options, (req: http.IncomingMessage, res: http.ServerResponse) => {
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
          body = { Message: err.message };
          res.statusCode = 500;
        }
      } else {
        res.statusCode = 400;
      }

      res.setHeader("content-type", "application/json");
      res.setHeader(
        "content-location",
        `${secure ? 'https' : 'http'}://${req.headers.host}${req.url}`
      );
      res.setHeader("connection", "close");
      res.setHeader("x-ms-activity-id", activityId(req));
      res.setHeader("x-ms-request-charge", "1");
      if (req.headers["x-ms-documentdb-populatequerymetrics"]) {
        res.setHeader(
          "x-ms-documentdb-query-metrics",
          "totalExecutionTimeInMs=0.00;queryCompileTimeInMs=0.00;queryLogicalPlanBuildTimeInMs=0.00;queryPhysicalPlanBuildTimeInMs=0.00;queryOptimizationTimeInMs=0.00;VMExecutionTimeInMs=0.00;indexLookupTimeInMs=0.00;documentLoadTimeInMs=0.00;systemFunctionExecuteTimeInMs=0.00;userFunctionExecuteTimeInMs=0.00;retrievedDocumentCount=0;retrievedDocumentSize=0;outputDocumentCount=1;outputDocumentSize=0;writeOutputTimeInMs=0.00;indexUtilizationRatio=0.00"
        );
      }
      if (req.method == "GET") {
        addMsContentPathHeader(body, res);

        if (body._etag) {
          if (req.headers["if-match"] && !matches(body._etag, req.headers["if-match"])) {
            res.statusCode = 412;
            res.end("");
            return;
          }
          if (req.headers["if-none-match"] && matches(body._etag, req.headers["if-none-match"])) {
            res.statusCode = 304;
            res.end("");
            return;
          }
        }
      }          

      if (body._etag) {
        res.setHeader("ETag", body._etag);
      }

      res.end(JSON.stringify(body).replace(/\//g, '\\/'));  // the real service escapes / characters
    })().catch(err => {
      // eslint-disable-next-line no-console
      console.error(err);
      if (!res.finished) {
        res.statusCode = 500;
        res.end("");
      }
    });
  });

  function activityId(req: http.IncomingMessage ): string {
    const id = req.headers['x-ms-activity-id'];
    if (id as string)
      return id as string;
    else if (id as string[])
      return id[0];
    else
      return uuid();
  }

  function addMsContentPathHeader(body: any, res: http.ServerResponse) {
    if (body._rid && body._self && body._self.endsWith('/')) {
      const tokens = body._self.split();
      if (tokens.length > 3 && tokens[tokens.length - 2] == body._rid)
        res.setHeader('x-ms-content-path', tokens[tokens.length - 4]);
    }
  }

  function matches(needle: string, haystack: string | string[]): boolean {
    if (needle) {
      if (haystack as string)
        return haystack == needle;
      if (haystack as string[])
        return (haystack as string[]).includes(needle);
    }
    return false;
  }
};
