// @flow
const uuid = require("uuid/v1");
const json = require("../json");

module.exports = async (
  dbs: Map<string, Map<string, any>>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId }: { dbId: string, collId: string }
) => {
  const body = await json(req);
  if (!body.id) {
    throw new Error("Missing id");
  }

  const doc = { ...body, _etag: uuid() };
  const db = dbs.get(dbId) || new Map();
  const coll = db.get(collId) || new Map();
  coll.set(body.id, doc);
  db.set(collId, coll);
  dbs.set(dbId, db);

  return doc;
};
