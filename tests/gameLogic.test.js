import { describe, it, expect } from 'vitest';
import {
  seededRandom,
  shuffle,
  createDeck,
  createInitialState,
  flipCard,
  resolveMismatch,
  getNextLevel,
  THRESHOLDS,
} from '../src/gameLogic.js';

describe('createDeck', () => {
  it('same seed produces the same deck', () => {
    const deck1 = createDeck(42);
    const deck2 = createDeck(42);
    expect(deck1.map(c => c.symbol)).toEqual(deck2.map(c => c.symbol));
  });

  it('different seeds produce different decks', () => {
    const deck1 = createDeck(1);
    const deck2 = createDeck(999);
    expect(deck1.map(c => c.symbol)).not.toEqual(deck2.map(c => c.symbol));
  });

  it('deck has exactly 8 pairs (16 cards, each symbol appears twice)', () => {
    const deck = createDeck(7);
    expect(deck).toHaveLength(16);
    const counts = {};
    deck.forEach(card => {
      counts[card.symbol] = (counts[card.symbol] || 0) + 1;
    });
    Object.values(counts).forEach(count => expect(count).toBe(2));
  });
});

describe('flipCard – match', () => {
  function findMatchingPair(cards) {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].symbol === cards[j].symbol) return [i, j];
      }
    }
  }

  it('matching two cards: both stay matched, moves = 1, matchedPairs = 1', () => {
    const state = createInitialState('Easy', 42);
    const [a, b] = findMatchingPair(state.cards);

    const after1 = flipCard(state, a);
    const after2 = flipCard(after1, b);

    expect(after2.moves).toBe(1);
    expect(after2.matchedPairs).toBe(1);
    expect(after2.cards[a].matched).toBe(true);
    expect(after2.cards[b].matched).toBe(true);
    expect(after2.locked).toBe(false);
  });
});

describe('flipCard – mismatch', () => {
  function findMismatchPair(cards) {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].symbol !== cards[j].symbol) return [i, j];
      }
    }
  }

  it('mismatch sets locked = true', () => {
    const state = createInitialState('Easy', 42);
    const [a, b] = findMismatchPair(state.cards);

    const after1 = flipCard(state, a);
    const after2 = flipCard(after1, b);

    expect(after2.locked).toBe(true);
    expect(after2.moves).toBe(1);
  });

  it('resolveMismatch flips both mismatched cards back face-down', () => {
    const state = createInitialState('Easy', 42);
    const [a, b] = findMismatchPair(state.cards);

    const afterFlip2 = flipCard(flipCard(state, a), b);
    const resolved = resolveMismatch(afterFlip2);

    expect(resolved.cards[a].faceUp).toBe(false);
    expect(resolved.cards[b].faceUp).toBe(false);
    expect(resolved.locked).toBe(false);
    expect(resolved.firstIndex).toBeNull();
    expect(resolved.secondIndex).toBeNull();
  });
});

describe('flipCard – ignored clicks', () => {
  function findMismatchPair(cards) {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].symbol !== cards[j].symbol) return [i, j];
      }
    }
  }

  it('third click while locked is ignored (returns same state)', () => {
    const state = createInitialState('Easy', 42);
    const [a, b] = findMismatchPair(state.cards);
    const [c] = findMismatchPair(state.cards.filter((_, i) => i !== a && i !== b))
      .map(idx => [a, b].includes(idx) ? idx + 2 : idx);

    const lockedState = flipCard(flipCard(state, a), b);
    expect(lockedState.locked).toBe(true);

    const otherIndex = state.cards.findIndex((_, i) => i !== a && i !== b);
    const afterThird = flipCard(lockedState, otherIndex);

    expect(afterThird).toBe(lockedState);
  });

  it('clicking the same first card again is ignored', () => {
    const state = createInitialState('Easy', 5);
    const afterFirst = flipCard(state, 0);
    const afterSameAgain = flipCard(afterFirst, 0);
    expect(afterSameAgain).toBe(afterFirst);
  });

  it('clicking an already matched card is ignored', () => {
    const state = createInitialState('Easy', 42);
    const cards = state.cards;
    let pairA = -1, pairB = -1;
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].symbol === cards[j].symbol) { pairA = i; pairB = j; break; }
      }
      if (pairA !== -1) break;
    }
    const matched = flipCard(flipCard(state, pairA), pairB);
    const afterClickMatched = flipCard(matched, pairA);
    expect(afterClickMatched).toBe(matched);
  });

  it('clicking while status is won is ignored', () => {
    const state = createInitialState('Easy', 42);
    const wonState = { ...state, status: 'won' };
    const after = flipCard(wonState, 0);
    expect(after).toBe(wonState);
  });
});

describe('win condition', () => {
  it('matching all 8 pairs sets status to won', () => {
    let state = createInitialState('Easy', 42);
    const cards = state.cards;

    const pairs = [];
    const used = new Set();
    for (let i = 0; i < cards.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < cards.length; j++) {
        if (!used.has(j) && cards[i].symbol === cards[j].symbol) {
          pairs.push([i, j]);
          used.add(i);
          used.add(j);
          break;
        }
      }
    }

    for (const [a, b] of pairs) {
      state = flipCard(state, a);
      state = flipCard(state, b);
    }

    expect(state.status).toBe('won');
    expect(state.matchedPairs).toBe(8);
  });
});

describe('getNextLevel', () => {
  it('Easy + 10 moves → Medium (good game)', () => {
    const { nextLevel } = getNextLevel('Easy', 10);
    expect(nextLevel).toBe('Medium');
  });

  it('Hard + 22 moves → Medium (bad game)', () => {
    const { nextLevel } = getNextLevel('Hard', 22);
    expect(nextLevel).toBe('Medium');
  });

  it('Medium + 16 moves → Medium (stays same)', () => {
    const { nextLevel } = getNextLevel('Medium', 16);
    expect(nextLevel).toBe('Medium');
  });

  it('Hard stays at Hard on a very good game', () => {
    const { nextLevel, reason } = getNextLevel('Hard', 8);
    expect(nextLevel).toBe('Hard');
    expect(reason).toMatch(/already at the hardest/i);
  });

  it('Easy stays at Easy on a very bad game', () => {
    const { nextLevel, reason } = getNextLevel('Easy', 25);
    expect(nextLevel).toBe('Easy');
    expect(reason).toMatch(/already at the easiest/i);
  });

  it('reason string mentions the move count', () => {
    const { reason } = getNextLevel('Medium', 11);
    expect(reason).toContain('11');
  });

  it('boundary: exactly goodGame threshold moves up', () => {
    const { nextLevel } = getNextLevel('Easy', THRESHOLDS.goodGame);
    expect(nextLevel).toBe('Medium');
  });

  it('boundary: exactly badGame threshold moves down', () => {
    const { nextLevel } = getNextLevel('Hard', THRESHOLDS.badGame);
    expect(nextLevel).toBe('Medium');
  });
});
