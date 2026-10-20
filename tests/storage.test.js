import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveResult, loadResults, clearResults } from '../src/storage.js';

beforeEach(() => {
  localStorage.clear();
});

const mockResult = {
  date: '2026-10-20',
  level: 'Easy',
  seed: 42,
  moves: 10,
  time: 45,
  nextLevel: 'Medium',
};

describe('storage', () => {
  it('loadResults returns empty array when nothing is stored', () => {
    expect(loadResults()).toEqual([]);
  });

  it('saveResult stores a result and loadResults retrieves it', () => {
    saveResult(mockResult);
    const results = loadResults();
    expect(results).toHaveLength(1);
    expect(results[0].moves).toBe(10);
    expect(results[0].level).toBe('Easy');
  });

  it('keeps at most 5 results (oldest are dropped)', () => {
    for (let i = 0; i < 7; i++) {
      saveResult({ ...mockResult, moves: i });
    }
    const results = loadResults();
    expect(results).toHaveLength(5);
    expect(results[0].moves).toBe(6);
  });

  it('clearResults removes all stored entries', () => {
    saveResult(mockResult);
    clearResults();
    expect(loadResults()).toEqual([]);
  });

  it('a failing localStorage.setItem does not crash the app', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveResult(mockResult)).not.toThrow();
  });

  it('a failing localStorage.getItem does not crash the app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('SecurityError');
    });
    expect(loadResults()).toEqual([]);
  });

  it('corrupted JSON in localStorage returns empty array', () => {
    localStorage.setItem('memoryGame_results', 'not-valid-json{{{');
    expect(loadResults()).toEqual([]);
  });
});
