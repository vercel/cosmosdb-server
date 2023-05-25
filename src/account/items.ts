/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import { randomUUID } from "crypto";
import query, { CompositeIndex } from "@zeit/cosmosdb-query";
import LRU from "lru-cache";
import ItemObject from "./item-object";
import Item from "./item";
import getValue from "../utils/get-value";
import { PartitionValue } from "../types";

type Query = ReturnType<typeof query>;

function ts() {
  return Math.floor(Date.now() / 1e3);
}

export default class Items<P extends Item, I extends Item> {
  _parent: P;

  _data: Map<string, I>;

  _index: Map<string, string>;

  _ridCount: number;

  _queryCache: LRU<string, Query>;

  _partitionKeyPath: string[];

  _uniqueKeyPaths: string[];

  constructor(
    parent: P,
    partitionKeyPath: string[],
    uniqueKeyPaths: string[] = []
  ) {
    this._parent = parent;
    this._data = new Map();
    this._index = new Map();
    this._ridCount = 0;
    this._queryCache = new LRU({ max: 100 });
    this._partitionKeyPath = partitionKeyPath;
    this._uniqueKeyPaths = uniqueKeyPaths.concat("/id");
  }

  create(data: { [x: string]: any }) {
    const partition = this._getPartition(data);
    this._uniqueKeyPaths.forEach(keyPath => {
      const keyPathValue = getValue(keyPath.slice(1).split("/"), data);
      if (this._item(keyPath, keyPathValue, partition).read()) {
        const err = new Error(
          `Resource with specified ${keyPath.slice(1)} already exists.`
        );
        // @ts-ignore
        err.conflict = true;
        throw err;
      }
    });

    this._ridCount += 1;
    const _rid = this._rid(this._ridCount);
    const _data = {
      ...data,
      id: data.id,
      _etag: randomUUID(),
      _rid,
      _self: this._self(_rid),
      _ts: ts()
    };
    return this._set(_data);
  }

  delete(idOrRid: string, partition: PartitionValue) {
    const data = this._item("/id", idOrRid, partition).read();
    if (!data) {
      throw new Error("does not exist");
    }

    this._uniqueKeyPaths.forEach(keyPath => {
      const keyPathValue = getValue(keyPath.slice(1).split("/"), data);
      const id = this._getId(keyPath, keyPathValue, this._getPartition(data));
      this._index.delete(id);
    });
    this._data.delete(data._rid);
  }

  query(
    params: {
      query: string;
      parameters?: {
        name: string;
        value: any;
      }[];
    },
    {
      maxItemCount,
      continuation
    }: {
      maxItemCount?: number | null;
      continuation?: {
        token: string;
      } | null;
    }
  ) {
    if (!this._parent.read()) return null;

    const data = [...this._data.values()].map(item => item.read());
    const udf = this._userDefinedFunctions();
    const parent = this._parent.read();
    const compositeIndexes = ((parent.indexingPolicy
      ? parent.indexingPolicy.compositeIndexes
      : null) || []) as CompositeIndex[][];
    const q = this._getQuery(params.query);
    const options = {
      parameters: params.parameters,
      udf,
      maxItemCount,
      continuation,
      compositeIndexes
    };
    try {
      return q.exec(data, options);
    } catch (err) {
      // @ts-ignore
      err.badRequest = true;
      throw err;
    }
  }

  read({
    maxItemCount,
    continuation
  }: {
    maxItemCount?: number | null;
    continuation?: {
      token: string;
    } | null;
  } = {}) {
    if (!this._parent.read()) return null;

    const data = [...this._data.values()].map(item => item.read());
    return this._getQuery("SELECT * FROM c").exec(data, {
      maxItemCount,
      continuation
    });
  }

  replace(data: { [x: string]: any }, original: { [x: string]: any }) {
    if (this._getPartition(data) !== this._getPartition(original)) {
      const err = new Error(
        `replacing partition key "${this._getPartitionKeyPath().join(
          "."
        )}" is not allowed`
      );
      // @ts-ignore
      err.badRequest = true;
      throw err;
    }

    const partition = this._getPartition(data);
    const oldData = this._item("/id", data.id, partition).read();
    if (!oldData || data.id !== oldData.id) {
      const err = new Error("replacing id is not allowed");
      // @ts-ignore
      err.badRequest = true;
      throw err;
    }

    this._uniqueKeyPaths.forEach(keyPath => {
      // No need to check /id here since we explicitly checked it earlier
      if (keyPath === "/id") {
        return;
      }

      const keys = keyPath.slice(1).split("/");
      const newKeyPathValue = getValue(keys, data);
      const originalKeyPathValue = getValue(keys, original);
      if (newKeyPathValue === originalKeyPathValue) {
        return;
      }

      if (this._item(keyPath, newKeyPathValue, partition).read()) {
        const err = new Error(
          `Resource with specified ${keyPath.slice(1)} already exists.`
        );
        // @ts-ignore
        err.conflict = true;
        throw err;
      }
    });

    const { _rid, _self } = oldData;
    const _data = {
      ...data,
      id: data.id,
      _etag: randomUUID(),
      _rid,
      _self,
      _ts: ts()
    };
    this.delete(oldData.id, partition);
    return this._set(_data);
  }

  upsert(data: { [x: string]: any }) {
    const partition = this._getPartition(data);
    const oldData = this._item("/id", data.id, partition).read();
    return oldData ? this.replace(data, oldData) : this.create(data);
  }

  _item(keyPath: string, keyPathValue: string, partition: PartitionValue): I {
    const rid = this._toRid(keyPath, keyPathValue, partition);
    return this._data.get(rid) || this._newItem();
  }

  // eslint-disable-next-line no-unused-vars
  _newItem(data?: ItemObject): I {
    throw new Error("Not implemented");
  }

  _rid(id: number): string {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  _self(rid: string): string {
    throw new Error("Not implemented");
  }

  _set(data: ItemObject) {
    this._uniqueKeyPaths.forEach(keyPath => {
      const keyPathValue = getValue(keyPath.slice(1).split("/"), data);
      const id = this._getId(keyPath, keyPathValue, this._getPartition(data));
      this._index.set(id, data._rid);
    });
    this._data.set(data._rid, this._newItem(data));
    return data;
  }

  _toRid(
    keyPath: string,
    keyPathValueOrRid: string,
    partition: PartitionValue
  ) {
    const id = this._getId(keyPath, keyPathValueOrRid, partition);
    return this._index.get(id) || keyPathValueOrRid;
  }

  _userDefinedFunctions():
    | {
        [x: string]: any;
      }
    | undefined
    | null {
    return null;
  }

  _getQuery(sql: string): Query {
    let q = this._queryCache.get(sql);
    if (!q) {
      q = query(sql);
      this._queryCache.set(sql, q);
    }
    return q;
  }

  _getId(keyPath: string, id: string, partition: PartitionValue) {
    return [partition || id, keyPath, id].join(":");
  }

  _getPartition(data: { [x: string]: any }): PartitionValue {
    return getValue(this._getPartitionKeyPath(), data);
  }

  _getPartitionKeyPath(): string[] {
    const [firstPath] = this._partitionKeyPath;
    if (!firstPath) {
      return ["id"]; // Default/fallback to `id` as partition key for now
    }
    const path = firstPath.slice(1).split("/");
    if (path.length === 1 && path[0] === "_partitionKey") {
      return ["id"];
    }
    return path;
  }
}
