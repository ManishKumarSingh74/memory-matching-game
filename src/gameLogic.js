export const LEVELS = {
  Easy:   { label: 'Easy',   flipBackMs: 1500 },
  Medium: { label: 'Medium', flipBackMs: 1000 },
  Hard:   { label: 'Hard',   flipBackMs: 600  },
};

export const THRESHOLDS = {
  goodGame: 12,
  badGame:  20,
};

const LEVEL_ORDER = ['Easy', 'Medium', 'Hard'];

const SYMBOLS = ['🐶', '🐱', '🐭', '🐹', '🦊', '🐻', '🐼', '🐨'];

export function seededRandom(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function createDeck(seed) {
  const rng = seededRandom(seed);
  const symbols = [...SYMBOLS, ...SYMBOLS];
  shuffle(symbols, rng);
  return symbols.map((symbol, index) => ({
    id: index,
    symbol,
    faceUp: false,
    matched: false,
  }));
}

export function createInitialState(level, seed) {
  return {
    cards: createDeck(seed),
    firstIndex: null,
    secondIndex: null,
    locked: false,
    moves: 0,
    matchedPairs: 0,
    status: 'idle',
    level,
    seed,
  };
}

export function flipCard(state, index) {
  const { cards, firstIndex, secondIndex, locked, status } = state;

  if (status === 'won') return state;
  if (locked) return state;
  if (cards[index].faceUp || cards[index].matched) return state;
  if (firstIndex === index) return state;

  const newCards = cards.map((card, i) =>
    i === index ? { ...card, faceUp: true } : card
  );

  if (firstIndex === null) {
    return {
      ...state,
      cards: newCards,
      firstIndex: index,
      status: 'playing',
    };
  }

  const isMatch = cards[firstIndex].symbol === cards[index].symbol;
  const newMoves = state.moves + 1;

  if (isMatch) {
    const matchedCards = newCards.map((card, i) =>
      i === firstIndex || i === index ? { ...card, matched: true } : card
    );
    const newMatchedPairs = state.matchedPairs + 1;
    const allMatched = newMatchedPairs === SYMBOLS.length;

    return {
      ...state,
      cards: matchedCards,
      firstIndex: null,
      secondIndex: null,
      moves: newMoves,
      matchedPairs: newMatchedPairs,
      status: allMatched ? 'won' : 'playing',
    };
  }

  return {
    ...state,
    cards: newCards,
    firstIndex,
    secondIndex: index,
    locked: true,
    moves: newMoves,
  };
}

export function resolveMismatch(state) {
  const { firstIndex, secondIndex, cards } = state;
  const newCards = cards.map((card, i) =>
    i === firstIndex || i === secondIndex ? { ...card, faceUp: false } : card
  );
  return {
    ...state,
    cards: newCards,
    firstIndex: null,
    secondIndex: null,
    locked: false,
  };
}

export function getNextLevel(currentLevel, moves) {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);

  if (moves <= THRESHOLDS.goodGame) {
    const nextIndex = Math.min(currentIndex + 1, LEVEL_ORDER.length - 1);
    const nextLevel = LEVEL_ORDER[nextIndex];
    if (nextLevel === currentLevel) {
      return {
        nextLevel,
        reason: `Finished in ${moves} moves (${THRESHOLDS.goodGame} or fewer) — already at the hardest level, staying at ${nextLevel}.`,
      };
    }
    return {
      nextLevel,
      reason: `Finished in ${moves} moves (${THRESHOLDS.goodGame} or fewer), so next round is ${nextLevel}.`,
    };
  }

  if (moves >= THRESHOLDS.badGame) {
    const nextIndex = Math.max(currentIndex - 1, 0);
    const nextLevel = LEVEL_ORDER[nextIndex];
    if (nextLevel === currentLevel) {
      return {
        nextLevel,
        reason: `Finished in ${moves} moves (${THRESHOLDS.badGame} or more) — already at the easiest level, staying at ${nextLevel}.`,
      };
    }
    return {
      nextLevel,
      reason: `Finished in ${moves} moves (${THRESHOLDS.badGame} or more), so next round drops to ${nextLevel}.`,
    };
  }

  return {
    nextLevel: currentLevel,
    reason: `Finished in ${moves} moves (between ${THRESHOLDS.goodGame + 1} and ${THRESHOLDS.badGame - 1}), so difficulty stays at ${currentLevel}.`,
  };
}
