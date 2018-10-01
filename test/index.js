// @flow

const assert = require("assert");
const withCosmosDB = require("./with-cosmosdb");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function withTestEnv(fn: Object => any) {
  return withCosmosDB(fn);
}

exports.readDocument404 = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const item = container.item("not-exist");

  try {
    await item.read();
    // $FlowFixMe
    assert.fail();
  } catch (err) {
    assert.equal(err.code, 404);
  }
});

exports.upsertDocument = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  await container.items.upsert({ id: "test", text: "hi" });
  const { body } = await container.item("test").read();
  assert.strictEqual(body.id, "test");
  assert.strictEqual(body.text, "hi");
  assert(body._etag);
});

exports.upsertDocumentUpdate = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  await container.items.upsert({ id: "test", text: "hi" });
  await container.items.upsert({ id: "test", text: "hello" });
  const { body } = await container.item("test").read();
  assert.strictEqual(body.id, "test");
  assert.strictEqual(body.text, "hello");
  assert(body._etag);
});

exports.readDocumentsEmpty = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const { result } = await container.items.readAll().toArray();
  assert.deepStrictEqual(result, []);
});

exports.readDocuments = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const data = [
    { id: "test1", text: "foo", n: 1 },
    { id: "test2", text: "bar", n: 2 },
    { id: "test3", text: "baz", n: 3 }
  ];
  await Promise.all(data.map(d => container.items.upsert(d)));
  const { result } = await container.items.readAll().toArray();
  assert.strictEqual(result.length, data.length);
  const sortedResult = result.sort((a, b) => a.n - b.n);
  for (let i = 0, l = sortedResult.length; i < l; i += 1) {
    const r = sortedResult[i];
    const d = data[i];
    assert.strictEqual(r.id, d.id);
    assert.strictEqual(r.text, d.text);
    assert(r._etag);
  }
});

exports.udf = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  await container.userDefinedFunctions.create({
    id: "REGEX_MATCH",
    body: `
      function(input, pattern) {
        return input.match(pattern) !== null
      }
    `
  });
  const { result } = await container.items
    .query(`SELECT VALUE udf.REGEX_MATCH("foobar", ".*bar")`)
    .toArray();
  assert.deepStrictEqual(result, [true]);
});
