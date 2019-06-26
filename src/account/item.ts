/* eslint-disable no-underscore-dangle */
import ItemObject from "./item-object";

export default class Item {
  _data: ItemObject | undefined | null;

  constructor(data: ItemObject | undefined | null) {
    this._data = data;
  }

  read() {
    return this._data;
  }
}
