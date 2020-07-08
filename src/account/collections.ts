/* eslint-disable class-methods-use-this, no-bitwise, no-underscore-dangle, no-use-before-define */
import Collection from "./collection";
import Database from "./database";
import ItemObject from "./item-object";
import Items from "./items";
import ResourceId from "./resource-id";

export default class Collections extends Items<Database, Collection> {
  _set(data: ItemObject) {
    const indexingPolicy: any = data.indexingPolicy || {};
    const _data = {
      geospatialConfig: {},
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

  _newItem(data: ItemObject | undefined | null) {
    return new Collection(data);
  }

  _rid(id: number) {
    const database = this._parent.read();
    const idString = (id | 0x80000000).toString();
    return ResourceId.newDocumentCollectionId(
      database._rid,
      idString
    ).toString();
  }

  _self(rid: string) {
    const parent = this._parent.read();
    if (!parent) {
      throw new Error("parent is missing");
    }
    return `${parent._self}/colls/${rid}`;
  }
}
