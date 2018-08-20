// @flow
const { readFileSync } = require("fs");
const { createServer } = require("https");
const { join } = require("path");
const readCollection = require("./handler/read-collection");
const readDocument = require("./handler/read-document");
const readDocuments = require("./handler/read-documents");
const readMeta = require("./handler/read-meta");
const upsertDocument = require("./handler/upsert-document");
const router = require("./router");

const options = {
  cert: readFileSync(join(__dirname, "..", "cert.pem")),
  key: readFileSync(join(__dirname, "..", "key.pem")),
  rejectUnauthorized: false,
  requestCert: false
};

const getRoute = router({
  GET: {
    "/dbs/:dbName/colls/:collName/docs/:docId": readDocument,
    "/dbs/:dbName/colls/:collName/docs": readDocuments,
    "/dbs/:dbName/colls/:collName": readCollection,
    "/": readMeta
  },
  POST: {
    "/dbs/:dbName/colls/:collName/docs": upsertDocument
  }
});

module.exports = () => {
  const dbs = new Map();

  return createServer(options, (req, res) => {
    const route = getRoute(req);

    (async () => {
      let body;
      if (route) {
        const [params, handler] = route;
        try {
          body = await handler(dbs, req, res, params);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          res.statusCode = 404;
        }
      } else {
        res.statusCode = 400;
      }

      if (!body && res.statusCode === 200) {
        res.statusCode = 404;
      }

      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(body || {}));
    })().catch(err => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  });
};
