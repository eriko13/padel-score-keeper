export const uid = () => {
  if (crypto?.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers
  return `id-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
};

export const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const chunkPairs = (arr) => {
  const pairs = [];
  for (let i = 0; i < arr.length; i += 2) {
    if (arr[i + 1]) pairs.push([arr[i], arr[i + 1]]);
  }
  return pairs;
};

export const formatDate = (iso) => new Date(iso).toLocaleString();

export const downloadText = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('copy failed', err);
    return false;
  }
};

export const createElement = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};
