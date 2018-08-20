// @flow
const getRawBody = require("raw-body");
const uuid = require("uuid/v1");

module.exports = async (
  dbs: Map<string, Map<string, Object>>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbName, collName }: { dbName: string, collName: string }
) => {
  const rawBody = await getRawBody(req);
  const body = JSON.parse(rawBody);
  if (!body.id) {
    throw new Error("Missing id");
  }

  const doc = { ...body, _etag: uuid() };
  const db = dbs.get(dbName) || new Map();
  const coll = db.get(collName) || new Map();
  coll.set(body.id, doc);
  db.set(collName, coll);
  dbs.set(dbName, db);

  return doc;
};
