const createDatabase = require("./handler/create-database");
const deleteDatabase = require("./handler/delete-database");
const queryDatabases = require("./handler/query-databases");
const readCollection = require("./handler/read-collection");
const readDatabase = require("./handler/read-database");
const readDatabases = require("./handler/read-databases");
const readDocument = require("./handler/read-document");
const readDocuments = require("./handler/read-documents");
const readMeta = require("./handler/read-meta");
const upsertDocument = require("./handler/upsert-document");
const router = require("./router");

module.exports = router({
  GET: {
    "/dbs/:dbId/colls/:collId/docs/:docId": readDocument,
    "/dbs/:dbId/colls/:collId/docs": readDocuments,
    "/dbs/:dbId/colls/:collId": readCollection,
    "/dbs/:dbId": readDatabase,
    "/dbs": readDatabases,
    "/": readMeta
  },
  POST: {
    "/dbs/:dbId/colls/:collId/docs": upsertDocument,
    "/dbs": createDatabase
  },
  POST_QUERY: {
    "/dbs": queryDatabases
  },
  DELETE: {
    "/dbs/:dbId": deleteDatabase
  }
});
