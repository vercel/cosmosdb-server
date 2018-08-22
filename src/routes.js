const readCollection = require("./handler/read-collection");
const readDocument = require("./handler/read-document");
const readDocuments = require("./handler/read-documents");
const readMeta = require("./handler/read-meta");
const upsertDocument = require("./handler/upsert-document");
const router = require("./router");

module.exports = router({
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
