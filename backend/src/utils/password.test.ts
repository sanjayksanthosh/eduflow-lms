import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('hashes to a salted bcrypt digest, never the plain text', async () => {
    const hash = await hashPassword('Sup3r-secret');

    expect(hash).not.toBe('Sup3r-secret');
    expect(hash.startsWith('$2')).toBe(true);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('accepts the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('Sup3r-secret');

    await expect(verifyPassword('Sup3r-secret', hash)).resolves.toBe(true);
    await expect(verifyPassword('sup3r-secret', hash)).resolves.toBe(false);
  });

  it('produces a different digest for the same password', async () => {
    const [first, second] = await Promise.all([hashPassword('same'), hashPassword('same')]);

    expect(first).not.toBe(second);
  });
});
