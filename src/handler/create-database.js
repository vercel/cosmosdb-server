// @flow
const uuid = require("uuid/v1");
const { INTERNAL_DB, DATABASES_COLL } = require("../constants");
const json = require("../json");
const rid = require("../rid");

module.exports = async (dbs: Map<string, any>, req: http$IncomingMessage) => {
  const body = await json(req);
  if (!body.id) {
    throw new Error("Missing id");
  }

  const _rid = rid();
  const doc = {
    ...body,
    _rid,
    _etag: uuid(),
    _self: `/dbs/${_rid}`
  };
  const db: Map<string, any> = dbs.get(INTERNAL_DB) || new Map();
  const coll: Map<string, {}> = db.get(DATABASES_COLL) || new Map();
  coll.set(doc.id, doc);
  db.set(DATABASES_COLL, coll);
  dbs.set(INTERNAL_DB, db);

  return doc;
};
