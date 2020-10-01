/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import query from "@zeit/cosmosdb-query";
import LRU from "lru-cache";
import uuid from "uuid/v4";
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

  constructor(parent: P, partitionKeyPath: string[]) {
    this._parent = parent;
    this._data = new Map();
    this._index = new Map();
    this._ridCount = 0;
    this._queryCache = new LRU({ max: 100 });
    this._partitionKeyPath = partitionKeyPath;
  }

  create(data: { [x: string]: any }) {
    const partition = this._getPartition(data);
    if (this._item(data.id, partition).read()) {
      const err = new Error(
        "Resource with specified id or name already exists."
      );
      // @ts-ignore
      err.conflict = true;
      throw err;
    }

    this._ridCount += 1;
    const _rid = this._rid(this._ridCount);
    const _data = {
      ...data,
      id: data.id,
      _etag: uuid(),
      _rid,
      _self: this._self(_rid),
      _ts: ts()
    };
    return this._set(_data);
  }

  delete(idOrRid: string, partition: PartitionValue) {
    const data = this._item(idOrRid, partition).read();
    if (!data) {
      throw new Error("does not exist");
    }

    this._index.delete(this._getId(idOrRid, partition));
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
    return this._getQuery(params.query).exec(data, {
      parameters: params.parameters,
      udf,
      maxItemCount,
      continuation
    });
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
    const oldData = this._item(data.id, partition).read();
    if (!oldData || data.id !== oldData.id) {
      const err = new Error("replacing id is not allowed");
      // @ts-ignore
      err.badRequest = true;
      throw err;
    }

    const { _rid, _self } = oldData;
    const _data = {
      ...data,
      id: data.id,
      _etag: uuid(),
      _rid,
      _self,
      _ts: ts()
    };
    return this._set(_data);
  }

  upsert(data: { [x: string]: any }) {
    const partition = this._getPartition(data);
    const oldData = this._item(data.id, partition).read();
    return oldData ? this.replace(data, oldData) : this.create(data);
  }

  _item(idOrRid: string, partition: PartitionValue): I {
    const rid = this._toRid(idOrRid, partition);
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
    const id = this._getId(data.id, this._getPartition(data));
    this._data.set(data._rid, this._newItem(data));
    this._index.set(id, data._rid);
    return data;
  }

  _toRid(idOrRid: string, partition: PartitionValue) {
    const id = this._getId(idOrRid, partition);
    return this._index.get(id) || idOrRid;
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

  _getId(id: string, partition: PartitionValue) {
    return [partition || id, id].join(":");
  }

  _getPartition(data: { [x: string]: any }): PartitionValue {
    const partition = getValue(this._getPartitionKeyPath(), data);
    if (partition === undefined) {
      throw new Error(
        `Missing partition "${this._getPartitionKeyPath().join(
          "."
        )}" value for "${JSON.stringify(data)}"`
      );
    }
    if (typeof partition !== "string" && typeof partition !== "number") {
      throw new Error(
        `Partition value ${JSON.stringify(partition)} for "${
          data.id
        }" must be a number or string`
      );
    }
    return partition;
  }

  _getPartitionKeyPath(): string[] {
    try {
      const [firstPath] = this._partitionKeyPath;
      if (!firstPath) {
        return ["id"]; // Default/fallback to `id` as partition key for now
      }
      const path = firstPath.slice(1).split("/");
      if (path.length === 1 && path[0] === "_partitionKey") {
        return ["id"];
      }
      return path;
    } catch (error) {
      return ["id"];
    }
  }
}
