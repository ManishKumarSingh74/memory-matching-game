import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from './Card.jsx';
import { createInitialState, flipCard, resolveMismatch, getNextLevel, LEVELS } from './gameLogic.js';
import { saveResult, loadResults, clearResults } from './storage.js';
import './App.css';

function getSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  if (raw !== null && !isNaN(Number(raw))) return Number(raw);
  return Math.floor(Math.random() * 999999) + 1;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function App() {
  const seedRef = useRef(getSeedFromUrl());

  const [gameState, setGameState] = useState(() =>
    createInitialState('Easy', seedRef.current)
  );

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const gameIdRef = useRef(0);

  const [history, setHistory] = useState(() => loadResults());
  const [nextLevelInfo, setNextLevelInfo] = useState(null);

  useEffect(() => {
    if (gameState.status === 'playing' && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }

    if (gameState.status === 'won') {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [gameState.status]);

  useEffect(() => {
    if (gameState.status !== 'won') return;

    const info = getNextLevel(gameState.level, gameState.moves);
    setNextLevelInfo(info);

    const result = {
      date: new Date().toLocaleDateString(),
      level: gameState.level,
      seed: gameState.seed,
      moves: gameState.moves,
      time: elapsed,
      nextLevel: info.nextLevel,
    };
    saveResult(result);
    setHistory(loadResults());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (gameState.status !== 'playing') return;
      if (document.hidden) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        intervalRef.current = setInterval(() => {
          setElapsed(prev => prev + 1);
        }, 1000);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameState.status]);

  const handleCardClick = useCallback((index) => {
    setGameState(prev => {
      const next = flipCard(prev, index);
      if (next === prev) return prev;

      if (next.locked) {
        const capturedGameId = gameIdRef.current;
        const delay = LEVELS[next.level].flipBackMs;

        timeoutRef.current = setTimeout(() => {
          setGameState(current => {
            if (gameIdRef.current !== capturedGameId) return current;
            return resolveMismatch(current);
          });
        }, delay);
      }

      return next;
    });
  }, []);

  const handleRestart = useCallback((levelOverride) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    gameIdRef.current += 1;

    const newSeed = Math.floor(Math.random() * 999999) + 1;
    seedRef.current = newSeed;

    const level = levelOverride || gameState.level;
    setGameState(createInitialState(level, newSeed));
    setElapsed(0);
    setNextLevelInfo(null);
  }, [gameState.level]);

  const handleNextLevel = useCallback(() => {
    if (!nextLevelInfo) return;
    handleRestart(nextLevelInfo.nextLevel);
  }, [nextLevelInfo, handleRestart]);

  const handleClearHistory = useCallback(() => {
    clearResults();
    setHistory([]);
  }, []);

  const { cards, moves, matchedPairs, status, level, seed } = gameState;

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧠 Memory Matching</h1>
        <p className="app__subtitle">PS09 – Adaptive Difficulty</p>
      </header>

      <section className="status-bar" aria-live="polite">
        <span className="status-bar__item">
          <strong>Level:</strong> {level}
        </span>
        <span className="status-bar__item">
          <strong>Moves:</strong> {moves}
        </span>
        <span className="status-bar__item">
          <strong>Pairs:</strong> {matchedPairs} / 8
        </span>
        <span className="status-bar__item">
          <strong>Time:</strong> {formatTime(elapsed)}
        </span>
        <span className="status-bar__item status-bar__seed">
          <strong>Seed:</strong> {seed}
        </span>
      </section>

      <main className="grid" role="main" aria-label="Game board">
        {cards.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            index={i}
            onClick={() => handleCardClick(i)}
          />
        ))}
      </main>

      {status === 'won' && nextLevelInfo && (
        <section className="win-screen" role="alert" aria-live="assertive">
          <h2>🎉 You Win!</h2>
          <p>
            <strong>{moves} moves</strong> &nbsp;|&nbsp;
            <strong>{matchedPairs} pairs</strong> &nbsp;|&nbsp;
            <strong>{formatTime(elapsed)}</strong>
          </p>
          <p className="win-screen__reason">{nextLevelInfo.reason}</p>
          <div className="win-screen__buttons">
            <button className="btn btn--primary" onClick={handleNextLevel}>
              ▶ Play Next Round ({nextLevelInfo.nextLevel})
            </button>
            <button className="btn btn--secondary" onClick={() => handleRestart(level)}>
              ↺ Replay Same Level
            </button>
          </div>
        </section>
      )}

      {status !== 'won' && (
        <div className="controls">
          <button className="btn btn--secondary" onClick={() => handleRestart()}>
            ↺ Restart
          </button>
          <select
            className="level-select"
            value={level}
            onChange={e => handleRestart(e.target.value)}
            aria-label="Choose difficulty level"
          >
            <option value="Easy">Easy (1.5 s delay)</option>
            <option value="Medium">Medium (1.0 s delay)</option>
            <option value="Hard">Hard (0.6 s delay)</option>
          </select>
        </div>
      )}

      <section className="history" aria-label="Recent results">
        <h2>Recent Results</h2>
        {history.length === 0 ? (
          <p className="history__empty">No results yet – finish a game to see history.</p>
        ) : (
          <>
            <table className="history__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Level</th>
                  <th>Moves</th>
                  <th>Time</th>
                  <th>Next</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>{r.level}</td>
                    <td>{r.moves}</td>
                    <td>{formatTime(r.time)}</td>
                    <td>{r.nextLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn--danger" onClick={handleClearHistory}>
              🗑 Clear History
            </button>
          </>
        )}
      </section>

      <section className="how-to-play">
        <h2>How to Play</h2>
        <ol>
          <li>Click any card to flip it face-up.</li>
          <li>Click a second card to try to find its match.</li>
          <li>If they match, both cards stay open. 🎊</li>
          <li>If they don't match, they flip back after a short delay.</li>
          <li>Find all 8 pairs to win. Fewer moves = harder next round!</li>
        </ol>
        <details>
          <summary>Adaptive difficulty rule</summary>
          <table className="rule-table">
            <thead>
              <tr><th>Moves used</th><th>What happens</th></tr>
            </thead>
            <tbody>
              <tr><td>≤ 12 (great!)</td><td>Next level goes UP one step</td></tr>
              <tr><td>13 – 19</td><td>Same level</td></tr>
              <tr><td>≥ 20 (tough)</td><td>Next level goes DOWN one step</td></tr>
            </tbody>
          </table>
        </details>
        <p className="seed-tip">
          💡 Share a fixed seed via URL: <code>?seed=42</code>
        </p>
      </section>
    </div>
  );
}

export default App;
