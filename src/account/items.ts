/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import query from "@zeit/cosmosdb-query";
import LRU from "lru-cache";
import uuid from "uuid/v4";
import ItemObject from "./item-object";
import Item from "./item";
import ResourceId from "./resource-id";

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

  constructor(parent: P) {
    this._parent = parent;
    this._data = new Map();
    this._index = new Map();
    this._ridCount = 0;
    this._queryCache = new LRU({ max: 100 });
  }

  create(data: { [x: string]: any }) {
    if (this._item(data.id).read()) {
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

  replace(data: { [x: string]: any }) {
    const oldData = this._item(data.id).read();
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
    const oldData = this._item(data.id).read();
    return oldData ? this.replace(data) : this.create(data);
  }

  _item(idOrRid: string): I {
    const rid = this._toRid(idOrRid);
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
    this._data.set(data._rid, this._newItem(data));
    this._index.set(data.id, data._rid);
    return data;
  }

  _toRid(idOrRid: string) {
    return this._index.get(idOrRid) || idOrRid;
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
}
