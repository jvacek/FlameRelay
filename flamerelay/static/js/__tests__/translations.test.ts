import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

type TranslationNode = { [key: string]: string | TranslationNode };

const localesDir = resolve(__dirname, '../../locales');
const sourceDir = resolve(__dirname, '..');

function leafPaths(obj: TranslationNode, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null
      ? leafPaths(v as TranslationNode, path)
      : [path];
  });
}

function walkTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '__tests__')
      return walkTsFiles(full);
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) return [full];
    return [];
  });
}

function extractUsedKeys(source: string): string[] {
  const keys: string[] = [];
  for (const m of source.matchAll(/\bt\(['"]([a-zA-Z0-9_.]+)['"]\)/g))
    keys.push(m[1]);
  for (const m of source.matchAll(/i18nKey=\{?['"]([a-zA-Z0-9_.]+)['"]\}?/g))
    keys.push(m[1]);
  return keys;
}

const en = JSON.parse(
  readFileSync(join(localesDir, 'en', 'translation.json'), 'utf8'),
) as TranslationNode;
const enPaths = new Set(leafPaths(en));

const usedKeys = new Set(
  walkTsFiles(sourceDir).flatMap((f) =>
    extractUsedKeys(readFileSync(f, 'utf8')),
  ),
);

describe('en/translation.json', () => {
  it('has no empty source strings', () => {
    function emptyPaths(obj: TranslationNode, prefix = ''): string[] {
      return Object.entries(obj).flatMap(([k, v]) => {
        const path = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null)
          return emptyPaths(v as TranslationNode, path);
        return v === '' ? [path] : [];
      });
    }
    expect(emptyPaths(en)).toEqual([]);
  });

  it('contains a key for every t() and i18nKey call in source (accounting for plurals)', () => {
    const missing = [...usedKeys].filter(
      (key) =>
        !enPaths.has(key) &&
        !enPaths.has(`${key}_one`) &&
        !enPaths.has(`${key}_other`),
    );
    expect(missing).toEqual([]);
  });
});
