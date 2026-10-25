/* The contact address shown on every page. Set it once here; every element with class "contact" shows it as a mail link. */
'use strict';
const CONTACT_EMAIL = 'supeersaiyan15@gmail.com';

document.querySelectorAll('.contact').forEach(el => {
  if (!CONTACT_EMAIL) { el.textContent = 'the contact address on our Google Play page'; return; }
  const a = document.createElement('a');
  a.href = 'mailto:' + CONTACT_EMAIL;
  a.textContent = CONTACT_EMAIL;
  el.replaceChildren(a);
});
