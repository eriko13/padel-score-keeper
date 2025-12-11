export const initScoreboard = ({
  elements,
  onChange,
}) => {
  let engine = null;

  const setEngine = (nextEngine) => {
    engine = nextEngine;
    render();
  };

  const renderTeams = () => {
    if (!engine) return;
    const { teams } = engine.state;
    const setCard = (el, teamKey) => {
      const team = teams[teamKey];
      el.innerHTML = '';
      const title = document.createElement('h3');
      title.textContent = team.name;
      title.style.color = team.color;
      const points = document.createElement('div');
      points.style.fontSize = '2.5rem';
      points.style.fontWeight = '700';
      points.textContent = engine.pointLabel(teamKey);
      const players = document.createElement('ul');
      players.className = 'list';
      team.players.forEach((p) => {
        const li = document.createElement('li');
        li.textContent = p.name;
        players.append(li);
      });
      el.append(title, points, players);
      if (engine.state.serving === teamKey) {
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 220);
      }
    };
    setCard(elements.teamA, 'A');
    setCard(elements.teamB, 'B');
  };

  const renderSets = () => {
    if (!engine) return;
    elements.setScores.innerHTML = '';
    engine.state.sets.forEach((set, idx) => {
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = `Set ${idx + 1}: ${set.gamesA}-${set.gamesB}`;
      elements.setScores.append(badge);
    });
  };

  const renderServe = () => {
    if (!engine) return;
    elements.serveIndicator.title = `Serving: ${engine.state.serving === 'A' ? engine.state.teams.A.name : engine.state.teams.B.name}`;
  };

  const renderLog = () => {
    if (!engine) return;
    elements.eventLog.innerHTML = '';
    engine.state.log.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = `${new Date(entry.timestamp).toLocaleTimeString()} — ${entry.message}`;
      elements.eventLog.append(li);
    });
  };

  const render = () => {
    if (!engine) return;
    renderTeams();
    renderSets();
    renderServe();
    renderLog();
  };

  elements.scoreButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!engine) return;
      engine.addPoint(btn.dataset.score);
      render();
      onChange?.(engine.state);
    });
  });

  elements.undo.addEventListener('click', () => { if (!engine) return; engine.undo(); render(); onChange?.(engine.state); });
  elements.redo.addEventListener('click', () => { if (!engine) return; engine.redo(); render(); onChange?.(engine.state); });
  elements.endMatch.addEventListener('click', () => { if (!engine) return; engine.endMatch(); render(); onChange?.(engine.state); });
  elements.clearLog.addEventListener('click', () => { if (!engine) return; engine.state.log = []; render(); onChange?.(engine.state); });

  return { setEngine, render };
};
