// @flow
/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import type { ItemObject } from "./item-object";
import type Collection from "./collection";

const Document = require("./document");
const Items = require("./items");

module.exports = class Documents extends Items<Collection, Document> {
  _newItem(data: ?ItemObject) {
    return new Document(data);
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }

    return `${parent._self}/docs/${rid}`;
  }

  _userDefinedFunctions() {
    const collection = this._parent.read();
    if (!collection) return null;

    return this._parent.userDefinedFunctions.functions;
  }
};
