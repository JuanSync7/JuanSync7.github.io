/** -> the places, in order, of the texts that hold every word of the search, whatever its case; an empty
 *  search keeps them all. A word is searched as written: nothing in it is a pattern. */
export function matching(texts: readonly string[], query: string): number[] {
  const words = query.toLowerCase().split(/\s+/);
  return texts.flatMap((text, at) => (words.every((word) => text.toLowerCase().includes(word)) ? [at] : []));
}
