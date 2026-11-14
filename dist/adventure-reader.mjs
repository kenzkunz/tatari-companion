function cropMask(image, box, predicate) {
  const [x, y, w, h] = box.map(Math.round);
  if (x < 0 || y < 0 || x + w > image.width || y + h > image.height) return null;
  const bits = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = ((y + j) * image.width + x + i) * 4;
    bits[j * w + i] = Number(predicate(image.data[k], image.data[k + 1], image.data[k + 2]));
  }
  return {bits, w, h};
}

function shape(mask, left, right, width, height) {
  const {bits, w, h} = mask;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = left; x < right; x++) {
    if (!bits[y * w + x]) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < x0) return null;
  const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
  let normalized = '';
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    normalized += bits[(y0 + Math.floor((y + .5) * sh / height)) * w + x0 +
      Math.floor((x + .5) * sw / width)];
  }
  return {ratio: sw / sh, normalized, height: sh};
}

function match(shape, templates, aspectWeight) {
  const scores = new Map();
  for (const [id, ratio, bits] of templates) {
    let errors = 0;
    for (let i = 0; i < bits.length; i++) errors += Number(bits[i] !== shape.normalized[i]);
    const cost = errors / bits.length + aspectWeight * Math.abs(Math.log(ratio / shape.ratio));
    scores.set(id, Math.min(cost, scores.get(id) ?? Infinity));
  }
  return [...scores].sort((a, b) => a[1] - b[1]);
}

function readNumber(mask, templates) {
  if (!mask) return null;
  const {bits, w, h} = mask;
  let text = '', start = -1;
  for (let x = 0; x <= w; x++) {
    let set = false;
    for (let y = 0; x < w && y < h && !set; y++) set = !!bits[y * w + x];
    if (set && start < 0) start = x;
    if (set || start < 0) continue;
    const left = start;
    start = -1;
    const glyph = shape(mask, left, x, 12, 18);
    if (glyph.height < h * .35) continue;
    const [best, next] = match(glyph, templates, .12);
    if (best[1] <= .26 && next[1] - best[1] >= .012) {
      text += best[0];
      continue;
    }
    if (glyph.ratio < 1) return null;
    const pairs = new Map();
    for (let split = left + Math.ceil((x - left) * .35); split <= left + (x - left) * .65; split++) {
      const [a] = match(shape(mask, left, split, 12, 18), templates, .12);
      const [b] = match(shape(mask, split, x, 12, 18), templates, .12);
      if (Math.max(a[1], b[1]) > .23) continue;
      const pair = a[0] + b[0];
      pairs.set(pair, Math.min(pairs.get(pair) ?? Infinity, a[1] + b[1]));
    }
    const [pair, other] = [...pairs].sort((a, b) => a[1] - b[1]);
    if (!pair || (other && other[1] - pair[1] < .02)) return null;
    text += pair[0];
  }
  return /^\d{1,5}$/.test(text) ? Number(text) : null;
}

function findRows(image, columns) {
  const runs = [];
  let start = null;
  for (let y = 0; y <= image.height; y++) {
    const hit = y < image.height && columns.filter(x => {
      const i = (y * image.width + Math.round(x + image.width * .21)) * 4;
      const [r, g, b] = image.data.subarray(i, i + 3);
      return r >= 15 && r < 60 && g >= 12 && g < 55 && b > 52 && b < 105 && b > r * 1.45;
    }).length >= 3;
    if (hit && start === null) start = y;
    if (!hit && start !== null) {
      if (y - start > image.width * .025 && y - start < image.width * .065) runs.push((start + y) / 2);
      start = null;
    }
  }
  return runs;
}

export function scanCodex(image, artifacts, templates) {
  const scale = image.width / 947;
  const columns = [18, 251, 484, 716].map(x => x * scale);
  const rows = findRows(image, columns);
  const records = [];
  let unread = 0;
  const valuesRead = [];
  for (const y of rows) for (const x of columns) {
    const numberBox = [x + 64 * scale, y - 15 * scale, 134 * scale, 30 * scale];
    const values = [145, 175, 205, 225, 240, 250].map(t => readNumber(cropMask(image, numberBox,
      (r, g, b) => Math.min(r, g, b) > t), templates.white));
    const value = values.find(n => n !== null && values.filter(v => v === n).length >= 2);
    if (value !== undefined) valuesRead.push(value);
    const nameBox = [x + 6 * scale, y - 99 * scale, 203 * scale, 53 * scale];
    const white = cropMask(image, nameBox, (r, g, b) => Math.min(r, g, b) > 180);
    const dark = cropMask(image, nameBox, (r, g, b) => Math.max(r, g, b) < 115);
    const label = dark && white.bits.reduce((a, b) => a + b, 0) > white.bits.length * .48
      ? shape(dark, 0, dark.w, 96, 20) : null;
    if (!label || value === undefined) { unread++; continue; }
    const [best, next] = match(label, templates.names, .08);
    const artifact = artifacts.find(a => a.id === best[0]);
    if (best[1] > .22 || next[1] - best[1] < .025 || value < artifact.min || value > artifact.max) {
      unread++;
      continue;
    }
    records.push({id: artifact.id, value});
  }

  const header = cropMask(image, [616 * scale, 130 * scale, 183 * scale, 59 * scale],
    (r, g, b) => r > 170 && g > 140 && b < 180 && r - b > 55);
  const total = readNumber(header, [...templates.gold, ...templates.white]);
  return {records, unread, total, valuesRead};
}
