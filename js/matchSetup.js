import { fetchShuffledIndices } from './apiPairing.js';
import { fetchTeamName } from './apiTeamName.js';
import { chunkPairs, uid } from './utils.js';

const colors = ['#2d7ff9', '#a4ff4f', '#fbbf24', '#f472b6', '#38bdf8', '#a78bfa'];

export const initMatchSetup = ({
  elements,
  getAvailablePlayers,
  onStartMatch,
}) => {
  const state = {
    teams: [],
  };

  const renderAvailable = () => {
    const available = getAvailablePlayers();
    elements.availablePlayers.innerHTML = '';
    available.forEach((player) => {
      const chip = document.importNode(document.getElementById('chip-template').content.firstElementChild, true);
      chip.textContent = player.name;
      chip.dataset.id = player.id;
      elements.availablePlayers.append(chip);
    });
  };

  const renderTeams = () => {
    elements.teamsContainer.innerHTML = '';
    state.teams.forEach((team, idx) => {
      const card = document.createElement('div');
      card.className = 'team-card';
      card.style.borderColor = colors[idx % colors.length];
      const title = document.createElement('h4');
      title.textContent = team.name;
      title.style.color = colors[idx % colors.length];
      const list = document.createElement('ul');
      list.className = 'list';
      team.players.forEach((p) => {
        const li = document.createElement('li');
        li.textContent = p.name;
        list.append(li);
      });
      card.append(title, list);
      elements.teamsContainer.append(card);
    });
  };

  const buildTeams = async () => {
    const available = getAvailablePlayers();
    if (available.length < 4) {
      alert('Need at least 4 available players.');
      return;
    }
    const shuffledIndices = await fetchShuffledIndices(available.length);
    const ordered = shuffledIndices.map((i) => available[i]);
    const pairs = chunkPairs(ordered);
    const teams = [];
    for (let i = 0; i < pairs.length; i += 1) {
      const name = await fetchTeamName();
      teams.push({
        id: uid(),
        name,
        color: colors[i % colors.length],
        players: pairs[i],
      });
    }
    state.teams = teams;
    renderTeams();
  };

  const renameTeams = async () => {
    const renamed = [];
    for (let i = 0; i < state.teams.length; i += 1) {
      renamed.push({ ...state.teams[i], name: await fetchTeamName() });
    }
    state.teams = renamed;
    renderTeams();
  };

  const reset = () => {
    state.teams = [];
    elements.teamsContainer.innerHTML = '';
  };

  elements.generateTeams.addEventListener('click', buildTeams);
  elements.resetTeams.addEventListener('click', reset);
  elements.renameTeams.addEventListener('click', renameTeams);

  elements.startMatch.addEventListener('click', () => {
    if (state.teams.length < 2) {
      alert('Generate at least two teams.');
      return;
    }
    const payload = {
      teams: state.teams,
      format: elements.format.value,
      court: elements.court.value.trim() || 'Court',
      noAd: elements.noAd.checked,
    };
    onStartMatch(payload);
  });

  renderAvailable();

  return {
    refreshAvailable: renderAvailable,
    getTeams: () => [...state.teams],
  };
};
