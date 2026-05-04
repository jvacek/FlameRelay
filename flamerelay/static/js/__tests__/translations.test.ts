import { readFileSync } from 'fs';
import { join, resolve } from 'path';

type TranslationNode = { [key: string]: string | TranslationNode };

const localesDir = resolve(__dirname, '../../locales');

const en = JSON.parse(
  readFileSync(join(localesDir, 'en', 'translation.json'), 'utf8'),
) as TranslationNode;

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
});
