import { initRoster } from './roster.js';
import { initMatchSetup } from './matchSetup.js';
import { createScoringEngine } from './scoring.js';
import { initScoreboard } from './scoreboard.js';
import { initHistory, addMatchToHistory } from './history.js';
import { storage } from './storage.js';
import { uid, formatDate } from './utils.js';

const $ = (selector) => document.querySelector(selector);

let refreshSetup = null;
let matchSetupApi = null;
let rosterApi = null;
let scoreboardApi = null;
let historyApi = null;
let currentView = 'home';
let previousView = null;

const viewLabels = {
  home: 'Home',
  setup: 'Match setup',
  roster: 'Roster',
  live: 'Live scoring',
  history: 'History',
};

const breadcrumbEls = {
  back: document.getElementById('breadcrumb-back'),
  trail: document.getElementById('breadcrumb-trail'),
};

const updateBreadcrumb = () => {
  if (!breadcrumbEls.trail) return;
  const label = viewLabels[currentView] || currentView;
  breadcrumbEls.trail.textContent = currentView === 'home' ? 'Home' : `Home / ${label}`;
  if (breadcrumbEls.back) {
    breadcrumbEls.back.disabled = currentView === 'home';
  }
};

const appState = {
  plan: storage.get('plan', null),
  schedule: storage.get('schedule', []),
  currentMatchId: storage.get('currentMatchId', null),
};

const setActiveNav = (viewId) => {
  document.querySelectorAll('.nav-button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
};

const showView = (viewId) => {
  if (viewId !== currentView) {
    previousView = currentView;
    currentView = viewId;
  }
  document.querySelectorAll('.view').forEach((view) => {
    const isTarget = view.dataset.view === viewId || view.id === `view-${viewId}`;
    view.classList.toggle('hidden', !isTarget);
  });
  setActiveNav(viewId);
  updateBreadcrumb();
};

const scrollToSection = (viewId) => {
  const target = document.getElementById(`view-${viewId}`) || document.querySelector(`.view[data-view="${viewId}"]`);
  if (!target) return;
  showView(viewId);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
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
  document.querySelectorAll('button[data-view], [role="button"][data-view]').forEach((btn) => {
    btn.addEventListener('click', () => scrollToSection(btn.dataset.view));
  });
};

const planEls = {
  panel: $('#plan-panel'),
  form: $('#plan-form'),
  name: $('#plan-name'),
  date: $('#plan-date'),
  court: $('#plan-court'),
  format: $('#plan-format'),
  noAd: $('#plan-no-ad'),
  type: $('#plan-type'),
  notes: $('#plan-notes'),
  playerOptions: $('#plan-player-options'),
  reset: $('#plan-reset'),
  summary: $('#plan-summary'),
  summaryName: $('#summary-name'),
  summaryDate: $('#summary-date'),
  summaryCourt: $('#summary-court'),
  summaryFormat: $('#summary-format'),
  summaryType: $('#summary-type'),
  summaryNotes: $('#summary-notes'),
  summaryPlayers: $('#summary-players'),
  summaryGenerate: $('#summary-generate'),
  summaryStartNext: $('#summary-start-next'),
  edit: $('#plan-edit'),
  clear: $('#plan-clear'),
};

const scheduleEls = {
  panel: $('#schedule-panel'),
  list: $('#schedule-list'),
  count: $('#schedule-count'),
  startNext: $('#start-next-match'),
};

const savePlan = (plan) => {
  appState.plan = plan;
  storage.set('plan', plan);
};

const clearPlan = () => {
  appState.plan = null;
  storage.set('plan', null);
};

const saveSchedule = (schedule) => {
  appState.schedule = schedule;
  storage.set('schedule', schedule);
};

const saveCurrentMatchId = (matchId) => {
  appState.currentMatchId = matchId;
  storage.set('currentMatchId', matchId);
};

const getPlannedPlayers = () => {
  if (!rosterApi) return [];
  const players = rosterApi.getPlayers();
  if (!appState.plan?.playerIds?.length) return rosterApi.getAvailable();
  const selected = new Set(appState.plan.playerIds);
  return players.filter((p) => selected.has(p.id) && p.isAvailable);
};

const renderPlanPlayerOptions = () => {
  if (!planEls.playerOptions || !rosterApi) return;
  const players = rosterApi.getPlayers();
  const selected = new Set(appState.plan?.playerIds ?? []);
  planEls.playerOptions.innerHTML = '';
  players.forEach((player) => {
    const label = document.createElement('label');
    label.className = 'chip selectable';
    label.setAttribute('tabindex', '0');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.id = player.id;
    checkbox.checked = selected.has(player.id);
    const name = document.createElement('span');
    name.textContent = `${player.name}${player.rating ? ` (${player.rating})` : ''}`;
    label.append(checkbox, name);
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
      }
    });
    planEls.playerOptions.append(label);
  });
};

const setPlanVisibility = () => {
  const hasPlan = Boolean(appState.plan);
  if (planEls.form && planEls.panel) {
    planEls.panel.classList.toggle('hidden', hasPlan);
  }
  if (planEls.summary) {
    planEls.summary.classList.toggle('hidden', !hasPlan);
  }
  if (scheduleEls.panel) {
    scheduleEls.panel.classList.toggle('hidden', !hasPlan || appState.schedule.length === 0);
  }
};

const renderPlanSummary = () => {
  if (!appState.plan) {
    setPlanVisibility();
    return;
  }
  const plan = appState.plan;
  const playerLookup = rosterApi ? rosterApi.getPlayers().reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) : {};
  const players = (plan.playerIds || []).map((id) => playerLookup[id]).filter(Boolean);

  planEls.summaryName.textContent = plan.name;
  planEls.summaryCourt.textContent = plan.court || 'Court';
  planEls.summaryFormat.textContent = `${plan.format === 'best-of-3' ? 'Best of 3' : 'Single set'}${plan.noAd ? ' · No-ad' : ''}`;
  planEls.summaryType.textContent = plan.type === 'round-robin' ? 'Round robin' : plan.type || 'Match';
  planEls.summaryDate.textContent = plan.date ? formatDate(plan.date) : 'Not set';
  planEls.summaryNotes.textContent = plan.notes || '—';
  planEls.summaryPlayers.innerHTML = '';
  players.forEach((p) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = p.name;
    planEls.summaryPlayers.append(chip);
  });
  setPlanVisibility();
};

const buildRoundRobinSchedule = (teams) => {
  const schedule = [];
  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      schedule.push({
        id: uid(),
        teams: [teams[i], teams[j]],
        status: 'pending',
        result: null,
      });
    }
  }
  return schedule;
};

const renderSchedule = () => {
  if (!scheduleEls.list) return;
  scheduleEls.list.innerHTML = '';
  scheduleEls.count.textContent = appState.schedule.length ? `${appState.schedule.length} matches` : 'No matches yet';

  if (!appState.schedule.length) {
    const li = document.createElement('li');
    li.textContent = 'Generate teams to build a round robin.';
    scheduleEls.list.append(li);
    setPlanVisibility();
    return;
  }

  appState.schedule.forEach((match) => {
    const li = document.createElement('li');
    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.textContent = `${match.teams[0].name} vs ${match.teams[1].name}`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = match.result || 'Scheduled';
    const status = document.createElement('span');
    status.className = `status-badge status-${match.status}`;
    status.textContent = match.status === 'pending' ? 'Pending' : match.status === 'live' ? 'Live' : 'Done';

    const actions = document.createElement('div');
    actions.className = 'actions-inline';
    if (match.status === 'pending') {
      const startBtn = document.createElement('button');
      startBtn.className = 'primary';
      startBtn.textContent = 'Start';
      startBtn.addEventListener('click', () => startScheduledMatch(match.id));
      actions.append(startBtn);
    }
    li.append(title, meta, status, actions);
    scheduleEls.list.append(li);
  });
  setPlanVisibility();
};

const handlePlanSubmit = (event) => {
  event.preventDefault();
  if (!planEls.form) return;
  const selectedIds = [...planEls.playerOptions.querySelectorAll('input[type="checkbox"]')]
    .filter((cb) => cb.checked)
    .map((cb) => cb.dataset.id);
  if (selectedIds.length < 4) {
    alert('Select at least 4 players.');
    return;
  }
  if (selectedIds.length % 2 !== 0) {
    alert('Use an even number of players for doubles.');
    return;
  }

  const plan = {
    id: uid(),
    name: planEls.name.value.trim() || 'Padel session',
    date: planEls.date.value || '',
    court: planEls.court.value.trim() || 'Court',
    format: planEls.format.value,
    noAd: planEls.noAd.checked,
    type: planEls.type.value,
    notes: planEls.notes.value.trim(),
    playerIds: selectedIds,
    savedAt: new Date().toISOString(),
  };

  savePlan(plan);
  renderPlanSummary();
  if (matchSetupApi) matchSetupApi.refreshAvailable();
};

const handlePlanEdit = () => {
  if (!appState.plan || !planEls.form) return;
  planEls.name.value = appState.plan.name;
  planEls.date.value = appState.plan.date;
  planEls.court.value = appState.plan.court;
  planEls.format.value = appState.plan.format;
  planEls.noAd.checked = Boolean(appState.plan.noAd);
  planEls.type.value = appState.plan.type ?? 'round-robin';
  planEls.notes.value = appState.plan.notes ?? '';
  planEls.panel?.classList.remove('hidden');
  planEls.summary?.classList.add('hidden');
  scheduleEls.panel?.classList.add('hidden');
};

const handlePlanClear = () => {
  clearPlan();
  saveSchedule([]);
  saveCurrentMatchId(null);
  setPlanVisibility();
  renderSchedule();
  if (planEls.form) planEls.form.reset();
  renderPlanPlayerOptions();
};

const syncScheduleFromTeams = (teams) => {
  if (!teams || teams.length < 2) {
    saveSchedule([]);
    renderSchedule();
    return;
  }
  const schedule = buildRoundRobinSchedule(teams);
  saveSchedule(schedule);
  renderSchedule();
};

const setLiveStatusOnSchedule = (matchId, status, result) => {
  if (!matchId) return;
  saveSchedule(appState.schedule.map((m) => {
    if (m.id !== matchId) return { ...m, status: m.status === 'live' ? 'pending' : m.status };
    return { ...m, status, result: result ?? m.result };
  }));
  renderSchedule();
};

const startScheduledMatch = (matchId) => {
  if (!appState.plan) {
    alert('Save a plan first.');
    return;
  }
  const match = appState.schedule.find((m) => m.id === matchId);
  if (!match) {
    alert('Match not found.');
    return;
  }
  startLiveMatch({
    teams: match.teams,
    format: appState.plan.format,
    noAd: appState.plan.noAd,
    court: appState.plan.court,
    matchId,
  });
};

const startNextPendingMatch = () => {
  const next = appState.schedule.find((m) => m.status === 'pending');
  if (!next) {
    alert('No pending matches.');
    return;
  }
  startScheduledMatch(next.id);
};

let currentCourt = '';

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
  if (!scoreboardApi) return;
  scoreboardApi.setEngine(engine);
  currentCourt = payload.court;
  document.getElementById('live-court').textContent = currentCourt;
  saveCurrentMatchId(payload.matchId ?? null);
  storage.set('currentMatch', { ...engine.state, court: currentCourt, matchId: payload.matchId ?? null });
  setLiveStatusOnSchedule(payload.matchId, 'live');
  scrollToSection('live');
};

const handleMatchEnd = () => {
  const current = storage.get('currentMatch');
  if (!current) return;
  const finished = {
    ...current,
    finishedAt: new Date().toISOString(),
  };
  addMatchToHistory(finished);
  renderRecent();
  historyApi?.refresh();

  const summary = finished.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(' ');
  setLiveStatusOnSchedule(appState.currentMatchId, 'done', `Final: ${summary}`);
  saveCurrentMatchId(null);
  storage.set('currentMatch', null);
};

const buildApp = () => {
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
  showView('home');
  updateBreadcrumb();

  let notifyRosterChange = () => {};

  rosterApi = initRoster({
    listEl: $('#roster-list'),
    formEl: $('#roster-form'),
    availableCountEl: $('#available-count'),
    availablePlayersEl: null,
    schedulePlayersEl: null,
    onChange: () => notifyRosterChange(),
  });

  renderPlanPlayerOptions();

  scoreboardApi = initScoreboard({
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
      storage.set('currentMatch', { ...state, court: currentCourt, matchId: appState.currentMatchId });
    },
  });

  matchSetupApi = initMatchSetup({
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
    getAvailablePlayers: getPlannedPlayers,
    onStartMatch: (payload) => startLiveMatch({ ...payload, matchId: null }),
    onTeamsChange: syncScheduleFromTeams,
  });
  refreshSetup = matchSetupApi.refreshAvailable;
  notifyRosterChange = () => {
    matchSetupApi.refreshAvailable();
    renderPlanPlayerOptions();
  };

  refreshSetup();
  renderPlanSummary();
  renderSchedule();

  historyApi = initHistory({
    listEl: $('#history-list'),
    filterInput: $('#history-filter'),
    exportBtn: $('#export-csv'),
    copyBtn: $('#copy-summary'),
  });

  document.getElementById('end-match').addEventListener('click', handleMatchEnd);

  document.querySelector('[data-action="refresh-history"]').addEventListener('click', () => {
    historyApi.refresh();
    renderRecent();
  });

  planEls.form?.addEventListener('submit', handlePlanSubmit);
  planEls.reset?.addEventListener('click', () => planEls.form?.reset());
  planEls.edit?.addEventListener('click', handlePlanEdit);
  planEls.clear?.addEventListener('click', handlePlanClear);
  planEls.summaryGenerate?.addEventListener('click', async () => { await matchSetupApi?.buildTeams(); scrollToSection('setup'); });
  planEls.summaryStartNext?.addEventListener('click', startNextPendingMatch);
  scheduleEls.startNext?.addEventListener('click', startNextPendingMatch);

  breadcrumbEls.back?.addEventListener('click', () => {
    if (previousView) {
      const target = previousView;
      previousView = null;
      scrollToSection(target);
    } else {
      scrollToSection('home');
    }
  });

  if (appState.plan) {
    renderPlanSummary();
    setPlanVisibility();
  } else {
    setPlanVisibility();
  }
};

buildApp();
