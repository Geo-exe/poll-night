const normalizeKey = (attribute) => (attribute?.key || '').trim().toLowerCase();

export function mergeAttributes(shared = [], own = []) {
  const merged = new Map();
  let anonymousIndex = 0;

  [...shared, ...own].forEach(attribute => {
    if (!attribute || (!attribute.key && !attribute.value)) return;
    const key = normalizeKey(attribute);
    merged.set(key || `__anonymous_${anonymousIndex++}`, attribute);
  });

  return [...merged.values()];
}

export function cleanAttributes(attributes = []) {
  return attributes.filter(attribute => attribute && (attribute.key || attribute.value));
}
