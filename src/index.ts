import { readFileSync } from "fs";
import { createServer } from "https";
import { join } from "path";
import * as tls from "tls";
import Account from "./account";
import routes from "./routes";

const options = {
  cert: readFileSync(join(__dirname, "..", "cert.pem")),
  key: readFileSync(join(__dirname, "..", "key.pem")),
  minVersion: "TLSv1" as tls.SecureVersion,
  rejectUnauthorized: false,
  requestCert: false
};

export default () => {
  const account = new Account();

  return createServer(options, (req, res) => {
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
        `https://${req.headers.host}${req.url}`
      );
      res.setHeader("connection", "close");
      res.setHeader("x-ms-request-charge", "1");
      res.end(JSON.stringify(body));
    })().catch(err => {
      // eslint-disable-next-line no-console
      console.error(err);
      if (!res.finished) {
        res.statusCode = 500;
        res.end("");
      }
    });
  });
};
