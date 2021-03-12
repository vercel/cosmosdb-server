import batchDocuments from "./handler/batch-documents";
import createCollection from "./handler/create-collection";
import createDatabase from "./handler/create-database";
import createDocument from "./handler/create-document";
import createUserDefinedFunction from "./handler/create-user-defined-function";
import deleteCollection from "./handler/delete-collection";
import deleteDocument from "./handler/delete-document";
import deleteDatabase from "./handler/delete-database";
import deleteUserDefinedFunction from "./handler/delete-user-defined-function";
import queryCollections from "./handler/query-collections";
import queryDatabases from "./handler/query-databases";
import queryDocuments from "./handler/query-documents";
import queryUserDefinedFunctions from "./handler/query-user-defined-functions";
import readCollection from "./handler/read-collection";
import readCollections from "./handler/read-collections";
import readDatabase from "./handler/read-database";
import readDatabases from "./handler/read-databases";
import readDocument from "./handler/read-document";
import readDocuments from "./handler/read-documents";
import readMeta from "./handler/read-meta";
import readPartitionKeyRanges from "./handler/read-partition-key-ranges";
import readUserDefinedFunction from "./handler/read-user-defined-function";
import readUserDefinedFunctions from "./handler/read-user-defined-functions";
import replaceCollection from "./handler/replace-collection";
import replaceDocument from "./handler/replace-document";
import replaceUserDefinedFunction from "./handler/replace-user-defined-function";
import upsertDocument from "./handler/upsert-document";
import upsertUserDefinedFunction from "./handler/upsert-user-defined-function";
import router from "./router";

export default router({
  DELETE: {
    "/dbs/:dbId/colls/:collId/docs/:docId": deleteDocument,
    "/dbs/:dbId/colls/:collId/udfs/:udfId": deleteUserDefinedFunction,
    "/dbs/:dbId/colls/:collId": deleteCollection,
    "/dbs/:dbId": deleteDatabase
  },
  GET: {
    "/dbs/:dbId/colls/:collId/docs/:docId": readDocument,
    "/dbs/:dbId/colls/:collId/docs": readDocuments,
    "/dbs/:dbId/colls/:collId/pkranges": readPartitionKeyRanges,
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
  POST_BATCH: {
    "/dbs/:dbId/colls/:collId/docs": batchDocuments
  },
  PUT: {
    "/dbs/:dbId/colls/:collId/docs/:docId": replaceDocument,
    "/dbs/:dbId/colls/:collId/udfs/:udfId": replaceUserDefinedFunction,
    "/dbs/:dbId/colls/:collId": replaceCollection
  }
});
