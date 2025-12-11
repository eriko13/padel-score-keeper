import { shuffleArray } from './utils.js';

const RANDOM_WORD_URL = 'https://random-word-api.herokuapp.com/word?number=2';
const fallbackWords = ['Aqua', 'Blitz', 'Citrus', 'Dynamo', 'Echo', 'Flare', 'Gale', 'Helix', 'Ion', 'Jet', 'Kinetic', 'Lumen', 'Nova', 'Orbit', 'Pulse', 'Quake', 'Rally', 'Surge', 'Tempo', 'Vibe'];

export const fetchTeamName = async () => {
  try {
    const res = await Promise.race([
      fetch(RANDOM_WORD_URL),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    if (!res.ok) throw new Error('bad response');
    const words = await res.json();
    if (Array.isArray(words) && words.length) {
      const name = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return name || pickFallback();
    }
    return pickFallback();
  } catch (err) {
    console.warn('team name API fallback', err);
    return pickFallback();
  }
};

const pickFallback = () => {
  const [a, b] = shuffleArray(fallbackWords).slice(0, 2);
  return `${a} ${b}`;
};
