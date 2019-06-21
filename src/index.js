// @flow
const { readFileSync } = require("fs");
const { createServer } = require("https");
const { join } = require("path");
const Account = require("./account");
const routes = require("./routes");

const options = {
  cert: readFileSync(join(__dirname, "..", "cert.pem")),
  key: readFileSync(join(__dirname, "..", "key.pem")),
  minVersion: "TLSv1",
  rejectUnauthorized: false,
  requestCert: false
};

module.exports = () => {
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
