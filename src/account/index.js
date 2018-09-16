// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
const query = require("@zeit/cosmosdb-query");
const { randomBytes } = require("crypto");
const uuid = require("uuid/v1");

type ItemObject = {
  id: string,
  indexingPolicy?: { indexingMode: ?string },
  partitionKey?: { paths: string[] },
  _etag: string,
  _rid: string,
  _self: string,
  _ts: number
};

function ts() {
  return Math.floor(Date.now() / 1e3);
}

function range(
  data: any[],
  {
    maxItemCount,
    continuation
  }: {
    maxItemCount?: ?number,
    continuation?: ?{ token: string }
  }
) {
  let _data = data;

  if (continuation) {
    const index = data.findIndex(d => (d || {})._rid === continuation.token);
    if (index >= 0) {
      _data = data.slice(index + 1);
    }
  }

  return maxItemCount != null ? _data.slice(0, maxItemCount) : _data;
}

class Item {
  _data: ?ItemObject;

  constructor(data: ?ItemObject) {
    this._data = data;
  }

  read() {
    return this._data;
  }
}

class Items<P: Item, I: Item> {
  _parent: P;

  _data: Map<string, I>;

  _index: Map<string, string>;

  constructor(parent: P) {
    this._parent = parent;
    this._data = new Map();
    this._index = new Map();
  }

  create(data: { id: string }) {
    if (this._item(data.id).read()) {
      throw new Error("already exist");
    }

    const _rid = this._rid();
    const _data = {
      ...data,
      _etag: uuid(),
      _rid,
      _self: this._self(_rid),
      _ts: ts()
    };
    return this._set(_data);
  }

  delete(idOrRid: string) {
    const data = this._item(idOrRid).read();
    if (!data) {
      throw new Error("does not exist");
    }

    this._index.delete(data.id);
    this._data.delete(data._rid);
  }

  query(
    params: {
      query: string,
      parameters?: { name: string, value: any }[]
    },
    {
      maxItemCount,
      continuation
    }: {
      maxItemCount?: ?number,
      continuation?: ?{ token: string }
    }
  ) {
    const data = this.read();
    if (!data) return null;

    const _data = query(params.query).exec(data, params.parameters);
    return range(_data, { maxItemCount, continuation });
  }

  read({
    maxItemCount,
    continuation
  }: {
    maxItemCount?: ?number,
    continuation?: ?{ token: string }
  } = {}) {
    if (!this._parent.read()) return null;

    const data = [...this._data.values()];
    const _data = data.map(item => item.read());
    return range(_data, { maxItemCount, continuation });
  }

  replace(data: { id: string }) {
    const oldData = this._item(data.id).read();
    if (!oldData) {
      throw new Error("does not exist");
    }

    const { _rid, _self } = oldData;
    const _data = {
      ...data,
      _etag: uuid(),
      _rid,
      _self,
      _ts: ts()
    };
    return this._set(_data);
  }

  upsert(data: { id: string }) {
    const oldData = this._item(data.id).read();
    return oldData ? this.replace(data) : this.create(data);
  }

  _item(idOrRid: string): I {
    const rid = this._toRid(idOrRid);
    return this._data.get(rid) || this._newItem();
  }

  // eslint-disable-next-line no-unused-vars
  _newItem(data: ?ItemObject): I {
    throw new Error("Not implemented");
  }

  _rid() {
    return randomBytes(8)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  // eslint-disable-next-line no-unused-vars
  _self(rid) {
    throw new Error("Not implemented");
  }

  _set(data: ItemObject) {
    this._data.set(data._rid, this._newItem(data));
    this._index.set(data.id, data._rid);
    return data;
  }

  _toRid(idOrRid: string) {
    return this._index.get(idOrRid) || idOrRid;
  }
}

class Document extends Item {}

class Documents extends Items<Collection, Document> {
  _newItem(data) {
    return new Document(data);
  }

  _self(rid) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }

    return `${parent._self}/docs/${rid}`;
  }
}

class Collection extends Item {
  documents: Documents;

  constructor(data: ?ItemObject) {
    super(data);
    this.documents = new Documents(this);
  }

  document(idOrRid: string) {
    return this.documents._item(idOrRid);
  }
}

class Collections extends Items<Database, Collection> {
  _set(data: ItemObject) {
    const indexingPolicy = data.indexingPolicy || {};
    const _data = {
      ...data,
      indexingPolicy: {
        ...indexingPolicy,
        indexingMode: (
          indexingPolicy.indexingMode || "consistent"
        ).toLowerCase()
      }
    };
    return super._set(_data);
  }

  _newItem(data: ?ItemObject) {
    return new Collection(data);
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }
    return `${parent._self}/colls/${rid}`;
  }
}

class Database extends Item {
  collections: Collections;

  constructor(data: ?ItemObject) {
    super(data);
    this.collections = new Collections(this);
  }

  collection(idOrRid: string) {
    return this.collections._item(idOrRid);
  }
}

class Databases extends Items<Account, Database> {
  _newItem(data: ?ItemObject) {
    return new Database(data);
  }

  _self(rid: string) {
    return `/dbs/${rid}`;
  }
}

class Account extends Item {
  databases: Databases;

  constructor() {
    super({
      id: "",
      _etag: "",
      _rid: "",
      _self: "",
      _ts: 0
    });
    this.databases = new Databases(this);
  }

  database(idOrRid: string) {
    return this.databases._item(idOrRid);
  }
}

module.exports = Account;
