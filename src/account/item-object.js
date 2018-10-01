// @flow
/* eslint-disable no-underscore-dangle */

export type ItemObject = {
  id: string,
  indexingPolicy?: { indexingMode: ?string },
  partitionKey?: { paths: string[] },
  _etag: string,
  _rid: string,
  _self: string,
  _ts: number
};
