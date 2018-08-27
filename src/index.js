// @flow
const { readFileSync } = require("fs");
const { createServer } = require("https");
const { join } = require("path");
const routes = require("./routes");

const options = {
  cert: readFileSync(join(__dirname, "..", "cert.pem")),
  key: readFileSync(join(__dirname, "..", "key.pem")),
  rejectUnauthorized: false,
  requestCert: false
};

module.exports = () => {
  const dbs = new Map();

  return createServer(options, (req, res) => {
    const route = routes(req);

    (async () => {
      let body;
      if (route) {
        const [params, handler] = route;
        try {
          body = await handler(dbs, req, res, params);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          res.statusCode = 500;
        }
      } else {
        res.statusCode = 400;
      }

      if (!body && res.statusCode === 200) {
        res.statusCode = 404;
      }

      res.setHeader("content-type", "application/json");
      res.setHeader(
        "content-location",
        `https://${req.headers.host}/${req.url}`
      );
      res.end(JSON.stringify(body || {}));
    })().catch(err => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  });
};
