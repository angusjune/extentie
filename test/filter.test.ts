import { describe, it, expect } from 'vitest';
import { filterByName } from '../src/lib/filter';
import type { ExtensionInfo } from '../src/types';

function ext(name: string): ExtensionInfo {
  return { id: name, name, enabled: true, type: 'extension', isApp: false } as ExtensionInfo;
}

describe('filterByName', () => {
  const items = [ext('AdBlock'), ext('Dark Reader'), ext('uBlock')];

  it('returns all items for an empty query', () => {
    expect(filterByName(items, '')).toHaveLength(3);
    expect(filterByName(items, '   ')).toHaveLength(3);
  });

  it('matches case-insensitively on a substring', () => {
    expect(filterByName(items, 'block').map((e) => e.name)).toEqual(['AdBlock', 'uBlock']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterByName(items, 'zzz')).toEqual([]);
  });
});
