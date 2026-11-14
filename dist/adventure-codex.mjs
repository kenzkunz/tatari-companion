import {confirmDialog} from './site-dialogs.mjs?v=1';

const key = 'tatari-adventure-codex-v1';
const format = value => value.toLocaleString('en-US');
const get = id => document.getElementById('codex-' + id);
const status = get('status');
const cards = [];
const quality = {Blue: 2, Purple: 3, Gold: 4, Red: 5};
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(key) || '{}') ?? {};
} catch {}

function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(
      cards.filter(({input}) => parseRecord(input) !== null)
        .map(({artifact, input}) => [artifact.id, input.value])
    )));
  } catch {
    status.hidden = false;
    status.textContent = 'Browser storage is unavailable. Records will last for this visit only.';
  }
}

function parseRecord(input) {
  const raw = input.value.trim();
  if (!/^\d+$|^\d{1,3}(,\d{3})+$/.test(raw)) return null;
  const number = Number(raw.replaceAll(',', ''));
  return number >= Number(input.dataset.min) && number <= Number(input.dataset.max) ? number : null;
}

function update() {
  let total = 0, ceiling = 0, count = 0, invalid = 0;
  for (const {artifact, card, input} of cards) {
    const value = parseRecord(input);
    const wrong = input.value.trim() !== '' && value === null;
    invalid += Number(wrong);
    count += Number(value !== null);
    total += value ?? 0;
    ceiling += artifact.max;
    input.setAttribute('aria-invalid', String(wrong));
    card.querySelector('.fish-error').textContent = wrong ?
      'Enter ' + format(artifact.min) + '–' + format(artifact.max) + '.' : '';
    card.querySelector('.fish-current strong').textContent = value === null ? '—' : format(value);
    card.querySelector('.fish-gain strong').textContent = '+' + format(artifact.max - (value ?? 0));
  }
  get('total').textContent = format(total);
  get('gain').textContent = '+' + format(ceiling - total);
  get('count').textContent = count + ' / ' + cards.length + ' records entered' +
    (invalid ? ' · ' + invalid + ' invalid values excluded' : '');
}

function makeCard(artifact) {
  const card = document.createElement('article');
  card.className = 'fish-card quality-' + quality[artifact.rarity];
  card.innerHTML = '<div class="fish-art"><img alt="" loading="lazy" width="128" height="128">' +
    '<div class="fish-current"><strong>—</strong></div></div><h3></h3>' +
    '<label>Best value at 1×</label><input type="text" inputmode="numeric" autocomplete="off" placeholder="No record">' +
    '<p class="fish-error"></p><div class="fish-gain"><span>Can add</span><strong></strong></div>';
  card.querySelector('img').src = artifact.icon;
  card.querySelector('h3').textContent = artifact.name;
  const input = card.querySelector('input');
  input.id = 'codex-record-' + artifact.id;
  input.dataset.min = artifact.min;
  input.dataset.max = artifact.max;
  input.value = typeof saved[artifact.id] === 'string' ? saved[artifact.id] : '';
  card.querySelector('label').htmlFor = input.id;
  input.setAttribute('aria-label', artifact.name + ' best value at 1×');
  const error = card.querySelector('.fish-error');
  error.id = input.id + '-error';
  input.setAttribute('aria-describedby', error.id);
  input.addEventListener('input', () => {
    update();
    persist();
  });
  get('grid').append(card);
  return {artifact, card, input};
}

try {
  const response = await fetch(new URL('./guide-data/adventure-codex.json', import.meta.url));
  if (!response.ok) throw new Error('Artifact data is unavailable.');
  const artifacts = await response.json();
  cards.push(...artifacts.map(makeCard));
  const picker = get('files');
  const importButton = get('import');
  importButton.addEventListener('click', () => picker.click());
  importButton.disabled = false;
  picker.addEventListener('change', async () => {
    const files = [...picker.files];
    picker.value = '';
    if (!files.length) return;
    status.hidden = false;
    if (files.length > 6) {
      status.textContent = 'Choose up to six screenshots at a time.';
      return;
    }
    importButton.disabled = true;
    status.textContent = 'Reading codex screenshots…';
    try {
      const {readCodexFiles} = await import('./adventure-import.mjs');
      const {records, summary} = await readCodexFiles(files, artifacts);
      const changes = cards.filter(({artifact, input}) =>
        records.has(artifact.id) && records.get(artifact.id) > (parseRecord(input) ?? 0));
      status.textContent = summary;
      if (!changes.length) return;
      const accepted = await confirmDialog(summary + ' Save ' + changes.length + ' new or higher records?', {
        title: 'Import artifact records', action: 'Save records'
      });
      if (!accepted) return;
      let imported = 0;
      for (const {artifact, input} of changes) {
        const value = records.get(artifact.id);
        if (value <= (parseRecord(input) ?? 0)) continue;
        input.value = String(value);
        imported++;
      }
      update();
      status.textContent = imported + ' records imported. ' + summary;
      persist();
    } catch {
      status.textContent = 'Screenshot import could not start. Reload and try again.';
    } finally {
      importButton.disabled = false;
    }
  });
  update();
  get('search').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    for (const {artifact, card} of cards) {
      card.hidden = !(artifact.name + ' ' + artifact.rarity).toLowerCase().includes(query);
    }
    get('empty').hidden = cards.some(({card}) => !card.hidden);
  });
  get('max').disabled = get('reset').disabled = false;
  get('max').addEventListener('click', () => {
    for (const {artifact, input} of cards) input.value = String(artifact.max);
    update();
    persist();
  });
  get('reset').addEventListener('click', async () => {
    if (!cards.some(({input}) => input.value)) return;
    if (!await confirmDialog('Clear all saved artifact records?', {title: 'Clear records', action: 'Clear records'})) return;
    for (const {input} of cards) input.value = '';
    update();
    persist();
  });
} catch {
  get('count').textContent = 'Artifact records could not load. Reload the page to try again.';
}
