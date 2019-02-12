const createCollection = require("./handler/create-collection");
const createDatabase = require("./handler/create-database");
const createDocument = require("./handler/create-document");
const createUserDefinedFunction = require("./handler/create-user-defined-function");
const deleteCollection = require("./handler/delete-collection");
const deleteDocument = require("./handler/delete-document");
const deleteDatabase = require("./handler/delete-database");
const deleteUserDefinedFunction = require("./handler/delete-user-defined-function");
const queryCollections = require("./handler/query-collections");
const queryDatabases = require("./handler/query-databases");
const queryDocuments = require("./handler/query-documents");
const queryUserDefinedFunctions = require("./handler/query-user-defined-functions");
const readCollection = require("./handler/read-collection");
const readCollections = require("./handler/read-collections");
const readDatabase = require("./handler/read-database");
const readDatabases = require("./handler/read-databases");
const readDocument = require("./handler/read-document");
const readDocuments = require("./handler/read-documents");
const readMeta = require("./handler/read-meta");
const readUserDefinedFunction = require("./handler/read-user-defined-function");
const readUserDefinedFunctions = require("./handler/read-user-defined-functions");
const replaceCollection = require("./handler/replace-collection");
const replaceDocument = require("./handler/replace-document");
const replaceUserDefinedFunction = require("./handler/replace-user-defined-function");
const upsertDocument = require("./handler/upsert-document");
const upsertUserDefinedFunction = require("./handler/upsert-user-defined-function");
const router = require("./router");

module.exports = router({
  DELETE: {
    "/dbs/:dbId/colls/:collId/docs/:docId": deleteDocument,
    "/dbs/:dbId/colls/:collId/udfs/:udfId": deleteUserDefinedFunction,
    "/dbs/:dbId/colls/:collId": deleteCollection,
    "/dbs/:dbId": deleteDatabase
  },
  GET: {
    "/dbs/:dbId/colls/:collId/docs/:docId": readDocument,
    "/dbs/:dbId/colls/:collId/docs": readDocuments,
    "/dbs/:dbId/colls/:collId/udfs/:udfId": readUserDefinedFunction,
    "/dbs/:dbId/colls/:collId/udfs": readUserDefinedFunctions,
    "/dbs/:dbId/colls/:collId": readCollection,
    "/dbs/:dbId/colls": readCollections,
    "/dbs/:dbId": readDatabase,
    "/dbs": readDatabases,
    "/": readMeta
  },
  POST: {
    "/dbs/:dbId/colls/:collId/docs": createDocument,
    "/dbs/:dbId/colls/:collId/udfs": createUserDefinedFunction,
    "/dbs/:dbId/colls": createCollection,
    "/dbs": createDatabase
  },
  POST_UPSERT: {
    "/dbs/:dbId/colls/:collId/docs": upsertDocument,
    "/dbs/:dbId/colls/:collId/udfs": upsertUserDefinedFunction
  },
  POST_QUERY: {
    "/dbs/:dbId/colls/:collId/docs": queryDocuments,
    "/dbs/:dbId/colls/:collId/udfs": queryUserDefinedFunctions,
    "/dbs/:dbId/colls": queryCollections,
    "/dbs": queryDatabases
  },
  PUT: {
    "/dbs/:dbId/colls/:collId/docs/:docId": replaceDocument,
    "/dbs/:dbId/colls/:collId/udfs/:udfId": replaceUserDefinedFunction,
    "/dbs/:dbId/colls/:collId": replaceCollection
  }
});
