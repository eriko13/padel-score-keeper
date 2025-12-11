import { storage } from './storage.js';
import { createElement, formatDate, downloadText, copyToClipboard } from './utils.js';

const KEY = 'history';

const getHistory = () => storage.get(KEY, []);
const saveHistory = (entries) => storage.set(KEY, entries);

export const addMatchToHistory = (match) => {
  const entries = getHistory();
  entries.unshift(match);
  saveHistory(entries);
};

export const initHistory = ({ listEl, filterInput, exportBtn, copyBtn }) => {
  let entries = getHistory();

  const render = () => {
    const term = filterInput.value.trim().toLowerCase();
    listEl.innerHTML = '';
    entries
      .filter((m) => !term || m.teams.A.players.concat(m.teams.B.players).some((p) => p.name.toLowerCase().includes(term)))
      .forEach((match) => {
        const li = document.createElement('li');
        const title = createElement('div');
        title.style.fontWeight = '600';
        title.textContent = `${match.teams.A.name} vs ${match.teams.B.name}`;
        const meta = createElement('div');
        meta.style.color = '#6b7280';
        meta.textContent = `${match.court} · ${formatDate(match.finishedAt)} · ${match.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(' ')}`;
        li.append(title, meta);
        listEl.append(li);
      });
  };

  filterInput.addEventListener('input', render);

  exportBtn.addEventListener('click', () => {
    const csv = ['Team A,Team B,Court,Finished,Sets'].concat(
      entries.map((m) => `${m.teams.A.name},${m.teams.B.name},${m.court},${m.finishedAt},"${m.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(' ')}"`),
    ).join('\n');
    downloadText('matches.csv', csv);
  });

  copyBtn.addEventListener('click', async () => {
    const summary = entries.slice(0, 10).map((m) => `${m.teams.A.name} vs ${m.teams.B.name} — ${m.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(' ')}`).join('\n');
    const ok = await copyToClipboard(summary || 'No matches yet.');
    if (ok) alert('Copied summary');
  });

  const refresh = () => { entries = getHistory(); render(); };
  render();
  return { refresh };
};
