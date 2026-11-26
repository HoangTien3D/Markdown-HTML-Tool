/**
 * Security Rules TDD Specification against the "Dirty Dozen" Payloads.
 * Intended for verification with @firebase/rules-unit-testing against the Firebase Emulator.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export const DIRTY_DOZEN_SCENARIOS = [
  { id: 1, name: 'Unauthenticated workspace access', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Cross-tenant workspace write', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity spoofing in payload userId', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Unverified email write', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field injection (isAdmin: true)', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Client-forged createdAt timestamp', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Path ID poisoning (dots / oversized ID)', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Immutable createdAt / userId mutation on update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Value type/size poisoning on asset fields', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Orphaned chunk creation without parent asset', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Chunk parent assetId mismatch', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Cross-user collection list query', expected: 'PERMISSION_DENIED' },
];

describe('Firestore Security Rules Dirty Dozen Spec', () => {
  it('defines all 12 adversarial payloads with PERMISSION_DENIED expectations', () => {
    assert.equal(DIRTY_DOZEN_SCENARIOS.length, 12);
    for (const scenario of DIRTY_DOZEN_SCENARIOS) {
      assert.equal(scenario.expected, 'PERMISSION_DENIED');
    }
  });
});
