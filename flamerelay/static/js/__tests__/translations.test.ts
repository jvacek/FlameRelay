import { readdirSync, readFileSync, statSync } from 'fs';
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

function emptyLeafPaths(obj: TranslationNode, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null)
      return emptyLeafPaths(v as TranslationNode, path);
    return v === '' ? [path] : [];
  });
}

function loadLocale(lang: string): TranslationNode {
  return JSON.parse(
    readFileSync(join(localesDir, lang, 'translation.json'), 'utf8'),
  ) as TranslationNode;
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
  // t('key') and t("key")
  for (const m of source.matchAll(/\bt\(['"]([a-zA-Z0-9_.]+)['"]\)/g))
    keys.push(m[1]);
  // i18nKey="key", i18nKey='key', i18nKey={"key"}, i18nKey={'key'}
  for (const m of source.matchAll(/i18nKey=\{?['"]([a-zA-Z0-9_.]+)['"]\}?/g))
    keys.push(m[1]);
  return keys;
}

// ── Locale data ──────────────────────────────────────────────────────────────

const en = loadLocale('en');
const enPaths = new Set(leafPaths(en));

const targetLocales = readdirSync(localesDir).filter(
  (d) => d !== 'en' && statSync(join(localesDir, d)).isDirectory(),
);

// ── Source key extraction ────────────────────────────────────────────────────

const usedKeys = new Set(
  walkTsFiles(sourceDir).flatMap((f) =>
    extractUsedKeys(readFileSync(f, 'utf8')),
  ),
);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('en source strings are all non-empty', () => {
  it('en/translation.json has no empty values', () => {
    expect(emptyLeafPaths(en)).toEqual([]);
  });
});

describe.each(targetLocales)('%s/translation.json key parity', (lang) => {
  const target = loadLocale(lang);
  const targetPaths = new Set(leafPaths(target));

  it('has no orphan keys absent from en (run `just i18n-sync` to fix)', () => {
    const orphans = [...targetPaths].filter((p) => !enPaths.has(p));
    expect(orphans).toEqual([]);
  });

  it('has all keys present in en (run `just i18n-sync` to fix)', () => {
    const missing = [...enPaths].filter((p) => !targetPaths.has(p));
    expect(missing).toEqual([]);
  });
});

describe('source keys exist in en/translation.json', () => {
  it('every t() and i18nKey call resolves to a key in en (accounting for plurals)', () => {
    const missing = [...usedKeys].filter(
      (key) =>
        !enPaths.has(key) &&
        !enPaths.has(`${key}_one`) &&
        !enPaths.has(`${key}_other`),
    );
    expect(missing).toEqual([]);
  });
});
