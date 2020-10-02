/**
 * Gets value from an object by following
 * @param keys path
 *
 * Examples:
 *  > getValue(['foo', 'bar'], { foo: { bar: 1 } })
 *  => 1
 *
 *  > getValue(['foo', 'bar'], {})
 *  => undefined
 */
export default function getValue(
  keys: string[],
  obj: { [key: string]: any } | undefined
): any {
  if (!obj || keys.length === 0) {
    return undefined;
  }
  const [head, ...tail] = keys;
  if (tail.length === 0) {
    return obj[head];
  }
  return getValue(tail, obj[head]);
}
