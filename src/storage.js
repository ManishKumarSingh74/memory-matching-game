const STORAGE_KEY = 'memoryGame_results';
const MAX_RESULTS = 5;

export function saveResult(result) {
  try {
    const existing = loadResults();
    const updated = [result, ...existing].slice(0, MAX_RESULTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_err) {
  }
}

export function loadResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (_err) {
    return [];
  }
}

export function clearResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_err) {
  }
}
