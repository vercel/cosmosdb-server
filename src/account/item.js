// @flow
/* eslint-disable no-underscore-dangle */
import type { ItemObject } from "./item-object";

module.exports = class Item {
  _data: ?ItemObject;

  constructor(data: ?ItemObject) {
    this._data = data;
  }

  read() {
    return this._data;
  }
};
