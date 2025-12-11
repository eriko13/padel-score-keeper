const clone = (obj) => JSON.parse(JSON.stringify(obj));

const createInitialSet = () => ({ gamesA: 0, gamesB: 0 });

const createBaseState = ({ format, noAd, teams }) => ({
  status: 'live',
  format,
  noAd,
  teams,
  sets: [createInitialSet()],
  points: { A: 0, B: 0 },
  advantage: null,
  serving: 'A',
  log: [],
  history: [],
  redo: [],
});

const pointLabel = (points, advantage, side, noAd) => {
  const other = side === 'A' ? 'B' : 'A';
  if (noAd) {
    if (points[side] >= 4 || (points[side] >= 3 && points[other] >= 3)) return 'Game';
    return ['0', '15', '30', '40'][points[side]] ?? '40';
  }
  if (points[side] >= 3 && points[other] >= 3) {
    if (advantage === side) return 'Ad';
    if (advantage === other) return '40';
    return '40';
  }
  return ['0', '15', '30', '40'][points[side]] ?? '40';
};

const checkGameWin = (state, side) => {
  const other = side === 'A' ? 'B' : 'A';
  const { points, noAd, advantage } = state;
  if (noAd) {
    if (points[side] >= 3 && points[other] >= 3) return true;
    if (points[side] >= 4) return true;
    return false;
  }
  if (points[side] >= 3 && points[other] >= 3) {
    if (advantage === side) return true;
    return false;
  }
  return points[side] >= 4;
};

const switchServe = (state) => {
  state.serving = state.serving === 'A' ? 'B' : 'A';
};

const appendLog = (state, message) => {
  state.log.unshift({ id: crypto.randomUUID(), message, timestamp: new Date().toISOString() });
};

const awardGame = (state, side) => {
  const set = state.sets[state.sets.length - 1];
  if (side === 'A') set.gamesA += 1; else set.gamesB += 1;
  state.points = { A: 0, B: 0 };
  state.advantage = null;
  appendLog(state, `Game ${side}`);
  switchServe(state);
  const winner = checkSetWin(set);
  if (winner) {
    appendLog(state, `Set ${winner}`);
    const setsWonA = state.sets.filter((s) => s.gamesA > s.gamesB).length;
    const setsWonB = state.sets.filter((s) => s.gamesB > s.gamesA).length;
    if (state.format === 'single-set' || setsWonA >= 2 || setsWonB >= 2) {
      state.status = 'final';
      appendLog(state, `Match ${winner}`);
      return;
    }
    state.sets.push(createInitialSet());
  }
};

const checkSetWin = (set) => {
  const { gamesA, gamesB } = set;
  if (gamesA >= 6 || gamesB >= 6) {
    if (Math.abs(gamesA - gamesB) >= 2) {
      return gamesA > gamesB ? 'A' : 'B';
    }
    if (gamesA === 7 || gamesB === 7) return gamesA > gamesB ? 'A' : 'B';
  }
  return null;
};

export const createScoringEngine = (config) => {
  const state = createBaseState(config);

  const pushHistory = () => {
    state.history.push(clone({
      sets: state.sets,
      points: state.points,
      advantage: state.advantage,
      serving: state.serving,
      log: state.log,
      status: state.status,
    }));
    state.redo = [];
  };

  const restore = (snap) => {
    state.sets = snap.sets;
    state.points = snap.points;
    state.advantage = snap.advantage;
    state.serving = snap.serving;
    state.log = snap.log;
    state.status = snap.status;
  };

  const addPoint = (side) => {
    if (state.status !== 'live') return state;
    pushHistory();
    const other = side === 'A' ? 'B' : 'A';
    if (state.noAd) {
      state.points[side] += 1;
      if (checkGameWin(state, side)) {
        awardGame(state, side);
      }
      return state;
    }
    if (state.points[side] >= 3 && state.points[other] >= 3) {
      if (state.advantage === side) {
        awardGame(state, side);
      } else if (state.advantage === other) {
        state.advantage = null;
        appendLog(state, 'Back to deuce');
      } else {
        state.advantage = side;
        appendLog(state, `Advantage ${side}`);
      }
      return state;
    }
    state.points[side] += 1;
    if (checkGameWin(state, side)) {
      awardGame(state, side);
    }
    return state;
  };

  const undo = () => {
    const snap = state.history.pop();
    if (!snap) return state;
    state.redo.push(clone({
      sets: state.sets,
      points: state.points,
      advantage: state.advantage,
      serving: state.serving,
      log: state.log,
      status: state.status,
    }));
    restore(snap);
    return state;
  };

  const redo = () => {
    const snap = state.redo.pop();
    if (!snap) return state;
    pushHistory();
    restore(snap);
    return state;
  };

  const endMatch = () => {
    state.status = 'final';
    appendLog(state, 'Match ended');
    return state;
  };

  const getScoreSummary = () => {
    const setScores = state.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(' ');
    return `${state.teams.A.name} vs ${state.teams.B.name} | ${setScores}`;
  };

  return {
    state,
    addPoint,
    undo,
    redo,
    endMatch,
    pointLabel: (side) => pointLabel(state.points, state.advantage, side, state.noAd),
    getScoreSummary,
  };
};
