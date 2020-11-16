/* eslint-disable class-methods-use-this, no-underscore-dangle, no-use-before-define */
import Collections from "./collections";
import ItemObject from "./item-object";
import Item from "./item";

export default class Database extends Item {
  collections: Collections;

  constructor(data: ItemObject | undefined | null) {
    super(data);
    this.collections = new Collections(this, ["/id"]);
  }

  collection(idOrRid: string) {
    return this.collections._item("/id", idOrRid, idOrRid);
  }
}
