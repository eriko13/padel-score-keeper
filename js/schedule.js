import { shuffleArray } from './utils.js';

const createMatches = (players, courts) => {
  const rounds = [];
  let pool = [...players];
  let roundIndex = 1;
  while (pool.length >= 4) {
    const shuffled = shuffleArray(pool);
    const round = [];
    for (let c = 0; c < courts; c += 1) {
      if (shuffled.length < 4) break;
      const teamA = [shuffled.pop(), shuffled.pop()];
      const teamB = [shuffled.pop(), shuffled.pop()];
      round.push({ court: c + 1, teamA, teamB });
    }
    rounds.push({ id: `r${roundIndex}`, matches: round });
    roundIndex += 1;
    pool = shuffled;
  }
  return rounds;
};

export const initSchedule = ({ playersContainer, courtsInput, buildBtn, tableEl, refreshBtn, getRoster }) => {
  const collectSelected = () => {
    const chips = [...playersContainer.querySelectorAll('.chip')];
    return chips.filter((chip) => chip.classList.contains('active')).map((chip) => {
      const id = chip.dataset.id;
      const player = getRoster().find((p) => p.id === id);
      return player;
    }).filter(Boolean);
  };

  const renderTable = (rounds) => {
    tableEl.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Round</th><th>Court</th><th>Teams</th></tr>';
    table.append(thead);
    const tbody = document.createElement('tbody');
    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        const tr = document.createElement('tr');
        const teams = `${match.teamA.map((p) => p.name).join(' & ')} vs ${match.teamB.map((p) => p.name).join(' & ')}`;
        tr.innerHTML = `<td>${round.id}</td><td>${match.court}</td><td>${teams}</td>`;
        tbody.append(tr);
      });
    });
    table.append(tbody);
    tableEl.append(table);
  };

  const build = (silent = false) => {
    const players = collectSelected();
    const courts = Number.parseInt(courtsInput.value, 10) || 1;
    if (players.length < 4) {
      if (!silent) alert('Select at least 4 players');
      return;
    }
    const rounds = createMatches(players, courts);
    renderTable(rounds);
  };

  buildBtn.addEventListener('click', build);
  refreshBtn.addEventListener('click', () => {
    tableEl.innerHTML = '';
  });

  return { rebuild: () => build(true) };
};
