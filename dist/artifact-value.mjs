const artifact = document.getElementById('artifact-choice');
const grade = document.getElementById('artifact-grade');
const multiplier = document.getElementById('artifact-multiplier');
const format = new Intl.NumberFormat('en-US');
try {
  const response = await fetch(new URL('./guide-data/adventure-codex.json', import.meta.url));
  if (!response.ok) throw new Error('Artifact data unavailable');
  const records = await response.json();
  for (const [index, record] of records.entries()) artifact.add(new Option(record.name, index));
  for (const option of multiplier.options) {
    option.value = option.text;
    option.text = '×' + option.value;
  }
  const render = () => {
    const bounds = records[Number(artifact.value)].gradeBounds;
    const index = grade.selectedIndex;
    const range = factor => format.format(bounds[index] * factor) + '–' +
      format.format(bounds[index + 1] * factor);
    document.getElementById('artifact-base').textContent = range(1);
    document.getElementById('artifact-points').textContent = range(Number(multiplier.value));
  };
  for (const input of [artifact, grade, multiplier]) input.addEventListener('change', render);
  render();
} catch {
  document.getElementById('artifact-result').textContent = 'Could not load artifact values. Reload to try again.';
}
