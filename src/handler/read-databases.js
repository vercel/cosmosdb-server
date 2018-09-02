// @flow
import type Account from "../account";

module.exports = (account: Account) => {
  const Databases = account.databases.read();
  return { Databases, _count: Databases.length };
};
