import { storage } from './storage.js';
import { uid, createElement } from './utils.js';

const KEY = 'players';

const getRoster = () => storage.get(KEY, []);
const persistRoster = (players) => storage.set(KEY, players);

const renderPlayerRow = (player, { onToggle, onEdit, onDelete }) => {
  const li = document.createElement('li');
  const info = createElement('div');
  info.style.display = 'grid';
  info.style.gap = '0.25rem';
  const name = createElement('div');
  name.textContent = player.name;
  const meta = createElement('div');
  meta.style.color = '#6b7280';
  meta.style.fontSize = '0.9rem';
  meta.textContent = `${player.rating ? `Rating ${player.rating} · ` : ''}${player.isAvailable ? 'Available' : 'Unavailable'}`;
  info.append(name, meta);

  const actions = createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '0.35rem';

  const toggleBtn = createElement('button', player.isAvailable ? 'secondary' : 'ghost', player.isAvailable ? 'On court' : 'Bench');
  toggleBtn.addEventListener('click', () => onToggle(player.id));

  const editBtn = createElement('button', 'ghost', 'Edit');
  editBtn.addEventListener('click', () => onEdit(player.id));

  const deleteBtn = createElement('button', 'ghost', 'Remove');
  deleteBtn.style.color = '#e02424';
  deleteBtn.addEventListener('click', () => onDelete(player.id));

  actions.append(toggleBtn, editBtn, deleteBtn);
  li.append(info, actions);
  return li;
};

export const initRoster = ({
  listEl,
  formEl,
  availableCountEl,
  availablePlayersEl,
  schedulePlayersEl,
  onChange = () => {},
}) => {
  const state = {
    players: getRoster(),
  };

  const saveAndRender = () => {
    persistRoster(state.players);
    render();
    onChange();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = formEl.elements.name.value.trim();
    const rating = formEl.elements.rating.value.trim();
    if (!name) return;
    state.players.push({
      id: uid(),
      name,
      rating: rating || null,
      isAvailable: true,
    });
    formEl.reset();
    saveAndRender();
  };

  const handleToggle = (id) => {
    state.players = state.players.map((p) => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p);
    saveAndRender();
  };

  const handleEdit = (id) => {
    const player = state.players.find((p) => p.id === id);
    if (!player) return;
    const newName = window.prompt('Edit name', player.name);
    if (!newName) return;
    const newRating = window.prompt('Edit rating (optional)', player.rating ?? '');
    state.players = state.players.map((p) => p.id === id ? { ...p, name: newName.trim(), rating: newRating?.trim() || null } : p);
    saveAndRender();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this player?')) return;
    state.players = state.players.filter((p) => p.id !== id);
    saveAndRender();
  };

  const renderAvailableChips = () => {
    if (!availablePlayersEl) return;
    availablePlayersEl.innerHTML = '';
    state.players.filter((p) => p.isAvailable).forEach((player) => {
      const chip = document.importNode(document.getElementById('chip-template').content.firstElementChild, true);
      chip.textContent = player.name;
      chip.dataset.id = player.id;
      availablePlayersEl.append(chip);
    });
  };

  const renderScheduleChips = () => {
    if (!schedulePlayersEl) return;
    schedulePlayersEl.innerHTML = '';
    state.players.forEach((player) => {
      const chip = document.importNode(document.getElementById('chip-template').content.firstElementChild, true);
      chip.textContent = player.name;
      chip.dataset.id = player.id;
      chip.classList.toggle('active', player.isAvailable);
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
      schedulePlayersEl.append(chip);
    });
  };

  const render = () => {
    listEl.innerHTML = '';
    state.players.forEach((player) => {
      const row = renderPlayerRow(player, {
        onToggle: handleToggle,
        onEdit: handleEdit,
        onDelete: handleDelete,
      });
      listEl.append(row);
    });
    const availableCount = state.players.filter((p) => p.isAvailable).length;
    if (availableCountEl) {
      availableCountEl.textContent = `${availableCount} available`;
    }
    renderAvailableChips();
    renderScheduleChips();
  };

  formEl.addEventListener('submit', handleSubmit);
  render();

  return {
    getPlayers: () => [...state.players],
    getAvailable: () => state.players.filter((p) => p.isAvailable),
    setPlayers: (players) => { state.players = players; saveAndRender(); },
  };
};
