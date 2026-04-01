import index from '../data/fakebook-index.json';

export type TuneRef = { book: string; page: number };

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