import { describe, it, expect } from 'vitest';
import { pickIcon } from '../src/lib/icon';

describe('pickIcon', () => {
  it('returns empty string when there are no icons', () => {
    expect(pickIcon(undefined)).toBe('');
    expect(pickIcon([])).toBe('');
  });

  it('picks the smallest icon larger than 16px', () => {
    const icons = [
      { size: 16, url: 'a16' },
      { size: 32, url: 'a32' },
      { size: 48, url: 'a48' },
    ];
    expect(pickIcon(icons)).toBe('a32');
  });

  it('ignores input order', () => {
    const icons = [
      { size: 48, url: 'a48' },
      { size: 16, url: 'a16' },
      { size: 32, url: 'a32' },
    ];
    expect(pickIcon(icons)).toBe('a32');
  });

  it('falls back to the largest icon when none exceed 16px', () => {
    const icons = [
      { size: 8, url: 'a8' },
      { size: 16, url: 'a16' },
    ];
    expect(pickIcon(icons)).toBe('a16');
  });

  it('does not mutate the input array', () => {
    const icons = [
      { size: 48, url: 'a48' },
      { size: 16, url: 'a16' },
    ];
    pickIcon(icons);
    expect(icons[0].size).toBe(48);
  });
});
