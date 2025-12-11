import { shuffleArray } from './utils.js';

const RANDOM_SEQUENCE_URL = (count) =>
  `https://www.random.org/sequences/?min=0&max=${count - 1}&col=1&format=plain&rnd=new`;

const requestTimeout = (ms) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error('timeout')), ms);
});

export const fetchShuffledIndices = async (count) => {
  if (count < 2) return [];
  try {
    const url = RANDOM_SEQUENCE_URL(count);
    const res = await Promise.race([
      fetch(url),
      requestTimeout(4500),
    ]);
    if (!res.ok) throw new Error('bad response');
    const text = await res.text();
    const numbers = text
      .split(/\s+/)
      .map((n) => Number.parseInt(n, 10))
      .filter(Number.isFinite);
    if (numbers.length === count) return numbers;
    return shuffleArray([...Array(count).keys()]);
  } catch (err) {
    console.warn('pairing API fallback', err);
    return shuffleArray([...Array(count).keys()]);
  }
};
