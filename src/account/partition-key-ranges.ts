/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import Collection from "./collection";
import ItemObject from "./item-object";
import Items from "./items";
import PartitionKeyRange from "./partition-key-range";

export default class PartitionKeyRanges extends Items<
  Collection,
  PartitionKeyRange
> {
  _newItem(data: ItemObject | undefined | null) {
    return new PartitionKeyRange(data);
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }

    return `${parent._self}/pkranges/${rid}`;
  }
}
