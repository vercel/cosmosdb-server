/* eslint-disable class-methods-use-this, no-underscore-dangle */
import Databases from "./databases";
import Item from "./item";

export default class Account extends Item {
  databases: Databases;

  constructor() {
    super({
      id: "",
      _etag: "",
      _rid: "",
      _self: "",
      _ts: 0
    });
    this.databases = new Databases(this, ["/id"]);
  }

  database(idOrRid: string) {
    return this.databases._item("/id", idOrRid, idOrRid);
  }
}
