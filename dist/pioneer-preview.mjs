// Keep every comparison available without JavaScript; show one at a time when enhanced.
for (const view of document.querySelectorAll('[data-odds-view]')) {
  const select = view.querySelector('[data-odds-select]');
  const panels = [...view.querySelectorAll('[data-odds-panel]')];
  const update = () => {
    for (const panel of panels) panel.hidden = panel.dataset.oddsPanel !== select.value;
  };
  select.addEventListener('change', update);
  update();
}
