const narrow = matchMedia('(max-width: 600px)');
for (const list of document.querySelectorAll('.info-skill-list')) {
  list.tabIndex = 0;
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', 'Skill cards. Scroll sideways to compare.');
  let frame;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!narrow.matches) { list.style.removeProperty('height'); return; }
      const left = list.getBoundingClientRect().left;
      const cards = [...list.children];
      const visible = cards.reduce((a, b) => Math.abs(a.getBoundingClientRect().left - left) < Math.abs(b.getBoundingClientRect().left - left) ? a : b);
      list.style.height = `${Math.ceil(visible.getBoundingClientRect().height) + 12}px`;
    });
  };
  list.addEventListener('scroll', update, {passive:true});
  narrow.addEventListener('change', update);
  const observer = new ResizeObserver(update);
  for (const card of list.children) observer.observe(card);
  update();
}
