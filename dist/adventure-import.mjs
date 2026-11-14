import {scanCodex} from './adventure-reader.mjs';

const format = n => n.toLocaleString('en-US');

async function readFile(file, artifacts, templates) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1284, image.naturalWidth);
    canvas.height = Math.round(canvas.width * image.naturalHeight / image.naturalWidth);
    if (!canvas.width || !canvas.height || canvas.height > 4000) throw Error('Unsupported image dimensions.');
    const context = canvas.getContext('2d', {willReadFrequently: true});
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return scanCodex(context.getImageData(0, 0, canvas.width, canvas.height), artifacts, templates);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readCodexFiles(files, artifacts) {
  const response = await fetch(new URL('./guide-data/adventure-reader.json', import.meta.url));
  if (!response.ok) throw Error('Could not load the screenshot reader.');
  const templates = await response.json();
  const results = [];
  let failed = 0;
  for (const file of files) {
    try {
      results.push(await readFile(file, artifacts, templates));
    } catch {
      failed++;
    }
  }

  const records = new Map();
  const conflicts = new Set();
  for (const {records: entries} of results) for (const {id, value} of entries) {
    if (records.has(id) && records.get(id) !== value) conflicts.add(id);
    records.set(id, value);
  }
  for (const id of conflicts) records.delete(id);
  const headers = new Set(results.map(result => result.total).filter(n => n !== null));
  const header = headers.size === 1 ? [...headers][0] : null;
  const sum = [...records.values()].reduce((a, b) => a + b, 0);
  const matchingVisibleSum = header !== null && results.some(result =>
    result.total === header && result.valuesRead.length === artifacts.length &&
    result.valuesRead.reduce((a, b) => a + b, 0) === header);
  let verification;
  if (headers.size > 1) {
    return {records: new Map(), summary: 'The screenshots show different header totals. Import one codex snapshot at a time.'};
  }
  if (header !== null && sum > header) {
    return {records: new Map(), summary: 'The read records exceed the screenshot total. Try clearer screenshots.'};
  }
  if (records.size === artifacts.length && header !== null && sum !== header) {
    return {records: new Map(), summary: 'The read records do not match the screenshot total. Try clearer screenshots.'};
  }
  if (header !== null && sum === header) verification = 'Named records match the screenshot total of ' + format(header) + '.';
  else if (matchingVisibleSum) verification = 'Visible values add up to the screenshot total of ' + format(header) + '. Only records with readable names can be imported.';
  else if (header !== null) verification = 'Named records total ' + format(sum) + ' of ' + format(header) + ' shown in the screenshot. Full total unverified.';
  else verification = 'Screenshot total could not be read.';

  const summary = records.size + ' / ' + artifacts.length + ' artifact records read. ' + verification +
    (conflicts.size ? ' ' + conflicts.size + ' conflicting records skipped.' : '') +
    (failed ? ' ' + failed + ' screenshots could not be opened.' : '');
  return {records, summary};
}
