// @flow

const parseJSONOrNull = (s: string) => {
  try {
    return JSON.parse(s);
  } catch (err) {
    return null;
  }
};

const parseHeaders = (headers: Object) => {
  const maxItemCount = headers["x-ms-max-item-count"]
    ? parseInt(headers["x-ms-max-item-count"], 10)
    : null;
  const continuation = headers["x-ms-continuation"]
    ? parseJSONOrNull(headers["x-ms-continuation"])
    : null;
  return { maxItemCount, continuation };
};

module.exports = async (
  req: http$IncomingMessage,
  res: http$ServerResponse,
  itemsName: string,
  fn: ({ maxItemCount?: ?number, continuation?: ?Object }) => ?(any[])
) => {
  const { maxItemCount, continuation } = parseHeaders(req.headers);
  const items = await fn({ maxItemCount, continuation });
  if (!items) {
    res.statusCode = 404;
    return {};
  }

  const count = items.length;
  if (maxItemCount && count === maxItemCount) {
    res.setHeader(
      "x-ms-continuation",
      JSON.stringify({
        token: items[count - 1]._rid,
        range: { min: "", max: "FF" }
      })
    );
  }
  res.setHeader("x-ms-item-count", String(count));

  return { [itemsName]: items, _count: count };
};
