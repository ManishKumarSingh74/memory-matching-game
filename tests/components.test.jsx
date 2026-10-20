import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../src/App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '?seed=42');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Card component (via App)', () => {
  it('clicking a face-down card makes it show its symbol', () => {
    render(<App />);

    const allCards = screen.getAllByRole('button', { name: /face down/i });
    expect(allCards.length).toBeGreaterThan(0);

    fireEvent.click(allCards[0]);

    const faceUpCards = screen.getAllByRole('button', { name: /card 1,/i });
    expect(faceUpCards[0]).not.toHaveAccessibleName(/face down/i);
  });

  it('win message and next-level reason appear after matching all pairs', async () => {
    vi.useFakeTimers();
    render(<App />);

    const { createDeck } = await import('../src/gameLogic.js');
    const deck = createDeck(42);

    const pairs = [];
    const used = new Set();
    for (let i = 0; i < deck.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < deck.length; j++) {
        if (!used.has(j) && deck[i].symbol === deck[j].symbol) {
          pairs.push([i, j]);
          used.add(i);
          used.add(j);
          break;
        }
      }
    }

    for (const [a, b] of pairs) {
      const buttons = screen.getAllByRole('button');
      const cardButtons = buttons.filter(btn =>
        btn.getAttribute('aria-label')?.startsWith('Card')
      );
      act(() => { fireEvent.click(cardButtons[a]); });
      act(() => { fireEvent.click(cardButtons[b]); });
    }

    expect(screen.getByRole('heading', { name: /you win/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('Restart safety', () => {
  it('restarting during a pending mismatch timer does not change the new game', async () => {
    vi.useFakeTimers();
    render(<App />);

    const getCardButtons = () =>
      screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.startsWith('Card')
      );

    const { createDeck } = await import('../src/gameLogic.js');
    const deck = createDeck(42);
    let mismatchA = -1, mismatchB = -1;
    for (let i = 0; i < deck.length; i++) {
      for (let j = i + 1; j < deck.length; j++) {
        if (deck[i].symbol !== deck[j].symbol) {
          mismatchA = i; mismatchB = j; break;
        }
      }
      if (mismatchA !== -1) break;
    }

    act(() => { fireEvent.click(getCardButtons()[mismatchA]); });
    act(() => { fireEvent.click(getCardButtons()[mismatchB]); });

    const restartBtn = screen.getByRole('button', { name: /restart/i });
    act(() => { fireEvent.click(restartBtn); });

    const cardButtonsAfter = getCardButtons();
    const faceDownCount = cardButtonsAfter.filter(btn =>
      btn.getAttribute('aria-label')?.includes('face down')
    ).length;
    expect(faceDownCount).toBe(16);

    act(() => { vi.advanceTimersByTime(2000); });

    const cardButtonsFinal = getCardButtons();
    const faceDownFinal = cardButtonsFinal.filter(btn =>
      btn.getAttribute('aria-label')?.includes('face down')
    ).length;
    expect(faceDownFinal).toBe(16);
  });
});
