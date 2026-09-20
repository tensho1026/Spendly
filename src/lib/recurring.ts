export function missingRecurringRules<T extends { id: string }>(
  rules: T[],
  existingIds: Iterable<string | null>,
): T[] {
  const existing = new Set(existingIds);
  return rules.filter((rule) => !existing.has(rule.id));
}
