// @flow
module.exports = (
  dbs: Map<string, Map<string, Object>>,
  req: http$IncomingMessage,
  res: http$ServerResponse,
  {
    dbName,
    collName,
    docId
  }: { dbName: string, collName: string, docId: string }
) => {
  const db = dbs.get(dbName) || new Map();
  const coll = db.get(collName) || new Map();
  return coll.get(docId);
};
