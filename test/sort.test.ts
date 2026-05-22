import { describe, it, expect } from 'vitest';
import { sortExtensions } from '../src/lib/sort';
import type { ExtensionInfo } from '../src/types';

function ext(name: string, enabled: boolean): ExtensionInfo {
  return { id: name, name, enabled, type: 'extension', isApp: false } as ExtensionInfo;
}

describe('sortExtensions', () => {
  it('puts enabled items before disabled items', () => {
    const result = sortExtensions([ext('B', false), ext('A', true)]);
    expect(result.map((e) => e.name)).toEqual(['A', 'B']);
  });

  it('sorts alphabetically within the same enabled state, case-insensitively', () => {
    const result = sortExtensions([ext('beta', true), ext('Alpha', true)]);
    expect(result.map((e) => e.name)).toEqual(['Alpha', 'beta']);
  });

  it('does not mutate the input array', () => {
    const input = [ext('B', true), ext('A', true)];
    sortExtensions(input);
    expect(input[0].name).toBe('B');
  });
});
