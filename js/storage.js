const NAMESPACE = 'psk.';

const withNamespace = (key) => `${NAMESPACE}${key}`;

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(withNamespace(key));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error('storage read error', err);
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(withNamespace(key), JSON.stringify(value));
  } catch (err) {
    console.error('storage write error', err);
  }
};

const update = (key, updater, fallback) => {
  const current = read(key, fallback);
  const next = updater(current ?? fallback);
  write(key, next);
  return next;
};

export const storage = {
  get: read,
  set: write,
  update,
};
