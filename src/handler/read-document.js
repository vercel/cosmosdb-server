// @flow
module.exports = (
  dbs: Map<string, Map<string, any>>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  { dbId, collId, docId }: { dbId: string, collId: string, docId: string }
) => {
  const db = dbs.get(dbId) || new Map();
  const coll = db.get(collId) || new Map();
  return coll.get(docId);
};
