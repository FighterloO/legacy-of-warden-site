// Bloodmoon page: each section names its art in data-bg and the fixed backdrop crossfades as it comes into view (as on the home page).
const layers = [document.getElementById('bd-a'), document.getElementById('bd-b')];
let front = 0, cur = null;
function setBackdrop(url) {
  if (url === cur) return;
  cur = url;
  const img = new Image();
  img.onload = () => {
    if (cur !== url) return;
    const next = layers[1 - front];
    next.style.backgroundImage = `url("${url}")`;
    next.classList.add('on');
    layers[front].classList.remove('on');
    front = 1 - front;
  };
  img.src = url;
}
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) setBackdrop(e.target.dataset.bg);
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-bg]').forEach(s => io.observe(s));
