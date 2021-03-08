import assert from "assert";
import withCosmosDB from "./with-cosmosdb";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function withTestEnv(fn: (x0: { [x: string]: any }) => any) {
  return withCosmosDB(fn);
}

export const readDocument404 = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const item = container.item("not-exist");

  const { resource, statusCode } = await item.read();
  assert.strictEqual(resource, undefined);
  assert.strictEqual(statusCode, 404);
});

export const upsertDocument = withTestEnv(async client => {
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

export const upsertDocumentUpdate = withTestEnv(async client => {
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

export const readDocumentsEmpty = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const { container } = await database.containers.create({
    id: "test-collection"
  });
  const { resources } = await container.items.readAll().fetchAll();
  assert.deepStrictEqual(resources, []);
});

export const readDocuments = withTestEnv(async client => {
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

export const udf = withTestEnv(async client => {
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

export const deleteDatabase = withTestEnv(async client => {
  const { database } = await client.databases.create({ id: "test-database" });
  const result = await database.delete();
  assert.strictEqual(result.statusCode, 204);
});

export const querySyntaxError = withTestEnv(async client => {
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

export const failsToCreateInvalidCompositeIndexes = withTestEnv(
  async client => {
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
  }
);

export const queryWithMultipleOrderBy = withTestEnv(async client => {
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

export const queryWithMultipleOrderByFailsWhenNoCompositeIndexes = withTestEnv(
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

export const queryWithInvalidMultipleOrderByFails = withTestEnv(
  async client => {
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
  }
);
