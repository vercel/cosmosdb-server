/* eslint-disable class-methods-use-this, no-bitwise, no-underscore-dangle, no-use-before-define */

import Account from ".";
import Database from "./database";
import ItemObject from "./item-object";
import Items from "./items";
import ResourceId from "./resource-id";

export default class Databases extends Items<Account, Database> {
  _newItem(data: ItemObject | undefined | null) {
    return new Database(data);
  }

  _rid(id: number) {
    const idString = ((id << 8) | 0x80000000).toString();
    return ResourceId.newDatabaseId(idString).toString();
  }

  _self(rid: string) {
    return `/dbs/${rid}`;
  }
}
