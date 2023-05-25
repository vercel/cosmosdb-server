import { BulkOperationType } from "@azure/cosmos";
import assert from "assert";
import withCosmosDB from "./with-cosmosdb";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function withTestEnv(fn: (x0: { [x: string]: any }) => any) {
  return withCosmosDB(fn);
}

const readDocument404 = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const item = container.item("not-exist");

  const { resource, statusCode } = await item.read();
  assert.strictEqual(resource, undefined);
  assert.strictEqual(statusCode, 404);
});

const upsertDocument = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  await container.items.upsert({ id: "test", text: "hi" });
  const { resource } = await container.item("test").read();

  assert.strictEqual(resource.id, "test");
  assert.strictEqual(resource.text, "hi");
  assert(resource._etag);
});

const upsertDocumentUpdate = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  await container.items.upsert({ id: "test", text: "hi" });
  await container.items.upsert({ id: "test", text: "hello" });
  const { resource } = await container.item("test").read();
  assert.strictEqual(resource.id, "test");
  assert.strictEqual(resource.text, "hello");
  assert(resource._etag);
});

const readDocumentsEmpty = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const { resources } = await container.items.readAll().fetchAll();
  assert.deepStrictEqual(resources, []);
});

const readDocuments = withTestEnv(async client => {
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
  const { resources } = await container.items.readAll().fetchAll();
  assert.strictEqual(resources.length, data.length);
  const sortedResult = resources.sort(
    (a: { n: number }, b: { n: number }) => a.n - b.n
  );
  for (let i = 0, l = sortedResult.length; i < l; i += 1) {
    const r = sortedResult[i];
    const d = data[i];
    assert.strictEqual(r.id, d.id);
    assert.strictEqual(r.text, d.text);
    assert(r._etag);
  }
});

const udf = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  await container.scripts.userDefinedFunctions.create({
    id: "REGEX_MATCH",
    body: `
      function(input, pattern) {
        return input.match(pattern) !== null
      }
    `
  });
  const { resources } = await container.items
    .query(`SELECT VALUE udf.REGEX_MATCH("foobar", ".*bar")`)
    .fetchAll();
  assert.deepStrictEqual(resources, [true]);
});

const deleteDatabase = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const result = await database.delete();
  assert.strictEqual(result.statusCode, 204);
});

const deleteDocument404 = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const item = container.item("test-item");

  try {
    await item.delete();
    assert.fail();
  } catch (err) {
    assert.strictEqual(err.code, 404);
  }
});

const querySyntaxError = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-container"
  });
  try {
    await container.items.query("INVALID SELECT *").fetchAll();
    assert.fail();
  } catch (err) {
    assert.strictEqual(err.code, 400);
  }
});

const failsToCreateInvalidCompositeIndexes = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const params = {
    id: "test-container",
    indexingPolicy: {
      compositeIndexes: [
        [
          {
            path: "/sortKey1",
            order: "invalid"
          },
          {
            path: "/sortKey2",
            order: "descending"
          }
        ]
      ]
    }
  };
  try {
    await database.containers.create(params);
    assert.fail();
  } catch (err) {
    assert.strictEqual(err.code, 400);
  }
});

const queryWithMultipleOrderBy = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-container",
    indexingPolicy: {
      compositeIndexes: [
        [
          {
            path: "/sortKey1"
          },
          {
            path: "/sortKey2",
            order: "descending"
          }
        ]
      ]
    }
  });

  const data = [
    { id: "id1", sortKey1: "a", sortKey2: "a" },
    { id: "id2", sortKey1: "a", sortKey2: "b" },
    { id: "id3", sortKey1: "b", sortKey2: "a" },
    { id: "id4", sortKey1: "b", sortKey2: "b" }
  ];
  await Promise.all(data.map(d => container.items.create(d)));

  const { resources } = await container.items
    .query(
      "SELECT c.id, c.sortKey1, c.sortKey2 FROM c ORDER BY c.sortKey1, c.sortKey2 DESC"
    )
    .fetchAll();
  assert.deepStrictEqual(resources, [
    { id: "id2", sortKey1: "a", sortKey2: "b" },
    { id: "id1", sortKey1: "a", sortKey2: "a" },
    { id: "id4", sortKey1: "b", sortKey2: "b" },
    { id: "id3", sortKey1: "b", sortKey2: "a" }
  ]);
});

const queryWithMultipleOrderByFailsWhenNoCompositeIndexes = withTestEnv(
  async client => {
    const { database } = await client.databases.create({ id: "test-database" });
    const { container } = await database.containers.create({
      id: "test-container"
    });
    try {
      await container.items
        .query("SELECT * FROM c ORDER BY c.sortKey1, c.sortKey2")
        .fetchAll();
      assert.fail();
    } catch (err) {
      assert.strictEqual(err.code, 400);
    }
  }
);

const queryWithInvalidMultipleOrderByFails = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-container",
    indexingPolicy: {
      compositeIndexes: [
        [
          {
            path: "/sortKey1"
          },
          {
            path: "/sortKey2",
            order: "descending"
          }
        ]
      ]
    }
  });
  try {
    await container.items
      .query("SELECT * FROM c ORDER BY c.sortKey1, c.sortKey2")
      .fetchAll();
    assert.fail();
  } catch (err) {
    assert.strictEqual(err.code, 400);
  }
});

const bulkApi = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-container",
    partitionKey: {
      paths: ["/key"]
    }
  });

  await container.items.create({
    id: "item1",
    key: "A",
    class: "2010"
  });
  await container.items.create({
    id: "item2",
    key: "A",
    class: "2010"
  });
  await container.items.create({
    id: "item3",
    key: 5,
    class: "2010"
  });

  const operations = [
    {
      operationType: BulkOperationType.Create,
      resourceBody: { id: "doc1", name: "sample", key: "A" }
    },
    {
      operationType: BulkOperationType.Upsert,
      partitionKey: "A",
      resourceBody: { id: "doc2", name: "other", key: "A" }
    },
    {
      operationType: BulkOperationType.Read,
      id: "item1",
      partitionKey: "A"
    },
    {
      operationType: BulkOperationType.Delete,
      id: "item2",
      partitionKey: "A"
    },
    {
      operationType: BulkOperationType.Replace,
      partitionKey: 5,
      id: "item3",
      resourceBody: { id: "item3", name: "nice", key: 5 }
    }
  ];

  const response = await container.items.bulk(operations);

  // Create
  assert.equal(response[0].resourceBody.name, "sample");
  assert.equal(response[0].statusCode, 201);
  assert(response[0].requestCharge > 0);
  assert(response[0].eTag);
  // Upsert
  assert.equal(response[1].resourceBody.name, "other");
  assert.equal(response[1].statusCode, 201);
  assert(response[1].requestCharge > 0);
  assert(response[1].eTag);
  // Read
  assert.equal(response[2].resourceBody.class, "2010");
  assert.equal(response[2].statusCode, 200);
  assert(response[2].requestCharge > 0);
  assert(response[2].eTag);
  // Delete
  assert.equal(response[3].statusCode, 204);
  assert(response[3].requestCharge > 0);
  assert(!response[3].eTag);
  // Replace
  assert.equal(response[4].resourceBody.name, "nice");
  assert.equal(response[4].statusCode, 200);
  assert(response[4].requestCharge > 0);
  assert(response[4].eTag);
});

const bulkApiDoNotContinueOnError = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-container",
    partitionKey: {
      paths: ["/key"]
    }
  });

  await container.items.create({
    id: "item1",
    key: "A"
  });
  await container.items.create({
    id: "item2",
    key: "A"
  });

  const operations = [
    {
      operationType: BulkOperationType.Create,
      resourceBody: { id: "item3", key: "A" }
    },
    {
      operationType: BulkOperationType.Read,
      id: "item1",
      partitionKey: "A"
    },
    {
      operationType: BulkOperationType.Read,
      id: "not-exist",
      partitionKey: "A"
    },
    {
      operationType: BulkOperationType.Create,
      resourceBody: { id: "item4", key: "A" }
    },
    {
      operationType: BulkOperationType.Read,
      id: "item2",
      partitionKey: "A"
    }
  ];

  const response = await container.items.bulk(operations);

  assert.equal(response[0].statusCode, 201);
  assert.equal(response[1].statusCode, 200);
  assert.equal(response[2].statusCode, 404);
  assert.equal(response[3].statusCode, 424);
  assert.equal(response[4].statusCode, 424);
});

describe("CosmosDB", () => {
  it("read document 404", readDocument404);
  it("upsert document", upsertDocument);
  it("upsert document update", upsertDocumentUpdate);
  it("read documents empty", readDocumentsEmpty);
  it("read documents", readDocuments);
  it("udf", udf);
  it("delete database", deleteDatabase);
  it("delete document 404", deleteDocument404);
  it("query syntax error", querySyntaxError);
  it(
    "fails to create invalid composite indexes",
    failsToCreateInvalidCompositeIndexes
  );
  it(
    "queryWithInvalidMultipleOrderByFails",
    queryWithInvalidMultipleOrderByFails
  );
  it("queryWithMultipleOrderBy", queryWithMultipleOrderBy);
  it(
    "queryWithMultipleOrderByFailsWhenNoCompositeIndexes",
    queryWithMultipleOrderByFailsWhenNoCompositeIndexes
  );
  it("bulkApi", bulkApi);
  it("bulkApiDoNotContinueOnError", bulkApiDoNotContinueOnError);
});
