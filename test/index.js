// @flow
/* eslint-disable no-underscore-dangle */

const assert = require("assert");
const withCosmosDB = require("./with-cosmosdb");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function withTestEnv(fn: Object => any) {
  return withCosmosDB(fn);
}

exports.readDocument404 = withTestEnv(
  async ({ collectionLink, readDocument }) => {
    const collLink = collectionLink("test-collection");
    try {
      await readDocument(`${collLink}/docs/not-exist`);
      // $FlowFixMe
      assert.fail();
    } catch (err) {
      assert.equal(err.statusCode, 404);
    }
  }
);

exports.upsertDocument = withTestEnv(
  async ({ collectionLink, readDocument, upsertDocument }) => {
    const collLink = collectionLink("test-collection");
    await upsertDocument(collLink, { id: "test", text: "hi" });
    const doc = await readDocument(`${collLink}/docs/test`);
    assert.strictEqual(doc.id, "test");
    assert.strictEqual(doc.text, "hi");
    assert(doc._etag);
  }
);

exports.upsertDocumentUpdate = withTestEnv(
  async ({ collectionLink, readDocument, upsertDocument }) => {
    const collLink = collectionLink("test-collection");
    await upsertDocument(collLink, { id: "test", text: "hi" });
    await upsertDocument(collLink, { id: "test", text: "hello" });
    const doc = await readDocument(`${collLink}/docs/test`);
    assert.strictEqual(doc.id, "test");
    assert.strictEqual(doc.text, "hello");
    assert(doc._etag);
  }
);

exports.readDocumentsEmpty = withTestEnv(
  async ({ collectionLink, readDocuments }) => {
    const collLink = collectionLink("test-collection");
    const docs = await readDocuments(collLink);
    assert.deepStrictEqual(docs, []);
  }
);

exports.readDocuments = withTestEnv(
  async ({ collectionLink, readDocuments, upsertDocument }) => {
    const collLink = collectionLink("test-collection");
    const data = [
      { id: "test1", text: "foo", n: 1 },
      { id: "test2", text: "bar", n: 2 },
      { id: "test3", text: "baz", n: 3 }
    ];
    await Promise.all(data.map(d => upsertDocument(collLink, d)));
    const docs = await readDocuments(collLink);
    assert.strictEqual(docs.length, data.length);
    const sortedDocs = docs.sort((a, b) => a.n - b.n);
    for (let i = 0, l = sortedDocs.length; i < l; i += 1) {
      const doc = sortedDocs[i];
      const d = data[i];
      assert.strictEqual(doc.id, d.id);
      assert.strictEqual(doc.text, d.text);
      assert(doc._etag);
    }
  }
);
