/**
 * Fjern `undefined`-nøgler rekursivt før en Firestore-skrivning.
 *
 * Firestore afviser `undefined` med "Unsupported field value" — også nested, fx et ryddet
 * `description.href`. Mønstret `...(x ? { x } : {})` dækker de simple tilfælde ved kilden,
 * men rækker ikke for objekter der bygges dynamisk eller har dybe felter.
 */
export function omitUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => omitUndefined(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = omitUndefined(v);
    }
    return out as T;
  }
  return value;
}
