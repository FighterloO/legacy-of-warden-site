/* Back to top: a button at the bottom right (the music button sits at the bottom left), shown once the page is scrolled past
   the first screen. Loaded by the long pages (home, Bloodmoon). */
'use strict';
(() => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'to-top';
  b.setAttribute('aria-label', 'Back to top');
  b.innerHTML = '<i aria-hidden="true"></i><span>Top</span>';
  b.addEventListener('click', () => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  });
  document.body.append(b);
  const show = () => b.classList.toggle('on', window.scrollY > window.innerHeight * 0.8);
  addEventListener('scroll', show, { passive: true });
  show();
})();
