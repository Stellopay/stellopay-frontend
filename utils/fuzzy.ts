/**
 * Returns a relevance score for a query matched against text, or null when
 * the query is not present as a subsequence.
 */
export function fuzzyMatch(query: string, text: string): number | null {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const normalizedText = text.toLocaleLowerCase();
  if (!normalizedQuery) return 0;

  const exactIndex = normalizedText.indexOf(normalizedQuery);
  if (exactIndex !== -1) {
    return (
      1000 - exactIndex * 2 - (normalizedText.length - normalizedQuery.length)
    );
  }

  let queryIndex = 0;
  let score = 0;
  let previousIndex = -1;
  let firstIndex = -1;

  for (let textIndex = 0; textIndex < normalizedText.length; textIndex += 1) {
    if (normalizedText[textIndex] !== normalizedQuery[queryIndex]) continue;

    if (firstIndex === -1) firstIndex = textIndex;
    score += previousIndex === textIndex - 1 ? 12 : 4;
    if (textIndex === 0 || /[\s/_-]/.test(normalizedText[textIndex - 1])) {
      score += 8;
    }

    previousIndex = textIndex;
    queryIndex += 1;
    if (queryIndex === normalizedQuery.length) {
      score += Math.max(0, 20 - firstIndex);
      return score;
    }
  }

  return null;
}

export function fuzzySearch<T>(
  query: string,
  items: readonly T[],
  getSearchText: (item: T) => string,
): Array<{ item: T; score: number }> {
  if (!query.trim()) return [];

  return items
    .map((item) => ({ item, score: fuzzyMatch(query, getSearchText(item)) }))
    .filter(
      (result): result is { item: T; score: number } => result.score !== null,
    )
    .sort((a, b) => b.score - a.score);
}
