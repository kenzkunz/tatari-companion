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
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const img of document.querySelectorAll('#sharpup .info-asset-grid img')) {
  const animated = img.getAttribute('src');
  const still = animated.replace('-idle.webp', '.png');
  const update = () => { img.src = reducedMotion.matches ? still : animated; };
  reducedMotion.addEventListener('change', update);
  update();
}
for (const img of document.querySelectorAll('img[data-still-src]')) {
  const animated = img.getAttribute('src');
  const toggle = img.closest('figure').querySelector('[data-animation-toggle]');
  let paused = reducedMotion.matches;
  const update = () => {
    img.src = paused ? img.dataset.stillSrc : animated;
    toggle.textContent = paused ? 'Play animation' : 'Pause animation';
    toggle.setAttribute('aria-pressed', String(paused));
  };
  toggle.addEventListener('click', () => { paused = !paused; update(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; update(); });
  update();
}
