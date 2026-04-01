import index from '../data/fakebook-index.json';

export type TuneRef = { book: string; page: number };

export type FakebookResult = { name: string; refs: TuneRef[] };

const fakebookIndex = index as Record<string, TuneRef[]>;

export function normalizeTuneName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTuneReferences(name: string): TuneRef[] {
  const key = normalizeTuneName(name);
  return fakebookIndex[key] ?? [];
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function searchFakebook(query: string, limit = 20): FakebookResult[] {
  const q = normalizeTuneName(query);
  if (q.length < 2) return [];
  const results: FakebookResult[] = [];
  for (const key of Object.keys(fakebookIndex)) {
    if (key.includes(q)) {
      results.push({ name: toTitleCase(key), refs: fakebookIndex[key] });
      if (results.length >= limit) break;
    }
  }
  return results;
}
