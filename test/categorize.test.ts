import { describe, it, expect } from 'vitest';
import { categorize } from '../src/types';
import type { ExtensionInfo } from '../src/types';

function make(partial: Partial<ExtensionInfo> = {}): ExtensionInfo {
  return {
    id: 'x',
    name: 'X',
    type: 'extension',
    isApp: false,
    enabled: true,
    ...partial,
  } as ExtensionInfo;
}

describe('categorize', () => {
  it('classifies a theme', () => {
    expect(categorize(make({ type: 'theme' }))).toBe('theme');
  });

  it('classifies an app by isApp', () => {
    expect(categorize(make({ type: 'hosted_app', isApp: true }))).toBe('app');
  });

  it('classifies a plain extension', () => {
    expect(categorize(make())).toBe('extension');
  });

  it('prefers theme over isApp', () => {
    expect(categorize(make({ type: 'theme', isApp: true }))).toBe('theme');
  });
});
