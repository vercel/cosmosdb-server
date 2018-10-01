// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import type { ItemObject } from "./item-object";

const Collection = require("./collection");
const Database = require("./database");
const Items = require("./items");

module.exports = class Collections extends Items<Database, Collection> {
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
};
