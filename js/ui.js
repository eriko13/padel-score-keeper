import { initRoster } from './roster.js';
import { initMatchSetup } from './matchSetup.js';
import { createScoringEngine } from './scoring.js';
import { initScoreboard } from './scoreboard.js';
import { initHistory, addMatchToHistory } from './history.js';
import { storage } from './storage.js';
import { uid } from './utils.js';

const $ = (selector) => document.querySelector(selector);

let refreshSetup = null;

const setActiveNav = (viewId) => {
  document.querySelectorAll('.nav-button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
};

const scrollToSection = (viewId) => {
  const target = document.getElementById(`view-${viewId}`) || document.querySelector(`.view[data-view="${viewId}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
  setActiveNav(viewId);
  if (viewId === 'setup' && refreshSetup) refreshSetup();
};

const recentMatchesEl = $('#recent-matches');

const renderRecent = () => {
  const history = storage.get('history', []);
  recentMatchesEl.innerHTML = '';
  history.slice(0, 5).forEach((m) => {
    const li = document.createElement('li');
    li.textContent = `${m.teams.A.name} vs ${m.teams.B.name} — ${m.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(' ')}`;
    recentMatchesEl.append(li);
  });
};

const setupNav = () => {
  // Only bind to clickable controls, not the view sections themselves.
  document.querySelectorAll('button[data-view], [role="button"][data-view]').forEach((btn) => {
    btn.addEventListener('click', () => scrollToSection(btn.dataset.view));
  });
};

const buildApp = () => {
  // Seed a starter roster so the app feels interactive on first load
  const seedPlayers = () => {
    const existing = storage.get('players', []);
    if (existing.length) return;
    storage.set('players', [
      { id: uid(), name: 'Alex', rating: '8', isAvailable: true },
      { id: uid(), name: 'Blair', rating: '7', isAvailable: true },
      { id: uid(), name: 'Casey', rating: '7.5', isAvailable: true },
      { id: uid(), name: 'Drew', rating: '8.5', isAvailable: true },
      { id: uid(), name: 'Emery', rating: '6.5', isAvailable: true },
    ]);
  };

  seedPlayers();

  setupNav();
  renderRecent();
  setActiveNav('home');

  let notifyRosterChange = () => {};

  const roster = initRoster({
    listEl: $('#roster-list'),
    formEl: $('#roster-form'),
    availableCountEl: $('#available-count'),
    availablePlayersEl: null,
    schedulePlayersEl: null,
    onChange: () => notifyRosterChange(),
  });

  let currentCourt = '';

  const scoreboard = initScoreboard({
    elements: {
      teamA: $('#team-a'),
      teamB: $('#team-b'),
      setScores: $('#set-scores'),
      eventLog: $('#event-log'),
      serveIndicator: $('#serve-indicator'),
      scoreButtons: [...document.querySelectorAll('[data-score]')],
      undo: document.querySelector('[data-undo]'),
      redo: document.querySelector('[data-redo]'),
      endMatch: $('#end-match'),
      clearLog: $('#clear-log'),
    },
    onChange: (state) => {
      storage.set('currentMatch', { ...state, court: currentCourt });
    },
  });

  const startLiveMatch = (payload) => {
    const teams = {
      A: { ...payload.teams[0], name: payload.teams[0].name, color: payload.teams[0].color },
      B: { ...payload.teams[1], name: payload.teams[1].name, color: payload.teams[1].color },
    };
    const engine = createScoringEngine({
      format: payload.format,
      noAd: payload.noAd,
      teams,
    });
    scoreboard.setEngine(engine);
    currentCourt = payload.court;
    document.getElementById('live-court').textContent = currentCourt;
    storage.set('currentMatch', { ...engine.state, court: currentCourt });
    scrollToSection('live');
  };

  const matchSetup = initMatchSetup({
    elements: {
      availablePlayers: $('#available-players'),
      teamsContainer: $('#teams-container'),
      generateTeams: $('#generate-teams'),
      resetTeams: $('#reset-teams'),
      renameTeams: $('#regenerate-names'),
      startMatch: $('#start-match'),
      format: $('#match-format'),
      court: $('#match-court'),
      noAd: $('#match-no-ad'),
    },
    getAvailablePlayers: roster.getAvailable,
    onStartMatch: startLiveMatch,
  });
  refreshSetup = matchSetup.refreshAvailable;
  notifyRosterChange = () => {
    matchSetup.refreshAvailable();
  };

  refreshSetup();

  const history = initHistory({
    listEl: $('#history-list'),
    filterInput: $('#history-filter'),
    exportBtn: $('#export-csv'),
    copyBtn: $('#copy-summary'),
  });

  document.getElementById('end-match').addEventListener('click', () => {
    const current = storage.get('currentMatch');
    if (!current) return;
    const finished = {
      ...current,
      finishedAt: new Date().toISOString(),
    };
    addMatchToHistory(finished);
    renderRecent();
    history.refresh();
  });

  document.querySelector('[data-action="refresh-history"]').addEventListener('click', () => {
    history.refresh();
    renderRecent();
  });
};

buildApp();
